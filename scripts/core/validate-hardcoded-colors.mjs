#!/usr/bin/env node

/**
 * Validates that CSS files use CSS custom properties instead of hard-coded colors.
 * Detects hex colors, rgb/rgba values, and color names that aren't using var().
 * 
 * Exemptions:
 * - Colors with comment: HARDCODED COLOR: reason
 * - themes.css (defines the variables)
 * - Transparent, inherit, currentColor (special CSS values)
 * 
 * Usage:
 *   node scripts/validate-hardcoded-colors.mjs
 *   npm run validate:colors
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

// CSS color patterns to detect
const COLOR_PATTERNS = [
  // Hex colors: #fff, #ffffff, #fff9
  /\#[0-9a-fA-F]{3,8}\b/g,
  
  // RGB/RGBA: rgb(255, 255, 255), rgba(0, 0, 0, 0.5)
  /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)/gi,
  
  // HSL/HSLA: hsl(180, 100%, 50%), hsla(180, 100%, 50%, 0.5)
  /hsla?\s*\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(,\s*[\d.]+\s*)?\)/gi,
];

// CSS color names to detect (subset of common ones)
const COLOR_NAMES = [
  'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
  'pink', 'brown', 'gray', 'grey', 'cyan', 'magenta', 'lime', 'navy',
  'teal', 'olive', 'maroon', 'aqua', 'silver', 'gold', 'beige', 'coral',
  'crimson', 'indigo', 'violet', 'turquoise', 'tan', 'khaki', 'salmon',
  'orchid', 'plum', 'peru', 'sienna', 'wheat', 'azure', 'ivory',
  'lavender', 'linen', 'mint', 'mistyrose', 'moccasin', 'oldlace',
  'lightgrey', 'lightgray', 'darkgrey', 'darkgray', 'lightblue', 'lightgreen',
  'lightyellow', 'lightpink', 'lightcoral', 'lightcyan', 'lightseagreen',
  'lightskyblue', 'lightslategray', 'lightsteelblue', 'darkblue', 'darkgreen',
  'darkred', 'darkorange', 'darkviolet', 'darkcyan', 'darkmagenta'
];

// Special CSS values that are allowed (not colors)
const ALLOWED_VALUES = [
  'transparent',
  'inherit',
  'initial',
  'unset',
  'currentcolor',
  'currentColor'
];

// Files to exclude from validation
const EXCLUDED_FILES = [
  'themes.css', // Defines the CSS custom properties
];

/**
 * Scans a CSS file for hard-coded color values
 * @param {string} filePath - Path to CSS file
 * @returns {Array<{line: number, color: string, context: string}>} - Found violations
 */
function scanCSSFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Skip lines that are comments
    if (line.trim().startsWith('/*') || line.trim().startsWith('*')) {
      continue;
    }

    // Skip lines with exemption comment
    if (line.includes('HARDCODED COLOR:')) {
      continue;
    }

    // Check if previous line has exemption comment
    if (i > 0 && lines[i - 1].includes('HARDCODED COLOR:')) {
      continue;
    }

    // Skip lines using var() (already using custom properties)
    if (line.includes('var(--')) {
      continue;
    }

    // Check for hex colors
    for (const pattern of COLOR_PATTERNS) {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        const matchedColor = match[0];
        const afterMatch = line.substring(match.index + matchedColor.length).trim();
        
        // Skip if this is an ID selector (e.g., #add-attachment-btn {)
        // ID selectors are followed by whitespace/characters and then {
        if (matchedColor.startsWith('#') && /^[a-zA-Z0-9_-]*\s*(\{|,|\.|\[|:)/.test(afterMatch)) {
          continue;
        }
        
        violations.push({
          line: lineNumber,
          color: matchedColor,
          context: line.trim()
        });
      }
    }

    // Check for color names
    const lowerLine = line.toLowerCase();
    for (const colorName of COLOR_NAMES) {
      // Build regex to match color name as a value (not in variable names)
      const colorRegex = new RegExp(`:\\s*${colorName}\\b`, 'i');
      if (colorRegex.test(lowerLine)) {
        // Check if it's an allowed value
        if (!ALLOWED_VALUES.includes(colorName.toLowerCase())) {
          violations.push({
            line: lineNumber,
            color: colorName,
            context: line.trim()
          });
        }
      }
    }
  }

  return violations;
}

/**
 * Recursively finds all CSS files in a directory
 * @param {string} dir - Directory to search
 * @returns {Array<string>} - Array of CSS file paths
 */
function findCSSFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and other non-source directories
      if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
        files.push(...findCSSFiles(fullPath));
      }
    } else if (entry.name.endsWith('.css')) {
      // Skip excluded files
      if (!EXCLUDED_FILES.includes(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Main validation function
 */
function validateColors() {
  console.log('🎨 Validating hard-coded colors in CSS files...\n');

  const cssDir = path.join(PROJECT_ROOT, 'css');
  const cssFiles = findCSSFiles(cssDir);

  if (cssFiles.length === 0) {
    console.log('⚠️  No CSS files found to validate');
    process.exit(0);
  }

  console.log(`📂 Scanning ${cssFiles.length} CSS file(s)...\n`);

  let totalViolations = 0;
  const fileViolations = {};

  for (const filePath of cssFiles) {
    const violations = scanCSSFile(filePath);
    
    if (violations.length > 0) {
      const relativePath = path.relative(PROJECT_ROOT, filePath);
      fileViolations[relativePath] = violations;
      totalViolations += violations.length;
    }
  }

  // Report results
  if (totalViolations === 0) {
    console.log('✅ No hard-coded colors found!\n');
    console.log('All CSS files are using CSS custom properties from themes.css.\n');
    process.exit(0);
  } else {
    console.log(`❌ Found ${totalViolations} hard-coded color(s) across ${Object.keys(fileViolations).length} file(s):\n`);

    for (const [file, violations] of Object.entries(fileViolations)) {
      console.log(`\n📄 ${file}`);
      console.log('─'.repeat(60));
      
      for (const violation of violations) {
        console.log(`  Line ${violation.line}: ${violation.color}`);
        console.log(`    ${violation.context}`);
      }
    }

    console.log('\n' + '─'.repeat(60));
    console.log('\n💡 How to fix:\n');
    console.log('1. Replace hard-coded colors with CSS custom properties from themes.css:');
    console.log('   Example: #0a3a52 → var(--color-primary)');
    console.log('   Example: rgba(122, 164, 199, 0.3) → var(--border-primary)\n');
    
    console.log('2. If color MUST be hard-coded (brand colors, etc), add exemption comment:');
    console.log('   Example: background: #635bff; /* HARDCODED COLOR: Stripe brand color */\n');
    
    console.log('3. See docs/NAMING_STYLE_GUIDE.md section 8 for complete color variable list.\n');
    
    console.log('4. Test changes in both light and dark themes!\n');

    process.exit(1);
  }
}

// Run validation
validateColors();

