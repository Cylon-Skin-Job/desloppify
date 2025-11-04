# Setup Guide - Desloppify Integration

**Purpose:** Instructions for AI to integrate the unified quality + wisdom system into a new project.

---

## 🎯 What This Does

When you add desloppify to a project, you get:
1. **Quality Enforcement** - Validators, contract enforcers, bug pattern detectors
2. **Accumulated Wisdom** - Debug clues, insights, and battle-tested patterns from all your projects

**One submodule. Two powerful systems.**

---

## 📚 Modern Paradigm (2025+)

**Key Insight:** AI can read files directly. Wisdom access is automatic, validation is configurable.

### The Single Menu Interface

**One command for everything:**

```
User: /menu
```

**8 unified workflows:**
1. 🔍 **Full Maintenance** - Run all validators, generate rules, capture wisdom
2. 🔄 **Sync Desloppify** - Update submodule, show what's new (wisdom + validators)
3. 🚀 **Deploy Workflow** - Step-by-step deployment with pre-deploy checks
4. 📝 **End Session** - Quick commit + session summary (light validation)
5. 🧠 **Search Wisdom** - Find debug clues, insights, patterns
6. 📚 **View Project Docs** - Browse project-specific documentation
7. 📖 **View Sessions** - Read session ledger
8. ⚡ **Quick Status** - Git status, submodule status, validation summary

**Philosophy:** One menu, everything accessible. Universal code (desloppify submodule) vs project-specific files (desloppify-local folder).

**Wisdom capture happens automatically** during Full Maintenance (option 1) and End Session (option 4).  
**Validators run on demand** via Full Maintenance or individual npm scripts.

---

## ✅ Quick Start Checklist

**Minimum viable setup (3 steps):**

```bash
# 1. Add desloppify submodule
cd your-project-root
git submodule add https://github.com/Cylon-Skin-Job/desloppify.git desloppify
git submodule update --init --recursive

# 2. Copy menu command template
mkdir -p .cursor/commands
cp desloppify/templates/cursor-commands/menu.md.template .cursor/commands/menu.md

# 3. Test it works
# In Cursor, type: /menu
```

**That's the minimum!** You now have:
- ✅ Access to accumulated wisdom (debug clues, insights, patterns)
- ✅ Unified `/menu` command (8 workflows in one place)

---

**Full setup (adds documentation infrastructure):**

After the 3 steps above, add:

```bash
# 4. (Optional) Install universal conventions
cp desloppify/cursor-rule-templates/*.mdc .cursor/rules/

# 5. Document your project (AI-guided)
# Run the interactive setup wizard:
# Type in Cursor: "Run desloppify setup" or "Document my project"
# AI will:
#   - Auto-detect your tech stack
#   - Interview you about your project
#   - Create 00-project-context.mdc
#   - Copy relevant generators
#   - Create docs-check.js orchestrator
#   - Set up desloppify-local/ structure

# 6. Test full system
npm run docs:check

# 7. Commit everything
git add .
git commit -m "Add desloppify: full documentation infrastructure"
```

**Full setup gives you:**
- ✅ Self-documenting codebase (auto-generated cursor rules)
- ✅ Quality validators (bug patterns, contracts, style checks)
- ✅ Deployment playbooks
- ✅ Session tracking
- ✅ Project-specific generators

**Want validators only?** See Step 2 below for npm script setup (no setup wizard needed).

---

## 🎨 Vanilla Mode: Pure HTML/CSS/JS Projects (No npm)

**If your project has NO `package.json`** (pure HTML/CSS/JS), use **Minimal Setup**:

### Quick Vanilla Setup

```bash
# 1. Add desloppify submodule
cd your-project-root
git submodule add https://github.com/Cylon-Skin-Job/desloppify.git desloppify
git submodule update --init --recursive

# 2. Run setup wizard (chooses MINIMAL automatically for vanilla projects)
bash desloppify/setup.sh

# Or manually copy menu:
mkdir -p .cursor/commands
cp desloppify/templates/cursor-commands/menu.md.template .cursor/commands/menu.md

# 3. Test
# In Cursor: /menu
```

### What You Get (Vanilla Mode)

