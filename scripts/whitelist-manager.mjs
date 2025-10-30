#!/usr/bin/env node

/**
 * Whitelist Manager
 * 
 * Handles validation whitelist operations:
 * - Load/save whitelist.json
 * - Parse consumer and provider comments
 * - Detect code drift
 * - Validate contracts
 * - Sync from comments
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const WHITELIST_PATH = path.join(ROOT_DIR, 'scripts', 'validation-whitelist.json');

/**
 * Whitelist structure:
 * {
 *   version: "1.0",
 *   lastUpdated: "2025-10-17",
 *   frameworks: {
 *     "express": {
 *       id: "framework-express-001",
 *       enabled: true,
 *       verifiedDate: "2025-10-17",
 *       verifiedBy: "user",
 *       pattern: {
 *         description: "Express middleware pattern",
 *         signatures: ["(req, res, next)", "(req, res)", "(err, req, res, next)"]
 *       },
 *       stats: {
 *         functionsMatched: 47,
 *         filesAffected: ["middleware/logging.js", "routes/ravenRoutes.js"]
 *       }
 *     }
 *   },
 *   entries: [
 *     {
 *       id: "null-access-001",
 *       category: "null-access",
 *       file: "js/thread-manager.js",
 *       line: 42,
 *       codeBlock: "const threadName = thread.name;",
 *       comment: {
 *         reason: "thread guaranteed non-null by initThreads()",
 *         whitelistedDate: "2025-10-17"
 *       },
 *       dependencies: [...],
 *       validated: true,
 *       lastValidated: "2025-10-17"
 *     }
 *   ],
 *   categories: {
 *     "null-access": 15,
 *     "missing-await": 2
 *   }
 * }
 */

// ============================================================================
// WHITELIST FILE OPERATIONS
// ============================================================================

/**
 * Load whitelist.json, or create empty one if doesn't exist
 */
export function loadWhitelist() {
  if (!fs.existsSync(WHITELIST_PATH)) {
    const emptyWhitelist = {
      version: "1.0",
      lastUpdated: new Date().toISOString().split('T')[0],
      frameworks: {},
      entries: [],
      categories: {}
    };
    saveWhitelist(emptyWhitelist);
    return emptyWhitelist;
  }

  try {
    const content = fs.readFileSync(WHITELIST_PATH, 'utf-8');
    const whitelist = JSON.parse(content);
    
    // Ensure frameworks section exists (backwards compatibility)
    if (!whitelist.frameworks) {
      whitelist.frameworks = {};
    }
    
    return whitelist;
  } catch (error) {
    console.error(`Error loading whitelist: ${error.message}`);
    return null;
  }
}

/**
 * Save whitelist.json
 */
export function saveWhitelist(whitelist) {
  whitelist.lastUpdated = new Date().toISOString().split('T')[0];
  
  // Update category counts
  const categoryCounts = {};
  for (const entry of whitelist.entries) {
    categoryCounts[entry.category] = (categoryCounts[entry.category] || 0) + 1;
  }
  whitelist.categories = categoryCounts;

  fs.writeFileSync(WHITELIST_PATH, JSON.stringify(whitelist, null, 2));
}

/**
 * Generate next available ID for a category
 */
export function generateWhitelistId(whitelist, category) {
  const categoryEntries = whitelist.entries.filter(e => e.category === category);
  const maxNum = categoryEntries.reduce((max, entry) => {
    const match = entry.id.match(new RegExp(`${category}-(\\d+)`));
    return match ? Math.max(max, parseInt(match[1])) : max;
  }, 0);
  
  return `${category}-${String(maxNum + 1).padStart(3, '0')}`;
}

/**
 * Get whitelist entry by ID
 */
export function getWhitelistEntry(whitelist, id) {
  return whitelist.entries.find(e => e.id === id);
}

/**
 * Get whitelist entry by file and line
 */
export function getWhitelistEntryByLocation(whitelist, file, line) {
  return whitelist.entries.find(e => 
    e.file === file && e.line === line
  );
}

// ============================================================================
// COMMENT PARSING
// ============================================================================

