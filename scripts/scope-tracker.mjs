/**
 * @fileoverview Scope Tracker - Lightweight scope tracking using brace depth
 * 
 * This module provides utilities for tracking variable scope in JavaScript files
 * without requiring a full AST parser. It uses brace counting to determine scope depth.
 * 
 * Usage:
 *   import { ScopeTracker } from './scope-tracker.mjs';
 *   const tracker = new ScopeTracker();
 *   
 *   lines.forEach((line, i) => {
 *     tracker.processLine(line, i + 1);
 *     
 *     // Add variables at current depth
 *     if (line.includes('const myVar')) {
 *       tracker.addVariable('myVar', { line: i + 1, type: 'const' });
 *     }
 *     
 *     // Check if variable is in current scope
 *     const varInfo = tracker.getVariable('myVar');
 *     if (varInfo) {
 *       console.log('Found myVar:', varInfo);
 *     }
 *   });
 * 
 * Created: 2025-10-17
 * Milestone: Bug Pattern #3 (Null/Undefined Access Detection)
 */

/**
 * Tracks scope depth using brace counting
 * Handles nested functions, blocks, callbacks, etc.
 */
export class ScopeTracker {
  constructor() {
    this.braceDepth = 0;
    this.variables = new Map();  // Key: "varName:depth", Value: varInfo
    this.scopeStack = [];  // Track scope entry points for debugging
  }

  /**
   * Process a line to update brace depth
   * @param {string} line - The line of code
   * @param {number} lineNum - Line number (for debugging)
   */
  processLine(line, lineNum) {
    // Count opening braces
    const openBraces = (line.match(/\{/g) || []).length;
    
    // Store scope entry if we're entering a new scope
    if (openBraces > 0) {
      this.scopeStack.push({
        depth: this.braceDepth,
        line: lineNum,
        text: line.trim().substring(0, 50)  // Store snippet for debugging
      });
    }
    
    this.braceDepth += openBraces;
    
    // Count closing braces
    const closeBraces = (line.match(/\}/g) || []).length;
    this.braceDepth -= closeBraces;
    
    // Pop scope stack when leaving scope
    if (closeBraces > 0) {
      for (let i = 0; i < closeBraces; i++) {
        this.scopeStack.pop();
      }
    }
    
    // Ensure depth never goes negative
    if (this.braceDepth < 0) {
      console.warn(`[ScopeTracker] Negative depth at line ${lineNum}. Resetting to 0.`);
      this.braceDepth = 0;
    }
  }

  /**
   * Add a variable to the current scope
   * @param {string} varName - Variable name
   * @param {object} varInfo - Information about the variable
   */
  addVariable(varName, varInfo) {
    const key = `${varName}:${this.braceDepth}`;
    this.variables.set(key, {
      ...varInfo,
      depth: this.braceDepth
    });
  }

  /**
   * Get variable from current scope (checks current depth and parent scopes)
   * @param {string} varName - Variable name to look up
   * @returns {object|null} Variable info or null if not found
   */
  getVariable(varName) {
    // Check current scope first, then walk up the scope chain
    for (let depth = this.braceDepth; depth >= 0; depth--) {
      const key = `${varName}:${depth}`;
      if (this.variables.has(key)) {
        return this.variables.get(key);
      }
    }
    return null;
  }

  /**
   * Get variable at a specific depth (exact match)
   * @param {string} varName - Variable name
   * @param {number} depth - Scope depth
   * @returns {object|null} Variable info or null if not found
   */
  getVariableAtDepth(varName, depth) {
    const key = `${varName}:${depth}`;
    return this.variables.get(key) || null;
  }

  /**
   * Check if variable exists at current depth (not in parent scopes)
   * @param {string} varName - Variable name
   * @returns {boolean} True if variable is in current scope
   */
  hasVariableAtCurrentDepth(varName) {
    const key = `${varName}:${this.braceDepth}`;
    return this.variables.has(key);
  }

  /**
   * Get all variables with a given name across all scopes
   * @param {string} varName - Variable name
   * @returns {Array<object>} Array of variable info objects
   */
  getAllVariables(varName) {
    const results = [];
    for (const [key, value] of this.variables.entries()) {
      if (key.startsWith(`${varName}:`)) {
        results.push(value);
      }
    }
    return results.sort((a, b) => a.depth - b.depth);
  }

  /**
   * Get current brace depth
   * @returns {number} Current depth
   */
  getCurrentDepth() {
    return this.braceDepth;
  }

  /**
   * Get current scope context for debugging
   * @returns {object} Scope context
   */
  getScopeContext() {
    return {
      depth: this.braceDepth,
      scopeStack: [...this.scopeStack],
      variableCount: this.variables.size
    };
  }

  /**
   * Reset the tracker (for processing a new file)
   */
  reset() {
    this.braceDepth = 0;
    this.variables.clear();
    this.scopeStack = [];
  }

  /**
   * Debug helper: Print all tracked variables
   */
  debugPrint() {
    console.log('\n=== Scope Tracker Debug ===');
    console.log('Current depth:', this.braceDepth);
    console.log('Scope stack:', this.scopeStack);
    console.log('\nVariables:');
    for (const [key, value] of this.variables.entries()) {
      console.log(`  ${key}:`, value);
    }
    console.log('========================\n');
  }
}

/**
 * Helper function: Create a tracker and process all lines at once
 * @param {Array<string>} lines - Array of code lines
 * @returns {ScopeTracker} Configured tracker
 */
export function createTrackerFromLines(lines) {
  const tracker = new ScopeTracker();
  lines.forEach((line, i) => {
    tracker.processLine(line, i + 1);
  });
  return tracker;
}

/**
 * Helper function: Count braces in a line
 * @param {string} line - Line of code
 * @returns {object} { open: number, close: number, net: number }
 */
export function countBraces(line) {
  const open = (line.match(/\{/g) || []).length;
  const close = (line.match(/\}/g) || []).length;
  return { open, close, net: open - close };
}

