# Menu - Unified Desloppify Interface

**Aliases:** `/menu`, `/m`

**Purpose:** Single command interface for all maintenance, deployment, wisdom, and project management tasks.

---

## What This Does

Provides interactive menu for:
- Validation and maintenance
- Deployment workflows
- Session management
- Wisdom search and access
- Project documentation

**Key Concept:** Universal code (desloppify submodule) vs project-specific files (desloppify-local folder).

---

## Usage

```
User: /menu

AI presents interactive menu with 8 options
```

---

## Menu Structure

When user types `/menu`, present this:

```
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

---

## Implementation Details

### Option 1: Full Maintenance

**Purpose:** Complete validation + wisdom capture workflow

**Steps:**

1. **Sync desloppify first:**
   ```bash
   git submodule update --remote desloppify
   cd desloppify && git log -3 --oneline && cd ..
   ```
   - Show what changed (wisdom + validators)
   - Check for new wisdom: `git diff HEAD@{1} HEAD --stat desloppify/wisdom/`

2. **Run full validation:**
   ```bash
   npm run docs:check
   ```
   - Runs all validators in `scripts/docs-check.js`
   - Auto-generates cursor rules from code
   - Shows pass/fail for each validator

3. **Wisdom capture prompts:**
   - "Did you fix any tricky bugs worth documenting?"
   - "Did you create any reusable patterns worth sharing?"
   - If yes, guide user to add to `desloppify/wisdom/`

4. **Check for drift:**
   - Compare `desloppify-local/` vs templates (future: when templates exist)
   - Suggest universal improvements to push to desloppify main

5. **Update session:**
   - Prompt for session file update
   - Update validation status in latest session file

6. **Documentation Intelligence (NEW):**
   - **Scan for new patterns:**
     ```
     📚 Documentation Review
     
     Files changed this session: [from git diff]
     
     Do any changes warrant new documentation?
     - New coding pattern? → Consider cursor rule
     - New workflow? → Consider desloppify-local doc
     - Bug fix? → Consider desloppify/wisdom entry
     - Architecture change? → Update docs/
     
     Use decision tree: desloppify-local/cursor-docs/RULES_VS_DOCS_GUIDE.md
     ```
   
   - **Scan existing docs for updates:**
     ```bash
     # Find docs related to changed code
     git diff --name-only HEAD~1 | grep -E "\.(js|mjs|css|html)"
     
     # Search for related docs
     grep -r "keyword" .cursor/rules/
     grep -r "keyword" desloppify-local/cursor-docs/
     grep -r "keyword" docs/
     ```
   
   - **Prompt user:**
     ```
     Should I:
     1. Create new rule/doc? (y/n)
     2. Update existing docs? (y/n)
     3. No changes needed (skip)
     
     If yes: Use RULES_VS_DOCS_GUIDE.md decision tree
     ```
   
   - **Auto-scan questions:**
     - "Does this code introduce a new pattern?"
     - "Did we change an existing pattern?"
     - "Are there inconsistencies in docs now?"
     - "Should this be shared universally (desloppify) or kept local?"

**If all pass:**
```
✅ Maintenance complete!
   - Desloppify synced (validators + wisdom up to date)
   - Cursor rules auto-generated from code
   - All validators passed
   - Session ledger updated

Ready to commit or continue working.
```

**If failures:**
```
❌ Maintenance found issues:

[List failures with fix suggestions]

Fix these before deploying.
```

---

### Option 2: Sync Desloppify

**Purpose:** Pull latest from desloppify submodule, show what's new

**Steps:**

1. **Pull latest:**
   ```bash
   git submodule update --remote desloppify
   cd desloppify && git log -5 --oneline --decorate && cd ..
   ```

2. **Show what changed:**
   Parse commit log and separate:
   - **Wisdom updates:** Changes in `desloppify/wisdom/`
   - **Validator updates:** Changes in `desloppify/scripts/`
   - **Template updates:** Changes in `desloppify/templates/`

   Example output:
   ```
   🔄 Desloppify Updates
   
   📦 5 new commits pulled
   
   🧠 Wisdom:
     - Added: Firebase auth debug clues (3 new)
     - Updated: Smart-parser pattern (multi-line support)
     - New insight: Progressive validation
   
   🛠️  Validators:
     - New: async race condition detector
     - Updated: responsive annotation validator
   
   📊 Summary:
     - 3 wisdom files updated
     - 2 validators added/updated
   ```

3. **Check for local changes in desloppify:**
   ```bash
   cd desloppify && git status && git log origin/main..HEAD
   ```

4. **If unpushed changes exist:**
   ```
   ⚠️  Local Changes Found
   
   📦 desloppify:
     🔴 1 unpushed commit:
        - Added RavenOS TTS streaming debug clue
     
     Should I push this to desloppify? (y/n)
   ```

5. **If user says yes:**
   ```bash
   cd desloppify && git push origin main && cd ..
   ```
   ```
   ✅ Pushed to desloppify main
   ✅ Other projects can now benefit!
   ```

6. **Update submodule reference in parent:**
   ```bash
   git add desloppify && git status
   ```
   Show diff, offer to commit:
   ```
   📝 Submodule Reference Updated
   
     desloppify: abc123f → def456g (5 commits ahead)
   
   Should I commit this submodule update? (yes/no)
   ```

**If yes:**
```bash
git commit -m "Update desloppify submodule