✅ **Wisdom Access**
- Full access to debug clues, insights, patterns
- AI reads `desloppify/wisdom/` directly
- No npm required

✅ **Unified Menu**
- `/menu` command works
- Options 2, 5, 6, 7, 8 available
- Option 1 (Full Maintenance) requires npm

❌ **No Validators** (requires Node.js/npm)
- Can't run automated validation
- No `docs:check` script
- Wisdom only

### Adding npm Later (Optional)

If you want validators, add `package.json`:

```bash
npm init -y

# Add desloppify scripts
# See Step 2 below for package.json scripts
```

Then re-run setup:
```bash
bash desloppify/setup.sh
# Choose STANDARD setup this time
```

### Why Vanilla Mode Exists

Not every project needs a build system. Pure HTML/CSS/JS projects benefit from:
- ✅ Debug wisdom (Firebase gotchas, CSS bugs, JS patterns)
- ✅ Accumulated learnings from other projects
- ✅ Unified `/menu` for project management

Validators are **optional**—wisdom is **universal**.

---

## Step 1: Add Desloppify as Submodule

```bash
cd your-project-root
git submodule add https://github.com/Cylon-Skin-Job/desloppify.git desloppify
git submodule update --init --recursive
git add .gitmodules desloppify
git commit -m "Add desloppify for quality enforcement + accumulated wisdom"
```

**Result:** `desloppify/` now exists at your project root with validators + wisdom.

---

## Step 2: Configure Validators (Optional)

If you want to use the quality enforcement features, create a config file.

### Create `desloppify.config.js` in Project Root

```javascript
export default {
  // Core validators (always recommended)
  core: {
    lintStyles: true,        // No inline CSS
    lintDuplicateIds: true,  // No duplicate IDs
    validateColors: true,    // No hardcoded colors
    cursorRules: true        // Cursor rule syntax validation
  },

  // Contract system (opt-in)
  contracts: {
    enabled: false,  // Enable when ready for strict contracts
    enforcers: ['return-types', 'nullability', 'async-boundaries']
  },

  // Bug pattern detection (recommended)
  bugPatterns: {
    enabled: true,
    detectors: ['null-access', 'memory-leaks', 'security', 'data-shapes']
  },

  // Optional modules (enable as needed)
  modules: {
    firebase: { enabled: false },        // Firestore schema validation
    express: { enabled: false },          // API route documentation
    stateManagement: { enabled: false },  // Centralized state validation
    todoSystem: { enabled: true }        // TODO.md contract system
  },

  // Project paths (adjust to your structure)
  paths: {
    routesDir: 'routes',
    serverFile: 'server.js',
    frontendJs: 'index.js',
    htmlFiles: ['*.html']
  }
};
```

### Add Scripts to `package.json`

```json
{
  "scripts": {
    "desloppify": "cd desloppify && npm run desloppify && cd ..",
    "desloppify:core": "cd desloppify && npm run desloppify:core && cd ..",
    "desloppify:bugs": "cd desloppify && npm run desloppify:bugs && cd ..",
    "lint:styles": "node desloppify/scripts/core/lint-styles.cjs",
    "validate:cursor-rules": "node desloppify/scripts/core/validate-cursor-rules.mjs"
  }
}
```

**What these do:**
- `npm run desloppify` - Full suite (core + contracts + bug patterns)
- `npm run desloppify:core` - Core validators only (styles, IDs, colors, cursor rules)
- `npm run desloppify:bugs` - Bug pattern detectors only (null access, memory leaks, security, data shapes)
- `npm run lint:styles` - Fast: No inline CSS check
- `npm run validate:cursor-rules` - Fast: Cursor rule syntax validation

**Note:** If you only want wisdom (no validators), skip this step entirely. The wisdom files are always accessible.

---

## Step 3: Set Up `/menu` Command

### Create the Menu Command

**File:** `.cursor/commands/menu.md`

**Quick Setup:**
```bash
# Copy template to your project
cp desloppify/templates/cursor-commands/menu.md.template .cursor/commands/menu.md
```

**Or manually create `.cursor/commands/menu.md`** - See full template: `desloppify/templates/cursor-commands/menu.md.template`

