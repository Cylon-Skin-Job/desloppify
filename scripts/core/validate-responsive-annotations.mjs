#!/usr/bin/env node

/**
 * Responsive Annotation Validator
 * 
 * Validates that all selectors with responsive rules in responsive.css
 * are annotated in their base CSS files with a comment pointing to responsive.css.
 * 
 * Annotation format:
 *   /* Responsive: See responsive.css @media (max-width: 600px) *\/
 *   #selector { ... }
 * 
 * Exit codes:
 *   0 - All annotations present
 *   1 - Missing annotations found
 *   2 - Error during validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const CSS_DIR = path.join(projectRoot, 'css');
const RESPONSIVE_CSS = path.join(CSS_DIR, 'responsive.css');

// CSS files to check for annotations (exclude responsive.css itself and themes.css)
const CSS_FILES_TO_CHECK = [
  'main.css',
  'header-footer.css',
  'buttons.css',
  'log-in.css',
  'threads.css',
  'notes.css',
  'modals.css',
  'popups.css',
  'tools.css'
];

/**
 * Extract all selectors from responsive.css @media queries
 * @returns {Map<string, string[]>} Map of selector -> array of breakpoint descriptions
 */
function extractResponsiveSelectors() {
  const content = fs.readFileSync(RESPONSIVE_CSS, 'utf-8');
  const selectors = new Map();
  
  // Match @media blocks and extract selectors inside them
  const mediaQueryRegex = /@media\s+([^{]+)\s*\{([\s\S]*?)\n\}/g;
  
  let match;
  while ((match = mediaQueryRegex.exec(content)) !== null) {
    const mediaCondition = match[1].trim();
    const blockContent = match[2];
    
    // Extract selectors from the block (simple regex - handles basic cases)
    const selectorRegex = /([.#][\w-]+|\w+)\s*\{/g;
    let selectorMatch;
    
    while ((selectorMatch = selectorRegex.exec(blockContent)) !== null) {
      const selector = selectorMatch[1];
      
      // Skip pseudo-elements (e.g., ::-webkit-scrollbar)
      // Check if there's a :: before this match on the same line
      const matchIndex = selectorMatch.index;
      const lineStart = blockContent.lastIndexOf('\n', matchIndex) + 1;
      const lineContent = blockContent.substring(lineStart, matchIndex);
      if (lineContent.includes('::')) {
        continue; // Skip pseudo-elements
      }
      
      if (!selectors.has(selector)) {
        selectors.set(selector, []);
      }
      selectors.get(selector).push(mediaCondition);
    }
  }
  
  return selectors;
}

/**
 * Check if a selector has a responsive annotation comment above it
 * @param {string} fileContent - Full content of the CSS file
 * @param {string} selector - The selector to check
 * @returns {boolean} True if annotation exists
 */
function hasAnnotation(fileContent, selector) {
  const lines = fileContent.split('\n');
  
  // Find all occurrences of the selector
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line contains our selector as a rule declaration
    // Handle various formats: "#selector {", ".selector {", "selector {"
    const selectorPattern = new RegExp(`^\\${selector}\\s*\\{|^${selector.replace(/^[.#]/, '')}\\s*\\{`);
    
    if (selectorPattern.test(line)) {
      // Check up to 5 lines above for annotation comment
      for (let j = Math.max(0, i - 5); j < i; j++) {
        const checkLine = lines[j].trim();
        if (checkLine.includes('/* Responsive:') && checkLine.includes('responsive.css')) {
          return true;
        }
      }
    }
  }
  
  return false;
}

/**
 * Validate annotations across all CSS files
 */
function validateAnnotations() {
  console.log('🔍 Validating responsive annotations...\n');
  
  const responsiveSelectors = extractResponsiveSelectors();
  console.log(`Found ${responsiveSelectors.size} unique selectors in responsive.css\n`);
  
  const errors = [];
  
  for (const cssFile of CSS_FILES_TO_CHECK) {
    const filePath = path.join(CSS_DIR, cssFile);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${cssFile} (not found)`);
      continue;
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const fileErrors = [];
    
    // Check if this file contains any of the responsive selectors
    for (const [selector, breakpoints] of responsiveSelectors.entries()) {
      // Simple check: does the file contain this selector?
      const selectorPattern = new RegExp(`\\${selector}\\s*\\{|${selector.replace(/^[.#]/, '')}\\s*\\{`);
      
      if (selectorPattern.test(fileContent)) {
        // File contains this selector, check for annotation
        if (!hasAnnotation(fileContent, selector)) {
          fileErrors.push({
            selector,
            breakpoints: breakpoints.join(', ')
          });
        }
      }
    }
    
    if (fileErrors.length > 0) {
      errors.push({ file: cssFile, errors: fileErrors });
    }
  }
  
  // Report results
  if (errors.length === 0) {
    console.log('✅ All responsive selectors are properly annotated!');
    return true;
  } else {
    console.log('❌ Missing responsive annotations found:\n');
    
    for (const { file, errors: fileErrors } of errors) {
      console.log(`📄 ${file}:`);
      for (const { selector, breakpoints } of fileErrors) {
        console.log(`   ${selector}`);
        console.log(`      Add: /* Responsive: See responsive.css @media (${breakpoints}) */`);
      }
      console.log('');
    }
    
    console.log(`Found ${errors.reduce((sum, e) => sum + e.errors.length, 0)} missing annotations across ${errors.length} file(s)\n`);
    return false;
  }
}

// Run validation
try {
  const success = validateAnnotations();
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('❌ Error during validation:',  error.message);
  process.exit(2);
}

