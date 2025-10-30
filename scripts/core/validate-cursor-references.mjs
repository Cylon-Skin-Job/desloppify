#!/usr/bin/env node

/**
 * Validates that all file references in .cursor/ directory still exist
 * 
 * Scans .cursor/ for:
 * - File paths in markdown links
 * - File paths in text (docs, rules, scripts)
 * - Script references
 * 
 * Verifies each referenced file actually exists in the workspace.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔍 Validating .cursor/ file references...\n');

let hasErrors = false;
const allReferences = new Map(); // file -> [locations]

/**
 * Recursively find all .md and .mdc files in a directory
 */
function findCursorFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findCursorFiles(fullPath));
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdc')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Extract file references from content
 * Looks for:
 * - Markdown links: [text](path/to/file)
 * - Direct mentions: docs/file.md, scripts/file.mjs, .cursor/rules/file.mdc
 */
function extractFileReferences(content, filePath) {
  const references = [];
  
  // Pattern 1: Markdown links [text](path)
  const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = mdLinkRegex.exec(content)) !== null) {
    const link = match[2];
    // Skip URLs, anchors, and mailto
    if (!link.startsWith('http') && !link.startsWith('#') && !link.startsWith('mailto:')) {
      references.push(link);
    }
  }
  
  // Pattern 2: File paths in text (docs/, scripts/, .cursor/, js/, css/, etc.)
  // Looking for: word/word.ext patterns
  const pathRegex = /(?:^|\s|`)((?:docs|scripts|\.cursor|js|css|services|routes|middleware|specs)\/[a-zA-Z0-9_.\/-]+\.(?:md|mdc|mjs|js|json|css|html))(?:\s|`|$|\)|,|\.)/gm;
  while ((match = pathRegex.exec(content)) !== null) {
    references.push(match[1]);
  }
  
  return references;
}

// Find all cursor files
const cursorDir = path.join(projectRoot, '.cursor');
const cursorFiles = findCursorFiles(cursorDir);

console.log(`📂 Scanning ${cursorFiles.length} files in .cursor/...\n`);

// Scan each file for references
for (const cursorFile of cursorFiles) {
  const content = fs.readFileSync(cursorFile, 'utf-8');
  const relativePath = path.relative(projectRoot, cursorFile);
  const references = extractFileReferences(content, cursorFile);
  
  for (const ref of references) {
    // Resolve the reference relative to project root
    const resolvedPath = path.join(projectRoot, ref);
    
    if (!allReferences.has(ref)) {
      allReferences.set(ref, []);
    }
    allReferences.get(ref).push(relativePath);
  }
}

console.log(`🔗 Found ${allReferences.size} unique file references\n`);

// Check if each referenced file exists
console.log('✅ Checking references...\n');

const brokenReferences = [];
const validReferences = [];

for (const [ref, locations] of allReferences.entries()) {
  const resolvedPath = path.join(projectRoot, ref);
  const exists = fs.existsSync(resolvedPath);
  
  if (!exists) {
    brokenReferences.push({ ref, locations });
  } else {
    validReferences.push(ref);
  }
}

// Report valid references (summary only)
console.log(`✅ Valid references: ${validReferences.length}`);
if (validReferences.length <= 10) {
  validReferences.forEach(ref => console.log(`   ✅ ${ref}`));
} else {
  validReferences.slice(0, 5).forEach(ref => console.log(`   ✅ ${ref}`));
  console.log(`   ... and ${validReferences.length - 5} more`);
}
console.log();

// Report broken references
if (brokenReferences.length > 0) {
  console.error(`❌ BROKEN REFERENCES: ${brokenReferences.length}\n`);
  
  for (const { ref, locations } of brokenReferences) {
    console.error(`❌ ${ref}`);
    console.error(`   Referenced in:`);
    locations.forEach(loc => console.error(`   - ${loc}`));
    console.error();
  }
  
  console.error('Fix: Update or remove these references in .cursor/ files\n');
  hasErrors = true;
}

// Summary
if (hasErrors) {
  console.error('❌ .cursor/ reference validation FAILED\n');
  process.exit(1);
} else {
  console.log('✅ All .cursor/ references valid!\n');
  process.exit(0);
}








