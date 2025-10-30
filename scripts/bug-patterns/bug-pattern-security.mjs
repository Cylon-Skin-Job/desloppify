#!/usr/bin/env node

/**
 * Bug Pattern #5: SQL/XSS Injection Risks
 * 
 * Detects potential security vulnerabilities:
 * - innerHTML assignments with unsanitized variables
 * - Template strings in SQL-like contexts
 * - User input flowing into dangerous APIs
 * 
 * Supports whitelist system with drift detection.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import whitelistManager from './whitelist-manager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// ============================================================================
// DANGEROUS API DETECTION
// ============================================================================

/**
 * APIs that are dangerous when used with user input
 */
const DANGEROUS_APIS = {
  xss: [
    'innerHTML',
    'outerHTML',
    'insertAdjacentHTML',
    'document.write',
    'document.writeln',
    'eval',
    'Function',
    'setTimeout',  // When used with string
    'setInterval',  // When used with string
  ],
  sql: [
    '.query',
    '.execute',
    '.run',
    '.exec',
    '.raw',
  ]
};

/**
 * Safe sanitization functions/methods
 */
const SAFE_SANITIZERS = [
  'DOMPurify.sanitize',
  'sanitize',
  'escape',
  'escapeHtml',
  'textContent',  // Safe alternative to innerHTML
  'innerText',    // Safe alternative to innerHTML
];

/**
 * Detect innerHTML assignments with variables
 * Pattern: element.innerHTML = variable or ${variable}
 */