**What you get:**
- 8 unified workflows (maintenance, deploy, sessions, wisdom, docs)
- All maintenance tasks accessible from one command
- No need to remember separate commands

**Usage:**
```
User: /menu

AI presents:
1. 🔍 Full Maintenance
2. 🔄 Sync Desloppify
3. 🚀 Deploy Workflow
4. 📝 End Session
5. 🧠 Search Wisdom
6. 📚 View Project Docs
7. 📖 View Sessions
8. ⚡ Quick Status
```

### Why One Menu?

**Old way (separate commands):**
- `/maintenance` for validation
- `/end-session` for commits
- `/deploy` for deployment
- `/sync` for submodule updates
- User has to remember 4+ commands

**New way (unified menu):**
- `/menu` for everything
- 8 organized options
- No hunting for commands
- Clear separation: universal (desloppify) vs local (desloppify-local)

---

## Step 4: Install Universal Conventions (Optional)

**Purpose:** Copy battle-tested HTML/CSS/JS cursor rules

**Quick Setup:**
```bash
# Copy universal conventions to your project
mkdir -p .cursor/rules
cp desloppify/cursor-rule-templates/*.mdc .cursor/rules/
```

**What you get:**
- `01-html-conventions.mdc` - kebab-case IDs/classes, cross-file consistency
- `02-css-conventions.mdc` - CSS custom properties, no hardcoded colors
- `03-javascript-naming.mdc` - camelCase conventions
- `88-cursor-rule-syntax.mdc` - Meta rule (how to write cursor rules)

**Why install these?**
These conventions prevent common bugs:
- HTML/CSS/JS naming mismatches
- Hardcoded colors breaking themes
- Duplicate IDs causing selector conflicts
- Inconsistent naming across files

**Skip if:**
- You have your own conventions already
- Not using HTML/CSS/vanilla JS
- Want to define your own rules first

---

## Step 5: Document Your Project

**Purpose:** Auto-generate cursor rules and set up self-documenting infrastructure

This is the big one! We'll:
1. Auto-detect your tech stack
2. Interview you about your project
3. Create `00-project-context.mdc` (project overview)
4. Copy relevant generators based on tech stack
5. Create `docs-check.js` orchestrator
6. Set up `desloppify-local/` folder structure
7. Run first validation

### 5.1: Auto-Detect Tech Stack

**AI should scan your project:**

```javascript
// Scan package.json for dependencies
const hasDependency = (dep) => /* check package.json */

const techStack = {
  express: hasDependency('express'),
  firebase: hasDependency('firebase-admin') || hasDependency('firebase'),
  react: hasDependency('react'),
  vue: hasDependency('vue'),
  typescript: fs.existsSync('tsconfig.json'),
  // ... etc
};

// Scan folder structure
const structure = {
  hasRoutes: fs.existsSync('routes/'),
  hasMiddleware: fs.existsSync('middleware/'),
  hasScripts: fs.existsSync('scripts/'),
  // ... etc
};
```

**Report findings:**
```
🔍 Scanning project structure...
   ✅ Detected: Express (routes/ folder + express in package.json)
   ✅ Detected: Firebase/Firestore (firebase-admin in package.json)
   ✅ Detected: ES6 Modules (type: module in package.json)
   ✅ Detected: 45 scripts in scripts/ directory
   ⚠️  No TODO.md found
```

### 5.2: Interview for 00-project-context.mdc

**Conduct interview to populate project context template:**

**See:** `desloppify/templates/cursor-rules/README.md` for full interview flow

**Quick version:**
1. Project name: _______
2. What does it do (1 sentence): _______
3. Project stage (pre-alpha/alpha/beta/production): _______
4. Tech stack (confirm auto-detected): _______
5. What features are working: _______
6. What's in progress: _______
7. Your role/experience level: _______

**Generate file:**
```bash
# AI creates .cursor/rules/00-project-context.mdc from template
# Replaces all {{PLACEHOLDERS}} with interview answers
```

### 5.3: Copy Relevant Generators

**Based on detected tech stack, copy generators to `desloppify-local/scripts/`:**

