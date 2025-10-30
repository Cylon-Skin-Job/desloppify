#!/usr/bin/env node
/**
 * Cursor Rule Syntax Validator
 * 
 * Validates that all .mdc files in .cursor/rules/ follow rule 88 syntax
 * 
 * Checks:
 * - Frontmatter delimiters (---)
 * - globs uses JSON array format ["pattern"] not YAML list
 * - alwaysApply is present (true or false)
 * - Correct spacing in arrays (, not ,  )
 * - No trailing commas
 * 
 * @returns {void}
 * @throws Never throws - reports errors and exits with code 1
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Parse frontmatter from an MDC file
 * @param {string} content - File content
 * @returns {object|null} Parsed frontmatter or null if invalid
 */
function parseFrontmatter(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return null;
  }
  
  const frontmatter = frontmatterMatch[1];
  return {
    raw: frontmatter,
    fullMatch: frontmatterMatch[0]
  };
}

/**
 * Validate a single cursor rule file
 * @param {string} filePath - Path to .mdc file
 * @returns {Array} Array of error objects
 */
function validateRuleFile(filePath) {
  const errors = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(projectRoot, filePath);
  
  // Check 1: Has frontmatter delimiters
  if (!content.startsWith('---\n')) {
    errors.push({
      file: relativePath,
      error: 'Missing frontmatter opening delimiter (---)',
      severity: 'error'
    });
    return errors; // Can't validate further without frontmatter
  }
  
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    errors.push({
      file: relativePath,
      error: 'Missing frontmatter closing delimiter (---)',
      severity: 'error'
    });
    return errors;
  }
  
  // Check 2: Has alwaysApply field
  if (!frontmatter.raw.includes('alwaysApply:')) {
    errors.push({
      file: relativePath,
      error: 'Missing alwaysApply field',
      severity: 'error'
    });
  }
  
  // Check 3: alwaysApply value is valid
  const alwaysApplyMatch = frontmatter.raw.match(/alwaysApply:\s*(true|false)/);
  if (frontmatter.raw.includes('alwaysApply:') && !alwaysApplyMatch) {
    errors.push({
      file: relativePath,
      error: 'alwaysApply must be true or false',
      severity: 'error'
    });
  }
  
  // Check 4: globs format (if present)
  const globsMatch = frontmatter.raw.match(/globs:\s*(.+)/);
  if (globsMatch) {
    const globsValue = globsMatch[1].trim();
    
    // Check if using YAML list format (wrong)
    if (frontmatter.raw.match(/globs:\s*\n\s*-/)) {
      errors.push({
        file: relativePath,
        error: 'globs uses YAML list format. Should be JSON array: globs: ["pattern1", "pattern2"]',
        severity: 'error',
        line: frontmatter.raw.split('\n').findIndex(l => l.includes('globs:')) + 1
      });
    }
    
    // Check if using brackets
    if (!globsValue.startsWith('[')) {
      errors.push({
        file: relativePath,
        error: 'globs must use square brackets: globs: ["pattern"]',
        severity: 'error'
      });
    }
    
    // Check for double spaces after comma
    if (globsValue.match(/,\s{2,}/)) {
      errors.push({
        file: relativePath,
        error: 'globs array has extra spaces after comma. Should be single space: ", "',
        severity: 'warning'
      });
    }
    
    // Check for trailing comma
    if (globsValue.match(/,\s*\]/)) {
      errors.push({
        file: relativePath,
        error: 'globs array has trailing comma',
        severity: 'warning'
      });
    }
    
    // Check for missing quotes around patterns
    if (globsValue.includes('[') && !globsValue.match(/\[".*"\]/)) {
      // Allow empty arrays []
      if (globsValue.trim() !== '[]') {
        errors.push({
          file: relativePath,
          error: 'globs patterns must be in double quotes',
          severity: 'error'
        });
      }
    }
  }
  
  return errors;
}

/**
 * Validate all cursor rule files
 * @returns {object} Validation results
 */
function validateAllRules() {
  const rulesDir = path.join(projectRoot, '.cursor/rules');
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };
  
  if (!fs.existsSync(rulesDir)) {
    console.log('⚠️  No .cursor/rules/ directory found');
    return results;
  }
  
  /**
   * Recursively scan directory for .mdc files
   * @param {string} dir - Directory to scan
   * @returns {Array<string>} Array of file paths
   */
  function scanDirectory(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...scanDirectory(fullPath));
      } else if (entry.name.endsWith('.mdc')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  const ruleFiles = scanDirectory(rulesDir);
  results.total = ruleFiles.length;
  
  for (const file of ruleFiles) {
    const errors = validateRuleFile(file);
    if (errors.length > 0) {
      results.failed++;
      results.errors.push(...errors);
    } else {
      results.passed++;
    }
  }
  
  return results;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Validating cursor rule syntax...\n');
  
  const results = validateAllRules();
  
  if (results.total === 0) {
    console.log('⚠️  No cursor rules found to validate');
    return;
  }
  
  console.log(`📊 Scanned ${results.total} rule files\n`);
  
  if (results.errors.length === 0) {
    console.log('✅ All cursor rules follow correct syntax!\n');
    return;
  }
  
  // Group errors by file
  const errorsByFile = {};
  for (const error of results.errors) {
    if (!errorsByFile[error.file]) {
      errorsByFile[error.file] = [];
    }
    errorsByFile[error.file].push(error);
  }
  
  console.log('❌ Found syntax issues:\n');
  
  for (const [file, errors] of Object.entries(errorsByFile)) {
    console.log(`📄 ${file}`);
    for (const error of errors) {
      const icon = error.severity === 'error' ? '  ❌' : '  ⚠️ ';
      const lineInfo = error.line ? ` (line ${error.line})` : '';
      console.log(`${icon} ${error.error}${lineInfo}`);
    }
    console.log('');
  }
  
  console.log(`\n📊 Summary: ${results.failed}/${results.total} files have issues\n`);
  console.log('💡 See .cursor/rules/88-cursor-rule-syntax.mdc for correct format\n');
  
  process.exit(1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateRuleFile, validateAllRules };