/**
 * Parse consumer comment (at risky code location)
 * 
 * Example:
 * // @validation-ignore null-access
 * // @reason: thread guaranteed non-null by initThreads()
 * // @dependency: initThreads() at line 15
 * // @whitelist-id: null-access-001
 */
export function parseConsumerComment(fileContent, lineNumber) {
  const lines = fileContent.split('\n');
  const commentLines = [];
  
  // Look backwards from lineNumber to find all comment lines
  for (let i = lineNumber - 2; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('//')) {
      commentLines.unshift(line);
    } else if (line === '') {
      continue; // Skip blank lines
    } else {
      break; // Hit non-comment
    }
  }

  // Parse comment structure
  const comment = {
    found: false,
    category: null,
    reason: null,
    dependencies: [],
    whitelistId: null
  };

  for (const line of commentLines) {
    // @validation-ignore <category>
    const ignoreMatch = line.match(/@validation-ignore\s+(\S+)/);
    if (ignoreMatch) {
      comment.found = true;
      comment.category = ignoreMatch[1];
    }

    // @reason: <text>
    const reasonMatch = line.match(/@reason:\s*(.+)/);
    if (reasonMatch) {
      comment.reason = reasonMatch[1].trim();
    }

    // @dependency: <function-name> at line <N> [in <file>]
    const depMatch = line.match(/@dependency:\s*(\S+)\s+at\s+line\s+(\d+)(?:\s+in\s+(.+))?/);
    if (depMatch) {
      comment.dependencies.push({
        function: depMatch[1],
        line: parseInt(depMatch[2]),
        file: depMatch[3] ? depMatch[3].trim() : null
      });
    }

    // @whitelist-id: <id>
    const idMatch = line.match(/@whitelist-id:\s*(\S+)/);
    if (idMatch) {
      comment.whitelistId = idMatch[1];
    }
  }

  return comment;
}

/**
 * Parse provider comment (at dependency code location)
 * 
 * Example:
 * // @validation-dependency null-access-001
 * // @required-by: line 42 (assumes non-null return)
 * // @contract: MUST filter out null/undefined threads
 */
export function parseProviderComment(fileContent, lineNumber) {
  const lines = fileContent.split('\n');
  const commentLines = [];
  
  // Look backwards from lineNumber to find all comment lines
  for (let i = lineNumber - 2; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('//')) {
      commentLines.unshift(line);
    } else if (line === '') {
      continue;
    } else {
      break;
    }
  }

  const comment = {
    found: false,
    whitelistIds: [],
    requiredBy: [],
    contract: null
  };

  for (const line of commentLines) {
    // @validation-dependency <id>
    const depMatch = line.match(/@validation-dependency\s+(\S+)/);
    if (depMatch) {
      comment.found = true;
      comment.whitelistIds.push(depMatch[1]);
    }

    // @required-by: line <N> (<description>)
    const reqMatch = line.match(/@required-by:\s*line\s+(\d+)\s*\(([^)]+)\)/);
    if (reqMatch) {
      comment.requiredBy.push({
        line: parseInt(reqMatch[1]),
        description: reqMatch[2].trim()
      });
    }

    // @contract: <description>
    const contractMatch = line.match(/@contract:\s*(.+)/);
    if (contractMatch) {
      comment.contract = contractMatch[1].trim();
    }
  }

  return comment;
}

// ============================================================================
// CODE EXTRACTION
// ============================================================================

/**
 * Extract code block at specific line
 * Returns the line itself plus context for validation
 */
export function extractCodeBlock(fileContent, lineNumber, contextLines = 0) {
  const lines = fileContent.split('\n');
  const targetLine = lines[lineNumber - 1];
  
  if (!targetLine) {
    return null;
  }

  if (contextLines === 0) {
    return targetLine.trim();
  }

  // Extract with context
  const start = Math.max(0, lineNumber - 1 - contextLines);
  const end = Math.min(lines.length, lineNumber + contextLines);
  
  return lines.slice(start, end).join('\n');
}

/**
 * Extract function code starting at line
 */