**If Express detected:**
```bash
mkdir -p desloppify-local/scripts
cp desloppify/scripts/modules/express/generate-api-routes-rule.mjs desloppify-local/scripts/
cp desloppify/scripts/modules/express/generate-middleware-rule.mjs desloppify-local/scripts/
```

**If Firebase detected:**
```bash
cp desloppify/scripts/modules/firebase/generate-schema-rule.mjs desloppify-local/scripts/
```

**If scripts/ folder detected:**
```bash
cp desloppify/scripts/modules/maintenance/generate-scripts-inventory-rule.mjs desloppify-local/scripts/
```

**If TODO.md detected:**
```bash
cp desloppify/scripts/modules/todo-system/validate-todo-contract.mjs desloppify-local/scripts/
```

**Update paths in copied files:**
Each generator needs `projectRoot` updated to `path.resolve(__dirname, '../..')` (since they moved to desloppify-local)

### 5.4: Create docs-check.js Orchestrator

**Copy template and customize:**
```bash
cp desloppify/templates/scripts/docs-check.js.template scripts/docs-check.js
```

**AI should auto-populate placeholders based on:**
- `{{PROJECT_NAME}}` - From interview
- `{{HTML_FILE}}` - Scan for *.html files
- `{{JS_FILES}}` - Scan for *.js, *.mjs files
- `{{GENERATOR_IMPORTS}}` - Based on copied generators
- `{{GENERATOR_CALLS}}` - Based on copied generators

**Example auto-population for Express + Firebase project:**
```javascript
// {{GENERATOR_IMPORTS}} becomes:
import { generateAPIRoutes } from '../desloppify-local/scripts/generate-api-routes-rule.mjs';
import { generateMiddleware } from '../desloppify-local/scripts/generate-middleware-rule.mjs';
import { generateFirebaseSchema } from '../desloppify-local/scripts/generate-schema-rule.mjs';

// {{GENERATOR_CALLS}} becomes:
await generateAPIRoutes();
await generateMiddleware();
await generateFirebaseSchema();
ok('Auto-generated cursor rules updated');
```

### 5.5: Create desloppify-local/ Structure

**Copy full structure:**
```bash
cp -r desloppify/templates/desloppify-local/ ./desloppify-local/

# Copy config
cp desloppify/templates/scripts/docs-check.config.json.template desloppify-local/scripts/docs-check.config.json

# Copy sessions templates (if not already present)
mkdir -p desloppify-local/ledger/sessions
cp desloppify/templates/sessions/*.md desloppify-local/ledger/sessions/
```

**Customize config:**
Update `desloppify-local/scripts/docs-check.config.json` with detected paths

### 5.6: Run First Validation

**Test the setup:**
```bash
npm run docs:check
```

**Expected first run:**
```
🔎 YourProject Docs Check

✅ Pre-flight: No interactive code detected

✔️  Function calls validation
✔️  Null/undefined access
✔️  Data shape validation
✔️  Security risks
✔️  Memory leak risks
✔️  Return type annotations
✔️  Error contract annotations
✔️  Nullability annotations
✔️  Async boundary annotations
✔️  Side effects annotations
✔️  State mutation annotations
✔️  Dependency annotations

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 VALIDATION COMPLETION REPORT

  ✅ Function calls validation              PASSED    0.25s
  ✅ Null/undefined access                  PASSED    0.18s
  ✅ Data shape validation                  PASSED    0.12s
  ✅ Security risks                         PASSED    0.09s
  ✅ Memory leak risks                      PASSED    0.11s
  ✅ Return type annotations                PASSED    0.15s
  ✅ Error contract annotations             PASSED    0.14s
  ✅ Nullability annotations                PASSED    0.13s
  ✅ Async boundary annotations             PASSED    0.12s
  ✅ Side effects annotations               PASSED    0.11s
  ✅ State mutation annotations             PASSED    0.10s
  ✅ Dependency annotations                 PASSED    0.12s

Total: 12 validators
  ✅ Passed: 12
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✔️  All docs checks passed.

✅ Generated: .cursor/rules/06-api-routes.mdc
✅ Generated: .cursor/rules/08-middleware-usage.mdc
✅ Generated: .cursor/rules/07-firestore-schema.mdc
✔️  Auto-generated cursor rules updated
```

### 5.7: Commit Setup