- Pulled 5 new commits
- Wisdom: Firebase auth clues, progressive validation
- Validators: Async race detector, responsive updates"
```

---

### Option 3: Deploy Workflow

**Purpose:** Execute deployment from playbook with pre-deploy checks

**Steps:**

1. **Prompt for docs-check:**
   ```
   🚀 Deploy Workflow
   
   Run docs-check before deploying? (y/n)
   ```

2. **If yes, run validation:**
   ```bash
   npm run docs:check
   ```
   - If failures: STOP, show errors, don't deploy
   - If pass: Continue to deployment

3. **If no or pass, read playbook:**
   ```
   Reading deploy playbook from desloppify-local/deploy/deploy-playbook.md...
   ```

4. **Parse and execute playbook:**
   - Read `desloppify-local/deploy/deploy-playbook.md`
   - Parse into steps (look for numbered lists, code blocks)
   - Present step-by-step:
   
   ```
   📋 Deploy Steps from Playbook:
   
   Step 1: Run pre-deploy checks
   Step 2: Build backend
   Step 3: Deploy to Cloud Run
   Step 4: Deploy frontend to Hosting
   Step 5: Test deployment
   
   Execute all steps? (yes/no/step-by-step)
   ```

5. **If step-by-step:**
   - Execute each step individually
   - Wait for confirmation before next
   - Show output after each

6. **If yes (all at once):**
   - Execute full sequence
   - Show consolidated output

7. **Log deployment:**
   - Append to `desloppify-local/ledger/CHANGELOG.md`
   - Note: deployed at [timestamp], commit hash, environment

---

### Option 4: End Session

**Purpose:** Quick commit + session summary without full validation

**Steps:**

1. **Git status check:**
   ```bash
   git status
   ```
   Show changed files

2. **Quick validation (optional):**
   - Run fast checks only (no full maintenance)
   - CSS linter, TODO validator (quick ones)

3. **Prompt for session summary:**
   ```
   📝 Session Summary
   
   Generate session file for today? (y/n)
   
   If no file exists for today:
   - Create from template: desloppify-local/ledger/sessions/TEMPLATE.md
   - Filename: YYYY-MM-DD-timeofday.md
   ```

4. **If yes, create/update session file:**
   - Use template from `desloppify-local/ledger/sessions/TEMPLATE.md`
   - Prompt for:
     - Goal (what did you set out to do?)
     - Completed (what shipped?)
     - Learned (insights, gotchas)
     - Next (unfinished work)

5. **Commit session:**
   ```bash
   git add desloppify-local/ledger/sessions/
   git commit -m "Session: [date] - [brief summary]"
   ```

6. **Wisdom prompts (light):**
   - "Any bugs worth documenting?"
   - "Any patterns to share?"
   - Don't force, just offer

7. **Quick documentation scan (NEW):**
   - **Light check (faster than full maintenance):**
     ```
     📚 Quick Doc Check
     
     Changed files: [list from git]
     
     Quick questions:
     - Did you introduce a new pattern? → Note for next maintenance
     - Did you fix a notable bug? → Consider wisdom entry
     - Did existing docs become outdated? → Flag for update
     
     Full doc review available in /menu → 1 (Full Maintenance)
     ```
   
   - **If something needs immediate attention:**
     ```
     ⚠️ Docs may need update:
     - [file.js] introduced new validation pattern
     - [api.md] might be outdated after route changes
     
     Address now (y) or flag for next maintenance (n)?
     ```

8. **Done:**
   ```
   ✅ Session ended
      - Changes committed
      - Session file created: desloppify-local/ledger/sessions/[date].md
      - Maintenance status: ⚠️ Not Run (use /menu → 1 for full validation)
   
   See you next time! 🏄‍♂️
   ```

---

### Option 5: Search Wisdom

**Purpose:** Find debug clues, insights, patterns in desloppify/wisdom/

**Steps:**

1. **Prompt for search:**
   ```
   🧠 Wisdom Search
   
   What are you looking for?
   Examples:
   - "Firebase auth issues"
   - "TTS streaming"
   - "State management patterns"
   
   Or browse categories:
   1. Debug clues (desloppify/wisdom/debug/)
   2. Insights (desloppify/wisdom/insights/)
   3. Patterns (desloppify/wisdom/patterns/)
   
   Search or browse? (search/1/2/3)
   ```

2. **If search:**
   ```bash
   cd desloppify/wisdom && grep -ri "search term" . && cd ../..
   ```
   Show results with file paths and context

3. **If browse:**
   ```bash
   ls -la desloppify/wisdom/[category]/
   ```
   List available files, let user pick

4. **Display file:**
   ```bash
   cat desloppify/wisdom/[category]/[file].md
   ```
   Show full file contents

5. **Offer actions:**
   ```
   Found what you need? (y/n)
   
   If no:
   - Try different search?
   - Add new wisdom entry?
   ```

---

### Option 6: View Project Docs

**Purpose:** Browse project-specific documentation in desloppify-local/cursor-docs/

**Steps:**

1. **List available docs:**
   ```bash
   ls -la desloppify-local/cursor-docs/
   ```

2. **If empty:**
   ```
   📚 Project Docs
   
   No custom docs yet!
   
   This folder is for project-specific conventions, workflows, or guides that aren't universal enough for desloppify main.
   
   Examples:
   - GitHub workflow for this project
   - Team conventions
   - Project-specific patterns
   
   Want to create a doc? (y/n)
   ```

3. **If docs exist:**
   Show list, let user pick, display with `cat`

4. **Offer to edit:**
   ```
   Edit this doc? (y/n)
   ```

---

### Option 7: View Sessions

**Purpose:** Browse session ledger

**Steps:**

1. **Show recent sessions:**
   ```bash
   ls -lt desloppify-local/ledger/sessions/ | head -10
   ```

2. **Display options:**
   ```
   📖 Session Ledger
   
   Recent sessions:
   1. 2025-10-30-evening.md
   2. 2025-10-29-afternoon.md
   3. [older sessions...]
   
   Actions:
   - View session (enter number)
   - Search sessions (grep)
   - View INDEX (summary)
   - Back to menu
   
   What would you like to do?
   ```

3. **If view:**
   Display selected session file

4. **If search:**
   ```
   Search for: _______
   ```
   ```bash
   grep -r "search term" desloppify-local/ledger/sessions/
   ```

5. **If INDEX:**
   ```bash
   cat desloppify-local/ledger/sessions/INDEX.md
   ```

---

### Option 8: Quick Status

**Purpose:** Fast overview of project state

**Steps:**

1. **Git status:**
   ```bash
   git status --short
   ```

2. **Submodule status:**
   ```bash
   git submodule status
   ```
   Show if desloppify is up-to-date or needs sync

3. **Latest session:**
   ```bash
   ls -t desloppify-local/ledger/sessions/*.md | head -1 | xargs head -20
   ```
   Show most recent session summary

4. **Last validation:**
   Check last session file for "Maintenance: ✅ Passed" or "⚠️ Not Run"

5. **Summary:**
   ```
   ⚡ Quick Status
   
   📂 Git:
      M  5 files changed
      ?? 2 untracked files
   
   📦 Desloppify:
      ✅ Up to date (v3.0.0)
   
   📝 Last Session:
      2025-10-30-evening.md
      Goal: Merge wisdom into desloppify
      Status: Complete
   
   🔍 Last Validation:
      ⚠️ Not Run (run /menu → 1 for full check)
   
   💡 Tip: Run maintenance before deploying!
   ```

---

## Menu Navigation

**After any option completes:**

```
Return to menu? (y/n)

If yes: Show menu again
If no: Exit gracefully
```

---

## Path References

**Universal (desloppify submodule):**
- Wisdom: `desloppify/wisdom/`
- Validators: `desloppify/scripts/`
- Templates: `desloppify/templates/`

**Project-specific (desloppify-local):**
- Deploy: `desloppify-local/deploy/deploy-playbook.md`
- Sessions: `desloppify-local/ledger/sessions/`
- Changelog: `desloppify-local/ledger/CHANGELOG.md`
- Docs: `desloppify-local/cursor-docs/`
- Config: `desloppify-local/config/`

---

## Special Behaviors

### First-Time Detection

Check if `desloppify-local/ledger/CHANGELOG.md` exists:
- If yes: Normal menu
- If no: First-time setup flow (future implementation)

### Deploy Safety

Before any deploy/push operation:
- Offer to run `npm run docs:check`
- Wait for confirmation: "Run docs-check first? (y/n)"
- If validation fails: STOP, don't proceed

### Wisdom Contribution

When user adds/modifies files in `desloppify/wisdom/`:
- Prompt: "Should this be pushed to desloppify main?"
- If yes: Help commit + push to submodule
- Remind: "Other projects will benefit!"

### Session Ledger Updates

When maintenance runs:
- Find latest session file
- Update "Maintenance:" status line
- Show: ✅ Passed, ❌ Failed, or ⚠️ Not Run

---

## Related Files

- Deploy playbook: `desloppify-local/deploy/deploy-playbook.md`
- Session template: `desloppify-local/ledger/sessions/TEMPLATE.md`
- Session README: `desloppify-local/ledger/sessions/README.md`
- Wisdom debug clues: `desloppify/wisdom/debug/`
- Wisdom insights: `desloppify/wisdom/insights/`
- Wisdom patterns: `desloppify/wisdom/patterns/`

---

## Philosophy

**One menu. Everything accessible. Universal vs project-specific is crystal clear.**

- Universal code → Push to desloppify (benefits all projects)
- Project code → Keep in desloppify-local (specific to this project)
- No more hunting for commands
- No more duplicated docs
- One source of truth

---

**TL;DR:** Type `/menu`, pick a number (1-8), AI handles the rest. Deploy playbooks, session ledgers, and project docs in desloppify-local. Universal validators and wisdom in desloppify submodule.

