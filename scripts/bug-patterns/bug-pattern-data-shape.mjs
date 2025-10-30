#!/usr/bin/env node

/**
 * Bug Pattern #4: Data Shape Validation
 * 
 * Detects potential "Cannot read property of undefined" errors from destructuring:
 * - Functions with destructured parameters that might receive incomplete objects
 * - Call sites passing object literals missing required properties
 * - Complex cases handled via @provides-data / @requires-data contracts
 * 
 * Supports whitelist system with drift detection.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import whitelistManager from '../whitelist-manager.mjs';
import { findAndParseAnnotations } from '../comment-parser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ============================================================================
// DESTRUCTURED PARAMETER DETECTION
// ============================================================================

/**
 * Find all functions with destructured parameters
 * Returns: Map<functionName, { file, line, params: ['email', 'name', 'id'] }>
 */
function findDestructuredFunctions(fileContent, filePath) {
  const functions = new Map();
  const lines = fileContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      continue;
    }

    // Pattern 1: Regular function with destructured params
    // function updateUser({ email, name, id }) {
    const regularMatch = line.match(/function\s+(\w+)\s*\(\s*\{\s*([^}]+)\s*\}/);
    if (regularMatch) {
      const funcName = regularMatch[1];
      const paramsStr = regularMatch[2];
      const params = parseDestructuredParams(paramsStr);
      
      functions.set(funcName, {
        file: filePath,
        line: lineNum,
        params: params,
        type: 'function'
      });
      continue;
    }

    // Pattern 2: Arrow function assigned to const/let/var
    // const updateUser = ({ email, name, id }) => {
    const arrowMatch = line.match(/(?:const|let|var)\s+(\w+)\s*=\s*\(\s*\{\s*([^}]+)\s*\}\s*\)\s*=>/);
    if (arrowMatch) {
      const funcName = arrowMatch[1];
      const paramsStr = arrowMatch[2];
      const params = parseDestructuredParams(paramsStr);
      
      functions.set(funcName, {
        file: filePath,
        line: lineNum,
        params: params,
        type: 'arrow'
      });
      continue;
    }

    // Pattern 3: Export function with destructured params
    // export function updateUser({ email, name, id }) {
    const exportMatch = line.match(/export\s+function\s+(\w+)\s*\(\s*\{\s*([^}]+)\s*\}/);
    if (exportMatch) {
      const funcName = exportMatch[1];
      const paramsStr = exportMatch[2];
      const params = parseDestructuredParams(paramsStr);
      
      functions.set(funcName, {
        file: filePath,
        line: lineNum,
        params: params,
        type: 'export-function'
      });
      continue;
    }

    // Pattern 4: Export arrow function
    // export const updateUser = ({ email, name, id }) => {
    const exportArrowMatch = line.match(/export\s+const\s+(\w+)\s*=\s*\(\s*\{\s*([^}]+)\s*\}\s*\)\s*=>/);
    if (exportArrowMatch) {
      const funcName = exportArrowMatch[1];
      const paramsStr = exportArrowMatch[2];
      const params = parseDestructuredParams(paramsStr);
      
      functions.set(funcName, {
        file: filePath,
        line: lineNum,
        params: params,
        type: 'export-arrow'
      });
      continue;
    }
  }

  return functions;
}

/**
 * Parse destructured parameter string into array of REQUIRED param names
 * Input: "email, name, id = 0, ...rest"
 * Output: ['email', 'name']  (excludes params with defaults and rest params)
 */
function parseDestructuredParams(paramsStr) {
  const params = [];
  
  // Split by comma, but ignore commas in nested objects/arrays
  const parts = paramsStr.split(',').map(p => p.trim());
  
  for (const part of parts) {
    // Skip rest parameters (...rest)
    if (part.startsWith('...')) {
      continue;
    }
    
    // Skip params with default values (email = "default")
    if (part.includes('=')) {
      continue;
    }
    
    // Extract param name (before : for renaming)
    // Handles: email, email: emailAddr
    const paramMatch = part.match(/^(\w+)/);
    if (paramMatch) {
      params.push(paramMatch[1]);
    }
  }
  
  return params;
}

// ============================================================================
// CALL SITE DETECTION
// ============================================================================