```bash
git add .cursor/rules/ scripts/ desloppify-local/
git commit -m "Add desloppify documentation infrastructure

- 00-project-context.mdc (project overview)
- docs-check.js orchestrator
- Auto-generated rules (API, schema, middleware)
- desloppify-local/ structure (generators, sessions, deploy)"
```

**Result:** 🎉 Your project is now self-documenting!

---

## Step 6: How to Use Wisdom in Your Project

### Reading Debug Clues

**When debugging, AI should:**
1. Ask: "What's broken?"
2. Load relevant category from `desloppify/wisdom/debug/`
3. Walk through checklist
4. Suggest fixes

**Categories:**
- `wisdom/debug/state-management.md` - window variables, stale data, mutation issues
- `wisdom/debug/firebase.md` - Field naming, timestamps, query failures
- `wisdom/debug/api-backend.md` - Auth headers, CORS, response handling
- `wisdom/debug/frontend-ui.md` - Selectors, event listeners, z-index
- `wisdom/debug/typos-mistakes.md` - snake_case vs camelCase, missing awaits
- `wisdom/debug/mobile-pwa.md` - Touch events, safe areas, keyboard jank
- `wisdom/debug/authentication.md` - Token expiry, 401 errors

**Example:**
```
User: "Firebase query is returning nothing"
AI: *reads desloppify/wisdom/debug/firebase.md*
AI: "Let me check common Firebase gotchas:
     - Using camelCase instead of snake_case in query?
     - Forgot to add composite index?
     - Timestamp field mismatch?"
```

### Reading Insights

**When designing or architecting, AI should:**
1. Load relevant topic from `desloppify/wisdom/insights/`
2. Present Problem → Solution → Why format
3. Cross-reference to `wisdom/patterns/` for code examples

**Topics:**
- `wisdom/insights/problem-solving-framework.md` - Context-Aware, Exemptions, Single Source of Truth
- `wisdom/insights/debugging-framework.md` - 5-step systematic debugging
- `wisdom/insights/validator-design.md` - How to build quality enforcers
- `wisdom/insights/system-thinking.md` - Architectural patterns

### Copying Patterns

**When implementing features, AI should:**
1. Check `desloppify/wisdom/patterns/` for existing solutions
2. Copy battle-tested code
3. Adapt to current context

**Examples:**
- `wisdom/patterns/smart-parser.md` - Context-aware comment block parser
- `wisdom/patterns/state-management.md` - Centralized state patterns
- `wisdom/patterns/firebase.md` - Common Firestore query patterns

---

## Step 7: Using the Menu

### Primary Workflow

```
User: /menu

AI presents 8 options, user picks one

Menu handles everything:
- Option 1: Full validation + wisdom capture
- Option 2: Submodule sync + diff
- Option 3: Deployment with checks
- Option 4: Session end + quick validation
- Option 5: Search wisdom files
- Option 6: Browse project docs
- Option 7: View session ledger
- Option 8: Quick status overview
```

### Running Validators Directly (Advanced)

For CI/CD or scripting, call validators directly:

```bash
npm run lint:styles              # No inline CSS
npm run validate:cursor-rules    # Cursor rule syntax
npm run desloppify:bugs          # Bug pattern detectors
```

**Most users should use `/menu` (option 1) instead.**

### Pre-Commit Hook (Optional)

Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
npm run lint:styles || exit 1
npm run validate:cursor-rules || exit 1
```

---

## Step 8: Contributing New Wisdom

### Via Menu (Recommended)

When you run `/menu` → option 1 (Full Maintenance) or option 4 (End Session), AI will prompt:

```
Did you fix any tricky bugs this session?
Did you discover any new patterns worth documenting?
```

If yes, AI will:
1. Ask about the bug/pattern (symptom, fix, why it worked)
2. Determine category (Debug Clues / Insights / Patterns)
3. Draft the wisdom entry
4. Commit to `desloppify/wisdom/`
5. Push to desloppify repo
6. All your projects benefit!

### Manual Contribution

If you want to add wisdom outside of `/menu`:

```bash
cd desloppify/wisdom

# Edit the relevant file
# - debug/[category].md for quick checklist items
# - insights/[topic].md for architectural patterns
# - patterns/[topic].md for reusable code

