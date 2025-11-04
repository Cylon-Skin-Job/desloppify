# Setup Failure Modes

**Last Updated:** 2025-11-04  
**Source:** Fusion Studio setup attempt (683-line validation report)

## Overview

This document captures REAL setup failures discovered when attempting to integrate desloppify into new projects. These are the gaps that prevent smooth setup and cause false validation results.

---

## Failure Mode 1: Validators Give False Results When Run Directly

**Symptom:** Validator reports "no issues" when issues actually exist

**Example (Fusion Studio):**
- Ran `lint-styles.cjs` directly from `.desloppify/scripts/core/`
- Reported "✅ No inline styles found"
- Reality: 3 inline styles actually existed in `index.html`
- Manually verified with `grep 'style=' index.html`

**Root Cause:**
Validators calculate project root using `__dirname` which is INSIDE the submodule:
```javascript
const projectRoot = path.join(__dirname, '..');
// Gives: /project/.desloppify/ ❌
// Should be: /project/ ✅
```

**Impact:** 
- 3 out of 4 validators crashed or gave false results
- User trusts validator, ships broken code
- Defeats entire purpose of validation

**Fix Applied:**
- Added safeguard in validators to detect if running standalone
- Error message: "Must run via orchestrator, not directly"
- Forces users through correct path

**Prevention:**
- Setup wizard MUST install orchestrator (scripts/docs-check.js)
- Documentation should discourage direct validator execution
- Add health check: "Are you running from project root?"

---

## Failure Mode 2: No Automated Setup Script

**Symptom:** User adds submodule but doesn't know what to copy next

**Example (Fusion Studio):**
- Added `.desloppify/` submodule ✅
- Created `desloppify-local/` folder structure ✅
- But never copied orchestrator ❌
- But never copied session templates ❌
- But never copied config files ❌
- Result: 7+ missing files, no way to run validation

**Root Cause:**
- No `setup.sh` or automated setup process
- User expected "npm install"-style automation
- Documentation lists manual steps but user didn't follow all of them

**Impact:**
- 956 lines of code written with NO validation
- No session tracking
- No way to run automated checks
- False sense of "desloppify installed"

**Fix Applied:**
- Created `setup.sh` with 3 setup levels (minimal/standard/full)
- Created `/setup-desloppify` Cursor command with AI guidance
- Setup auto-detects project type and asks smart questions

**Prevention:**
- Prominent "Quick Start" in README pointing to setup.sh
- First command after submodule: `bash desloppify/setup.sh`
- Or in Cursor: `/setup-desloppify`

---

## Failure Mode 3: Template Placeholders Left Unreplaced

**Symptom:** User copies template but doesn't replace `{{PLACEHOLDERS}}`

**Example:**
- Copied `docs-check.js.template` → `scripts/docs-check.js`
- File still contains `{{PROJECT_NAME}}`, `{{HTML_FILE}}`, etc.
- Script crashes when run: "undefined is not a function"
- User doesn't know what to replace placeholders WITH

**Root Cause:**
- Templates require manual editing
- No guidance on what values to use
- No validation that placeholders were replaced

**Impact:**
- Setup appears complete but is broken
- User wastes time debugging placeholder syntax errors
- Discourages adoption ("this is too complicated")

**Fix Applied:**
- `setup.sh` now auto-detects values and replaces placeholders
- `/setup-desloppify` command does interactive interview
- Setup validator checks for unreplaced `{{...}}` strings

**Prevention:**
- NEVER ship templates with manual placeholders
- Always auto-replace during setup
- Validate no `{{` remains in copied files

---

## Failure Mode 4: Validators Crash on Import Path Mismatches

**Symptom:** Validator crashes with "Cannot find module"

**Example (Fusion Studio):**
```bash
$ node .desloppify/scripts/core/check-async-without-await.mjs app.js
Error: Cannot find module '.desloppify/scripts/core/whitelist-manager.mjs'
```