/**
 * Find all call sites for a function
 * Returns: Array<{ line, type: 'literal' | 'variable', properties: [...] | varName }>
 */
function findCallSites(fileContent, functionName) {
  const callSites = [];
  const lines = fileContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      continue;
    }

    // Look for function calls
    const callPattern = new RegExp(`\\b${functionName}\\s*\\(`, 'g');
    if (!callPattern.test(line)) {
      continue;
    }

    // Try to parse what's being passed
    
    // Pattern 1: Direct object literal
    // updateUser({ email: "test", name: "RC" })
    const literalMatch = line.match(new RegExp(`${functionName}\\s*\\(\\s*\\{([^}]+)\\}`));
    if (literalMatch) {
      const objStr = literalMatch[1];
      const properties = parseObjectLiteral(objStr);
      
      callSites.push({
        line: lineNum,
        type: 'literal',
        properties: properties
      });
      continue;
    }

    // Pattern 2: Variable passed
    // updateUser(userData)
    const varMatch = line.match(new RegExp(`${functionName}\\s*\\(\\s*(\\w+)\\s*\\)`));
    if (varMatch) {
      const varName = varMatch[1];
      
      callSites.push({
        line: lineNum,
        type: 'variable',
        varName: varName
      });
      continue;
    }

    // Pattern 3: Other (function call, complex expression, etc.)
    callSites.push({
      line: lineNum,
      type: 'complex',
      note: 'Complex call site - consider adding @requires-data contract'
    });
  }

  return callSites;
}

/**
 * Parse object literal string into array of property names
 * Input: "email: 'test', name: 'RC', id: 123"
 * Output: ['email', 'name', 'id']
 */
function parseObjectLiteral(objStr) {
  const properties = [];
  
  // Split by comma (simple approach - doesn't handle nested objects)
  const parts = objStr.split(',').map(p => p.trim());
  
  for (const part of parts) {
    // Extract property name (before :)
    const propMatch = part.match(/^(\w+)\s*:/);
    if (propMatch) {
      properties.push(propMatch[1]);
    }
    
    // Handle shorthand: { email, name }
    const shorthandMatch = part.match(/^(\w+)$/);
    if (shorthandMatch) {
      properties.push(shorthandMatch[1]);
    }
  }
  
  return properties;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate a call site against expected parameters
 */
function validateCallSite(callSite, expectedParams, functionName, filePath, fileContent) {
  const issues = [];

  if (callSite.type === 'literal') {
    // Check if all expected params are provided
    const missing = expectedParams.filter(p => !callSite.properties.includes(p));
    
    if (missing.length > 0) {
      issues.push({
        file: filePath,
        line: callSite.line,
        function: functionName,
        expected: expectedParams,
        provided: callSite.properties,
        missing: missing,
        type: 'missing-properties',
        severity: 'error'
      });
    }
  } else if (callSite.type === 'variable') {
    // Look for data contract (inline comment)
    const contract = findDataContract(fileContent, callSite.varName);
    
    // Also check whitelist for stored contracts
    const whitelist = whitelistManager.loadWhitelist();
    const storedContract = whitelistManager.getDataContract(whitelist, callSite.varName);
    
    if (contract || storedContract) {
      // Use stored contract if available, otherwise use inline
      const activeContract = storedContract || contract;
      const provides = storedContract ? storedContract.provider?.shape : contract.provides;
      
      // Validate contract matches expected params
      const missing = expectedParams.filter(p => !provides.includes(p));
      
      if (missing.length > 0) {
        issues.push({
          file: filePath,
          line: callSite.line,
          function: functionName,
          expected: expectedParams,
          provided: provides,
          missing: missing,
          type: 'contract-mismatch',
          severity: 'error',
          contractId: activeContract.id
        });
      }
      
      // Check for drift if using stored contract
      if (storedContract) {
        const drift = whitelistManager.checkDataContractDrift(storedContract);
        if (drift.hasDrift) {
          issues.push({
            file: filePath,
            line: callSite.line,
            function: functionName,
            type: 'contract-drift',
            severity: 'warning',
            contractId: storedContract.id,
            driftDetails: drift.details
          });
        }
      }
    } else {
      // No contract - suggest adding one
      issues.push({
        file: filePath,
        line: callSite.line,
        function: functionName,
        expected: expectedParams,
        varName: callSite.varName,
        type: 'needs-contract',
        severity: 'warning'
      });
    }
  } else if (callSite.type === 'complex') {
    // Complex call site - suggest adding contract
    issues.push({
      file: filePath,
      line: callSite.line,
      function: functionName,
      expected: expectedParams,
      type: 'complex-needs-contract',
      severity: 'info'
    });
  }

  return issues;
}

// ============================================================================
// DATA CONTRACT SYSTEM
// ============================================================================

/**
 * Find @provides-data contract for a variable
 * This checks for inline comments in the code
 */
function findDataContract(fileContent, varName) {
  const lines = fileContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for @provides-data comment
    if (line.includes('@provides-data')) {
      const contractMatch = line.match(/@provides-data\s+(\S+)/);
      if (!contractMatch) continue;
      
      const contractId = contractMatch[1];
      
      // Look for @shape on next few lines
      let shape = [];
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        const nextLine = lines[j];
        const shapeMatch = nextLine.match(/@shape\s+\{?\s*([^}]+)\s*\}?/);
        if (shapeMatch) {
          shape = shapeMatch[1].split(',').map(s => s.trim());
          break;
        }
      }
      
      // Check if this is for the variable we're looking for
      // Look a few lines ahead for the variable declaration
      for (let j = i; j < Math.min(i + 10, lines.length); j++) {
        const nextLine = lines[j];
        if (nextLine.includes(`const ${varName}`) || 
            nextLine.includes(`let ${varName}`) ||
            nextLine.includes(`var ${varName}`)) {
          return {
            id: contractId,
            varName: varName,
            provides: shape,
            line: i + 1
          };
        }
      }
    }
  }
  
  return null;
}

