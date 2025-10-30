# Changelog - Cursor Shared Wisdom

**Purpose:** Track changes to the shared wisdom structure so AI can understand what's new.

---

## How to Use This

**For AI:**
- Check this file at start of session to see what's changed
- When updating commands, reference latest structure here
- When syncing wisdom, add entry to "Unreleased" section

**For Humans:**
- Read "Recent Changes" to see what's new
- Check structure changes before updating commands
- Use as reference when things break

---

## Format

**Each entry includes:**
- **Date** - When the change happened
- **Type** - Added, Changed, Fixed, Removed, Reorganized
- **Description** - What changed and why
- **Impact** - Does this break existing commands? Need updates?

---

## [Unreleased]

_(No unreleased changes yet)_

---

## [2.0.0] - 2025-10-30

### Streamlined Command Integration (SETUP.md v2.0)

**Type:** Changed, Removed  
**Breaking:** Yes (command integration pattern changed)

**What Changed:**

Completely rewrote `SETUP.md` to reflect the new streamlined 4-command paradigm. Removed deprecated standalone commands in favor of integrated workflow.

**Old Paradigm (Deprecated):**
- Separate commands: `/debug`, `/sync-wisdom`, `/insights`
- Manual wisdom capture
- 7 total commands

**New Paradigm (Current):**
- Wisdom integrated into `/maintenance` and `/end-session`
- AI reads files directly (no special commands needed)
- 4 total commands: `/maintenance`, `/end-session`, `/deploy`, `/sync`
- Automatic wisdom capture prompts

**Changes to SETUP.md:**
- ✅ Added integration instructions for `/maintenance` and `/end-session`
- ✅ Added `/sync` command template for submodule updates
- ✅ Documented direct file access pattern (AI reads debug/insights/patterns)
- ✅ Added troubleshooting for submodule workflows
- ✅ Added paradigm comparison (old vs new)
- ✅ Added migration guide from old command system
- ❌ Removed deprecated command examples (`/debug`, `/sync-wisdom`, `/insights`)
- ❌ Removed extensive command file boilerplate

**Impact:**
- **Existing projects:** Update your `/maintenance` and `/end-session` commands to include wisdom prompts
- **New projects:** Follow new SETUP.md for simpler integration
- **AI behavior:** Can now read wisdom files directly without special commands
- **No breaking changes to data:** Old debug/insights/patterns files still work, just accessed differently

**Why This Change:**
- Reduces cognitive load (4 commands vs 7)
- Wisdom capture happens automatically (less likely to forget)
- Simpler mental model (wisdom is just files AI can read)
- Aligns with Cursor Universal System roadmap
- Better integration with project workflows

**Version bump:** Major (1.1.0 → 2.0.0) due to breaking change in integration pattern

---

## [1.1.0] - 2025-10-30

### Genius Patterns Migration

**Extracted RavenOS genius problem-solving framework into reusable insights and patterns.**

#### Added

**New Insights (4 files):**
- `insights/problem-solving-framework.md` - The 5 genius patterns (context-aware, exemptions, single source, structure+content, phases)
- `insights/debugging-framework.md` - 5-step systematic problem-solving process
- `insights/validator-design.md` - Building intelligent, context-aware validators
- `insights/system-thinking.md` - High-level design philosophy (progressive disclosure, feedback loops, make wrong things hard)

**New Patterns (1 file):**
- `patterns/smart-parser.md` - Full implementation of context-aware comment parsing (3-layer architecture, production-tested, copy-paste ready)

#### Content Highlights

**Problem-Solving Framework:**
- Pattern #1: Context-Aware Over Naive
- Pattern #2: Exemptions Over Strict Rules
- Pattern #3: Single Source of Truth Arrays
- Pattern #4: Structure AND Content Validation
- Pattern #5: Progressive Complexity (Phases)

**Smart Parser Pattern:**
- Three-layer architecture (Detection → Extraction → Validation)
- No arbitrary limits (dynamic boundary tracing)
- Handles JSDoc + compact comments
- Structure + content validation
- Used in 20+ validators (RavenOS, Desloppify)

**System Thinking:**
- Progressive disclosure (simple defaults → advanced features)
- Feedback loops (self-documenting systems)
- Make wrong things hard (constraint-based, not convention-based)
- Single source of truth (config as data)
- Explicit over implicit (no magic behavior)

#### Source

