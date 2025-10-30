/**
 * Desloppify Configuration
 * 
 * Copy this file to your project root and customize as needed.
 */

export default {
  /**
   * Core validators - always recommended
   */
  core: {
    lintStyles: true,              // No inline CSS
    lintDuplicateIds: true,        // No duplicate HTML IDs
    validateColors: true,          // Use CSS variables, not hardcoded colors
    cursorRules: true,             // Validate .cursor/ rule syntax
    responsiveAnnotations: true    // Ensure mobile considerations documented
  },

  /**
   * Contract enforcement system
   */
  contracts: {
    enabled: true,
    enforcers: [
      'return-types',      // @returns annotations
      'nullability',       // @nullable / @nonnull
      'async-boundaries',  // @async-boundary
      'error-contracts',   // @throws
      'dependencies',      // @depends
      'state-mutations',   // @mutates
      'side-effects'       // @side-effects
    ]
  },

  /**
   * Bug pattern detection
   */
  bugPatterns: {
    enabled: true,
    detectors: [
      'null-access',      // Catch potential null/undefined access
      'memory-leaks',     // Detect common memory leak patterns
      'security',         // XSS, injection, exposed secrets
      'data-shape'        // Data structure mismatches
    ]
  },

  /**
   * Optional modules - enable only what your project needs
   */
  modules: {
    firebase: {
      enabled: false,
      schemaFile: 'scripts/firebase-expected.json'
    },
    express: {
      enabled: false,
      routesDir: 'routes',
      middlewareDir: 'middleware'
    },
    stateManagement: {
      enabled: false,
      stateFile: 'js/app-state.js'
    },
    todoSystem: {
      enabled: true,
      todoFile: 'docs/TODO.md'
    }
  },

  /**
   * Project-specific paths
   */
  paths: {
    routesDir: 'routes',
    serverFile: 'server.js',
    frontendJs: 'index.js',
    stylesDir: 'css',
    htmlFiles: ['*.html']
  },

  /**
   * Whitelist system - ignore specific files/patterns
   */
  ignore: {
    files: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '*.min.js',
      '*.min.css'
    ],
    patterns: []
  }
};

