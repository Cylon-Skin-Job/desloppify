# Desloppify

**Universal code quality enforcement system**

Stop writing sloppy code. Validate style, contracts, and bug patterns across any project.

---

## 🎯 What Is This?

Desloppify is a collection of validators, linters, and bug pattern detectors that enforce code quality standards. It's designed to be dropped into any project and immediately start catching issues.

**Philosophy:** Catch mistakes before they ship. Enforce conventions automatically. Make good code the default.

---

## ✨ Features

### Core Validators
- **Style Linting:** No inline CSS, duplicate IDs, hardcoded colors
- **Cursor Rules:** Validate `.cursor/` rule syntax and references
- **Responsive Annotations:** Ensure mobile considerations are documented

### Contract System
Enforce explicit contracts via code annotations:
- Return types (`@returns`)
- Nullability (`@nullable`, `@nonnull`)
- Async boundaries (`@async-boundary`)
- Error contracts (`@throws`)
- Dependencies (`@depends`)
- State mutations (`@mutates`)
- Side effects (`@side-effects`)

### Bug Pattern Detection
Catch common bugs before they bite:
- Null/undefined access
- Memory leaks
- Security issues (XSS, injection, secrets)
- Data shape mismatches

### Optional Modules
Enable only what you need:
- **Firebase:** Schema drift detection, Firestore usage validation
- **Express:** API route documentation, middleware usage tracking
- **State Management:** Centralized state validation
- **TODO System:** Two-way contract validation between code and TODO.md

---

## 🚀 Quick Start

### 1. Add as Submodule

```bash
cd your-project
git submodule add https://github.com/Cylon-Skin-Job/desloppify .desloppify
```

### 2. Create Config

Copy `desloppify.config.js` to your project root and customize:

```javascript
export default {
  core: {
    lintStyles: true,
    lintDuplicateIds: true,
    validateColors: true,
    cursorRules: true
  },
  contracts: {
    enabled: true,
    enforcers: ['return-types', 'nullability', 'async-boundaries']
  },
  modules: {
    firebase: { enabled: false },
    express: { enabled: false },
    stateManagement: { enabled: false },
    todoSystem: { enabled: true }
  },
  paths: {
    routesDir: 'routes',
    serverFile: 'server.js',
    frontendJs: 'index.js'
  }
};
```

### 3. Run Validators

```bash
npm run desloppify
```

---

## 📖 Usage

### Run All Core Validators

```bash
# Run core + contracts + bug patterns
npm run desloppify

# Run everything including modules (based on config)
npm run desloppify:all
```

### Run By Category

```bash
# Core validators only (styles, IDs, colors, cursor rules)
npm run desloppify:core

# Contract enforcers only
npm run desloppify:contracts

# Bug pattern detectors only
npm run desloppify:bugs
```

### Run Individual Validators

**Core:**
```bash
npm run lint:styles              # No inline CSS
npm run lint:ids                 # No duplicate IDs
npm run validate:colors          # No hardcoded colors
npm run validate:cursor-rules    # Cursor rule syntax
npm run validate:responsive      # Responsive annotations
```

**Contracts:**
```bash
npm run enforce:return-types     # @returns annotations
npm run enforce:nullability      # @nullable/@nonnull
npm run enforce:async            # @async-boundary
npm run enforce:errors           # @throws
npm run enforce:dependencies     # @depends
npm run enforce:state            # @mutates
npm run enforce:side-effects     # @side-effects
```

**Bug Patterns:**
```bash
npm run bug:null                 # Null/undefined access
npm run bug:memory               # Memory leaks
npm run bug:security             # XSS, injection, secrets
npm run bug:data                 # Data shape mismatches
```

**Modules (if enabled):**
```bash
# Firebase
npm run module:firebase:scan     # Scan Firestore usage
npm run module:firebase:schema   # Generate schema docs

# Express
npm run module:express:routes    # Generate API docs
npm run module:express:middleware # Generate middleware docs

# State Management
npm run module:state             # Validate centralized state

# TODO System
npm run module:todo:validate     # Validate two-way contracts
npm run module:todo:changes      # Detect uncommitted TODOs
```

---

## 📦 What's Included

```
desloppify/
├── scripts/
│   ├── core/          # Universal validators (style, rules, etc.)
│   ├── contracts/     # Contract enforcement system
│   ├── bug-patterns/  # Common bug detectors
│   └── modules/       # Optional modules (firebase, express, etc.)
├── .cursor/
│   ├── commands/      # Cursor IDE commands
│   └── rules/         # Universal coding conventions
├── templates/         # Boilerplate for new projects
└── desloppify.config.js
```

---

## 🎓 Core Concepts

### 1. Universal Standards

Desloppify enforces conventions that improve any codebase:
- No inline styles
- No duplicate IDs
- No hardcoded colors (use CSS variables)
- Proper cursor rule syntax
- Responsive design annotations

### 2. Contract-Driven Code

Explicit contracts via annotations make code self-documenting and verifiable:

```javascript
/**
 * Fetches user data from API
 * @async-boundary
 * @returns {Promise<User>}
 * @throws {ApiError} If network fails
 * @nullable
 */
async function fetchUser(id) {
  // Implementation
}
```

Validators ensure:
- Functions declare what they return
- Async boundaries are marked
- Nullable returns are documented
- Error cases are explicit

### 3. Context-Aware Intelligence

Validators understand your codebase:
- Smart parsing (code vs comments vs strings)
- Whitelist system for exceptions
- Incremental validation (only changed files)
- Helpful error messages with fix suggestions

### 4. Modular Architecture

Only enable what you need:
- Core validators always run
- Optional modules toggle on/off
- Zero config for simple projects
- Full customization for complex ones

---

## 📚 Documentation

### For Users
- **Getting Started:** See Quick Start above
- **Configuration:** See `desloppify.config.js` comments
- **Commands:** Check `.cursor/commands/` for available commands
- **Rules:** Read `.cursor/rules/` for coding conventions

### For Contributors
- **Architecture:** (Coming soon)
- **Adding Validators:** (Coming soon)
- **Module Development:** (Coming soon)

---

## 🔧 Requirements

- Node.js 18+
- Git
- (Optional) Cursor IDE for commands and rules

---

## 🤝 Contributing

This is currently a personal tool being open-sourced. Contributions welcome once v1.0.0 is stable.

### Development Setup

```bash
git clone https://github.com/Cylon-Skin-Job/desloppify.git
cd desloppify
npm install
npm test
```

---

## 📝 License

MIT (see LICENSE file)

---

## 🗺️ Roadmap

- [ ] **v1.0.0** - Core validators + contract system
- [ ] Firebase module
- [ ] Express module
- [ ] State management module
- [ ] TODO system module
- [ ] Bootstrap command
- [ ] Full documentation
- [ ] Example projects

---

## 💡 Philosophy

**Good code should be easy. Bad code should be hard.**

Desloppify makes quality the path of least resistance. It catches mistakes, enforces conventions, and guides you toward better patterns—all automatically.

Stop debating style in PRs. Stop debugging null access. Stop shipping secrets. Let the validators do the boring work so you can focus on building.

---

## 🏄‍♂️ Vibe

Built by developers who got tired of fixing the same bugs over and over. This is the system we wish existed when we started.

No jargon. No complexity. Just solid standards that make your code better.

---

**Status:** 🚧 Pre-alpha (v0.1.0)  
**Repo:** https://github.com/Cylon-Skin-Job/desloppify  
**Issues:** https://github.com/Cylon-Skin-Job/desloppify/issues

