#!/usr/bin/env node

/**
 * Project Type Detection
 * 
 * Scans a project and detects:
 * - Project type (vanilla, npm, framework)
 * - Tech stack (Express, Firebase, React, etc.)
 * - Folder structure
 * - What generators/validators are needed
 * 
 * Used by setup.sh to build custom setup config
 */

import fs from 'fs';
import path from 'path';

/**
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Object} Detection results
 */
export function detectProjectType(projectRoot) {
  const detection = {
    // Project basics
    projectType: 'unknown',
    hasNpm: false,
    hasGit: false,
    
    // Tech stack
    techStack: {
      express: false,
      firebase: false,
      react: false,
      vue: false,
      typescript: false,
      vanilla: false
    },
    
    // Structure
    structure: {
      hasRoutes: false,
      hasMiddleware: false,
      hasScripts: false,
      hasPublic: false,
      hasCss: false,
      hasJs: false,
      htmlFiles: [],
      cssFiles: [],
      jsFiles: []
    },
    
    // Recommended setup
    recommended: {
      validators: [],
      generators: [],
      templates: []
    }
  };
  
  // Check for package.json
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    detection.hasNpm = true;
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Detect dependencies
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    
    detection.techStack.express = 'express' in allDeps;
    detection.techStack.firebase = 'firebase-admin' in allDeps || 'firebase' in allDeps;
    detection.techStack.react = 'react' in allDeps;
    detection.techStack.vue = 'vue' in allDeps;
    detection.techStack.typescript = 'typescript' in allDeps || fs.existsSync(path.join(projectRoot, 'tsconfig.json'));
  }
  
  // Check for .git
  detection.hasGit = fs.existsSync(path.join(projectRoot, '.git'));
  
  // Scan folder structure
  const checkDir = (dirName) => fs.existsSync(path.join(projectRoot, dirName));
  
  detection.structure.hasRoutes = checkDir('routes');
  detection.structure.hasMiddleware = checkDir('middleware');
  detection.structure.hasScripts = checkDir('scripts');
  detection.structure.hasPublic = checkDir('public');
  detection.structure.hasCss = checkDir('css') || fs.existsSync(path.join(projectRoot, 'style.css'));
  detection.structure.hasJs = checkDir('js') || fs.existsSync(path.join(projectRoot, 'app.js'));
  
  // Find HTML files in root
  const filesInRoot = fs.readdirSync(projectRoot);
  detection.structure.htmlFiles = filesInRoot.filter(f => f.endsWith('.html'));
  
  // Find CSS files
  if (checkDir('css')) {
    const cssFiles = fs.readdirSync(path.join(projectRoot, 'css'));
    detection.structure.cssFiles = cssFiles.filter(f => f.endsWith('.css')).map(f => `css/${f}`);
  } else if (fs.existsSync(path.join(projectRoot, 'style.css'))) {
    detection.structure.cssFiles = ['style.css'];
  }
  
  // Find JS files
  if (checkDir('js')) {
    const jsFiles = fs.readdirSync(path.join(projectRoot, 'js'));
    detection.structure.jsFiles = jsFiles.filter(f => f.endsWith('.js') || f.endsWith('.mjs')).map(f => `js/${f}`);
  } else if (fs.existsSync(path.join(projectRoot, 'app.js'))) {
    detection.structure.jsFiles = ['app.js'];
  } else if (fs.existsSync(path.join(projectRoot, 'index.js'))) {
    detection.structure.jsFiles = ['index.js'];
  }
  
  // Determine project type
  if (!detection.hasNpm && detection.structure.htmlFiles.length > 0) {
    detection.projectType = 'vanilla';
    detection.techStack.vanilla = true;
  } else if (detection.hasNpm && !detection.techStack.react && !detection.techStack.vue) {
    detection.projectType = 'npm';
  } else if (detection.techStack.react) {
    detection.projectType = 'react';
  } else if (detection.techStack.vue) {
    detection.projectType = 'vue';
  }
  
  // Build recommendations
  
  // Core validators (always recommended)
  detection.recommended.validators = [
    'lint-styles',           // No inline CSS
    'lint-duplicate-ids',    // No duplicate IDs
    'validate-colors',       // No hardcoded colors
    'cursor-rules'           // Cursor rule syntax
  ];
  
  // Generators based on tech stack
  if (detection.techStack.express) {
    detection.recommended.generators.push('generate-api-routes-rule');
    detection.recommended.generators.push('generate-middleware-rule');
  }
  
  if (detection.techStack.firebase) {
    detection.recommended.generators.push('generate-schema-rule');
  }
  
  if (detection.structure.hasScripts) {
    detection.recommended.generators.push('generate-scripts-inventory-rule');
  }
  
  // Templates needed
  detection.recommended.templates = ['sessions'];
  
  if (detection.structure.hasRoutes || detection.techStack.express) {
    detection.recommended.templates.push('deploy-playbook');
  }
  
  return detection;
}

/**
 * Print detection results in human-readable format
 */
export function printDetectionReport(detection) {
  console.log('\n🔍 Project Detection Results\n');
  console.log('━'.repeat(50));
  
  // Project basics
  console.log('\n📦 Project Type:');
  console.log(`   ${detection.projectType.toUpperCase()}`);
  console.log(`   - Has package.json: ${detection.hasNpm ? '✅' : '❌'}`);
  console.log(`   - Has .git: ${detection.hasGit ? '✅' : '❌'}`);
  
  // Tech stack
  console.log('\n🛠️  Tech Stack Detected:');
  const stack = detection.techStack;
  if (stack.express) console.log('   ✅ Express (backend)');
  if (stack.firebase) console.log('   ✅ Firebase/Firestore');
  if (stack.react) console.log('   ✅ React');
  if (stack.vue) console.log('   ✅ Vue');
  if (stack.typescript) console.log('   ✅ TypeScript');
  if (stack.vanilla) console.log('   ✅ Vanilla HTML/CSS/JS');
  
  const hasAnyStack = Object.values(stack).some(v => v);
  if (!hasAnyStack) {
    console.log('   ⚠️  No major frameworks detected');
  }
  
  // Structure
  console.log('\n📁 Folder Structure:');
  const struct = detection.structure;
  if (struct.hasRoutes) console.log('   ✅ routes/ (API routes)');
  if (struct.hasMiddleware) console.log('   ✅ middleware/');
  if (struct.hasScripts) console.log('   ✅ scripts/');
  if (struct.hasPublic) console.log('   ✅ public/');
  if (struct.htmlFiles.length > 0) console.log(`   ✅ ${struct.htmlFiles.length} HTML file(s): ${struct.htmlFiles.join(', ')}`);
  if (struct.cssFiles.length > 0) console.log(`   ✅ ${struct.cssFiles.length} CSS file(s)`);
  if (struct.jsFiles.length > 0) console.log(`   ✅ ${struct.jsFiles.length} JS file(s)`);
  
  // Recommendations
  console.log('\n💡 Recommended Setup:');
  console.log(`   - Validators: ${detection.recommended.validators.length}`);
  console.log(`   - Generators: ${detection.recommended.generators.length}`);
  if (detection.recommended.generators.length > 0) {
    console.log(`     ${detection.recommended.generators.map(g => `• ${g}`).join('\n     ')}`);
  }
  
  console.log('\n━'.repeat(50));
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const projectRoot = process.argv[2] || process.cwd();
  const detection = detectProjectType(projectRoot);
  printDetectionReport(detection);
  
  // Export as JSON if --json flag
  if (process.argv.includes('--json')) {
    console.log('\n📄 JSON Output:\n');
    console.log(JSON.stringify(detection, null, 2));
  }
}

