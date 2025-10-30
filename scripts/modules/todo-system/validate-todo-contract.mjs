#!/usr/bin/env node

/**
 * validate-todo-contract.mjs
 * 
 * Validates the two-way contract between code and docs/TODO.md:
 * 
 * 1. Code → TODO: Every @todo: annotation in code must have a matching TODO.md entry
 * 2. TODO → Code: Every TODO entry with a Function: field must have matching @todo: annotation
 * 3. File paths and anchors must match
 * 
 * Usage:
 *   node scripts/validate-todo-contract.mjs
 *   npm run validate:todo
 * 
 * Exit codes:
 *   0 - All TODO contracts valid
 *   1 - Contract violations found
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// =============================================================================
// CONFIGURATION
// =============================================================================

const TODO_FILE = path.join(ROOT, 'docs/TODO.md');
const CODE_DIRS = [
  path.join(ROOT, 'js'),
  path.join(ROOT, 'services'),
  path.join(ROOT, 'routes'),
  path.join(ROOT, 'middleware'),
];

// Regex to find @todo: annotations in code
const TODO_ANNOTATION_REGEX = /@todo:\s*docs\/TODO\.md#([\w-]+)/gi;

// Regex to find TODO entries with Function: field
// Matches entries like:
// #### Title {#anchor}
// **File:** `path/to/file.js:123`
// **Function:** `functionName()`
const TODO_ENTRY_REGEX = /####\s+([^\{]+?)\s*\{#([\w-]+)\}[^\#]*?\*\*(?:File|Function):\*\*[^\#]*?\*\*(?:Function|File):\*\*/gi;

// =============================================================================
// FILE SCANNING
// =============================================================================

/**
 * Recursively find all .js and .mjs files in directories
 */
function findSourceFiles(dirs) {
  const files = [];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    
    const walk = (currentPath) => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules
          if (entry.name === 'node_modules') continue;
          walk(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))) {
          files.push(fullPath);
        }
      }
    };
    
    walk(dir);
  }
  
  return files;
}

/**
 * Extract all @todo: annotations from source files
 * Returns: [{ file, line, anchor, fullPath }]
 */
function extractTodoAnnotations(files) {
  const annotations = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, idx) => {
      const matches = [...line.matchAll(TODO_ANNOTATION_REGEX)];
      
      for (const match of matches) {
        const anchor = match[1];
        const relativePath = path.relative(ROOT, file);
        
        annotations.push({
          file: relativePath,
          line: idx + 1,
          anchor,
          fullPath: file,
        });
      }
    });
  }
  
  return annotations;
}

/**
 * Extract all TODO entries with Function: field from TODO.md
 * Returns: [{ title, anchor, function, file }]
 */
function extractTodoEntries(todoFile) {
  if (!fs.existsSync(todoFile)) {
    console.error(`❌ TODO file not found: ${todoFile}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(todoFile, 'utf-8');
  const lines = content.split('\n');
  const entries = [];
  
  let currentEntry = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for #### or ### Header {#anchor}
    const headerMatch = line.match(/^#{3,4}\s+([^\{]+?)\s*\{#([\w-]+)\}/);
    if (headerMatch) {
      // If we have a previous entry with Function field, save it
      if (currentEntry && currentEntry.function) {
        entries.push(currentEntry);
      }
      
      // Start new entry
      currentEntry = {
        title: headerMatch[1].trim(),
        anchor: headerMatch[2],
        function: null,
        file: null,
      };
      continue;
    }
    
    // If we're tracking an entry, look for **Function:** and **File:**
    if (currentEntry) {
      const functionMatch = line.match(/\*\*Functions?:\*\*\s*`([^`]+)`/);
      if (functionMatch) {
        currentEntry.function = functionMatch[1].trim();
      }
      
      const fileMatch = line.match(/\*\*File:\*\*\s*`([^`]+)`/);
      if (fileMatch) {
        currentEntry.file = fileMatch[1].trim();
      }
      
      // If we hit another ## section (but not ### or ####), save current entry if it has Function
      if (line.match(/^#{1,2}\s+/) && !line.match(/^#{3,4}/)) {
        if (currentEntry.function) {
          entries.push(currentEntry);
        }
        currentEntry = null;
      }
    }
  }
  
  // Don't forget the last entry
  if (currentEntry && currentEntry.function) {
    entries.push(currentEntry);
  }
  
  return entries;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validate that every @todo: annotation has a matching TODO.md entry
 */
function validateCodeToTodo(annotations, todoEntries) {
  const errors = [];
  const todoAnchors = new Set(todoEntries.map(e => e.anchor));
  
  for (const annotation of annotations) {
    if (!todoAnchors.has(annotation.anchor)) {
      errors.push({
        type: 'missing-todo-entry',
        annotation,
        message: `Code has @todo: annotation for #${annotation.anchor}, but TODO.md has no matching entry`,
      });
    }
  }
  
  return errors;
}