/**
 * Parse all data contracts from file
 */
function parseDataContracts(fileContent, filePath) {
  const contracts = {
    providers: [],
    consumers: []
  };
  
  const lines = fileContent.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    // Look for @provides-data
    if (line.includes('@provides-data')) {
      const contractMatch = line.match(/@provides-data\s+(\S+)/);
      if (contractMatch) {
        const contractId = contractMatch[1];
        
        // Parse shape
        let shape = [];
        let varName = null;
        
        for (let j = i; j < Math.min(i + 10, lines.length); j++) {
          const nextLine = lines[j];
          
          // Look for @shape
          const shapeMatch = nextLine.match(/@shape\s+\{?\s*([^}]+)\s*\}?/);
          if (shapeMatch) {
            shape = shapeMatch[1].split(',').map(s => s.trim());
          }
          
          // Look for variable declaration
          const varMatch = nextLine.match(/(?:const|let|var)\s+(\w+)/);
          if (varMatch) {
            varName = varMatch[1];
            
            contracts.providers.push({
              id: contractId,
              file: filePath,
              line: j + 1,
              varName: varName,
              shape: shape
            });
            break;
          }
        }
      }
    }
    
    // Look for @requires-data
    if (line.includes('@requires-data')) {
      const contractMatch = line.match(/@requires-data\s+(\S+)/);
      if (contractMatch) {
        const contractId = contractMatch[1];
        
        // Look for function with destructured params nearby
        for (let j = i; j < Math.min(i + 5, lines.length); j++) {
          const nextLine = lines[j];
          
          const funcMatch = nextLine.match(/(?:function|const|export)\s+(\w+)/);
          if (funcMatch) {
            const funcName = funcMatch[1];
            
            contracts.consumers.push({
              id: contractId,
              file: filePath,
              line: j + 1,
              function: funcName
            });
            break;
          }
        }
      }
    }
  }
  
  return contracts;
}

// ============================================================================
// STYLE GUIDE ENFORCEMENT
// ============================================================================

/**
 * Check if a function has a @requires-data contract
 * Uses smart comment parser to handle JSDoc + compact annotations
 */
function hasRequiresDataContract(fileContent, lineNumber) {
  const lines = fileContent.split('\n');
  
  // Use smart parser to find all annotations (handles JSDoc + compact)
  const result = findAndParseAnnotations(lines, lineNumber);
  
  if (!result.hasAnnotations) {
    return false;
  }
  
  // Check if @requires-data annotation exists in fullContent
  return result.annotations.fullContent.includes('@requires-data');
}