**Root Cause:**
- Validator imports `whitelist-manager.mjs` from relative parent
- Expects: `../whitelist-manager.mjs` (at scripts root)
- Path assumes it's in `scripts/core/` but looks for file in `scripts/core/whitelist-manager.mjs`
- File is actually at `scripts/whitelist-manager.mjs`

**Impact:**
- Validator can't run at all
- User can't validate async/await usage
- No feedback on code quality

**Fix Applied:**
- Corrected import paths in all validators
- Added existence checks before importing
- Graceful error if dependency missing

**Prevention:**
- Test ALL validators standalone before shipping
- CI/CD should run validators in isolation
- Document which files depend on what

---

## Failure Mode 5: No Session Folder, No Tracking

**Symptom:** User works for hours but can't create session log

**Example (Fusion Studio):**
- 956 lines of changes made
- No `desloppify-local/ledger/sessions/` folder
- Can't run `/menu` → 4 (End Session)
- Lost context: WHY changes were made, learnings, decisions

**Root Cause:**
- Session templates exist in `.desloppify/templates/sessions/`
- But never copied to `desloppify-local/ledger/sessions/`
- User doesn't know this folder should exist

**Impact:**
- No historical record of work
- Can't track which commits passed validation
- Future debugging: "Why did we build this?"
- No captured wisdom for other projects

**Fix Applied:**
- `setup.sh` STANDARD and FULL modes copy session templates
- `/setup-desloppify` includes session setup in Phase 3

**Prevention:**
- Session folder is MANDATORY in Standard+ setup
- First session auto-created during setup
- Validation checks folder exists before allowing session end

---

## Failure Mode 6: Vanilla Projects Need Different Setup Path

**Symptom:** User has pure HTML/CSS/JS project (no npm), setup fails

**Example (Fusion Studio):**
- No `package.json` (intentional design choice)
- Setup docs assume npm exists
- Instructions say "Run `npm run docs:check`" (impossible)
- Validators are Node.js scripts (user has no way to run them)

**Root Cause:**
- Setup documentation written for npm projects
- No "vanilla mode" documentation
- Unclear how to use desloppify without npm

**Impact:**
- Vanilla projects can't use validators
- Wisdom access still works, but user confused
- Partial setup feels broken

**Fix Applied:**
- `detect-project-type.mjs` now identifies vanilla projects
- `setup.sh` defaults to MINIMAL for vanilla (wisdom only)
- Setup asks "Add package.json for npm scripts?" if vanilla detected

**Prevention:**
- Clear two-tier system:
  - Minimal: Wisdom only (no npm needed)
  - Standard+: Validators (requires npm)
- Don't assume npm exists
- Offer to create package.json if useful

---

## Failure Mode 7: No Validation That Setup Completed

**Symptom:** Setup runs but user doesn't know if it worked

**Example:**
- User runs some setup steps manually
- Forgets to copy one file
- No error message
- Silently broken until user tries to use feature

**Root Cause:**
- No final "setup health check"
- User assumes success if no errors
- Missing files only discovered on first use

**Impact:**
- False confidence in setup
- Frustration when trying to run validation: "I thought I installed this!"
- Wasted debugging time

**Fix Applied:**
- Created `setup-check.mjs` validator
- `setup.sh` runs it at end
- `/setup-desloppify` validates after each phase
- Reports: MINIMAL / PARTIAL / FULL / INCOMPLETE

**Prevention:**
- ALWAYS validate setup at end
- Show checklist of installed vs missing files
- Color-coded: ✅ Required, ✨ Optional, ❌ Missing

---

## Failure Mode 8: Hardcoded Colors Validator Looks in Wrong Place

**Symptom:** Validator crashes looking for non-existent CSS directory

**Example (Fusion Studio):**
```bash
$ node .desloppify/scripts/core/validate-hardcoded-colors.mjs style.css
Error: ENOENT: no such file or directory, scandir '.desloppify/scripts/css'
```

**Root Cause:**
- Validator hardcodes path: `.desloppify/scripts/css/`
- This directory doesn't exist (and shouldn't)
- Validator should scan project CSS files, not desloppify internals