git add .
git commit -m "Add: [your learning]"
git push

cd ../..
git add desloppify
git commit -m "Update desloppify wisdom reference"
```

---

## File Structure

```
your-project/
├── desloppify/               ← Git submodule
│   ├── scripts/              (Validators & enforcers)
│   │   ├── core/
│   │   ├── contracts/
│   │   ├── bug-patterns/
│   │   └── modules/
│   │
│   ├── wisdom/               (Accumulated knowledge)
│   │   ├── debug/            (7 category files)
│   │   │   ├── README.md
│   │   │   ├── state-management.md
│   │   │   ├── firebase.md
│   │   │   ├── api-backend.md
│   │   │   ├── frontend-ui.md
│   │   │   ├── typos-mistakes.md
│   │   │   ├── mobile-pwa.md
│   │   │   └── authentication.md
│   │   │
│   │   ├── insights/         (14+ topic files)
│   │   │   ├── README.md
│   │   │   ├── problem-solving-framework.md
│   │   │   ├── debugging-framework.md
│   │   │   ├── validator-design.md
│   │   │   └── ...
│   │   │
│   │   └── patterns/         (8+ code pattern files)
│   │       ├── README.md
│   │       ├── smart-parser.md
│   │       └── ...
│   │
│   ├── cursor-rule-templates/ (Universal conventions)
│   ├── templates/            (Boilerplate files)
│   ├── README.md
│   ├── SETUP.md              ← You are here
│   └── CHANGELOG.md
│
├── desloppify.config.js      ← Your project's validator config
└── .cursor/
    └── commands/
        └── menu.md           ← Single unified interface (replaces 4 separate commands)
```

---

## For AI: Integration Checklist

When user says "set up desloppify" or starts a new project:

### 1. Check Submodule Status
```bash
if [ -d "desloppify" ]; then
  echo "✅ Desloppify already exists"
else
  echo "Adding desloppify..."
  git submodule add https://github.com/Cylon-Skin-Job/desloppify.git desloppify
fi
```

### 2. Ask About Validator Usage

**Ask user:**
- Want to use quality enforcement (validators/bug detectors)?
- Or just wisdom access?

**If validators wanted:**
- Create `desloppify.config.js`
- Add npm scripts to `package.json`
- Test with `npm run lint:styles`

**If wisdom only:**
- Skip config, just use wisdom files directly

### 3. Set Up `/menu` Command

**Check if `.cursor/commands/menu.md` exists:**
- If no: Copy from `desloppify/templates/cursor-commands/menu.md.template`
- If yes: Confirm it's up to date

**One command replaces all others:**
- Old: `/maintenance`, `/end-session`, `/deploy`, `/sync` (separate commands)
- New: `/menu` (unified interface with 8 options)

### 4. Test Access

```bash
# Verify submodule has content
ls desloppify/wisdom/debug/
ls desloppify/wisdom/insights/
ls desloppify/wisdom/patterns/
ls desloppify/scripts/core/
```

If empty:
```bash
git submodule update --init --recursive
```

### 5. Quick Usage Guide

Remind user:
- **Main interface:** Type `/menu` for everything
- **Debugging?** AI will read `desloppify/wisdom/debug/[category].md` directly
- **Designing?** AI will reference `desloppify/wisdom/insights/[topic].md`
- **Coding?** AI will copy from `desloppify/wisdom/patterns/[topic].md`
- **Fixed a bug?** Wisdom capture happens in `/menu` → option 1 (Full Maintenance) or option 4 (End Session)
- **Pull updates?** `/menu` → option 2 (Sync Desloppify)
- **Run validators?** `/menu` → option 1 (Full Maintenance)
- **Deploy?** `/menu` → option 3 (Deploy Workflow)

---

## For AI: Interactive Setup Workflow

When user says "run setup" or "walk me through desloppify setup":

**Present this interactive checklist:**

```
🛠️  Desloppify Setup Wizard

Let's get desloppify set up in your project!

Progress: [ ] [ ] [ ] [ ] [ ] [ ] [ ]