- Extracted from RavenOS `.cursor/rules/69-genius/` files
- Made project-agnostic with multi-project examples
- Production-tested patterns from real implementations
- Ready for use in any project

#### Impact

- ✅ **Non-breaking:** Additive changes only
- ✅ **Compatible:** Works with existing folder structure
- ✅ **Reusable:** All content project-agnostic
- ✅ **Actionable:** Smart parser is copy-paste ready

**Version bump:** Minor (1.0.0 → 1.1.0)

---

## [1.0.0] - 2025-10-29

### Initial Release

**Major reorganization from flat files to category folders.**

#### Added
- **Folder structure:**
  - `debug/` - Category-specific debug clues (7 files)
  - `insights/` - Problem-solving patterns (10 files)
  - `patterns/` - Copy-paste code (7 files)
  - Each folder has README.md index

- **New files:**
  - `SETUP.md` - Setup guide for new projects
  - `CHANGELOG.md` - This file
  - `debug/mobile-pwa.md` - Comprehensive mobile debugging (keyboard jank, safe areas, iOS quirks)
  - `insights/mobile.md` - Deep mobile optimization patterns
  - `patterns/mobile.md` - Mobile code patterns (viewport, gestures, PWA)

#### Changed
- **Structure:** Moved from single files to organized folders
  - `DEBUG_CLUES.md` → `debug/[category].md` (7 files)
  - `INSIGHTS.md` → `insights/[category].md` (10 files)
  - `PATTERNS.md` → `patterns/[category].md` (7 files)

- **README.md:** Updated to reflect new folder structure

#### Impact on Commands
- ✅ **BREAKING:** Commands must be updated to use new paths
- `.cursor/commands/debug.md` → Load from `debug/README.md`
- `.cursor/commands/sync-wisdom.md` → Target specific category files
- `.cursor/commands/insights.md` → Load from `insights/README.md`

**Migration:** See SETUP.md for updated command files

---

## [0.1.0] - 2025-10-29

### Initial Wisdom Files

#### Added
- `DEBUG_CLUES.md` - Single file with all debug clues
- `INSIGHTS.md` - Single file with all insights
- `PATTERNS.md` - Single file with all code patterns
- `README.md` - Project overview

**Content included:**
- State management patterns
- Firebase/Firestore gotchas
- API/Backend common issues
- Frontend/UI debugging
- Common typos and mistakes
- Authentication issues
- Promise-based modal pattern
- Centralized state pattern
- API client with auth

#### Commands Created
- `/debug` - Load debug clues
- `/debug-update` - Add new learnings (later renamed to `/sync-wisdom`)

**Source:** Extracted from RavenOS project learnings

---

## Future Changes

**Planned additions:**
- More mobile-specific patterns as projects ship
- Stripe integration gotchas (when RavenOS billing complete)
- Testing patterns (as test coverage improves)
- Deployment automation patterns
- Database migration patterns

**Structure evolution:**
- Consider splitting large category files if > 500 lines
- Add cross-references between related patterns
- Version control for breaking changes

---

## Change Types Reference

- **Added:** New files, new categories, new patterns
- **Changed:** Modified existing content, improved clarity
- **Fixed:** Corrected errors, updated stale info
- **Removed:** Deleted obsolete patterns
- **Reorganized:** Structural changes (file moves, folder changes)
- **Breaking:** Changes that require command updates

---

## Migration Guide

### From 0.1.0 → 1.0.0

**What changed:**
- File structure: Single files → Category folders
- Path references in commands need updating

**Steps:**
1. Pull latest submodule: `git submodule update --remote`
2. Update command files (see SETUP.md)
3. Test commands: `/debug`, `/sync-wisdom`, `/insights`
4. Commit changes to project

**Before:**
```
.cursor/shared-wisdom/DEBUG_CLUES.md
```

**After:**
```
.cursor/shared-wisdom/debug/README.md
.cursor/shared-wisdom/debug/firebase.md
.cursor/shared-wisdom/debug/api-backend.md
... etc
```

---

## Versioning

**Semantic versioning:** MAJOR.MINOR.PATCH

- **MAJOR:** Breaking changes (requires command updates)
- **MINOR:** New categories, new patterns (backward compatible)
- **PATCH:** Fixes, clarifications, small additions

**Current version:** 2.0.0

---

**Last Updated:** 2025-10-30  
**Maintained By:** RC (Cylon-Skin-Job)