**Impact:**
- Can't validate hardcoded colors
- 120 violations went undetected in Fusion Studio

**Fix Applied:**
- Fixed hardcoded path to use project root
- Scan CSS files passed as arguments
- Fallback to auto-detect `css/` or `style.css` if no args

**Prevention:**
- Never hardcode paths to desloppify internals
- All validators should accept file/folder args
- Test validators with minimal valid input

---

## Key Learnings

### What Went Wrong (Summary)
1. **Path calculations broken** when validators run standalone
2. **No automated setup** - user expected "install" button
3. **Manual placeholders** - confusing and error-prone
4. **Import path mismatches** - validators crash on dependencies
5. **Missing session tracking** - lost 956 lines of context
6. **No vanilla project support** - assumes npm exists
7. **No setup validation** - silent failures
8. **Hardcoded internal paths** - validators look in wrong folders

### What Worked
- ✅ Submodule installation (user got this right)
- ✅ Folder structure creation (partial)
- ✅ Project detection logic (existed, just not used)
- ✅ Setup templates (existed, just not copied correctly)

### The Fix (Implemented)
1. **Smart setup wizard** - `/setup-desloppify` command
2. **Auto-detection** - detects project type, asks smart questions
3. **Auto-placeholder replacement** - no manual editing
4. **Setup validation** - health check at end
5. **Vanilla mode** - wisdom-only setup for non-npm projects
6. **Validator safeguards** - error if run without orchestrator
7. **Session auto-setup** - copies templates in Standard+
8. **Path fixes** - all validators use correct project root

---

## How to Prevent This in Future Projects

### For AI During Setup
1. **Always run detection first:** `node desloppify/scripts/detect-project-type.mjs`
2. **Ask about setup level:** Minimal / Standard / Full
3. **Auto-replace placeholders:** Never leave `{{...}}` in files
4. **Validate at end:** Run `setup-check.mjs` and report results
5. **Create first session:** Document setup as session 0

### For Users
1. **Don't run validators directly:** Use orchestrator only
2. **Use setup wizard:** `/setup-desloppify` or `bash desloppify/setup.sh`
3. **Check setup health:** `node desloppify/scripts/setup-check.mjs`
4. **Read setup report:** Verify ✅ Required files all present

### For Desloppify Maintainers
1. **Test standalone validator execution** - should error gracefully
2. **Validate all import paths** - check dependencies exist
3. **Ship working setup.sh** - fully automated, no manual steps
4. **Document vanilla mode** - not everyone has npm
5. **Add CI tests** - run setup in fresh repo, verify health check passes

---

## Related Wisdom

- `insights/validator-design.md` - How to build validators that work standalone
- `debug/typos-mistakes.md` - Common path and import errors
- `patterns/smart-parser.md` - Context-aware file scanning

---

**Bottom Line:** Setup is the FIRST user experience with desloppify. If setup is broken, user never sees the value. These 8 failure modes are now fixed, documented, and tested. - What Goes Wrong When Desloppify Setup Is Incomplete

**Category:** Insights  
**Source:** Fusion Studio setup attempt (2025-11-02)  
**Problem:** Partial desloppify setup causes validator false positives/negatives

---

## The Problem

When desloppify is added as a submodule but setup is incomplete, validators give **unreliable results**:

- 3 out of 4 validators crashed or gave false results when run directly
- One validator reported "no issues" when 3 violations actually existed  
- Path calculations wrong (scanned `.desloppify/` instead of project root)
- Import errors (`whitelist-manager.mjs` not found)

**Root cause:** Validators designed to run FROM project root THROUGH orchestrator, not standalone from inside `.desloppify/` submodule.

---

## What Happened in Fusion Studio

### Setup Steps Completed ✅
1. Added desloppify as submodule
2. Created `desloppify-local/` folder structure

### Setup Steps Skipped ❌
1. Didn't copy orchestrator (`scripts/docs-check.js`)
2. Didn't copy config (`desloppify-local/scripts/docs-check.config.json`)
3. Didn't copy session templates
4. Never ran initial validation