Step 1 of 7: Add Submodule
───────────────────────────
Status: Checking...
```

### Step 1: Check & Add Submodule

```bash
# Check if desloppify exists
ls desloppify/ 2>/dev/null
```

**If exists:**
```
✅ Step 1: Submodule Already Exists
   Location: desloppify/

   Verify it has content:
```
```bash
ls desloppify/wisdom/debug/ && ls desloppify/scripts/core/
```

**If empty:** Run `git submodule update --init --recursive`

**If doesn't exist:**
```
Adding desloppify submodule...
```
```bash
git submodule add https://github.com/Cylon-Skin-Job/desloppify.git desloppify
git submodule update --init --recursive
```
```
✅ Step 1 Complete: Submodule added
   Progress: [✓] [ ] [ ] [ ] [ ]
```

---

### Step 2: Copy Menu Template

```bash
# Check if menu command exists
ls .cursor/commands/menu.md 2>/dev/null
```

**If exists:**
```
✅ Step 2: Menu Already Exists
   Progress: [✓] [✓] [ ] [ ] [ ] [ ] [ ]
```

**If doesn't exist:**
```
Creating menu command...
```
```bash
mkdir -p .cursor/commands
cp desloppify/templates/cursor-commands/menu.md.template .cursor/commands/menu.md
```
```
✅ Step 2 Complete: Menu created
   Progress: [✓] [✓] [ ] [ ] [ ] [ ] [ ]
   
   You can now type /menu in Cursor!
```

---

### Step 3: Universal Conventions (Optional)

**Ask user:**
```
Step 3: Universal Conventions
─────────────────────────────
Install battle-tested HTML/CSS/JS cursor rules?

These prevent common bugs:
- HTML/CSS/JS naming mismatches
- Hardcoded colors
- Duplicate IDs
- Inconsistent conventions

