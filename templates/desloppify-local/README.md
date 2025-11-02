# desloppify-local

**Purpose:** Project-specific code that stays in your project (not synced to desloppify main)

---

## What Goes Here vs desloppify/

### desloppify/ (Universal - Submodule)
✅ Validators that work for any project  
✅ Accumulated wisdom (debug clues, insights, patterns)  
✅ Cursor rule templates  
✅ Shared across all your projects

### desloppify-local/ (Project-Specific - Git Tracked)
✅ Generators for YOUR project (API routes, schema, middleware)  
✅ Custom validators for YOUR project (TODO contracts, state management)  
✅ Deployment playbooks for YOUR infrastructure  
✅ Session ledger for YOUR work log  
✅ Configuration specific to YOUR tech stack

**Rule of thumb:** If it benefits other projects, put it in `desloppify/`. If it's specific to this project, put it in `desloppify-local/`.

---

## Folder Structure

```
desloppify-local/
├── README.md                    ← You are here
│
├── scripts/                     ← Project-specific generators and validators
│   ├── README.md
│   ├── docs-check.config.json   ← Configuration for docs-check.js
│   │
│   ├── generate-*.mjs           ← Your generators (API routes, schema, etc.)
│   └── validate-*.mjs           ← Your custom validators
│
├── ledger/                      ← Project history and changelog
│   ├── CHANGELOG.md             ← Deployment history
│   └── sessions/                ← Work session logs
│       ├── README.md
│       ├── INDEX.md
│       ├── TEMPLATE.md
│       └── YYYY-MM-DD-*.md      ← Individual session files
│
├── deploy/                      ← Deployment procedures
│   ├── README.md
│   └── deploy-playbook.md       ← Step-by-step deployment guide
│
└── cursor-docs/                 ← Project-specific documentation
    ├── README.md
    └── *.md                     ← Custom guides, workflows, conventions
```

---

## Quick Start

### 1. Copy This Structure
```bash
# From your project root
cp -r desloppify/templates/desloppify-local/ ./desloppify-local/
```

### 2. Customize For Your Project
- Update `scripts/docs-check.config.json` with your paths
- Add generators based on your tech stack (see `scripts/README.md`)
- Create deployment playbook (see `deploy/README.md`)
- Start logging sessions (see `ledger/sessions/README.md`)

### 3. Add to Git
```bash
git add desloppify-local/
git commit -m "Add desloppify-local structure"
```

**Note:** Unlike `desloppify/` (submodule), `desloppify-local/` is directly tracked in your project's git history.

---

## What Each Folder Does

### `scripts/`
**Purpose:** Auto-generate cursor rules and validate project-specific patterns

**What goes here:**
- Generators that scan your codebase and create `.cursor/rules/` files
- Validators that enforce your project's specific conventions
- Configuration file (`docs-check.config.json`)

**Example generators:**
- `generate-api-routes-rule.mjs` - Scans `routes/` and creates API documentation
- `generate-schema-rule.mjs` - Scans Firestore usage and documents schema
- `generate-middleware-rule.mjs` - Documents Express middleware

**Example validators:**
- `validate-todo-contract.mjs` - Checks TODO.md ↔ code linkage
- `validate-state-management.mjs` - Enforces centralized state rules

**See:** `scripts/README.md` for details

---

### `ledger/`
**Purpose:** Track deployment history and work sessions

**What goes here:**
- `CHANGELOG.md` - Deployment log (when, what, where)
- `sessions/` - Work session summaries

**Why it's useful:**
- Git shows WHAT changed, ledger shows WHY
- Track which deployments passed validation
- Personal memory aid across sessions
- Future AI can read your intent and learnings

**See:** `ledger/sessions/README.md` for session tracking workflow

---

### `deploy/`
**Purpose:** Step-by-step deployment procedures

**What goes here:**
- `deploy-playbook.md` - Your deployment checklist
- Environment-specific configs (if needed)

**Why it's useful:**
- AI can walk you through deployment via `/menu` → 3
- Ensures consistency across deploys
- Captures tribal knowledge
- Easy onboarding for new team members

**See:** `deploy/README.md` for playbook template

---

### `cursor-docs/`
**Purpose:** Project-specific documentation that doesn't fit in cursor rules

**What goes here:**
- Workflows unique to your project
- Team conventions
- Design decisions
- Integration guides
- Anything too detailed for cursor rules but important for context

