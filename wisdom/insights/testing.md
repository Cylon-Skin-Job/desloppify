# Testing / Validation Insights

**Category:** Insights  
**Last updated:** 2025-10-29

---

## Automated Convention Enforcement

**Problem:** Manual code reviews miss convention violations. Inconsistency creeps in.

**Solution:** Scripts that enforce conventions automatically:
- No inline styles in HTML
- State management rules
- TODO.md format validation
- Cursor rule syntax validation

**Why it works:**
- Run on every commit (via `/maintenance`)
- Catches violations before they spread
- No human memory required
- Self-documenting (script shows the rule)

**Source:** RavenOS  
**Scripts:** `scripts/lint-inline-styles.mjs`, `scripts/validate-state.mjs`, `scripts/validate-todo.mjs`

**Key insight:** If you find yourself saying "remember to always X" → write a validator for X.