/**
 * Enforce style guide: All destructured functions should have contracts
 */
function checkMissingContracts(destructuredFuncs, fileContent, filePath, config = {}) {
  const violations = [];
  
  // Skip if enforcement is disabled
  if (config.enforceContracts === false) {
    return violations;
  }
  
  const severity = config.contractSeverity || 'warning';
  
  for (const [funcName, funcInfo] of destructuredFuncs.entries()) {
    // Check if function has @requires-data contract
    const hasContract = hasRequiresDataContract(fileContent, funcInfo.line - 1);
    
    if (!hasContract) {
      violations.push({
        file: filePath,
        line: funcInfo.line,
        function: funcName,
        params: funcInfo.params,
        type: 'missing-contract',
        severity: severity,
        category: 'style-guide'
      });
    }
  }
  
  return violations;
}

// ============================================================================
// MAIN SCAN FUNCTION
// ============================================================================

/**
 * Scan a single file for data shape issues
 */
function scanFile(filePath, config = {}) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];

  // 1. Find all functions with destructured parameters
  const destructuredFuncs = findDestructuredFunctions(content, filePath);

  // 2. Check for missing contracts (style guide enforcement)
  if (config.enforceContracts !== false) {
    const styleViolations = checkMissingContracts(destructuredFuncs, content, filePath, config);
    issues.push(...styleViolations);
  }

  // 3. For each function, find call sites and validate
  for (const [funcName, funcInfo] of destructuredFuncs.entries()) {
    const callSites = findCallSites(content, funcName);
    
    for (const callSite of callSites) {
      const callIssues = validateCallSite(callSite, funcInfo.params, funcName, filePath, content);
      issues.push(...callIssues);
    }
  }

  // 4. Parse data contracts for drift detection
  const contracts = parseDataContracts(content, filePath);
  
  return { issues, contracts, destructuredFuncs };
}

/**
 * Scan multiple files
 */
