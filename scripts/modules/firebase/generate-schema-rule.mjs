#!/usr/bin/env node
/**
 * Firestore Schema Rule Generator
 * 
 * Scans code for Firestore usage patterns and generates .cursor/rules/07-firestore-schema.mdc
 * with current database structure for AI context
 * 
 * Part of self-updating brain system - run via /maintenance command
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Extract Firestore collection/document patterns from code
 * @param {string} filePath - Path to scan
 * @returns {Array} Array of collection patterns found
 */
function extractFirestorePatterns(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const patterns = new Set();
  
  // Match collection paths like:
  // - db.collection('users')
  // - db.collection(`users/${userId}/threads`)
  // - collection("users")
  // - doc(db, 'users', userId)
  
  const collectionPatterns = [
    /db\.collection\(['"`]([^'"`]+)['"`]\)/g,
    /db\.collection\(`([^`]+)`\)/g,
    /collection\(['"`]([^'"`]+)['"`]\)/g,
    /doc\(db,\s*['"`]([^'"`]+)['"`]/g,
  ];
  
  for (const pattern of collectionPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      let collectionPath = match[1];
      
      // Normalize template strings (replace ${var} with {var})
      collectionPath = collectionPath.replace(/\$\{(\w+)\}/g, '{$1}');
      
      patterns.add(collectionPath);
    }
  }
  
  return Array.from(patterns);
}

/**
 * Scan codebase for Firestore patterns
 * @returns {Object} Patterns grouped by type
 */
function scanFirestoreUsage() {
  const patterns = {
    collections: new Set(),
    byFile: {}
  };
  
  // Scan backend files
  const dirsToScan = ['routes', 'services', 'middleware'];
  
  for (const dir of dirsToScan) {
    const dirPath = path.join(projectRoot, dir);
    if (!fs.existsSync(dirPath)) continue;
    
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.js'));
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const filePatterns = extractFirestorePatterns(filePath);
      
      if (filePatterns.length > 0) {
        patterns.byFile[`${dir}/${file}`] = filePatterns;
        filePatterns.forEach(p => patterns.collections.add(p));
      }
    }
  }
  
  // Also scan frontend if it uses Firestore
  const jsDir = path.join(projectRoot, 'js');
  if (fs.existsSync(jsDir)) {
    const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
    
    for (const file of files) {
      const filePath = path.join(jsDir, file);
      const filePatterns = extractFirestorePatterns(filePath);
      
      if (filePatterns.length > 0) {
        patterns.byFile[`js/${file}`] = filePatterns;
        filePatterns.forEach(p => patterns.collections.add(p));
      }
    }
  }
  
  return {
    collections: Array.from(patterns.collections).sort(),
    byFile: patterns.byFile
  };
}

/**
 * Parse collection path into hierarchy
 * @param {Array} collections - Array of collection paths
 * @returns {Object} Hierarchical structure
 */
function buildCollectionHierarchy(collections) {
  const tree = {};
  
  for (const path of collections) {
    const parts = path.split('/');
    let current = tree;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      if (!current[part]) {
        current[part] = {
          isCollection: i % 2 === 0, // Collections at even indices
          children: {}
        };
      }
      
      current = current[part].children;
    }
  }
  
  return tree;
}

/**
 * Generate markdown hierarchy from tree
 * @param {Object} tree - Collection hierarchy
 * @param {number} depth - Current depth level
 * @returns {string} Markdown representation
 */
function generateHierarchyMarkdown(tree, depth = 0) {
  let md = '';
  const indent = '  '.repeat(depth);
  
  for (const [name, node] of Object.entries(tree)) {
    const marker = node.isCollection ? '📁' : '📄';
    md += `${indent}- ${marker} \`${name}\`\n`;
    
    if (Object.keys(node.children).length > 0) {
      md += generateHierarchyMarkdown(node.children, depth + 1);
    }
  }
  
  return md;
}

/**
 * Generate the cursor rule content
 * @param {Object} usage - Firestore usage data
 * @returns {string} Markdown content for cursor rule
 */
function generateRuleContent(usage) {
  const timestamp = new Date().toISOString().split('T')[0];
  const tree = buildCollectionHierarchy(usage.collections);
  
  let content = `---
globs: ["routes/**/*.js", "services/**/*.js", "js/**/*.js"]
alwaysApply: false
---

# Firestore Schema Reference

**Auto-generated from code** - Last updated: ${timestamp}

This rule is automatically updated by \`/maintenance\` command.

---

## 🎯 Purpose

Provides AI with current Firestore database structure when working with data access.

**When loaded:** Working with database operations, schema changes, or data flow

---

## 📋 Collection Structure

**Total Collections/Paths:** ${usage.collections.length}

### Hierarchy

${generateHierarchyMarkdown(tree)}

---

## 📝 Collection Paths in Code

`;

  // List all unique paths
  for (const path of usage.collections) {
    content += `- \`${path}\`\n`;
  }
  
  content += `\n---\n\n`;
  
  // Show usage by file
  content += `## 📂 Usage by File\n\n`;
  
  for (const [file, paths] of Object.entries(usage.byFile)) {
    content += `### ${file}\n\n`;
    for (const path of paths) {
      content += `- \`${path}\`\n`;
    }
    content += `\n`;
  }
  
  // Add notes section
  content += `---

## 📝 Schema Notes

### Naming Convention
- **ALL Firestore fields use \`snake_case\`** (e.g., \`created_at\`, \`last_viewed\`, \`subscription_status\`)
- Collection names also use \`snake_case\`

### Common Fields
- \`created_at\` - Timestamp (FieldValue.serverTimestamp())
- \`last_modified\` - Timestamp for updates
- \`display_ts\` - Optional display timestamp override

### Key Collections

#### users/{userId}
- Main user document
- Contains \`settings\` object (subscriptionStatus, ageVerified, etc.)

#### users/{userId}/threads/{threadId}
- Thread metadata (title, last_viewed, created_at, app, pinned, archived)

#### users/{userId}/threads/{threadId}/messages/{messageId}
- Individual messages
- Fields:
  - \`user\` (string) - User's message content
  - \`assistant\` (string) - Assistant's response
  - \`created_at\` (timestamp) - When message was created
  - \`display_ts\` (string|null) - Optional display timestamp override
  - \`context_doc_ids\` (array) - FIFO context chain for conversation state (see note below)
  - \`app_slug\` (string) - App/mode identifier
  - \`prompt_payload\` (object) - Optional prompt configuration
  - \`bookmark\` (boolean) - Optional bookmark flag

#### system/
- Shared configurations (may be empty in dev)
- Subcollections:
  - \`prompt_library/{docId}\` - System prompts used by contextBuilder
  - \`app_registry/{slug}\` - Central app configuration (model, prompt file, context limits)
  - \`tts_voices/{provider}\` - Voice IDs/labels and ordering
  - \`system_tools/{toolId}\` - Shared tool definitions/configs

#### server_logs/
- Backend logs via logger.logServerEvent
- Fields: level, message, meta, created_at

### Important Notes

**Context Chain (\`context_doc_ids\`):**
- This is a FIFO array used by \`contextBuilder\` to reconstruct recent conversation state
- Contains message IDs in chronological order
- Critical for maintaining conversation context across requests

**Thread Cleanup:**
- Empty threads (no messages) may be automatically cleaned up by \`timeout.js\` services
- This prevents orphaned thread documents from accumulating

---

## 🔄 How This Updates

This file is auto-generated by:
1. \`npm run docs:check\` (runs all generators)
2. \`/maintenance\` command (full maintenance workflow)

**Source:** \`scripts/generate-schema-rule.mjs\`

**Note:** This scans code for Firestore usage patterns. Manual schema updates may be needed for collections not yet in code.

---

**Last scanned:** ${timestamp}
`;

  return content;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning Firestore usage patterns...');
  
  const usage = scanFirestoreUsage();
  
  console.log(`✅ Found ${usage.collections.length} collection paths across ${Object.keys(usage.byFile).length} files`);
  
  const content = generateRuleContent(usage);
  const outputPath = path.join(projectRoot, '.cursor/rules/07-firestore-schema.mdc');
  
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`✅ Generated: ${outputPath}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { scanFirestoreUsage, generateRuleContent };

