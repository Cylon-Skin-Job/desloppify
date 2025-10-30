# Changelog

All notable changes to Desloppify will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Universal cursor commands (bootstrap, session-end, maintenance)
- Configuration system loader
- Orchestrator script (docs-check equivalent)
- Testing in real projects

---

## [0.2.0] - 2025-10-30

### Added

**Core Validators (6):**
- `lint-styles.js` - No inline CSS
- `lint-duplicate-ids.mjs` - No duplicate HTML IDs
- `validate-hardcoded-colors.mjs` - Use CSS variables
- `validate-cursor-rules.mjs` - Cursor rule syntax validation
- `validate-cursor-references.mjs` - Check file references in rules
- `validate-responsive-annotations.mjs` - Mobile considerations documented

**Contract Enforcers (7):**
- `enforce-return-types.mjs` - @returns annotations
- `enforce-nullability.mjs` - @nullable/@nonnull
- `enforce-async-boundaries.mjs` - @async-boundary
- `enforce-error-contracts.mjs` - @throws
- `enforce-dependencies.mjs` - @depends
- `enforce-state-mutations.mjs` - @mutates
- `enforce-side-effects.mjs` - @side-effects

**Bug Pattern Detectors (4):**
- `bug-pattern-null-access.mjs` - Catch potential null access
- `bug-pattern-memory-leaks.mjs` - Detect memory leak patterns
- `bug-pattern-security.mjs` - XSS, injection, exposed secrets
- `bug-pattern-data-shape.mjs` - Data structure mismatches

**Utilities (3):**
- `comment-parser.mjs` - Smart code/comment/string parsing
- `scope-tracker.mjs` - Track code scope and context
- `whitelist-manager.mjs` - Manage validation exceptions

**Optional Modules:**
- **Firebase module:** Schema drift, Firestore usage validation
- **Express module:** API route docs, middleware tracking
- **State management module:** Centralized state enforcement
- **TODO system module:** Two-way contract validation

**Templates:**
- Session ledger templates (TEMPLATE.md, README.md, INDEX.md)
- TODO.md template with three-tier system
- NAMING_STYLE_GUIDE.md template

**Universal Cursor Rules (4):**
- `01-html-conventions.mdc` - HTML naming and structure
- `02-css-conventions.mdc` - CSS conventions and anti-patterns
- `03-javascript-naming.mdc` - JavaScript naming patterns
- `88-cursor-rule-syntax.mdc` - Cursor rule frontmatter guide

**Documentation:**
- Comprehensive README with usage examples
- Module-specific READMEs (Firebase, Express, State, TODO)
- npm scripts for all validators (40+ commands)

### Notes
- All validators extracted from production project (RavenOS)
- Cleaned of project-specific code
- Ready for use in any project
- Module system allows à la carte feature selection

---

## [0.1.0] - 2025-10-30

### Added
- Initial repository structure
- README with project vision
- CHANGELOG (this file)
- Folder structure for scripts, rules, templates
- Public GitHub repository

### Notes
- Pre-alpha stage
- Structure in place, validators not yet migrated
- Part of Cursor Universal System (Phase 2)

---

## Version History

- **0.1.0** - Repo created, structure established
- **1.0.0** (planned) - First stable release with all core features

---

**Repo:** https://github.com/Cylon-Skin-Job/desloppify