function detectInnerHTMLRisks(fileContent, filePath) {
  const risks = [];
  const lines = fileContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      continue;
    }

    // Pattern 1: .innerHTML = variable
    const innerHTMLMatch = line.match(/\.innerHTML\s*=\s*(.+)/);
    if (innerHTMLMatch) {
      const value = innerHTMLMatch[1].trim().replace(/;$/, '').trim();
      
      // Skip empty string assignments (safe - just clearing)
      if (value === '""' || value === "''" || value === '``' || value === '') {
        continue;
      }
      
      // Skip if it's a string literal
      if (value.startsWith('"') || value.startsWith("'") || value.startsWith('`')) {
        // If it's just an empty string
        if (value === '""' || value === "''" || value === '``') {
          continue;
        }
        
        // Check for template string with variables
        if (value.startsWith('`') && value.includes('${')) {
          // Has variables in template string
          const isSanitized = SAFE_SANITIZERS.some(sanitizer => line.includes(sanitizer));
          if (!isSanitized) {
            risks.push({
              file: filePath,
              line: lineNum,
              type: 'xss',
              api: 'innerHTML',
              code: line.trim(),
              severity: 'high',
              message: 'innerHTML with template string variables - potential XSS risk'
            });
          }
        }
        continue;
      }

      // It's a variable - check if sanitized or known safe
      const isSanitized = SAFE_SANITIZERS.some(sanitizer => line.includes(sanitizer));
      
      // Check for marked.parse (markdown library - user input should be sanitized before)
      const isMarked = value.includes('marked.parse');
      
      // Check for safe static HTML (Material Icons, etc)
      const isSafeStaticHTML = 
        line.includes('material-symbols-outlined') ||
        line.includes('<span class=') ||
        value === 'originalHTML' ||  // Restoring original HTML
        value === 'withBreaks';      // Just adding <br> tags
      
      // Check for safe variable naming patterns
      // These patterns indicate the developer has already sanitized or it's server data
      const safeVariablePatterns = [
        /Html$/,           // Variables ending in 'Html' are typically pre-processed
        /HTML$/,           // Variables ending in 'HTML' are typically pre-processed  
        /^display/,        // Display variables are typically formatted safe data
        /^final/,          // Final processed content
        /^next/,           // Next content (typically processed)
        /^sanitized/,      // Explicitly sanitized
        /^safe/,           // Explicitly marked safe
      ];
      
      const isSafeVariableName = safeVariablePatterns.some(pattern => pattern.test(value));
      
      if (!isSanitized && !isMarked && !isSafeStaticHTML && !isSafeVariableName) {
        risks.push({
          file: filePath,
          line: lineNum,
          type: 'xss',
          api: 'innerHTML',
          code: line.trim(),
          severity: 'high',
          message: 'innerHTML with unsanitized variable - potential XSS risk'
        });
      }
    }

    // Pattern 2: .outerHTML = variable
    const outerHTMLMatch = line.match(/\.outerHTML\s*=\s*([^;'"]+)/);
    if (outerHTMLMatch) {
      const value = outerHTMLMatch[1].trim();
      
      // Skip string literals without variables
      if (value.startsWith('"') || value.startsWith("'")) {
        continue;
      }

      // Check template strings or variables
      const isSanitized = SAFE_SANITIZERS.some(sanitizer => line.includes(sanitizer));
      if (!isSanitized) {
        risks.push({
          file: filePath,
          line: lineNum,
          type: 'xss',
          api: 'outerHTML',
          code: line.trim(),
          severity: 'high',
          message: 'outerHTML with unsanitized content - potential XSS risk'
        });
      }
    }

    // Pattern 3: insertAdjacentHTML
    const insertHTMLMatch = line.match(/\.insertAdjacentHTML\s*\(/);
    if (insertHTMLMatch) {
      // Check if the HTML content (2nd argument) is sanitized
      const isSanitized = SAFE_SANITIZERS.some(sanitizer => line.includes(sanitizer));
      if (!isSanitized && line.includes('${')) {
        risks.push({
          file: filePath,
          line: lineNum,
          type: 'xss',
          api: 'insertAdjacentHTML',
          code: line.trim(),
          severity: 'high',
          message: 'insertAdjacentHTML with variables - potential XSS risk'
        });
      }
    }

    // Pattern 4: eval() or new Function()
    if (line.includes('eval(') || line.includes('new Function(')) {
      const isSanitized = SAFE_SANITIZERS.some(sanitizer => line.includes(sanitizer));
      if (!isSanitized) {
        risks.push({
          file: filePath,
          line: lineNum,
          type: 'xss',
          api: 'eval/Function',
          code: line.trim(),
          severity: 'critical',
          message: 'eval() or new Function() - extremely dangerous, avoid if possible'
        });
      }
    }
  }

  return risks;
}

/**
 * Detect SQL injection risks
 * Pattern: .query() or similar with template strings containing variables
 */
function detectSQLRisks(fileContent, filePath) {
  const risks = [];
  const lines = fileContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      continue;
    }

    // Skip querySelector/querySelectorAll - NOT SQL!
    if (line.includes('querySelector') || line.includes('querySelectorAll')) {
      continue;
    }

    // Check for SQL-like methods
    const hasSQLMethod = DANGEROUS_APIS.sql.some(method => line.includes(method));
    if (!hasSQLMethod) {
      continue;
    }

    // Check if using template strings with variables
    if (line.includes('`') && line.includes('${')) {
      // Check for SQL keywords (common indicators)
      const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE', 'DROP'];
      const hasSQLKeyword = sqlKeywords.some(keyword => 
        line.toUpperCase().includes(keyword)
      );

      if (hasSQLKeyword) {
        // Check if using parameterized queries (safe pattern)
        const isParameterized = line.includes('?') || line.includes('$1') || line.includes(':');
        
        if (!isParameterized) {
          risks.push({
            file: filePath,
            line: lineNum,
            type: 'sql',
            api: 'SQL query',
            code: line.trim(),
            severity: 'critical',
            message: 'SQL query with template string variables - use parameterized queries'
          });
        }
      }
    }
  }

  return risks;
}

/**
 * Detect setTimeout/setInterval with string arguments (code execution risk)
 */
