// Annotation Enforcement: @async-boundary
// Detects async functions missing @async-boundary or @requires-await annotations

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findAndParseAnnotations } from './comment-parser.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.join(__dirname, '..');

/**
 * Check if async functions have boundary annotations
 * @param {string[]} files - Array of relative file paths
 * @param {object} config - Validation config from package.json
 * @returns {object} Validation results
 */
export function checkAsyncBoundaries(files, config = {}) {
  const issues = [];
  
  for (const file of files) {
    const filePath = path.join(repoRoot, file);
    let content;
    
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      continue;
    }
    
    const lines = content.split('\n');
    
    // Find all functions
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Match async function declarations
      const asyncFuncMatch = line.match(/async\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
      const asyncArrowMatch = line.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*async\s+\([^)]*\)\s*=>/);
      const asyncExportMatch = line.match(/export\s+async\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
      
      const functionName = asyncFuncMatch?.[1] || asyncArrowMatch?.[1] || asyncExportMatch?.[1];
      
      if (functionName) {
        // Use smart comment parser to check for async boundary annotation
        const parsed = findAndParseAnnotations(lines, i);
        const hasAsyncAnnotation = parsed.annotations.hasAsyncBoundary;
        
        if (!hasAsyncAnnotation) {
          const severity = config.asyncBoundarySeverity === 'error' ? 'error' : 'warning';
          
          issues.push({
            file,
            line: lineNum,
            function: functionName,
            type: 'missing-async-boundary',
            severity,
            message: `Async function '${functionName}' missing @async-boundary annotation`,
            suggestion: `Add: // @async-boundary\n// @requires await`
          });
        }
      }
      
      // Also check for non-async functions (to suggest @sync-only)
      const syncFuncMatch = line.match(/(?<!async\s+)function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
      const syncArrowMatch = line.match(/(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*\([^)]*\)\s*=>/);
      const syncExportMatch = line.match(/export\s+(?!async\s+)function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/);
      
      // Make sure we're not catching async functions
      if (line.includes('async')) continue;
      
      const syncFunctionName = syncFuncMatch?.[1] || syncArrowMatch?.[1] || syncExportMatch?.[1];
      
      if (syncFunctionName && config.enforceSyncAnnotations) {
        // Check if function returns a Promise
        let funcBody = '';
        let braceCount = 0;
        let started = false;
        
        for (let j = i; j < Math.min(i + 100, lines.length); j++) {
          const bodyLine = lines[j];
          
          if (bodyLine.includes('{')) {
            braceCount += (bodyLine.match(/\{/g) || []).length;
            started = true;
          }
          if (bodyLine.includes('}')) {
            braceCount -= (bodyLine.match(/\}/g) || []).length;
          }
          
          funcBody += bodyLine + '\n';
          
          if (started && braceCount === 0) break;
        }
        
        const returnsPromise = 
          funcBody.includes('new Promise') ||
          funcBody.includes('Promise.resolve') ||
          funcBody.includes('Promise.reject') ||
          /return\s+\w+\s*\(/.test(funcBody); // Might be returning another async function
        
        // Check if previous lines have @sync-only annotation
        let hasSyncAnnotation = false;
        
        for (let j = Math.max(0, i - 10); j < i; j++) {
          if (
            lines[j].includes('@sync-only') ||
            lines[j].includes('@do-not-await')
          ) {
            hasSyncAnnotation = true;
            break;
          }
        }
        
        if (!hasSyncAnnotation && !returnsPromise) {
          const severity = config.asyncBoundarySeverity === 'error' ? 'error' : 'warning';
          
          issues.push({
            file,
            line: lineNum,
            function: syncFunctionName,
            type: 'missing-sync-annotation',
            severity,
            message: `Sync function '${syncFunctionName}' missing @sync-only annotation`,
            suggestion: `Add: // @sync-only\n// @do-not-await`
          });
        }
      }
    }
  }
  
  return {
    issues,
    stats: {
      total: issues.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length
    }
  };
}

/**
 * Generate a report of async boundary issues
 * @param {object[]} issues - Array of issues
 * @returns {string} Formatted report
 */
export function generateAsyncBoundariesReport(issues) {
  if (issues.length === 0) {
    return 'All async functions have @async-boundary annotations';
  }
  
  const lines = [];
  const asyncIssues = issues.filter(i => i.type === 'missing-async-boundary');
  const syncIssues = issues.filter(i => i.type === 'missing-sync-annotation');
  
  if (asyncIssues.length > 0) {
    lines.push(`Found ${asyncIssues.length} async functions missing @async-boundary annotations:\n`);
    
    // Group by file
    const byFile = {};
    for (const issue of asyncIssues) {
      if (!byFile[issue.file]) byFile[issue.file] = [];
      byFile[issue.file].push(issue);
    }
    
    for (const [file, fileIssues] of Object.entries(byFile).slice(0, 5)) {
      lines.push(`  ${file}:`);
      for (const issue of fileIssues.slice(0, 3)) {
        lines.push(`    Line ${issue.line}: async ${issue.function}() needs @async-boundary`);
      }
      if (fileIssues.length > 3) {
        lines.push(`    ... and ${fileIssues.length - 3} more in this file`);
      }
    }
    
    if (Object.keys(byFile).length > 5) {
      lines.push(`  ... and ${Object.keys(byFile).length - 5} more files`);
    }
  }
  
  if (syncIssues.length > 0) {
    lines.push(`\nFound ${syncIssues.length} sync functions missing @sync-only annotations (optional):\n`);
    lines.push(`  (These are informational - helps AI know not to await them)`);
  }
  
  lines.push(`\n  💡 To auto-fix: npm run annotations:generate-async`);
  
  return lines.join('\n');
}

export default { checkAsyncBoundaries, generateAsyncBoundariesReport };

