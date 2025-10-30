#!/usr/bin/env node
/**
 * Middleware Documentation Generator
 * 
 * Scans middleware/ directory and route files to generate .cursor/rules/08-middleware-usage.mdc
 * with middleware definitions and their usage across routes
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
 * Extract middleware exports from a middleware file
 * @param {string} filePath - Path to middleware file
 * @returns {Array} Array of middleware objects
 */
function extractMiddlewareExports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const middlewares = [];
  const filename = path.basename(filePath);
  
  // Match export patterns
  const patterns = [
    // export function middlewareName
    /export\s+(?:async\s+)?function\s+(\w+)/g,
    // export const middlewareName =
    /export\s+const\s+(\w+)\s*=/g,
    // export { middlewareName }
    /export\s*{\s*([^}]+)\s*}/g,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const names = match[1].split(',').map(n => n.trim());
      for (const name of names) {
        if (name && !middlewares.some(m => m.name === name)) {
          // Find comment above the middleware
          const beforeExport = content.substring(0, match.index);
          const lines = beforeExport.split('\n');
          let comment = '';
          
          // Look for comment on line(s) before export
          for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
            const line = lines[i].trim();
            if (line.startsWith('//')) {
              comment = line.replace(/^\/\/\s*/, '') + ' ' + comment;
            } else if (line && !line.startsWith('export')) {
              break;
            }
          }
          
          middlewares.push({
            name,
            file: filename,
            comment: comment.trim()
          });
        }
      }
    }
  }
  
  return middlewares;
}

/**
 * Scan middleware directory for all middleware
 * @returns {Array} Array of middleware objects
 */
function scanMiddleware() {
  const middlewareDir = path.join(projectRoot, 'middleware');
  if (!fs.existsSync(middlewareDir)) {
    return [];
  }
  
  const files = fs.readdirSync(middlewareDir).filter(f => f.endsWith('.js'));
  const allMiddleware = [];
  
  for (const file of files) {
    const filePath = path.join(middlewareDir, file);
    const middleware = extractMiddlewareExports(filePath);
    allMiddleware.push(...middleware);
  }
  
  return allMiddleware;
}

/**
 * Find middleware usage in route files
 * @param {Array} middlewareList - List of middleware names
 * @returns {Object} Usage map by middleware name
 */
function findMiddlewareUsage(middlewareList) {
  const usage = {};
  const routesDir = path.join(projectRoot, 'routes');
  
  if (!fs.existsSync(routesDir)) {
    return usage;
  }
  
  const routeFiles = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  
  for (const middleware of middlewareList) {
    usage[middleware.name] = {
      middleware,
      usedIn: []
    };
  }
  
  // Scan route files for middleware usage
  for (const file of routeFiles) {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    for (const middleware of middlewareList) {
      // Check if middleware is imported
      const importPattern = new RegExp(`import.*${middleware.name}.*from`, 'i');
      if (importPattern.test(content)) {
        // Find route definitions using this middleware
        const routePattern = new RegExp(
          `router\\.(get|post|put|patch|delete|all)\\s*\\([^,]+,\\s*${middleware.name}`,
          'g'
        );
        
        let match;
        while ((match = routePattern.exec(content)) !== null) {
          // Extract the route path
          const pathMatch = match[0].match(/["']([^"']+)["']/);
          if (pathMatch) {
            usage[middleware.name].usedIn.push({
              route: pathMatch[1],
              method: match[1].toUpperCase(),
              file
            });
          }
        }
        
        // Also check for app.use(middleware) - applied globally
        const globalPattern = new RegExp(`app\\.use\\s*\\(\\s*${middleware.name}`, 'g');
        if (globalPattern.test(content)) {
          usage[middleware.name].usedIn.push({
            route: '*',
            method: 'ALL',
            file
          });
        }
      }
    }
  }
  
  // Also check server.js for global middleware
  const serverPath = path.join(projectRoot, 'server.js');
  if (fs.existsSync(serverPath)) {
    const content = fs.readFileSync(serverPath, 'utf-8');
    
    for (const middleware of middlewareList) {
      const importPattern = new RegExp(`import.*${middleware.name}.*from`, 'i');
      if (importPattern.test(content)) {
        const globalPattern = new RegExp(`app\\.use\\s*\\(\\s*${middleware.name}`, 'g');
        if (globalPattern.test(content)) {
          usage[middleware.name].usedIn.push({
            route: '*',
            method: 'ALL',
            file: 'server.js'
          });
        }
      }
    }
  }
  
  return usage;
}

/**
 * Generate the cursor rule content
 * @param {Array} middlewareList - List of middleware
 * @param {Object} usage - Usage map
 * @returns {string} Markdown content for cursor rule
 */