**Why separate from `docs/`?**
- `docs/` - User-facing documentation, architecture, API reference
- `cursor-docs/` - AI-facing documentation, coding patterns, conventions

**See:** `cursor-docs/README.md` for organization guide

---

## Typical Workflow

### Initial Setup (Once)
1. Copy `desloppify-local/` structure
2. Configure `scripts/docs-check.config.json`
3. Add generators for your tech stack
4. Create deployment playbook

### During Development
1. Work on features
2. `/menu` → 1 (Full Maintenance) - Auto-generates rules, runs validators
3. Wisdom capture (if you fixed bugs or created patterns)

### End of Session
1. `/menu` → 4 (End Session) - Quick commit + session summary
2. Session file captures: Goal, Completed, Learned, Next
3. Validation status recorded

### Before Deployment
1. `/menu` → 1 (Full Maintenance) - Full validation
2. `/menu` → 3 (Deploy Workflow) - Follow playbook
3. Update `ledger/CHANGELOG.md` with deployment details

---

## Syncing With desloppify

**When desloppify updates:**
```bash
/menu → 2 (Sync Desloppify)
```

This:
- Pulls latest wisdom and validators from desloppify main
- Shows what changed
- Optionally pushes your local wisdom contributions

**Your `desloppify-local/` is independent** - desloppify updates don't affect it.

---

## Adding New Generators

1. **Create generator script:**
```javascript
// desloppify-local/scripts/generate-my-rule.mjs
export async function generateMyRule() {
  // Scan codebase
  // Generate .cursor/rules/XX-my-rule.mdc
  console.log('✅ Generated: .cursor/rules/XX-my-rule.mdc');
}
```

2. **Import in `scripts/docs-check.js`:**
```javascript
import { generateMyRule } from '../desloppify-local/scripts/generate-my-rule.mjs';
```

3. **Call in docs-check:**
```javascript
await generateMyRule();
```

4. **Test:**
```bash
npm run docs:check
```

**See:** `scripts/README.md` for detailed generator guide

---

## Adding New Validators

1. **Create validator script:**
```javascript
// desloppify-local/scripts/validate-my-feature.mjs
export async function validateMyFeature(options) {
  const issues = [];
  // Your validation logic
  return issues;
}
```

2. **Add to `scripts/docs-check.js`:**
```javascript
import { validateMyFeature } from '../desloppify-local/scripts/validate-my-feature.mjs';

async function checkMyFeature() {
  const results = { passed: true, messages: [] };
  try {
    const issues = await validateMyFeature({ projectRoot: repoRoot, quiet: true });
    if (issues.length > 0) {
      results.passed = false;
      results.messages = issues;
    }
  } catch (err) {
    results.passed = false;
    results.messages.push(`My feature check error: ${err.message}`);
  }
  return results;
}

// Add to checks pipeline
['My custom feature', checkMyFeature],
```

3. **Test:**
```bash
npm run docs:check
```

**See:** `scripts/README.md` for detailed validator guide

---

## When to Add vs Promote

### Add to desloppify-local When:
- Generator is specific to YOUR project structure
- Validator enforces YOUR project's conventions
- Documentation is unique to YOUR workflow
- Configuration is tied to YOUR tech stack

### Promote to desloppify When:
- Generator works for ANY Express project
- Validator catches universal bugs
- Wisdom applies to many projects
- Pattern is battle-tested and reusable

**How to promote:**
1. Test locally in `desloppify-local/`
2. Generalize (remove project-specific assumptions)
3. Move to `desloppify/scripts/modules/`
4. Commit to desloppify main
5. Update `desloppify-local/` to import from `desloppify/`

---

## Troubleshooting

**"Module not found" error:**
- Check import paths in `scripts/docs-check.js`
- Verify file exists in `desloppify-local/scripts/`
- Ensure `.mjs` extension

**"Config not found" error:**
- Create `desloppify-local/scripts/docs-check.config.json`
- Or docs-check will use defaults

**Generators not running:**
- Check they're imported in `scripts/docs-check.js`
- Check they're called in the generator section
- Run with `npm run docs:check` to see errors

**Sessions not updating:**
- Check `ledger/sessions/` exists
- Verify `TEMPLATE.md` is present
- Run `/menu` → 4 (End Session) to create new session

---

**Version:** 3.0  
**Last Updated:** 2025-11-02  
**See:** SETUP.md for initial setup workflow

