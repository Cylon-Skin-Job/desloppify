#!/usr/bin/env node

/**
 * Dependency Health Check
 * 
 * Monitors npm dependencies and script usage for maintenance intelligence.
 * 
 * Features:
 * - Runs npm audit and summarizes security issues
 * - Lists outdated packages with version info
 * - Detects unused dependencies (compares package.json vs actual imports)
 * - Flags unused package.json scripts (basic heuristic)
 * - Tracks script execution over time (future: usage logs)
 * 
 * Part of: Maintenance Automation Roadmap - Phase 3, Milestone 3.1
 * 
 * @async-boundary
 * @side-effects Reads package.json, runs npm commands, writes to stdout
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

/**
 * Runs npm audit and parses output
 * 
 * @returns {Object} Audit summary with vulnerability counts
 * @async-boundary
 * @side-effects Executes npm audit command
 */
function runNpmAudit() {
  try {
    const auditOutput = execSync('npm audit --json', {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const audit = JSON.parse(auditOutput);
    return {
      total: audit.metadata?.vulnerabilities?.total || 0,
      critical: audit.metadata?.vulnerabilities?.critical || 0,
      high: audit.metadata?.vulnerabilities?.high || 0,
      moderate: audit.metadata?.vulnerabilities?.moderate || 0,
      low: audit.metadata?.vulnerabilities?.low || 0,
      info: audit.metadata?.vulnerabilities?.info || 0,
      vulnerabilities: audit.vulnerabilities || {}
    };
  } catch (error) {
    // npm audit exits with code 1 if vulnerabilities found
    if (error.stdout) {
      try {
        const audit = JSON.parse(error.stdout);
        return {
          total: audit.metadata?.vulnerabilities?.total || 0,
          critical: audit.metadata?.vulnerabilities?.critical || 0,
          high: audit.metadata?.vulnerabilities?.high || 0,
          moderate: audit.metadata?.vulnerabilities?.moderate || 0,
          low: audit.metadata?.vulnerabilities?.low || 0,
          info: audit.metadata?.vulnerabilities?.info || 0,
          vulnerabilities: audit.vulnerabilities || {}
        };
      } catch (parseError) {
        return { error: 'Failed to parse npm audit output' };
      }
    }
    return { error: error.message };
  }
}

/**
 * Lists outdated packages
 * 
 * @returns {Array<Object>} Array of outdated package info
 * @async-boundary
 * @side-effects Executes npm outdated command
 */
function getOutdatedPackages() {
  try {
    const outdatedOutput = execSync('npm outdated --json', {
      cwd: projectRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    const outdated = JSON.parse(outdatedOutput);
    return Object.entries(outdated).map(([name, info]) => ({
      name,
      current: info.current,
      wanted: info.wanted,
      latest: info.latest,
      type: info.type || 'dependencies'
    }));
  } catch (error) {
    // npm outdated exits with code 1 if outdated packages found
    if (error.stdout) {
      try {
        const outdated = JSON.parse(error.stdout);
        return Object.entries(outdated).map(([name, info]) => ({
          name,
          current: info.current,
          wanted: info.wanted,
          latest: info.latest,
          type: info.type || 'dependencies'
        }));
      } catch (parseError) {
        return [];
      }
    }
    return [];
  }
}

/**
 * Detects unused dependencies by scanning imports
 * 
 * @returns {Array<string>} Array of potentially unused dependency names
 * @async-boundary
 * @side-effects Reads package.json and scans codebase files
 */
function detectUnusedDependencies() {
  const packageJsonPath = join(projectRoot, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const dependencies = Object.keys(packageJson.dependencies || {});
  
  // Scan all JS files for imports
  const importedPackages = new Set();
  
  try {
    // Scan backend files
    const backendFiles = execSync('find . -name "*.js" -o -name "*.mjs" | grep -v node_modules | grep -v ".git"', {
      cwd: projectRoot,
      encoding: 'utf-8'
    }).split('\n').filter(Boolean);
    
    for (const file of backendFiles) {
      try {
        const content = readFileSync(join(projectRoot, file), 'utf-8');
        
        // Match require() and import statements
        const requireMatches = content.match(/require\(['"]([^'"]+)['"]\)/g) || [];
        const importMatches = content.match(/import .+ from ['"]([^'"]+)['"]/g) || [];
        
        [...requireMatches, ...importMatches].forEach(match => {
          const pkgMatch = match.match(/['"]([^'"]+)['"]/);
          if (pkgMatch) {
            const pkg = pkgMatch[1].split('/')[0]; // Handle scoped packages
            importedPackages.add(pkg);
          }
        });
      } catch (readError) {
        // Skip files that can't be read
      }
    }
  } catch (error) {
    // If find fails, return empty array
    return [];
  }
  
  // Find dependencies not imported anywhere
  const unused = dependencies.filter(dep => !importedPackages.has(dep));
  
  return unused;
}

/**
 * Detects unused npm scripts
 * 
 * @returns {Array<string>} Array of potentially unused script names
 * @async-boundary
 * @side-effects Reads package.json and scans for script references
 */
function detectUnusedScripts() {
  const packageJsonPath = join(projectRoot, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const scripts = Object.keys(packageJson.scripts || {});
  
  // Scripts that are commonly used but not referenced in code
  const alwaysUsed = ['start', 'test', 'build', 'dev', 'deploy'];
  
  // Find scripts referenced in other scripts
  const referencedInScripts = new Set();
  Object.values(packageJson.scripts || {}).forEach(scriptCmd => {
    scripts.forEach(scriptName => {
      if (scriptCmd.includes(`npm run ${scriptName}`) || scriptCmd.includes(`run ${scriptName}`)) {
        referencedInScripts.add(scriptName);
      }
    });
  });
  
  // Find scripts referenced in docs
  const referencedInDocs = new Set();
  try {
    const docFiles = execSync('find docs .cursor -name "*.md" -o -name "*.mdc" 2>/dev/null', {
      cwd: projectRoot,
      encoding: 'utf-8'
    }).split('\n').filter(Boolean);
    
    for (const file of docFiles) {
      try {
        const content = readFileSync(join(projectRoot, file), 'utf-8');
        scripts.forEach(scriptName => {
          if (content.includes(`npm run ${scriptName}`) || content.includes(`run ${scriptName}`)) {
            referencedInDocs.add(scriptName);
          }
        });
      } catch (readError) {
        // Skip files that can't be read
      }
    }
  } catch (error) {
    // If find fails, continue
  }
  
  // Scripts that are never referenced
  const unused = scripts.filter(script => 
    !alwaysUsed.includes(script) && 
    !referencedInScripts.has(script) &&
    !referencedInDocs.has(script)
  );
  
  return unused;
}

/**
 * Categorizes outdated packages by severity
 * 
 * @param {Array<Object>} outdated - Array of outdated package info
 * @returns {Object} Categorized packages
 */
function categorizeOutdated(outdated) {
  const major = [];
  const minor = [];
  const patch = [];
  
  outdated.forEach(pkg => {
    if (!pkg.current || !pkg.latest) return; // Skip if missing version info
    
    const currentParts = pkg.current.split('.');
    const latestParts = pkg.latest.split('.');
    
    if (currentParts[0] !== latestParts[0]) {
      major.push(pkg);
    } else if (currentParts[1] !== latestParts[1]) {
      minor.push(pkg);
    } else {
      patch.push(pkg);
    }
  });
  
  return { major, minor, patch };
}

/**
 * Generates dependency health report
 * 
 * @async-boundary
 * @side-effects Writes to stdout
 */
function generateReport() {
  console.log('# Dependency Health Report\n');
  console.log(`**Generated:** ${new Date().toISOString()}\n`);
  
  // 1. Security Audit
  console.log('## 1. Security Audit\n');
  const audit = runNpmAudit();
  
  if (audit.error) {
    console.log(`⚠️ **Error running npm audit:** ${audit.error}\n`);
  } else if (audit.total === 0) {
    console.log('✅ **No security vulnerabilities found**\n');
  } else {
    console.log(`🚨 **${audit.total} vulnerabilities found:**\n`);
    if (audit.critical > 0) console.log(`- 🔴 Critical: ${audit.critical}`);
    if (audit.high > 0) console.log(`- 🟠 High: ${audit.high}`);
    if (audit.moderate > 0) console.log(`- 🟡 Moderate: ${audit.moderate}`);
    if (audit.low > 0) console.log(`- 🟢 Low: ${audit.low}`);
    if (audit.info > 0) console.log(`- ℹ️ Info: ${audit.info}`);
    console.log('\n**Action:** Run `npm audit fix` to resolve\n');
  }
  
  // 2. Outdated Packages
  console.log('## 2. Outdated Packages\n');
  const outdated = getOutdatedPackages();
  
  if (outdated.length === 0) {
    console.log('✅ **All packages up to date**\n');
  } else {
    const categorized = categorizeOutdated(outdated);
    
    if (categorized.major.length > 0) {
      console.log('### Major Updates Available (Breaking Changes Possible)\n');
      categorized.major.forEach(pkg => {
        console.log(`- **${pkg.name}**: ${pkg.current} → ${pkg.latest}`);
      });
      console.log();
    }
    
    if (categorized.minor.length > 0) {
      console.log('### Minor Updates Available (New Features)\n');
      categorized.minor.forEach(pkg => {
        console.log(`- **${pkg.name}**: ${pkg.current} → ${pkg.latest}`);
      });
      console.log();
    }
    
    if (categorized.patch.length > 0) {
      console.log('### Patch Updates Available (Bug Fixes)\n');
      categorized.patch.forEach(pkg => {
        console.log(`- **${pkg.name}**: ${pkg.current} → ${pkg.latest}`);
      });
      console.log();
    }
    
    console.log(`**Action:** Review and update packages. Run \`npm update\` for minor/patch, manual update for major.\n`);
  }
  
  // 3. Unused Dependencies
  console.log('## 3. Unused Dependencies\n');
  const unused = detectUnusedDependencies();
  
  if (unused.length === 0) {
    console.log('✅ **All dependencies appear to be in use**\n');
  } else {
    console.log(`⚠️ **${unused.length} potentially unused dependencies:**\n`);
    unused.forEach(dep => {
      console.log(`- [ ] \`${dep}\` - Not found in any imports`);
    });
    console.log('\n**Note:** This is a heuristic check. Verify before removing.\n');
    console.log('**Action:** Review each package and remove if truly unused.\n');
  }
  
  // 4. Unused Scripts
  console.log('## 4. Unused Scripts\n');
  const unusedScripts = detectUnusedScripts();
  
  if (unusedScripts.length === 0) {
    console.log('✅ **All npm scripts appear to be in use**\n');
  } else {
    console.log(`⚠️ **${unusedScripts.length} potentially unused scripts:**\n`);
    unusedScripts.forEach(script => {
      console.log(`- [ ] \`${script}\` - Not referenced in other scripts or docs`);
    });
    console.log('\n**Note:** This is a heuristic check. Scripts may be used manually.\n');
    console.log('**Action:** Review each script and remove if truly unused.\n');
  }
  
  // 5. Summary
  console.log('## Summary\n');
  const issues = [];
  if (audit.total > 0) issues.push(`${audit.total} security vulnerabilities`);
  if (outdated.length > 0) issues.push(`${outdated.length} outdated packages`);
  if (unused.length > 0) issues.push(`${unused.length} potentially unused dependencies`);
  if (unusedScripts.length > 0) issues.push(`${unusedScripts.length} potentially unused scripts`);
  
  if (issues.length === 0) {
    console.log('✅ **Dependency ecosystem is healthy!**\n');
  } else {
    console.log(`⚠️ **Found:** ${issues.join(', ')}\n`);
  }
  
  console.log('---\n');
  console.log('**Next Steps:**');
  console.log('1. Address security vulnerabilities (if any)');
  console.log('2. Review and update outdated packages');
  console.log('3. Verify and remove unused dependencies');
  console.log('4. Clean up unused scripts from package.json\n');
}

// Run report
generateReport();