function scanFiles(filePaths, config = {}) {
  const allIssues = [];
  const allContracts = { providers: [], consumers: [] };
  const allFunctions = new Map();

  for (const filePath of filePaths) {
    try {
      const result = scanFile(filePath, config);
      allIssues.push(...result.issues);
      allContracts.providers.push(...result.contracts.providers);
      allContracts.consumers.push(...result.contracts.consumers);
      
      // Merge functions
      for (const [name, info] of result.destructuredFuncs.entries()) {
        allFunctions.set(`${filePath}:${name}`, info);
      }
    } catch (err) {
      console.warn(`⚠️  Could not scan ${filePath}: ${err.message}`);
    }
  }

  return { issues: allIssues, contracts: allContracts, functions: allFunctions };
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Generate report of data shape issues
 */
export function generateReport(issues) {
  const byFile = new Map();

  for (const issue of issues) {
    if (!byFile.has(issue.file)) {
      byFile.set(issue.file, []);
    }
    byFile.get(issue.file).push(issue);
  }

  let report = '\n';
  report += '━'.repeat(80) + '\n';
  report += '🔍 Bug Pattern #4: Data Shape Validation\n';
  report += '━'.repeat(80) + '\n\n';

  for (const [file, fileIssues] of byFile.entries()) {
    const relPath = path.relative(ROOT_DIR, file);
    report += `📄 ${relPath}\n\n`;

    // Group by type
    const errors = fileIssues.filter(i => i.severity === 'error');
    const warnings = fileIssues.filter(i => i.severity === 'warning');
    const infos = fileIssues.filter(i => i.severity === 'info');

    if (errors.length > 0) {
      report += `  ❌ ERRORS:\n\n`;
      for (const issue of errors) {
        report += formatIssue(issue);
      }
    }

    if (warnings.length > 0) {
      report += `  ⚠️  WARNINGS:\n\n`;
      for (const issue of warnings) {
        report += formatIssue(issue);
      }
    }

    if (infos.length > 0) {
      report += `  ℹ️  INFO:\n\n`;
      for (const issue of infos) {
        report += formatIssue(issue);
      }
    }

    report += '\n';
  }

  report += '━'.repeat(80) + '\n';
  report += `\n📊 Summary:\n\n`;
  report += `  ❌ Errors: ${issues.filter(i => i.severity === 'error').length}\n`;
  report += `  ⚠️  Warnings: ${issues.filter(i => i.severity === 'warning').length}\n`;
  report += `  ℹ️  Info: ${issues.filter(i => i.severity === 'info').length}\n\n`;
  
  report += `  💡 To add a data contract, use:\n`;
  report += `     // @provides-data contract-id-001\n`;
  report += `     // @shape { email, name, id }\n`;
  report += `     const userData = ...;\n\n`;
  report += `     // @requires-data contract-id-001\n`;
  report += `     function updateUser({ email, name, id }) { ... }\n\n`;
  
  report += '━'.repeat(80) + '\n';

  return report;
}

function formatIssue(issue) {
  let output = `  ${issue.file}:${issue.line}\n`;

  if (issue.type === 'missing-contract') {
    output += `    Function ${issue.function}() has destructured params but no @requires-data contract\n`;
    output += `    Expected params: { ${issue.params.join(', ')} }\n`;
    output += `    💡 Add contract:\n`;
    output += `       // @requires-data ${issue.function.toLowerCase()}-contract-001\n`;
    output += `       // @expects { ${issue.params.join(', ')} }\n`;
    output += `       function ${issue.function}({ ${issue.params.join(', ')} }) { ... }\n`;
    output += `\n`;
    output += `    📚 This enforces self-documenting code and makes AI patches safer\n`;
  } else if (issue.type === 'missing-properties') {
    output += `    Calling ${issue.function}() with incomplete object\n`;
    output += `    Expected: { ${issue.expected.join(', ')} }\n`;
    output += `    Provided: { ${issue.provided.join(', ')} }\n`;
    output += `    Missing: ${issue.missing.join(', ')}\n`;
  } else if (issue.type === 'contract-mismatch') {
    output += `    Contract violation for ${issue.function}()\n`;
    output += `    Contract ${issue.contractId} provides: { ${issue.provided.join(', ')} }\n`;
    output += `    Function expects: { ${issue.expected.join(', ')} }\n`;
    output += `    Missing: ${issue.missing.join(', ')}\n`;
  } else if (issue.type === 'contract-drift') {
    output += `    ⚠️  Data contract drift detected for ${issue.function}()\n`;
    output += `    Contract ID: ${issue.contractId}\n`;
    if (issue.driftDetails && issue.driftDetails.length > 0) {
      for (const detail of issue.driftDetails) {
        output += `    - ${detail.type}: ${detail.message} (${detail.file}:${detail.line})\n`;
      }
    }
    output += `    💡 Run: npm run validation:reverify to update contract\n`;
  } else if (issue.type === 'needs-contract') {
    output += `    ${issue.function}() called with variable '${issue.varName}'\n`;
    output += `    Expected params: { ${issue.expected.join(', ')} }\n`;
    output += `    💡 Add @provides-data contract to document what ${issue.varName} contains\n`;
  } else if (issue.type === 'complex-needs-contract') {
    output += `    ${issue.function}() called with complex expression\n`;
    output += `    Expected params: { ${issue.expected.join(', ')} }\n`;
    output += `    💡 Consider adding @requires-data contract to document expectations\n`;
  }

  output += '\n';
  return output;
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

/**
 * Main function for CLI usage
 * @param {Array<string>} filePaths - Files to scan
 * @param {Object} config - Configuration options
 * @param {boolean} config.enforceContracts - Enforce @requires-data contracts on all destructured functions
 * @param {string} config.contractSeverity - 'warning' or 'error' for missing contracts
 */
export function checkDataShapes(filePaths, config = {}) {
  const result = scanFiles(filePaths, config);
  return result;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const jsFiles = process.argv.slice(2);
  
  if (jsFiles.length === 0) {
    console.log('Usage: node bug-pattern-data-shape.mjs <file1.js> [file2.js ...]');
    process.exit(1);
  }

  const result = checkDataShapes(jsFiles);
  const report = generateReport(result.issues);
  console.log(report);

  process.exit(result.issues.filter(i => i.severity === 'error').length > 0 ? 1 : 0);
}

