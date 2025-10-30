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

### The 4-Command System

**Primary commands in most projects:**
1. **`/maintenance`** - Full validation, rule generation, wisdom capture
2. **`/end-session`** - Quick commit, light checks, wisdom prompts
3. **`/deploy`** - Deploy workflow with validation check
4. **`/sync`** - Submodule sync and diff checking

**Wisdom capture happens automatically** during maintenance and session-end workflows.
**Validators run on demand** via npm scripts.

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

## Step 3: Integrate into Existing Commands

### Option A: Update `/maintenance` Command

**File:** `.cursor/commands/maintenance.md`

**Add these sections to your existing maintenance workflow:**

```markdown
## Step 1.5: Sync Quality + Wisdom Tools

### Pull Latest Desloppify
```bash
# Pull latest validators and wisdom
git submodule update --remote desloppify

# Show what changed
cd desloppify
echo "📦 Desloppify Updates:"
git log -3 --oneline

# Check for new wisdom
echo ""
echo "🧠 New Wisdom:"
git diff HEAD@{1} HEAD --stat wisdom/

cd ..
```

### Run Validators (if configured)
```bash
# Run core validators
npm run lint:styles
npm run validate:cursor-rules

# Run bug detectors
npm run desloppify:bugs
```

### Wisdom Capture Prompts

**Ask user:**
- Did you fix any tricky bugs this session?
- Did you discover any new patterns worth documenting?
- Any gotchas that took > 30 minutes to solve?

**If yes:**
- Ask which category: Debug Clues / Insights / Patterns
- Draft the wisdom entry
- Commit to `desloppify/wisdom/` subdirectory
- Push to desloppify repo

**Categories:**
- **Debug Clues** (`wisdom/debug/`) - Symptom-based checklist for common issues
- **Insights** (`wisdom/insights/`) - Problem-solving patterns and architecture decisions
- **Patterns** (`wisdom/patterns/`) - Copy-paste ready code that works across projects
```

### Option B: Update `/end-session` Command

**File:** `.cursor/commands/session-end.md`

**Add these sections:**

```markdown
## Step 2.5: Sync Desloppify

### Pull Latest
```bash
git submodule update --remote desloppify
cd desloppify && git log -3 --oneline && cd ..
```

### Quick Wisdom Check

**Ask user:**
- Fix any bugs worth documenting?
- Discover useful patterns?

**If yes:** Brief capture (detailed capture happens in `/maintenance`)
```

### Option C: Create `/sync` Command

**File:** `.cursor/commands/sync.md`

```markdown
# Sync Desloppify

**Purpose:** Pull latest validators and wisdom from desloppify.

---

## Workflow

### Step 1: Pull Latest
```bash
cd your-project-root
git submodule update --remote desloppify
cd desloppify
git log -5 --oneline --decorate
cd ..
```

### Step 2: Show What Changed
```bash
# Show new wisdom
echo "🧠 New Debug Clues:"
git diff HEAD@{1} HEAD --stat desloppify/wisdom/debug/

echo "💡 New Insights:"
git diff HEAD@{1} HEAD --stat desloppify/wisdom/insights/

echo "📦 New Patterns:"
git diff HEAD@{1} HEAD --stat desloppify/wisdom/patterns/

# Show validator updates
echo "🔧 Validator Updates:"
git diff HEAD@{1} HEAD --stat desloppify/scripts/
```

### Step 3: Check for Local Changes
```bash
cd desloppify
if [[ -n $(git status -s) ]]; then
  echo "⚠️  You have uncommitted changes in desloppify:"
  git status -s
  echo "Want to push these?"
fi
cd ..
```

### Step 4: Update Parent Repo
```bash
git add desloppify
git commit -m "Sync desloppify (validators + wisdom)"
```
```

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

## Step 5: Running Validators

### Run All Validators
```bash
npm run desloppify        # Core + contracts + bug patterns
npm run desloppify:core   # Core validators only
npm run desloppify:bugs   # Bug pattern detectors only
```

### Run Individual Validators
```bash
npm run lint:styles              # No inline CSS
npm run lint:ids                 # No duplicate IDs
npm run validate:colors          # No hardcoded colors
npm run validate:cursor-rules    # Cursor rule syntax
```

### Pre-Commit Hook (Optional)
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
npm run lint:styles || exit 1
npm run validate:cursor-rules || exit 1
```

---

## Step 6: Contributing New Wisdom

### During `/maintenance` or `/end-session`

AI will prompt you:
```
Did you fix any tricky bugs this session?
```

If yes, AI will:
1. Ask about the bug (symptom, fix, why it worked)
2. Determine category (Debug / Insights / Patterns)
3. Draft the wisdom entry
4. Commit to desloppify submodule
5. Push to desloppify repo

### Manual Contribution

If you want to add wisdom outside of commands:

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
        ├── maintenance.md    (includes wisdom capture + validators)
        ├── session-end.md    (includes wisdom prompts)
        ├── sync.md           (submodule sync)
        └── deploy.md
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

### 3. Check Command Integration

**Ask user:**
- Do you have `/maintenance` or `/end-session` commands?
- Want me to add wisdom capture + validator runs?

**If yes:**
- Add desloppify sync and capture sections (see Step 3)
- Create `/sync` command if it doesn't exist

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
- **Debugging?** AI will read `desloppify/wisdom/debug/[category].md` directly
- **Designing?** AI will reference `desloppify/wisdom/insights/[topic].md`
- **Coding?** AI will copy from `desloppify/wisdom/patterns/[topic].md`
- **Fixed a bug?** Wisdom capture happens in `/maintenance` or `/end-session`
- **Pull updates?** Run `/sync`
- **Run validators?** Use `npm run desloppify` or individual scripts

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

### Commands not integrated
- Check if `.cursor/commands/maintenance.md` exists
- Add desloppify sync + wisdom capture sections manually (see Step 3)

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
3. Update command paths: `cursor-shared-wisdom/` → `desloppify/wisdom/`
4. Optionally configure validators (or ignore, wisdom still works)

**See:** [Migration Roadmap](../MERGE_WISDOM_INTO_DESLOPPIFY_ROADMAP.md) for detailed steps.

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