export function extractFunctionCode(fileContent, lineNumber, functionName) {
  const lines = fileContent.split('\n');
  let startLine = lineNumber - 1;
  
  // Find function declaration
  while (startLine >= 0) {
    const line = lines[startLine];
    if (line.includes('function') || line.includes(functionName)) {
      break;
    }
    startLine--;
  }

  if (startLine < 0) {
    return null;
  }

  // Find end of function (simple brace matching)
  let braceCount = 0;
  let endLine = startLine;
  let foundStart = false;

  for (let i = startLine; i < lines.length; i++) {
    const line = lines[i];
    
    for (const char of line) {
      if (char === '{') {
        braceCount++;
        foundStart = true;
      } else if (char === '}') {
        braceCount--;
        if (foundStart && braceCount === 0) {
          endLine = i;
          return lines.slice(startLine, endLine + 1).join('\n');
        }
      }
    }
  }

  // If no braces found, might be arrow function or one-liner
  return lines.slice(startLine, Math.min(startLine + 10, lines.length)).join('\n');
}

// ============================================================================
// DRIFT DETECTION
// ============================================================================

/**
 * Check if code block at location matches expected
 */
export function checkCodeDrift(filePath, lineNumber, expectedCode) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const actualCode = extractCodeBlock(fileContent, lineNumber);
    
    if (!actualCode) {
      return { drifted: true, reason: 'Code not found at line', actual: null };
    }

    if (actualCode !== expectedCode.trim()) {
      return { 
        drifted: true, 
        reason: 'Code changed', 
        expected: expectedCode.trim(),
        actual: actualCode 
      };
    }

    return { drifted: false };
  } catch (error) {
    return { drifted: true, reason: `File error: ${error.message}`, actual: null };
  }
}

/**
 * Check if dependency code changed
 */
export function checkDependencyDrift(dependency) {
  const filePath = path.join(ROOT_DIR, dependency.file);
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const actualCode = extractFunctionCode(fileContent, dependency.line, dependency.function);
    
    if (!actualCode) {
      return { 
        drifted: true, 
        reason: 'Dependency function not found',
        actual: null 
      };
    }

    // Normalize whitespace for comparison
    const normalize = (code) => code.replace(/\s+/g, ' ').trim();
    
    if (normalize(actualCode) !== normalize(dependency.codeSnapshot)) {
      return {
        drifted: true,
        reason: 'Dependency code changed',
        expected: dependency.codeSnapshot,
        actual: actualCode
      };
    }

    return { drifted: false };
  } catch (error) {
    return { 
      drifted: true, 
      reason: `Dependency file error: ${error.message}`,
      actual: null 
    };
  }
}

/**
 * Check if provider comment exists for dependency
 */
export function checkProviderComment(dependency, whitelistId) {
  const filePath = path.join(ROOT_DIR, dependency.file);
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const providerComment = parseProviderComment(fileContent, dependency.line);
    
    if (!providerComment.found) {
      return {
        missing: true,
        reason: 'Provider @validation-dependency comment not found',
        expected: `@validation-dependency ${whitelistId}`
      };
    }

    if (!providerComment.whitelistIds.includes(whitelistId)) {
      return {
        missing: true,
        reason: 'Provider comment exists but missing this whitelist ID',
        expected: `@validation-dependency ${whitelistId}`,
        found: providerComment.whitelistIds
      };
    }

    return { missing: false, comment: providerComment };
  } catch (error) {
    return {
      missing: true,
      reason: `Provider file error: ${error.message}`
    };
  }
}

/**
 * Validate entire whitelist entry
 */
