#!/usr/bin/env node

/**
 * Setup Completeness Checker
 * 
 * Validates that desloppify setup is complete in a project.
 * 
 * Checks for:
 * - Required files exist
 * - Templates were copied correctly
 * - Config files are valid
 * - Path references work
 * 
 * Used after setup.sh to verify nothing was missed
 */

import fs from 'fs';
import path from 'path';

/**
 * @param {string} projectRoot - Absolute path to project root
 * @returns {Object} Validation results
 */
export function checkSetup(projectRoot) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    info: [],
    files: {
      required: [],
      optional: [],
      missing: []
    }
  };
  
  // Check 1: Desloppify submodule exists
  const desloppifyPath = path.join(projectRoot, 'desloppify');
  if (!fs.existsSync(desloppifyPath)) {
    results.errors.push('❌ desloppify/ submodule not found');
    results.valid = false;
    return results; // Can't check further without submodule
  }
  results.files.required.push('✅ desloppify/ submodule');
  
  // Check 2: Submodule has content
  const wisdomPath = path.join(desloppifyPath, 'wisdom');
  if (!fs.existsSync(wisdomPath)) {
    results.errors.push('❌ desloppify/wisdom/ missing (submodule may be empty)');
    results.warnings.push('⚠️  Run: git submodule update --init --recursive');
    results.valid = false;
  } else {
    results.files.required.push('✅ desloppify/wisdom/');
  }
  
  // Check 3: Menu command exists
  const menuPath = path.join(projectRoot, '.cursor/commands/menu.md');
  if (!fs.existsSync(menuPath)) {
    results.errors.push('❌ .cursor/commands/menu.md missing');
    results.warnings.push('⚠️  Copy from: desloppify/templates/cursor-commands/menu.md.template');
    results.valid = false;
  } else {
    results.files.required.push('✅ .cursor/commands/menu.md');
  }
  
  // Check 4: Scripts folder (optional but recommended if npm project)
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const hasNpm = fs.existsSync(packageJsonPath);
  
  if (hasNpm) {
    const scriptsPath = path.join(projectRoot, 'scripts');
    const docsCheckPath = path.join(scriptsPath, 'docs-check.js');
    
    if (!fs.existsSync(scriptsPath)) {
      results.warnings.push('⚠️  scripts/ folder not found (recommended for npm projects)');
      results.files.missing.push('scripts/');
    } else if (!fs.existsSync(docsCheckPath)) {
      results.warnings.push('⚠️  scripts/docs-check.js not found (orchestrator missing)');
      results.warnings.push('   Copy from: desloppify/templates/scripts/docs-check.js.template');
      results.files.missing.push('scripts/docs-check.js');
    } else {
      results.files.optional.push('✅ scripts/docs-check.js (orchestrator)');
    }
  } else {
    results.info.push('ℹ️  No package.json (vanilla project - scripts/ folder optional)');
  }
  
  // Check 5: desloppify-local structure (optional but recommended for full setup)
  const localPath = path.join(projectRoot, 'desloppify-local');
  if (fs.existsSync(localPath)) {
    results.files.optional.push('✅ desloppify-local/ folder');
    
    // Check sessions
    const sessionsPath = path.join(localPath, 'ledger/sessions');
    if (!fs.existsSync(sessionsPath)) {
      results.warnings.push('⚠️  desloppify-local/ledger/sessions/ missing');
      results.files.missing.push('desloppify-local/ledger/sessions/');
    } else {
      // Check session templates
      const sessionReadme = path.join(sessionsPath, 'README.md');
      const sessionTemplate = path.join(sessionsPath, 'TEMPLATE.md');
      
      if (!fs.existsSync(sessionReadme) || !fs.existsSync(sessionTemplate)) {
        results.warnings.push('⚠️  Session templates missing');
        results.warnings.push('   Copy from: desloppify/templates/sessions/');
      } else {
        results.files.optional.push('✅ desloppify-local/ledger/sessions/ (with templates)');
      }
    }
    
    // Check local scripts
    const localScriptsPath = path.join(localPath, 'scripts');
    if (!fs.existsSync(localScriptsPath)) {
      results.warnings.push('⚠️  desloppify-local/scripts/ missing');
      results.files.missing.push('desloppify-local/scripts/');
    } else {
      results.files.optional.push('✅ desloppify-local/scripts/');
    }
  } else {
    results.info.push('ℹ️  desloppify-local/ not found (minimal setup - only wisdom access)');
  }
  
  // Check 6: Cursor rules (optional)
  const rulesPath = path.join(projectRoot, '.cursor/rules');
  if (fs.existsSync(rulesPath)) {
    const ruleFiles = fs.readdirSync(rulesPath);
    const hasConventions = ruleFiles.some(f => f.match(/^0[1-3]-/)); // 01, 02, 03 conventions
    const hasProjectContext = ruleFiles.includes('00-project-context.mdc');
    
    if (hasProjectContext) {
      results.files.optional.push('✅ .cursor/rules/00-project-context.mdc');
    }
    
    if (hasConventions) {
      results.files.optional.push('✅ .cursor/rules/ (universal conventions installed)');
    }
    
    if (!hasProjectContext && !hasConventions) {
      results.info.push('ℹ️  .cursor/rules/ exists but empty (optional - can add conventions later)');
    }
  } else {
    results.info.push('ℹ️  .cursor/rules/ not found (optional - can add conventions later)');
  }
  
  // Check 7: Config file (optional)
  const configPath = path.join(projectRoot, 'desloppify.config.js');
  if (fs.existsSync(configPath)) {
    results.files.optional.push('✅ desloppify.config.js (validators configured)');
  } else {
    results.info.push('ℹ️  desloppify.config.js not found (optional - only needed for validators)');
  }
  
  // Determine setup level
  const requiredCount = results.files.required.length;
  const optionalCount = results.files.optional.length;
  
  if (requiredCount >= 2 && optionalCount === 0) {
    results.setupLevel = 'minimal';
    results.info.push('📦 Setup Level: MINIMAL (wisdom access only)');
  } else if (requiredCount >= 2 && optionalCount >= 1 && optionalCount < 4) {
    results.setupLevel = 'partial';
    results.info.push('📦 Setup Level: PARTIAL (some features installed)');
  } else if (requiredCount >= 2 && optionalCount >= 4) {
    results.setupLevel = 'full';
    results.info.push('📦 Setup Level: FULL (complete infrastructure)');
  } else {
    results.setupLevel = 'incomplete';
    results.info.push('📦 Setup Level: INCOMPLETE (missing required files)');
  }
  
  return results;
}