function generateRuleContent(middlewareList, usage) {
  const timestamp = new Date().toISOString().split('T')[0];
  
  let content = `---
globs: ["middleware/**/*.js", "routes/**/*.js", "server.js"]
alwaysApply: false
---

# Middleware Documentation

**Auto-generated from code** - Last updated: ${timestamp}

This rule is automatically updated by \`/maintenance\` command.

---

## 🎯 Purpose

Provides AI with middleware definitions and their usage across routes.

**When loaded:** Working with middleware, route protection, or request handling

---

## 📋 Available Middleware

**Total Middleware:** ${middlewareList.length}

`;

  // Group by file
  const byFile = {};
  for (const mw of middlewareList) {
    if (!byFile[mw.file]) {
      byFile[mw.file] = [];
    }
    byFile[mw.file].push(mw);
  }
  
  for (const [file, middlewares] of Object.entries(byFile)) {
    content += `### ${file.replace('.js', '')}\n\n`;
    content += `**File:** \`middleware/${file}\`\n\n`;
    
    for (const mw of middlewares) {
      content += `#### \`${mw.name}\`\n\n`;
      if (mw.comment) {
        content += `${mw.comment}\n\n`;
      }
      
      const usageInfo = usage[mw.name];
      if (usageInfo && usageInfo.usedIn.length > 0) {
        content += `**Used in:**\n`;
        for (const use of usageInfo.usedIn) {
          if (use.route === '*') {
            content += `- **Global** (all routes) - Applied in \`${use.file}\`\n`;
          } else {
            content += `- \`${use.method} ${use.route}\` (\`${use.file}\`)\n`;
          }
        }
        content += `\n`;
      } else {
        content += `**Used in:** Not currently used in routes\n\n`;
      }
    }
    
    content += `---\n\n`;
  }
  
  // Add usage summary
  content += `## 📊 Usage Summary\n\n`;
  
  const usedMiddleware = Object.values(usage).filter(u => u.usedIn.length > 0);
  const unusedMiddleware = Object.values(usage).filter(u => u.usedIn.length === 0);
  
  content += `**In Use:** ${usedMiddleware.length}/${middlewareList.length} middleware actively used\n\n`;
  
  if (unusedMiddleware.length > 0) {
    content += `**Unused Middleware:**\n`;
    for (const u of unusedMiddleware) {
      content += `- \`${u.middleware.name}\` in \`${u.middleware.file}\`\n`;
    }
    content += `\n`;
  }
  
  // Add notes section
  content += `---\n\n## 📝 Notes\n\n`;
  content += `### Common Middleware Patterns\n\n`;
  content += `**Authentication:**\n`;
  content += `- Middleware that checks \`req.userId\` or Firebase tokens\n`;
  content += `- Applied to protected routes\n\n`;
  content += `**Authorization:**\n`;
  content += `- Middleware that checks subscription status or permissions\n`;
  content += `- Often applied to costly endpoints (TTS, image gen)\n\n`;
  content += `**Global Middleware:**\n`;
  content += `- Applied via \`app.use()\` in \`server.js\`\n`;
  content += `- Runs on all routes (CORS, logging, error handling)\n\n`;
  content += `**Route-Specific Middleware:**\n`;
  content += `- Applied via \`router.METHOD(path, middleware, handler)\`\n`;
  content += `- Only runs on specific routes\n\n`;
  
  content += `---\n\n## 🔄 How This Updates\n\n`;
  content += `This file is auto-generated by:\n`;
  content += `1. \`npm run docs:check\` (runs all generators)\n`;
  content += `2. \`/maintenance\` command (full maintenance workflow)\n\n`;
  content += `**Source:** \`scripts/generate-middleware-rule.mjs\`\n\n`;
  content += `---\n\n`;
  content += `**Last scanned:** ${timestamp}\n`;

  return content;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Scanning middleware...');
  
  const middlewareList = scanMiddleware();
  console.log(`✅ Found ${middlewareList.length} middleware exports`);
  
  console.log('🔍 Scanning middleware usage...');
  const usage = findMiddlewareUsage(middlewareList);
  
  const usedCount = Object.values(usage).filter(u => u.usedIn.length > 0).length;
  console.log(`✅ ${usedCount}/${middlewareList.length} middleware actively used`);
  
  const content = generateRuleContent(middlewareList, usage);
  const outputPath = path.join(projectRoot, '.cursor/rules/08-middleware-usage.mdc');
  
  fs.writeFileSync(outputPath, content, 'utf-8');
  console.log(`✅ Generated: ${outputPath}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { scanMiddleware, findMiddlewareUsage, generateRuleContent };







