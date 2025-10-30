# Documentation Insights

**Category:** Insights  
**Last updated:** 2025-10-29

---

## Self-Updating Documentation

**Problem:** Docs go stale when code changes. Manual doc updates are forgotten. AI gives outdated advice.

**Solution:** Auto-generate cursor rules from code:
- Scan `routes/` → Generate API documentation
- Scan Firestore usage → Generate schema docs
- Scan middleware → Generate usage docs

**Why it works:**
- Zero manual maintenance
- Docs are ALWAYS accurate
- Changes in code automatically update AI knowledge
- Run on every maintenance check

**Source:** RavenOS  
**Scripts:** `scripts/generate-api-routes-rule.mjs`, `scripts/generate-schema-rule.mjs`  
**Output:** `.cursor/rules/06-api-routes.mdc`, `.cursor/rules/07-firestore-schema.mdc`

**Key insight:** Your AI should read generated docs, not manually written ones. Manual docs for WHY, generated docs for WHAT.

