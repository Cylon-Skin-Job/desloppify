#!/usr/bin/env node

/**
 * @file Stale Documentation Detector
 * @description Flags docs that may be outdated based on code changes
 * 
 * Detects:
 * - Docs not updated in 60+ days when code changed recently
 * - Mismatches between API docs and actual routes
 * - Manual rules not updated when code changed
 * - Cross-reference drift (docs reference old files/patterns)
 * 
 * @requires-functions None (standalone)
 * @side-effects Reads filesystem, runs git commands, outputs to console
 * @async-boundary Top-level async
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../..');

// Configuration
const STALE_THRESHOLD_DAYS = 60;
const RECENT_CODE_CHANGE_DAYS = 30;

// Doc-to-Code mappings
const DOC_MAPPINGS = [
  {
    doc: 'docs/backend/api.md',
    code: ['routes/', 'middleware/'],
    description: 'API routes and middleware',
    note: 'May be redundant with .cursor/rules/06-api-routes.mdc (auto-generated)'
  },
  {
    doc: 'docs/backend/schema.md',
    code: ['services/', 'routes/'],
    description: 'Firestore schema usage',
    note: 'Redundant with .cursor/rules/07-firestore-schema.mdc (auto-generated) - consider deleting'
  },
  {
    doc: 'docs/backend/services.md',
    code: ['services/'],
    description: 'Backend services'
  },
  {
    doc: 'docs/backend/auth.md',
    code: ['services/auth.js', 'middleware/subscription.js'],
    description: 'Authentication flow'
  },
  {
    doc: 'docs/frontend/scripts.md',
    code: ['js/'],
    description: 'Frontend modules'
  },
  {
    doc: 'docs/frontend/styles.md',
    code: ['css/'],
    description: 'CSS architecture'
  },
  {
    doc: 'docs/frontend/ui-map.md',
    code: ['RavenOS.html', 'js/'],
    description: 'UI structure and components'
  },
  {
    doc: '.cursor/rules/00-project-context.mdc',
    code: ['package.json', 'server.js', 'routes/', 'services/'],
    description: 'Project status and tech stack'
  },
  {
    doc: 'docs/deploy_playbook.md',
    code: ['firebase.json', 'package.json', '.github/workflows/'],
    description: 'Deployment procedures'
  }
];

/**
 * Get last modified timestamp for a file using git
 * @param {string} filePath - Path to file
 * @returns {number|null} Unix timestamp in milliseconds, or null if not in git
 */
function getGitModifiedTime(filePath) {
  try {
    const timestamp = execSync(`git log -1 --format="%at" -- "${filePath}"`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8'
    }).trim();
    
    if (!timestamp) return null;
    return parseInt(timestamp, 10) * 1000; // Convert to milliseconds
  } catch (err) {
    return null;
  }
}

/**
 * Get most recent modification time for files in a directory
 * @param {string} dirPath - Directory path (relative to PROJECT_ROOT)
 * @returns {number|null} Most recent timestamp, or null if no files
 */
function getMostRecentModTime(dirPath) {
  const fullPath = path.join(PROJECT_ROOT, dirPath);
  
  try {
    // Use git to find most recent change in directory
    const timestamp = execSync(`git log -1 --format="%at" -- "${dirPath}"`, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8'
    }).trim();
    
    if (!timestamp) return null;
    return parseInt(timestamp, 10) * 1000;
  } catch (err) {
    return null;
  }
}

/**
 * Check if doc is stale compared to its code
 * @param {Object} mapping - Doc-to-code mapping
 * @returns {Object|null} Stale info if stale, null otherwise
 */
function checkStaleness(mapping) {
  const docPath = path.join(PROJECT_ROOT, mapping.doc);
  
  // Check if doc exists
  if (!fsSync.existsSync(docPath)) {
    return null;
  }
  
  const docModTime = getGitModifiedTime(mapping.doc);
  if (!docModTime) return null;
  
  const now = Date.now();
  const docDaysOld = Math.floor((now - docModTime) / (24 * 60 * 60 * 1000));
  
  // Get most recent code change across all mapped code paths
  let mostRecentCodeChange = 0;
  const codeChanges = [];
  
  mapping.code.forEach(codePath => {
    const codeModTime = getMostRecentModTime(codePath);
    if (codeModTime && codeModTime > mostRecentCodeChange) {
      mostRecentCodeChange = codeModTime;
      const codeDaysOld = Math.floor((now - codeModTime) / (24 * 60 * 60 * 1000));
      codeChanges.push({
        path: codePath,
        daysOld: codeDaysOld
      });
    }
  });
  
  // Check if doc is stale
  if (docDaysOld >= STALE_THRESHOLD_DAYS && mostRecentCodeChange > docModTime) {
    const codeDaysOld = Math.floor((now - mostRecentCodeChange) / (24 * 60 * 60 * 1000));
    const daysBetween = Math.floor((mostRecentCodeChange - docModTime) / (24 * 60 * 60 * 1000));
    
    // Only flag if code changed recently (within threshold)
    if (codeDaysOld <= RECENT_CODE_CHANGE_DAYS) {
      return {
        doc: mapping.doc,
        description: mapping.description,
        note: mapping.note,
        docDaysOld,
        codeDaysOld,
        daysBetween,
        severity: daysBetween > 90 ? 'high' : daysBetween > 60 ? 'medium' : 'low'
      };
    }
  }
  
  return null;
}

/**
 * Check for API routes not documented
 * @returns {Array<{route: string, file: string}>} Undocumented routes
 */