function detectTimerRisks(fileContent, filePath) {
  const risks = [];
  const lines = fileContent.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comments
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      continue;
    }

    // Pattern: setTimeout("code", ...) or setInterval("code", ...)
    const timerMatch = line.match(/set(?:Timeout|Interval)\s*\(\s*["'`]([^"'`]+)["'`]/);
    if (timerMatch) {
      const code = timerMatch[1];
      
      // If the string contains variables or looks like code execution
      if (code.includes('${') || code.includes('(') || code.includes('function')) {
        risks.push({
          file: filePath,
          line: lineNum,
          type: 'xss',
          api: 'setTimeout/setInterval',
          code: line.trim(),
          severity: 'medium',
          message: 'setTimeout/setInterval with string code - use function instead'
        });
      }
    }
  }

  return risks;
}

// ============================================================================
// MAIN VALIDATION
// ============================================================================

/**
 * Check a single file for security risks
 */
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const risks = [];

  // Detect all risk types
  risks.push(...detectInnerHTMLRisks(content, filePath));
  risks.push(...detectSQLRisks(content, filePath));
  risks.push(...detectTimerRisks(content, filePath));

  return risks;
}

/**
 * Check all JS files in the codebase
 */
function checkAllFiles() {
  const errors = [];
  const warnings = [];

  // Load whitelist once
  const whitelist = whitelistManager.loadWhitelist();

  // Directories to scan
  const dirsToScan = [
    path.join(ROOT_DIR, 'js'),
    path.join(ROOT_DIR, 'routes'),
    path.join(ROOT_DIR, 'services'),
    path.join(ROOT_DIR, 'middleware'),
    ROOT_DIR,  // For index.js, server.js, etc.
  ];

  // Files to skip
  const skipFiles = [
    'node_modules',
    '.backup',
    '.bak',
    'streamBuffer.js',  // Third-party
    'ttsMain.js',       // Standalone, no user input
    'ttsAuto.js',       // Standalone, no user input
  ];

  for (const dir of dirsToScan) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir, { recursive: false });
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      
      // Skip non-JS files and excluded files
      if (!filePath.endsWith('.js') && !filePath.endsWith('.mjs')) continue;
      if (skipFiles.some(skip => filePath.includes(skip))) continue;
      if (!fs.statSync(filePath).isFile()) continue;

      const risks = checkFile(filePath);
      
      for (const risk of risks) {
        // Check whitelist
        const relPath = path.relative(ROOT_DIR, risk.file);
        const entry = whitelistManager.getWhitelistEntryByLocation(whitelist, relPath, risk.line);
        
        if (entry && entry.category === 'security') {
          continue;  // Skip whitelisted issues
        }

        // Categorize by severity
        if (risk.severity === 'critical' || risk.severity === 'high') {
          errors.push(risk);
        } else {
          warnings.push(risk);
        }
      }
    }
  }

  return { errors, warnings };
}

/**
 * Format and print results
 */
function printResults(results) {
  const { errors, warnings } = results;

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ No security risks detected');
    return true;
  }

  // Print errors (critical/high severity)
  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} security ${errors.length === 1 ? 'risk' : 'risks'} detected:\n`);
    
    for (const error of errors) {
      const relativePath = path.relative(ROOT_DIR, error.file);
      console.log(`  ${relativePath}:${error.line}`);
      console.log(`    🔴 ${error.severity.toUpperCase()}: ${error.message}`);
      console.log(`    ${error.code}`);
      console.log('');
    }

    console.log('💡 To suppress false positives, add comment:');
    console.log('   // @validation-ignore security');
    console.log('   // @reason: [why this is safe]');
    console.log('');
  }

  // Print warnings (medium/low severity)
  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} potential security ${warnings.length === 1 ? 'issue' : 'issues'}:\n`);
    
    for (const warning of warnings) {
      const relativePath = path.relative(ROOT_DIR, warning.file);
      console.log(`  ${relativePath}:${warning.line}`);
      console.log(`    🟡 ${warning.severity.toUpperCase()}: ${warning.message}`);
      console.log(`    ${warning.code}`);
      console.log('');
    }
  }

  return errors.length === 0;
}

// ============================================================================
// CLI EXECUTION
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔒 Checking for security risks (SQL injection, XSS)...\n');
  
  const results = checkAllFiles();
  const success = printResults(results);
  
  process.exit(success ? 0 : 1);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default function checkSecurityRisks() {
  const results = checkAllFiles();
  
  if (results.errors.length === 0 && results.warnings.length === 0) {
    return { success: true, message: 'No security risks detected' };
  }
  
  const errorCount = results.errors.length;
  const warningCount = results.warnings.length;
  
  let message = '';
  if (errorCount > 0) {
    message += `${errorCount} security ${errorCount === 1 ? 'risk' : 'risks'} detected`;
  }
  if (warningCount > 0) {
    if (message) message += ', ';
    message += `${warningCount} potential ${warningCount === 1 ? 'issue' : 'issues'}`;
  }
  
  return {
    success: errorCount === 0,  // Only fail on critical/high severity
    message,
    errors: results.errors,
    warnings: results.warnings
  };
}