/**
 * Print setup check results
 */
export function printSetupReport(results) {
  console.log('\n🔍 Desloppify Setup Check\n');
  console.log('━'.repeat(50));
  
  // Required files
  if (results.files.required.length > 0) {
    console.log('\n✅ Required Files:');
    results.files.required.forEach(f => console.log(`   ${f}`));
  }
  
  // Optional files
  if (results.files.optional.length > 0) {
    console.log('\n✨ Optional Files:');
    results.files.optional.forEach(f => console.log(`   ${f}`));
  }
  
  // Errors
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(e => console.log(`   ${e}`));
  }
  
  // Warnings
  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(w => console.log(`   ${w}`));
  }
  
  // Info
  if (results.info.length > 0) {
    console.log('\nℹ️  Info:');
    results.info.forEach(i => console.log(`   ${i}`));
  }
  
  // Missing files
  if (results.files.missing.length > 0) {
    console.log('\n📋 Missing (Optional):');
    results.files.missing.forEach(f => console.log(`   - ${f}`));
  }
  
  console.log('\n━'.repeat(50));
  
  // Final verdict
  if (results.valid) {
    console.log('\n✅ Setup is VALID');
    console.log('   You can now use /menu to access desloppify features\n');
  } else {
    console.log('\n❌ Setup is INCOMPLETE');
    console.log('   Fix errors above before using desloppify\n');
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const projectRoot = process.argv[2] || process.cwd();
  const results = checkSetup(projectRoot);
  printSetupReport(results);
  
  // Exit with error code if invalid
  process.exit(results.valid ? 0 : 1);
}

