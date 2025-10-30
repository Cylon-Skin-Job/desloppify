#!/usr/bin/env node

/**
 * @file detect-todo-changes.mjs
 * @description Detects TODO-related changes in the current git diff
 * 
 * Helps with session-end workflow by:
 * - Finding new TODO comments added
 * - Finding TODO comments removed (completed?)
 * - Matching changed files to TODO.md items
 * - Suggesting TODO.md updates
 * 
 * Usage:
 *   node scripts/detect-todo-changes.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

/**
 * Get git diff with TODO comments
 * @returns {{added: Array, removed: Array}}
 */
function getTODODiff() {
  try {
    const diff = execSync('git diff HEAD', { 
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024
    });
    
    const added = [];
    const removed = [];
    
    let currentFile = null;
    
    diff.split('\n').forEach(line => {
      // Track current file
      if (line.startsWith('diff --git')) {
        const match = line.match(/b\/(.*)/);
        if (match) currentFile = match[1];
      }
      
      // Find TODO comments
      const todoMatch = line.match(/[+-]\s*.*?(TODO|FIXME|HACK|XXX):\s*(.+)/i);
      if (todoMatch && currentFile) {
        const isAddition = line.startsWith('+');
        const isRemoval = line.startsWith('-');
        const keyword = todoMatch[1];
        const text = todoMatch[2].trim();
        
        if (isAddition) {
          added.push({ file: currentFile, keyword, text });
        } else if (isRemoval) {
          removed.push({ file: currentFile, keyword, text });
        }
      }
    });
    
    return { added, removed };
  } catch (error) {
    // No diff or error
    return { added: [], removed: [] };
  }
}

/**
 * Get files changed in git status
 * @returns {Array<string>}
 */
function getChangedFiles() {
  try {
    const status = execSync('git status --short', { 
      cwd: PROJECT_ROOT,
      encoding: 'utf-8' 
    });
    
    return status.split('\n')
      .filter(line => line.trim())
      .map(line => line.substring(3));
  } catch (error) {
    return [];
  }
}

/**
 * Parse TODO.md to extract all tracked items
 * @returns {Array<{tier: number, title: string, file: string, line: string}>}
 */
function parseTODOList() {
  const todoPath = path.join(PROJECT_ROOT, 'docs/TODO.md');
  
  if (!fs.existsSync(todoPath)) {
    return [];
  }
  
  const content = fs.readFileSync(todoPath, 'utf-8');
  const items = [];
  
  let currentTier = null;
  
  content.split('\n').forEach(line => {
    // Detect tier
    if (line.includes('## 🔌 Tier 1:')) currentTier = 1;
    else if (line.includes('## 🔧 Tier 2:')) currentTier = 2;
    else if (line.includes('## 🚧 Tier 3:')) currentTier = 3;
    
    // Extract items (markdown headers)
    const headerMatch = line.match(/^###\s+(.+)/);
    if (headerMatch && currentTier) {
      items.push({
        tier: currentTier,
        title: headerMatch[1]
      });
    }
    
    // Extract file references
    const fileMatch = line.match(/\*\*File:\*\*\s+`([^`]+)`/);
    if (fileMatch && items.length > 0) {
      items[items.length - 1].file = fileMatch[1];
    }
  });
  
  return items;
}

/**
 * Match changed files to TODO items
 * @param {Array<string>} changedFiles
 * @param {Array} todoItems
 * @returns {Array}
 */
function matchFilesToTODOs(changedFiles, todoItems) {
  const matches = [];
  
  for (const item of todoItems) {
    if (!item.file) continue;
    
    // Extract just filename from "path/to/file.js:123" format
    const todoFile = item.file.split(':')[0];
    
    for (const changedFile of changedFiles) {
      if (changedFile.includes(todoFile)) {
        matches.push({
          file: changedFile,
          todoItem: item
        });
      }
    }
  }
  
  return matches;
}

/**
 * Generate report
 */
function generateReport() {
  console.log('🔍 TODO Change Detection\n');
  
  // Get TODO diff
  const { added, removed } = getTODODiff();
  
  // Get changed files
  const changedFiles = getChangedFiles();
  
  // Parse TODO.md
  const todoItems = parseTODOList();
  
  // Match files to TODOs
  const matches = matchFilesToTODOs(changedFiles, todoItems);
  
  // Report new TODOs
  if (added.length > 0) {
    console.log(`📝 New TODO Comments (${added.length}):\n`);
    added.forEach(({ file, keyword, text }) => {
      console.log(`   ${keyword}: ${text}`);
      console.log(`   └─ ${file}\n`);
    });
  } else {
    console.log('✅ No new TODO comments\n');
  }
  
  // Report removed TODOs
  if (removed.length > 0) {
    console.log(`🎉 Removed TODO Comments (${removed.length}):\n`);
    removed.forEach(({ file, keyword, text }) => {
      console.log(`   ${keyword}: ${text}`);
      console.log(`   └─ ${file}\n`);
    });
  } else {
    console.log('ℹ️  No TODO comments removed\n');
  }
  
  // Report matched files
  if (matches.length > 0) {
    console.log(`🎯 Files Matching TODO.md Items (${matches.length}):\n`);
    matches.forEach(({ file, todoItem }) => {
      console.log(`   Tier ${todoItem.tier}: ${todoItem.title}`);
      console.log(`   └─ Modified: ${file}\n`);
    });
  } else {
    console.log('ℹ️  No changed files match TODO.md items\n');
  }
  
  // Suggestions
  console.log('💡 Suggestions:\n');
  
  if (added.length > 0) {
    console.log('   • Consider adding new TODOs to docs/TODO.md');
  }
  
  if (removed.length > 0) {
    console.log('   • Update docs/TODO.md if these items are complete');
  }
  
  if (matches.length > 0) {
    console.log('   • Did you complete or update any of these TODO items?');
    console.log('   • Should any items move between tiers?');
  }
  
  if (added.length === 0 && removed.length === 0 && matches.length === 0) {
    console.log('   ✅ No TODO-related changes detected');
  }
  
  console.log('');
  
  // Exit code based on findings
  const hasChanges = added.length > 0 || removed.length > 0 || matches.length > 0;
  process.exit(hasChanges ? 1 : 0); // 1 = has changes (prompts user), 0 = no changes
}

generateReport();