### Result
- Cannot run automated validation (no orchestrator)
- Validators crash when run directly (path context wrong)
- **False negative:** `lint-styles.cjs` said "no inline styles" when 3 existed
- **Crash:** `validate-hardcoded-colors.mjs` looked for non-existent CSS directory
- **Crash:** `check-async-without-await.mjs` import path error

**956 lines of work undocumented** (no session tracking)

---

## Why Validators Failed

### Path Context is Everything

Validators calculate project root as:

```javascript
const projectRoot = path.join(__dirname, '..');
```

When run from `.desloppify/scripts/core/`:
- `__dirname` = `/path/to/.desloppify/scripts/core`
- `projectRoot` = `/path/to/.desloppify/scripts` ❌ WRONG

Should be:
- `projectRoot` = `/path/to/project/` ✅ CORRECT

**Impact:** Validator scans wrong folder, misses violations, reports false pass.

---

### Import Path Assumptions

Validators import shared utilities with relative paths:

```javascript
import { loadWhitelist } from '../whitelist-manager.mjs';
```

When orchestrator imports validator:
```javascript
// From: /project/scripts/docs-check.js
import { lintStyles } from '../desloppify/scripts/core/lint-styles.cjs';
// Import works ✅
```

When validator runs standalone:
```javascript
// From: /project/.desloppify/scripts/core/lint-styles.cjs
import { loadWhitelist } from '../whitelist-manager.mjs';
// Looks in: /project/.desloppify/scripts/whitelist-manager.mjs ✅
```

But if validator expects `whitelist-manager.mjs` in `core/`:
```javascript
import { loadWhitelist } from './whitelist-manager.mjs';
// Looks in: /project/.desloppify/scripts/core/whitelist-manager.mjs ❌
// File not there - CRASH
```

**Impact:** Validators can't run without orchestrator context.

---

## The 5 Setup Gaps Discovered

### Gap 1: No Automated Setup Script
**Current:** User must manually copy 7+ files from templates  
**Better:** `npm run desloppify:init` or `bash .desloppify/setup.sh`

**Why it failed:** No automation = steps get skipped

---

### Gap 2: No Setup Validation
**Current:** No way to check if setup is complete  
**Better:** `node scripts/setup-check.js` verifies all files exist

**Why it failed:** User thought setup was done (submodule added), didn't realize files missing

---

### Gap 3: Vanilla Project Support Unclear
**Current:** All docs assume npm/package.json exists  
**Better:** Document "vanilla mode" setup path for pure HTML/CSS/JS projects

**Why it failed:** Fusion Studio is vanilla (no package.json), docs didn't cover this case

---

### Gap 4: Validators Can't Run Standalone
**Current:** 3 out of 4 validators crash or give false results when run directly  
**Better:** Validators should detect if running standalone and error gracefully with "must run via orchestrator"

**Why it failed:** User tried to validate manually, got false results, lost trust in system

---

### Gap 5: No Post-Setup First Run
**Current:** User sets up, but never validates it worked  
**Better:** Auto-run `docs:check` after setup completes to verify

**Why it failed:** Setup looked complete (folders existed), but orchestrator was missing

---

## Lessons Learned

### 1. **Setup != Submodule Add**

Adding desloppify as submodule is **step 1 of 7**, not complete setup.

**Minimum viable setup:**
1. Add submodule
2. Copy menu command
3. (Optional) Copy orchestrator + config

Without step 2, can't even access `/menu`.

---

### 2. **Validators Need Orchestrator Context**

Validators are libraries, not standalone tools. They need:
- Correct `projectRoot` passed in
- Whitelist paths configured
- Imports resolved from project root

**Never run validators directly from inside `.desloppify/` folder.**

---

### 3. **False Negatives Are Worse Than Crashes**

When `lint-styles.cjs` said "no issues" but 3 violations existed, that's **worse** than crashing:
- User thinks code is clean ❌
- Violations go undetected ❌
- Trust in system lost ❌

**Better to crash loudly** with "must run via orchestrator" than silently scan wrong folder.

---

### 4. **Vanilla Projects Need Different Setup Path**