export function validateWhitelistEntry(entry) {
  const errors = [];
  const warnings = [];
  const filePath = path.join(ROOT_DIR, entry.file);

  // Check 1: Consumer comment exists
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const consumerComment = parseConsumerComment(fileContent, entry.line);
    
    if (!consumerComment.found) {
      errors.push({
        type: 'MISSING_CONSUMER_COMMENT',
        message: `Missing @validation-ignore comment at ${entry.file}:${entry.line}`
      });
    } else if (consumerComment.whitelistId !== entry.id) {
      warnings.push({
        type: 'MISMATCHED_ID',
        message: `Comment has ID ${consumerComment.whitelistId} but whitelist has ${entry.id}`
      });
    }
  } catch (error) {
    errors.push({
      type: 'FILE_ERROR',
      message: `Cannot read ${entry.file}: ${error.message}`
    });
    return { valid: false, errors, warnings };
  }

  // Check 2: Consumer code matches
  const codeDrift = checkCodeDrift(filePath, entry.line, entry.codeBlock);
  if (codeDrift.drifted) {
    errors.push({
      type: 'CODE_DRIFT',
      message: `Code changed at ${entry.file}:${entry.line}`,
      details: codeDrift
    });
  }

  // Check 3: Dependencies
  for (const dependency of entry.dependencies) {
    // Check 3a: Provider comment exists
    const providerCheck = checkProviderComment(dependency, entry.id);
    if (providerCheck.missing) {
      errors.push({
        type: 'MISSING_PROVIDER_COMMENT',
        message: `Missing provider comment at ${dependency.file}:${dependency.line}`,
        details: providerCheck
      });
    }

    // Check 3b: Dependency code matches
    const depDrift = checkDependencyDrift(dependency);
    if (depDrift.drifted) {
      errors.push({
        type: 'DEPENDENCY_DRIFT',
        message: `Dependency code changed at ${dependency.file}:${dependency.line}`,
        details: depDrift
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// WHITELIST OPERATIONS
// ============================================================================

/**
 * Add new whitelist entry
 */
export function addWhitelistEntry(whitelist, entry) {
  // Generate ID if not provided
  if (!entry.id) {
    entry.id = generateWhitelistId(whitelist, entry.category);
  }

  // Add timestamps
  entry.comment.whitelistedDate = new Date().toISOString().split('T')[0];
  entry.lastValidated = new Date().toISOString().split('T')[0];
  entry.validated = true;

  whitelist.entries.push(entry);
  saveWhitelist(whitelist);
  
  return entry.id;
}

/**
 * Update existing whitelist entry
 */
export function updateWhitelistEntry(whitelist, id, updates) {
  const entry = getWhitelistEntry(whitelist, id);
  if (!entry) {
    return false;
  }

  Object.assign(entry, updates);
  entry.lastValidated = new Date().toISOString().split('T')[0];
  
  saveWhitelist(whitelist);
  return true;
}

/**
 * Remove whitelist entry
 */
export function removeWhitelistEntry(whitelist, id) {
  const index = whitelist.entries.findIndex(e => e.id === id);
  if (index === -1) {
    return false;
  }

  whitelist.entries.splice(index, 1);
  saveWhitelist(whitelist);
  return true;
}

// ============================================================================
// VALIDATION REPORTING
// ============================================================================

/**
 * Format validation errors for display
 */
export function formatValidationErrors(entry, validation) {
  let output = '';

  if (!validation.valid) {
    output += `\n❌ VALIDATION FAILED: ${entry.id}\n`;
    output += `   ${entry.file}:${entry.line}\n\n`;

    for (const error of validation.errors) {
      output += `   🚨 ${error.type}: ${error.message}\n`;
      
      if (error.details) {
        if (error.details.expected && error.details.actual) {
          output += `      Expected: ${error.details.expected}\n`;
          output += `      Actual:   ${error.details.actual}\n`;
        } else if (error.details.reason) {
          output += `      Reason: ${error.details.reason}\n`;
        }
      }
      output += '\n';
    }
  }

  if (validation.warnings.length > 0) {
    output += `   ⚠️  Warnings:\n`;
    for (const warning of validation.warnings) {
      output += `      - ${warning.message}\n`;
    }
  }

  return output;
}

// ============================================================================
// FRAMEWORK WHITELIST OPERATIONS
// ============================================================================

/**
 * Check if framework is whitelisted
 */
export function isFrameworkWhitelisted(whitelist, frameworkName) {
  return whitelist.frameworks?.[frameworkName]?.enabled === true;
}

/**
 * Add framework whitelist
 */
export function addFrameworkWhitelist(whitelist, frameworkName, data) {
  if (!whitelist.frameworks) {
    whitelist.frameworks = {};
  }

  const id = `framework-${frameworkName}-001`;

  whitelist.frameworks[frameworkName] = {
    id: id,
    enabled: true,
    verifiedDate: new Date().toISOString().split('T')[0],
    verifiedBy: 'user',
    pattern: {
      description: data.description || `${frameworkName} pattern`,
      signatures: data.signatures || []
    },
    stats: {
      functionsMatched: data.functionsMatched || 0,
      filesAffected: data.filesAffected || []
    }
  };

  saveWhitelist(whitelist);
  return id;
}

/**
 * Remove framework whitelist
 */
export function removeFrameworkWhitelist(whitelist, frameworkName) {
  if (whitelist.frameworks?.[frameworkName]) {
    delete whitelist.frameworks[frameworkName];
    saveWhitelist(whitelist);
    return true;
  }
  return false;
}

/**
 * Get framework whitelist details
 */
export function getFrameworkWhitelist(whitelist, frameworkName) {
  return whitelist.frameworks?.[frameworkName] || null;
}

// ============================================================================
// DATA CONTRACT MANAGEMENT
// ============================================================================

/**
 * Add or update a data contract
 */
export function addDataContract(whitelist, contractId, contractData) {
  if (!whitelist.dataContracts) {
    whitelist.dataContracts = {};
  }
  
  whitelist.dataContracts[contractId] = {
    id: contractId,
    createdDate: new Date().toISOString().split('T')[0],
    lastValidated: new Date().toISOString().split('T')[0],
    ...contractData
  };
  
  whitelist.lastUpdated = new Date().toISOString().split('T')[0];
  return whitelist;
}

/**
 * Get a data contract by ID
 */
export function getDataContract(whitelist, contractId) {
  return whitelist.dataContracts?.[contractId] || null;
}

/**
 * Remove a data contract
 */
export function removeDataContract(whitelist, contractId) {
  if (whitelist.dataContracts && whitelist.dataContracts[contractId]) {
    delete whitelist.dataContracts[contractId];
    whitelist.lastUpdated = new Date().toISOString().split('T')[0];
  }
  return whitelist;
}

/**
 * Check if a data contract has drifted
 */
export function checkDataContractDrift(contract, currentProviderCode, currentConsumerCode) {
  const drift = {
    hasDrift: false,
    providerChanged: false,
    consumerChanged: false,
    details: []
  };
  
  // Check provider code drift
  if (contract.provider && contract.provider.codeSnapshot) {
    const providerDrift = checkCodeDrift(
      contract.provider.file,
      contract.provider.line,
      contract.provider.codeSnapshot
    );
    
    if (!providerDrift.matches) {
      drift.hasDrift = true;
      drift.providerChanged = true;
      drift.details.push({
        type: 'provider',
        file: contract.provider.file,
        line: contract.provider.line,
        message: 'Provider code has changed'
      });
    }
  }
  
  // Check consumer code drift
  if (contract.consumer && contract.consumer.codeSnapshot) {
    const consumerDrift = checkCodeDrift(
      contract.consumer.file,
      contract.consumer.line,
      contract.consumer.codeSnapshot
    );
    
    if (!consumerDrift.matches) {
      drift.hasDrift = true;
      drift.consumerChanged = true;
      drift.details.push({
        type: 'consumer',
        file: contract.consumer.file,
        line: contract.consumer.line,
        message: 'Consumer code has changed'
      });
    }
  }
  
  return drift;
}

/**
 * Get all data contracts
 */
export function getAllDataContracts(whitelist) {
  return Object.values(whitelist.dataContracts || {});
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  loadWhitelist,
  saveWhitelist,
  generateWhitelistId,
  getWhitelistEntry,
  getWhitelistEntryByLocation,
  parseConsumerComment,
  parseProviderComment,
  extractCodeBlock,
  extractFunctionCode,
  checkCodeDrift,
  checkDependencyDrift,
  checkProviderComment,
  validateWhitelistEntry,
  addWhitelistEntry,
  updateWhitelistEntry,
  removeWhitelistEntry,
  formatValidationErrors,
  isFrameworkWhitelisted,
  addFrameworkWhitelist,
  removeFrameworkWhitelist,
  getFrameworkWhitelist,
  addDataContract,
  getDataContract,
  removeDataContract,
  checkDataContractDrift,
  getAllDataContracts
};