Install universal conventions? (y/n)
```

**If yes:**
```
Installing universal conventions...
```
```bash
mkdir -p .cursor/rules
cp desloppify/cursor-rule-templates/*.mdc .cursor/rules/
```
```
✅ Step 3 Complete: Conventions installed
   Progress: [✓] [✓] [✓] [ ] [ ] [ ] [ ]
   
   Installed:
   - 01-html-conventions.mdc
   - 02-css-conventions.mdc
   - 03-javascript-naming.mdc
   - 88-cursor-rule-syntax.mdc
```

**If no:**
```
⏭️  Step 3 Skipped: Universal conventions
   Progress: [✓] [✓] [⏭️] [ ] [ ] [ ] [ ]
```

---

### Step 4: Document Your Project

**Ask user:**
```
Step 4: Document Your Project
─────────────────────────────
Set up self-documenting infrastructure?

This will:
- Auto-detect your tech stack
- Interview you about your project
- Create 00-project-context.mdc
- Copy relevant generators
- Create docs-check.js orchestrator
- Set up desloppify-local/ structure

Document your project? (y/n)
```

**If yes, run the full Step 5 workflow from main setup:**
- Auto-detect tech stack (scan package.json, folders)
- Interview for project context (see Step 5.2)
- Copy generators based on detected tech (see Step 5.3)
- Create docs-check.js (see Step 5.4)
- Create desloppify-local/ structure (see Step 5.5)
- Run first validation (see Step 5.6)

```
✅ Step 4 Complete: Project documented!
   Progress: [✓] [✓] [✓/⏭️] [✓] [ ] [ ] [ ]
   
   Created:
   - .cursor/rules/00-project-context.mdc
   - scripts/docs-check.js
   - desloppify-local/ (full structure)
   - Auto-generated rules (API, schema, etc.)
   
   Ran first validation: All checks passed ✅
```

**If no:**
```
⏭️  Step 4 Skipped: Documentation infrastructure
   Progress: [✓] [✓] [✓/⏭️] [⏭️] [ ] [ ] [ ]
   
   You can run this later with: "Document my project"
```

---

### Step 5: Validators (Optional - If Step 4 Skipped)

**Only show if Step 4 was skipped:**

**Ask user:**
```
Step 5: Quality Validators (Lightweight)
─────────────────────────────────────────
Want to add validators without full documentation setup?

- Yes: Add npm scripts for validators
- No: Skip (you have /menu and wisdom already)

Your choice? (y/n)
```

**If yes:**
```
Adding validator scripts...

1. Create desloppify.config.js? (y/n)
2. Add npm scripts to package.json? (y/n)
```

**If user wants config:** Show the config template from Step 2 of main doc

**If user wants scripts:** Show the npm scripts from Step 2 of main doc

```
✅ Step 5 Complete: Validators configured
   Progress: [✓] [✓] [✓/⏭️] [⏭️/✓] [✓] [ ] [ ]
```

**If no:**
```
⏭️  Step 5 Skipped: Validators
   Progress: [✓] [✓] [✓/⏭️] [⏭️] [⏭️] [ ] [ ]
```

---

### Step 6: Commit Setup

```bash
git status
```
```
Commit desloppify setup? (y/n)
```

**If yes:**
```bash
# Commit varies based on what was installed
git add .gitmodules desloppify .cursor/
git add scripts/ desloppify-local/  # If Step 4 was done
git commit -m "Add desloppify: [summary of what was installed]"
```
```
✅ Step 6 Complete: Changes committed
   Progress: [✓] [✓] [✓/⏭️] [✓/⏭️] [✓/⏭️] [✓] [ ]
```

---

### Step 7: Test It Works

```
Final Step: Let's test!

Type /menu and I'll show you the 8 options available.

Ready to test? (y/n)
```

**If yes:** Present the `/menu` interface from the menu.md template

```
✅ Step 7 Complete: Setup verified!
   Progress: [✓] [✓] [✓/⏭️] [✓/⏭️] [✓/⏭️] [✓] [✓]

🎉 Desloppify Setup Complete!

You now have:
✅ Access to accumulated wisdom
✅ Unified /menu command
✅ Universal conventions (if installed)
✅ Self-documenting infrastructure (if installed)
✅ Quality validators (if installed)

Next steps:
- Type /menu to explore
- Need help? /menu → 5 (Search Wisdom)
- Run validation? /menu → 1 (Full Maintenance)
- Document project later? Say "Document my project"
```

---

## Troubleshooting

### Submodule is empty
```bash
git submodule update --init --recursive
```

### Validators not working
- Check `desloppify.config.js` exists
- Check npm scripts are in `package.json`
- Run `npm run lint:styles` to test

### Can't push wisdom
```bash
cd desloppify
git remote -v  # Check remote is correct
# Should be: https://github.com/Cylon-Skin-Job/desloppify.git
```

### Menu command not working
- Check if `.cursor/commands/menu.md` exists
- Copy from `desloppify/templates/cursor-commands/menu.md.template` if missing
- Ensure AI is loading the command correctly

---

## What Gets Synced vs What Stays Local

**Synced (desloppify submodule):**
- Validators and enforcers
- Wisdom (debug clues, insights, patterns)
- Cursor rule templates
- This SETUP.md
- CHANGELOG.md

**Local to each project:**
- Your actual code
- `desloppify.config.js` (validator configuration)
- `.cursor/commands/` files (customized per project)
- Project-specific docs
- TODO.md
- Session ledger

**Why:** Quality tools and wisdom flow everywhere, but project code and config stay isolated.

---

## Migration from cursor-shared-wisdom

If your project currently uses the old `cursor-shared-wisdom` submodule:

**After desloppify v3.0.0:**
1. Remove `cursor-shared-wisdom` submodule
2. Add `desloppify` submodule (contains wisdom + validators)
3. Replace separate commands (`/maintenance`, `/end-session`, `/deploy`, `/sync`) with unified `/menu`
4. Update wisdom paths: `cursor-shared-wisdom/` → `desloppify/wisdom/`
5. Optionally configure validators (or ignore, wisdom still works)

**Benefits:**
- One command instead of four
- Validators + wisdom in one place
- Clearer universal vs project-specific separation

---

## Philosophy

**One submodule, two systems working together:**

1. **Quality Enforcement** catches bugs before they ship
2. **Accumulated Wisdom** prevents debugging the same issue twice

Together, they make good code easy and bad code hard—automatically.

---

**Version:** 3.0  
**Last Updated:** 2025-10-30  
**See:** CHANGELOG.md for recent changes