Pure HTML/CSS/JS projects (no npm) need:
- Different folder structure
- No package.json scripts
- Manual validator invocation
- Simpler setup docs

**Desloppify assumed npm everywhere.** This is wrong.

---

### 5. **Setup Checklist Should Be Automated**

Interactive setup wizard should:
1. Detect project type (vanilla vs npm vs framework)
2. Ask clarifying questions
3. Copy only relevant templates
4. Run first validation
5. Confirm setup complete

**Manual setup = human error.**

---

## The Fix

### Short Term (Immediate)

**Add to validators:**
```javascript
// Detect if running standalone (wrong context)
if (path.basename(path.dirname(__dirname)) === '.desloppify') {
  console.error('❌ Error: This validator must run via orchestrator');
  console.error('   Run: npm run docs:check');
  console.error('   Or: node scripts/docs-check.js');
  process.exit(1);
}
```

**Add setup checker:**
```bash
node desloppify/scripts/setup-check.mjs
# Validates all required files exist
# Exit code 1 if incomplete
```

---

### Long Term (Smart Setup)

**Build automated setup wizard:**
1. Detect project type (scan package.json, folders)
2. Interactive questions (Express? Firebase? Validators?)
3. Copy relevant templates only
4. Replace placeholders automatically
5. Run setup-check to verify
6. Run first validation
7. Generate setup report

**AI integration:**
- `/setup-desloppify` cursor command
- Uses TODO tool to track setup steps
- Marks each step complete as it runs
- Final report shows what was installed

---

## Decision Tree (What to Install)

### Vanilla Project (No npm)
**Install:**
- ✅ Submodule
- ✅ Menu command
- ✅ Session templates (optional)
- ❌ Orchestrator (can't use npm scripts)
- ❌ Validators (no automation without npm)

**Result:** Wisdom access only

---

### npm Project (Has package.json)
**Install:**
- ✅ Submodule
- ✅ Menu command
- ✅ Orchestrator (`scripts/docs-check.js`)
- ✅ Config (`desloppify-local/scripts/docs-check.config.json`)
- ✅ Session templates
- ✅ Validators (via npm scripts)

**If Express detected:** Also install API route generator  
**If Firebase detected:** Also install schema generator  
**If scripts/ exists:** Also install scripts inventory generator

**Result:** Full automated validation + wisdom

---

## Validation Workflow

### Right Way ✅
```bash
# From project root
npm run docs:check

# Or manually
node scripts/docs-check.js

# Orchestrator:
# 1. Sets correct projectRoot
# 2. Imports validators as libraries
# 3. Passes config to each validator
# 4. Validators run with correct context
```

### Wrong Way ❌
```bash
# From inside .desloppify/ folder
node scripts/core/lint-styles.cjs

# Validator:
# 1. Calculates projectRoot wrong (__dirname/..)
# 2. Scans .desloppify/ instead of project
# 3. Reports false results
```

---

## How to Diagnose Incomplete Setup

### Symptoms
- Validators crash with import errors
- Validators report "no issues" when issues exist
- Can't run `npm run docs:check` (script not found)
- No session tracking
- 956 lines of changes with no documentation

### Quick Check
```bash
# Run setup checker
node desloppify/scripts/setup-check.mjs

# Should report:
# ✅ Setup is VALID
# or
# ❌ Setup is INCOMPLETE (with list of missing files)
```

### Fix
1. Run setup wizard (when built)
2. Or manually copy missing templates
3. Run setup-check again
4. Run first validation to verify

---

## Related Wisdom

- **problem-solving-framework.md** - Context-Aware Problem Solving
- **validator-design.md** - How validators should handle edge cases
- **debugging-framework.md** - Systematic debugging when things fail

---

## Status

**Problem:** Identified via real-world setup failure  
**Fix:** In progress (building automated setup)  
**Priority:** High (blocks new project adoption)

---

**TL;DR:** Desloppify setup is more than adding submodule. Without orchestrator, validators give false results. Need automated setup wizard + vanilla project support + standalone validator safeguards.

