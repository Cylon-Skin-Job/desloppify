# Deployment Insights

**Category:** Insights  
**Last updated:** 2025-10-29

---

## Pre-Deploy Validation Gate

**Problem:** Deploy breaks production, have to roll back, embarrassing.

**Solution:** Mandatory validation before deploy:
```bash
npm run docs:check   # Runs ALL validators
npm run validate:state
# etc...
```

**Why it works:**
- Catches issues before they hit production
- Fast feedback loop
- Forces good habits
- Documents what "ready to deploy" means

**Source:** RavenOS  
**Workflow:** `/maintenance` command runs full validation

**Future idea:** Git pre-push hook that runs validation automatically.

