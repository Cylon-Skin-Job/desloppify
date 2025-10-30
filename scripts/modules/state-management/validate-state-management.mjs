#!/usr/bin/env node

/**
 * State Management Validator
 * 
 * Checks for:
 * 1. Direct state variable assignments (should use setters)
 * 2. Direct state variable reads (should use getters)
 * 3. Common ES6 module issues
 * 
 * Usage: node scripts/validate-state-management.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// State variables that MUST use getters/setters
const STATE_VARS = [
  'autoPlayEnabled',
  'devMode',
  'voiceOptions',
  'voiceIndex',
  'userId',
  'currentUser',
  'currentIdToken',
  'threadId',
  'currentThreadId',
  'currentAppSlug',
  'isSending',
  'currentAudio',
  'lastTtsButton',
  'pinnedSectionExpanded',
  'currentAssistantIcon',
  'currentAssistantName'
];

// Files to check (JS files only)
const FILE_PATTERNS = [
  'js/**/*.js',
  'rOS.js',
  'index.js'
];

// Files to exclude
const EXCLUDE_PATTERNS = [
  'node_modules',
  'js/app-state.js',  // This file defines the variables
  '.git'
];

let errors = [];
let warnings = [];

// Helper: recursively find files
function findFiles(dir, pattern) {
  const results = [];
  
  if (!fs.existsSync(dir)) {
    return results;
  }
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Skip excluded patterns
    if (EXCLUDE_PATTERNS.some(ex => filePath.includes(ex))) {
      continue;
    }
    
    if (stat.isDirectory()) {
      results.push(...findFiles(filePath, pattern));
    } else if (filePath.endsWith('.js')) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Check 1: Direct state variable assignments
function checkDirectAssignments(filePath, content, lines) {
  STATE_VARS.forEach(varName => {
    // Only check for window.varName = (the actual global state)
    const pattern = new RegExp(`window\\.${varName}\\s*=(?!=)`, 'g');
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      const line = lines[lineNum - 1];
      
      // Skip if it's a comment
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        continue;
      }
      
      // Skip if it's in a string literal
      if (isInString(content, match.index)) {
        continue;
      }
      
      // Skip if it's a DOM dataset attribute (e.g., element.dataset.varName)
      const before = content.substring(Math.max(0, match.index - 20), match.index);
      if (before.includes('.dataset.')) {
        continue;
      }
      
      // Skip if it's a local variable declaration (let/const/var)
      if (line.includes(`let ${varName}`) || line.includes(`const ${varName}`) || line.includes(`var ${varName}`)) {
        continue;
      }
      
      errors.push({
        file: path.relative(projectRoot, filePath),
        line: lineNum,
        code: line.trim(),
        issue: `Direct assignment to '${varName}' - use setter instead`,
        fix: `Use set${capitalize(varName)}(value)`
      });
    }
  });
}

// Check 2: Direct state variable reads
function checkDirectReads(filePath, content, lines) {
  STATE_VARS.forEach(varName => {
    // Pattern: window.varName (not followed by =)
    const pattern = new RegExp(`window\\.${varName}(?!\\s*[=\\(])`, 'g');
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      const line = lines[lineNum - 1];
      
      // Skip if it's a comment
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
        continue;
      }
      
      // Skip if it's in a string literal
      if (isInString(content, match.index)) {
        continue;
      }
      
      // Skip if it's a DOM dataset attribute
      const before = content.substring(Math.max(0, match.index - 20), match.index);
      if (before.includes('.dataset.')) {
        continue;
      }
      
      // Skip if it's already a getter call (has parentheses after)
      const nextChars = content.substring(match.index + match[0].length, match.index + match[0].length + 2);
      if (nextChars === '()') {
        continue;
      }
      
      errors.push({
        file: path.relative(projectRoot, filePath),
        line: lineNum,
        code: line.trim(),
        issue: `Direct read of '${varName}' - use getter instead`,
        fix: `Use get${capitalize(varName)}()`
      });
    }
  });
}

// Check 3: ES6 module issues
function checkES6Issues(filePath, content, lines) {
  const relPath = path.relative(projectRoot, filePath);
  
  // Issue: ES6 export in a file loaded as regular script
  if (relPath.includes('public/') || relPath.includes('ttsMain.js') || relPath.includes('ttsAuto.js')) {
    if (content.includes('export ') && !content.includes('window.')) {
      warnings.push({
        file: relPath,
        line: content.indexOf('export '),
        issue: 'File has ES6 export but might be loaded as regular script',
        fix: 'Either use window.ClassName or load with type="module"'
      });
    }
  }
  
  // Issue: Import without .js extension
  const importPattern = /import .+ from ['"]\.\.?\/.+(?<!\.js)['"]/g;
  let match;
  while ((match = importPattern.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    warnings.push({
      file: relPath,
      line: lineNum,
      code: lines[lineNum - 1].trim(),
      issue: 'Import path missing .js extension',
      fix: 'Add .js to the import path'
    });
  }
}

// Helper: Check if index is inside a string literal
function isInString(content, index) {
  let inString = false;
  let stringChar = null;
  
  for (let i = 0; i < index; i++) {
    const char = content[i];
    const prevChar = i > 0 ? content[i - 1] : '';
    
    if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
      if (inString && char === stringChar) {
        inString = false;
        stringChar = null;
      } else if (!inString) {
        inString = true;
        stringChar = char;
      }
    }
  }
  
  return inString;
}

// Helper: Capitalize first letter
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Main validation function
function validateFiles() {
  console.log('🔍 Validating state management and ES6 modules...\n');
  
  // Find all JS files
  const jsDir = path.join(projectRoot, 'js');
  const files = [
    ...findFiles(jsDir, '*.js'),
    path.join(projectRoot, 'rOS.js'),
    path.join(projectRoot, 'index.js')
  ].filter(f => fs.existsSync(f));
  
  console.log(`📁 Checking ${files.length} files...\n`);
  
  // Check each file
  files.forEach(filePath => {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    checkDirectAssignments(filePath, content, lines);
    checkDirectReads(filePath, content, lines);
    checkES6Issues(filePath, content, lines);
  });
  
  // Report results
  console.log('═══════════════════════════════════════════════════════\n');
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed! No issues found.\n');
    return true;
  }
  
  if (errors.length > 0) {
    console.log(`❌ Found ${errors.length} ERROR(S):\n`);
    errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.file}:${err.line}`);
      console.log(`   Issue: ${err.issue}`);
      console.log(`   Code:  ${err.code}`);
      console.log(`   Fix:   ${err.fix}`);
      console.log('');
    });
  }
  
  if (warnings.length > 0) {
    console.log(`⚠️  Found ${warnings.length} WARNING(S):\n`);
    warnings.forEach((warn, i) => {
      console.log(`${i + 1}. ${warn.file}:${warn.line}`);
      console.log(`   Issue: ${warn.issue}`);
      if (warn.code) console.log(`   Code:  ${warn.code}`);
      console.log(`   Fix:   ${warn.fix}`);
      console.log('');
    });
  }
  
  console.log('═══════════════════════════════════════════════════════\n');
  
  return errors.length === 0;
}

// Run validation
const success = validateFiles();
process.exit(success ? 0 : 1);

