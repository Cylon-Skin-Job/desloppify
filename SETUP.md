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
    "desloppify": "node desloppify/scripts/core/run-all.js",
    "desloppify:core": "node desloppify/scripts/core/validate-core.js",
    "desloppify:bugs": "node desloppify/scripts/bug-patterns/detect-all.js",
    "lint:styles": "node desloppify/scripts/core/lint-styles.js",
    "validate:cursor-rules": "node desloppify/scripts/core/validate-cursor-rules.js"
  }
}
```

**Note:** If you only want wisdom (no validators), skip this step entirely. The wisdom files are always accessible.

---

## Step 3: Set Up `/menu` Command

### Create the Menu Command

**File:** `.cursor/commands/menu.md`

Copy the menu command template from `desloppify/templates/cursor-commands/menu.md.template` to your project's `.cursor/commands/menu.md`.

**Or manually create:**

```markdown
# Menu - Unified Desloppify Interface

**Aliases:** `/menu`, `/m`

**Purpose:** Single command interface for all maintenance, deployment, wisdom, and project management tasks.

---

## What This Does

When user types `/menu`, present this interactive menu:

🛠️  Desloppify Menu

1. 🔍 Full Maintenance
   Run all validators, generate rules, capture wisdom

2. 🔄 Sync Desloppify
   Update submodule, show what's new (wisdom + validators)

3. 🚀 Deploy Workflow
   Step-by-step deployment from playbook

4. 📝 End Session
   Quick commit + session summary

5. 🧠 Search Wisdom
   Find debug clues, insights, patterns

6. 📚 View Project Docs
   Browse desloppify-local/cursor-docs/

7. 📖 View Sessions
   Read session ledger

8. ⚡ Quick Status
   Git status, submodule status, validation summary

What would you like to do? (1-8)
```

**See full implementation:** [menu.md command reference](https://github.com/Cylon-Skin-Job/desloppify/blob/main/templates/cursor-commands/README.md)

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

## Step 4: How to Use Wisdom in Your Project

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

## Step 5: Using the Menu

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

## Step 6: Contributing New Wisdom

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