/**
 * Validate that every TODO entry with Function: has a matching @todo: annotation
 */
function validateTodoToCode(todoEntries, annotations) {
  const errors = [];
  const codeAnchors = new Set(annotations.map(a => a.anchor));
  
  for (const entry of todoEntries) {
    if (!codeAnchors.has(entry.anchor)) {
      errors.push({
        type: 'missing-code-annotation',
        entry,
        message: `TODO.md has entry #${entry.anchor} for function ${entry.function}, but code has no @todo: annotation`,
      });
    }
  }
  
  return errors;
}

/**
 * Validate that file paths match between code and TODO
 */
function validateFilePaths(annotations, todoEntries) {
  const warnings = [];
  
  // Build a map of anchor -> code file path
  const anchorToCodeFile = new Map();
  for (const annotation of annotations) {
    anchorToCodeFile.set(annotation.anchor, annotation.file);
  }
  
  // Check if TODO file paths match code file paths
  for (const entry of todoEntries) {
    const codeFile = anchorToCodeFile.get(entry.anchor);
    
    if (codeFile) {
      // Extract just the file path (TODO might have :lineNumber)
      const todoFilePath = entry.file.split(':')[0];
      
      if (!codeFile.includes(todoFilePath)) {
        warnings.push({
          type: 'file-path-mismatch',
          entry,
          codeFile,
          message: `TODO.md says ${entry.function} is in ${entry.file}, but @todo: annotation found in ${codeFile}`,
        });
      }
    }
  }
  
  return warnings;
}

// =============================================================================
// REPORTING
// =============================================================================

function reportErrors(errors, warnings, annotationCount, todoEntryCount) {
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All TODO contracts validated successfully\n');
    console.log(`   📝 ${annotationCount} @todo: annotations in code`);
    console.log(`   📋 ${todoEntryCount} TODO entries with Function: field`);
    console.log(`   🔗 All contracts match!\n`);
    return true;
  }
  
  let hasErrors = false;
  
  if (errors.length > 0) {
    hasErrors = true;
    console.log('❌ TODO Contract Violations:\n');
    
    for (const error of errors) {
      if (error.type === 'missing-todo-entry') {
        console.log(`   ${error.annotation.file}:${error.annotation.line}`);
        console.log(`      @todo: docs/TODO.md#${error.annotation.anchor}`);
        console.log(`      ❌ No matching TODO entry found for #${error.annotation.anchor}\n`);
      } else if (error.type === 'missing-code-annotation') {
        console.log(`   docs/TODO.md#${error.entry.anchor}`);
        console.log(`      Function: ${error.entry.function}`);
        console.log(`      ❌ No @todo: annotation found in ${error.entry.file}\n`);
      }
    }
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  TODO Contract Warnings:\n');
    
    for (const warning of warnings) {
      console.log(`   docs/TODO.md#${warning.entry.anchor}`);
      console.log(`      TODO says: ${warning.entry.file}`);
      console.log(`      Code is in: ${warning.codeFile}`);
      console.log(`      ⚠️  File path mismatch (may need to update TODO.md)\n`);
    }
  }
  
  return !hasErrors;
}

// =============================================================================
// MAIN
// =============================================================================

function main() {
  console.log('🔍 Validating TODO contracts...\n');
  
  // Step 1: Find all source files
  const sourceFiles = findSourceFiles(CODE_DIRS);
  console.log(`   Found ${sourceFiles.length} source files to scan`);
  
  // Step 2: Extract @todo: annotations from code
  const annotations = extractTodoAnnotations(sourceFiles);
  console.log(`   Found ${annotations.length} @todo: annotations in code`);
  
  // Step 3: Extract TODO entries from TODO.md
  const todoEntries = extractTodoEntries(TODO_FILE);
  console.log(`   Found ${todoEntries.length} TODO entries with Function: field\n`);
  
  // Step 4: Validate contracts
  const codeToTodoErrors = validateCodeToTodo(annotations, todoEntries);
  const todoToCodeErrors = validateTodoToCode(todoEntries, annotations);
  const filePathWarnings = validateFilePaths(annotations, todoEntries);
  
  const allErrors = [...codeToTodoErrors, ...todoToCodeErrors];
  
  // Step 5: Report results
  const success = reportErrors(allErrors, filePathWarnings, annotations.length, todoEntries.length);
  
  // Step 6: Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { extractTodoAnnotations, extractTodoEntries, validateCodeToTodo, validateTodoToCode };