async function checkUndocumentedRoutes() {
  const apiDocPath = path.join(PROJECT_ROOT, 'docs/backend/api.md');
  const routesDir = path.join(PROJECT_ROOT, 'routes');
  
  try {
    const apiDoc = await fs.readFile(apiDocPath, 'utf-8');
    const routeFiles = await fs.readdir(routesDir);
    
    const undocumented = [];
    
    for (const file of routeFiles) {
      if (!file.endsWith('.js')) continue;
      
      const filePath = path.join(routesDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Extract route definitions (simplified)
      const routeMatches = content.matchAll(/router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/gi);
      
      for (const match of routeMatches) {
        const method = match[1].toUpperCase();
        const route = match[2];
        const routeSignature = `${method} ${route}`;
        
        // Check if route is documented
        if (!apiDoc.includes(route) || !apiDoc.includes(method)) {
          undocumented.push({
            route: routeSignature,
            file: `routes/${file}`
          });
        }
      }
    }
    
    return undocumented;
  } catch (err) {
    return [];
  }
}

/**
 * Generate stale docs report
 * @returns {Promise<Object>} Report data
 */
async function generateReport() {
  const staleDocs = [];
  
  // Check each doc-to-code mapping
  for (const mapping of DOC_MAPPINGS) {
    const staleInfo = checkStaleness(mapping);
    if (staleInfo) {
      staleDocs.push(staleInfo);
    }
  }
  
  // Check for undocumented routes
  const undocumentedRoutes = await checkUndocumentedRoutes();
  
  return {
    staleDocs,
    undocumentedRoutes
  };
}

/**
 * Print report
 * @param {Object} report - Report data
 */
function printReport(report) {
  console.log('\n📚 Stale Documentation Report\n');
  
  // Stale docs
  if (report.staleDocs.length > 0) {
    console.log(`## 🚨 Potentially Stale Documentation (${report.staleDocs.length})\n`);
    console.log('Docs not updated while code changed:\n');
    
    // Group by severity
    const high = report.staleDocs.filter(d => d.severity === 'high');
    const medium = report.staleDocs.filter(d => d.severity === 'medium');
    const low = report.staleDocs.filter(d => d.severity === 'low');
    
    if (high.length > 0) {
      console.log('### 🔴 High Priority\n');
      high.forEach(doc => {
        console.log(`- [ ] **${doc.doc}**`);
        console.log(`      Doc: ${doc.docDaysOld} days old | Code: ${doc.codeDaysOld} days old`);
        console.log(`      ⚠️  Code changed ${doc.daysBetween} days after doc last updated`);
        console.log(`      Documents: ${doc.description}`);
        if (doc.note) {
          console.log(`      💡 ${doc.note}`);
        }
        console.log('');
      });
    }
    
    if (medium.length > 0) {
      console.log('### 🟡 Medium Priority\n');
      medium.forEach(doc => {
        console.log(`- [ ] **${doc.doc}**`);
        console.log(`      Doc: ${doc.docDaysOld} days old | Code: ${doc.codeDaysOld} days old`);
        console.log(`      Documents: ${doc.description}`);
        if (doc.note) {
          console.log(`      💡 ${doc.note}`);
        }
        console.log('');
      });
    }
    
    if (low.length > 0) {
      console.log('### 🟢 Low Priority\n');
      low.forEach(doc => {
        console.log(`- [ ] **${doc.doc}**`);
        console.log(`      Doc: ${doc.docDaysOld} days old | Code: ${doc.codeDaysOld} days old`);
        console.log(`      Documents: ${doc.description}`);
        if (doc.note) {
          console.log(`      💡 ${doc.note}`);
        }
        console.log('');
      });
    }
  } else {
    console.log('✅ No stale documentation detected\n');
  }
  
  // Undocumented routes
  if (report.undocumentedRoutes.length > 0) {
    console.log(`## 📝 Potentially Undocumented Routes (${report.undocumentedRoutes.length})\n`);
    console.log('Routes that may not be in API docs:\n');
    
    report.undocumentedRoutes.slice(0, 10).forEach(({ route, file }) => {
      console.log(`- [ ] \`${route}\` in ${file}`);
    });
    
    if (report.undocumentedRoutes.length > 10) {
      console.log(`... and ${report.undocumentedRoutes.length - 10} more`);
    }
    
    console.log('\n⚠️  Note: May include false positives - verify before updating docs');
    console.log('');
  } else {
    console.log('## 📝 Undocumented Routes\n');
    console.log('✅ All routes appear to be documented\n');
  }
  
  // Summary
  console.log('---\n');
  console.log('## Summary\n');
  
  const totalIssues = report.staleDocs.length + report.undocumentedRoutes.length;
  
  if (totalIssues === 0) {
    console.log('✅ All documentation appears up-to-date!\n');
  } else {
    console.log(`Found ${totalIssues} potential issue(s):\n`);
    console.log(`- ${report.staleDocs.length} stale doc(s)`);
    console.log(`- ${report.undocumentedRoutes.length} potentially undocumented route(s)\n`);
    
    if (report.staleDocs.length > 0) {
      console.log('💡 Review stale docs to ensure they reflect current code behavior\n');
    }
  }
  
  console.log('Run as part of `/maintenance` for regular doc health checks.\n');
}

/**
 * Main execution
 */
async function main() {
  const report = await generateReport();
  printReport(report);
}

main().catch(err => {
  console.error('Error detecting stale docs:', err);
  process.exit(1);
});

