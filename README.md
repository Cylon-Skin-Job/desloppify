# Desloppify

**Universal code quality + accumulated knowledge system**

Stop writing sloppy code. Stop debugging the same issues twice. Validate style, contracts, and bug patterns while building a cross-project knowledge base that gets smarter with every bug you fix.

---

## 🎯 What Is This?

Desloppify is a unified system combining:
1. **Quality Enforcement** - Validators, linters, and bug pattern detectors that catch issues automatically
2. **Accumulated Wisdom** - A growing knowledge base of debug clues, insights, and battle-tested patterns

It's designed to be dropped into any project as a single submodule and immediately start improving code quality while making all your past learnings instantly available.

**Philosophy:** Catch mistakes before they ship. Learn from every bug once, not repeatedly. Enforce conventions automatically. Make good code the default.

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

## 🔌 Importing Validators in Your Project

Desloppify provides universal validators that you import into your project. Here's the pattern:

### Project Structure

```
your-project/
├── desloppify/                    # Git submodule (universal validators)
│   └── scripts/
│       ├── core/                  # Import these
│       ├── contracts/             # Import these
│       ├── bug-patterns/          # Import these
│       └── modules/               # Import these
├── desloppify-local/              # Project-specific scripts (NOT in git submodule)
│   └── scripts/
│       ├── generate-api-routes-rule.mjs    # Project-specific generator
│       ├── generate-schema-rule.mjs        # Project-specific generator
│       ├── validation-whitelist.json       # Project-specific exceptions
│       └── docs-check.config.json          # Project validation config
└── scripts/
    └── docs-check.js              # Orchestrator (imports from desloppify + local)
```

### Import Pattern

In your project's orchestrator script (e.g., `scripts/docs-check.js`):

```javascript
// Import universal validators from desloppify
import { validateFunctionCalls } from '../desloppify/scripts/core/function-call-validator.mjs';
import { checkNullAccess } from '../desloppify/scripts/bug-patterns/bug-pattern-null-access.mjs';
import { enforceReturnTypes } from '../desloppify/scripts/contracts/enforce-return-types.mjs';

// Import project-specific generators from desloppify-local
import { generateApiRoutes } from '../desloppify-local/scripts/generate-api-routes-rule.mjs';
import { generateSchema } from '../desloppify-local/scripts/generate-schema-rule.mjs';

// Configure validators with project-specific paths
const validation = validateFunctionCalls({
  quiet: true,
  htmlFile: path.join(PROJECT_ROOT, 'RavenOS.html')  // Your HTML entry point
});
```

### What Goes Where?

**Universal validators → `desloppify/scripts/`** (you import these)
- Style linters
- Contract enforcers
- Bug pattern detectors
- Core validation logic

**Project-specific → `desloppify-local/scripts/`** (you write these)
- Generators that scan YOUR routes/, middleware/, etc.
- Whitelists for YOUR project exceptions
- Config files for YOUR validation rules

**Orchestrator → `your-project/scripts/`** (minimal)
- Single docs-check.js that imports from both
- Coordinates validation workflow
- Passes project-specific config to validators

### Configuration Options

Most validators accept a config object:

```javascript
// function-call-validator
validateFunctionCalls({
  quiet: false,          // Show verbose output
  htmlFile: 'index.html' // Path to HTML entry point (default: 'index.html')
});

// Other validators follow similar pattern
enforceReturnTypes({
  whitelistPath: '../desloppify-local/scripts/validation-whitelist.json'
});
```

---

## 📖 Usage

### Primary Interface: `/menu`

**One command for everything:**

```
User: /menu

🛠️  Desloppify Menu

1. 🔍 Full Maintenance - Run all validators, generate rules, capture wisdom
2. 🔄 Sync Desloppify - Update submodule, show what's new
3. 🚀 Deploy Workflow - Step-by-step deployment with pre-checks
4. 📝 End Session - Quick commit + session summary
5. 🧠 Search Wisdom - Find debug clues, insights, patterns
6. 📚 View Project Docs - Browse project-specific documentation
7. 📖 View Sessions - Read session ledger
8. ⚡ Quick Status - Git status, validation summary

What would you like to do? (1-8)
```

**Philosophy:** One menu, everything accessible. No hunting for commands.

---

### Advanced: Direct npm Scripts

For CI/CD or scripting, you can call validators directly:

<details>
<summary>View npm scripts (click to expand)</summary>

**Core Validators:**
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

**Note:** Most users should use `/menu` instead. These scripts are for automation.

</details>

---

## 📦 What's Included

```
desloppify/
├── scripts/
│   ├── core/          # Universal validators (style, rules, etc.)
│   ├── contracts/     # Contract enforcement system
│   ├── bug-patterns/  # Common bug detectors
│   └── modules/       # Optional modules (firebase, express, etc.)
├── wisdom/            # 🆕 Accumulated knowledge base
│   ├── debug/         # Quick-scan debugging checklists
│   ├── insights/      # Problem-solving patterns & architecture
│   └── patterns/      # Copy-paste ready battle-tested code
├── cursor-rule-templates/ # Universal coding conventions
├── templates/         # Boilerplate for new projects
└── desloppify.config.js
```

---

## 🧠 Accumulated Wisdom

**Desloppify now includes a cross-project knowledge base that gets smarter with every bug you fix.**

Never debug the same thing twice. When you solve a problem in ANY project, that wisdom flows here and becomes available to ALL your projects.

### [🔍 Debug Clues](wisdom/debug/README.md)

**Quick-scan debugging checklists when something breaks.**

Start here first. Organized by symptom (State issues? Firebase silent failures? CORS errors?). Check the relevant category, run through the checklist, get unblocked fast.

**Categories:** State Management · Firebase · API/Backend · Frontend/UI · Typos · Mobile · Authentication

### [💡 Insights](wisdom/insights/README.md)

**Problem-solving patterns and architecture decisions that work.**

The "why" behind good solutions. Higher-level patterns discovered after solving hard problems. Read these to understand principles, not just copy code.

**Topics:** Problem Solving Framework · Debugging Framework · Validator Design · System Thinking · State Management · UI Patterns · Documentation · Firebase · API Design · Testing · Deployment · Mobile · Meta-Patterns

### [📦 Patterns](wisdom/patterns/README.md)

**Copy-paste ready code that works across projects.**

Battle-tested code you can drop into any project. Includes usage examples, gotchas, and why each pattern works. No theory - just working solutions.

**Categories:** Smart Parser · State Management · UI Components · Firebase · API Patterns · Mobile · Testing

### The Learning Loop

1. **Encounter bug** → Check debug clues
2. **Fix it** → Learn something new
3. **Document it** → Add to relevant wisdom category
4. **Commit & push to desloppify** → Wisdom flows to all consuming projects
5. **All projects benefit** → Next project knows it automatically

### How to Navigate Wisdom

**When debugging:**
→ Start with `wisdom/debug/` - quick symptom-based checklist

**When designing:**
→ Read `wisdom/insights/` - understand the "why" behind patterns

**When coding:**
→ Copy from `wisdom/patterns/` - ready-to-use code

### Contributing Wisdom

When you learn something in a project:

```bash
cd desloppify
# Edit the relevant file in wisdom/debug/, wisdom/insights/, or wisdom/patterns/
git add wisdom/
git commit -m "Add: [your learning]"
git push

# Back to your project
cd ..
git submodule update --remote desloppify
git commit -am "Update desloppify with new wisdom"
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

**Good code should be easy. Bad code should be hard. Debugging the same issue twice should be impossible.**

Desloppify makes quality the path of least resistance while turning every bug into institutional knowledge. It catches mistakes, enforces conventions, and guides you toward better patterns—all automatically. And when you DO hit a bug, you document it once and never waste time on it again.

Stop debating style in PRs. Stop debugging null access. Stop shipping secrets. Stop Googling the same Firebase error for the third time. Let the validators catch the mistakes and let the wisdom guide you through the tough spots.

---

## 🏄‍♂️ Vibe

Built by developers who got tired of fixing the same bugs over and over. This is the system we wish existed when we started.

No jargon. No complexity. Just solid standards and accumulated knowledge that make your code better.

---

**Status:** 🚧 Pre-alpha (v0.1.0)  
**Repo:** https://github.com/Cylon-Skin-Job/desloppify  
**Issues:** https://github.com/Cylon-Skin-Job/desloppify/issues

