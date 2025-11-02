# desloppify-local/deploy

**Purpose:** Step-by-step deployment procedures for your project

---

## What Goes Here

- `deploy-playbook.md` - Your deployment checklist
- Environment-specific configs (optional)
- Pre-deploy validation scripts (optional)
- Post-deploy verification scripts (optional)

---

## Quick Start

1. **Copy the template:**
```bash
cp desloppify/templates/desloppify-local/deploy/deploy-playbook.md.template desloppify-local/deploy/deploy-playbook.md
```

2. **Customize for your infrastructure:**
   - Replace `{{PLACEHOLDERS}}` with your values
   - Add/remove steps based on your deployment flow
   - Include commands specific to your hosting platform

3. **Test via `/menu`:**
```
/menu → 3 (Deploy Workflow)
```

AI will read your playbook and guide you through deployment.

---

## Deployment Playbook Structure

A good playbook has:

1. **Pre-Deploy Checks**
   - Validation passed?
   - Environment variables set?
   - Dependencies installed?

2. **Build Steps**
   - Frontend build
   - Backend build
   - Asset compilation

3. **Deploy Steps**
   - Deploy backend (Cloud Run, Railway, etc.)
   - Deploy frontend (Vercel, Netlify, Firebase Hosting, etc.)
   - Database migrations (if any)

4. **Post-Deploy Verification**
   - Health check endpoints
   - Smoke tests
   - Rollback plan

5. **Logging**
   - Update `desloppify-local/ledger/CHANGELOG.md`
   - Note: deployed commit, timestamp, environment

---

## Example Workflows

### Frontend (Vercel) + Backend (Railway)
```markdown
## Step 1: Pre-Deploy Checks
- [ ] Run `npm run docs:check` (all pass?)
- [ ] Environment: staging or production?
- [ ] Secrets configured in Railway/Vercel?

## Step 2: Backend Deploy
```bash
git push railway main
railway status
```

## Step 3: Frontend Deploy
```bash
vercel --prod
```

## Step 4: Verify
- [ ] Check https://api.myproject.com/health
- [ ] Check https://myproject.com loads
- [ ] Test critical user flow
```

### Firebase Hosting + Cloud Run
```markdown
## Step 1: Pre-Deploy Checks
- [ ] Run `npm run docs:check`
- [ ] Firebase project: dev or prod?

## Step 2: Deploy Backend
```bash
gcloud run deploy my-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

## Step 3: Deploy Frontend
```bash
firebase deploy --only hosting:production
```

## Step 4: Verify
- [ ] Check Cloud Run service URL
- [ ] Check Firebase Hosting URL
- [ ] Test API calls from frontend
```

---

## Integration with /menu

When you run `/menu` → 3 (Deploy Workflow), AI will:

1. Ask: "Run docs-check first?" (recommended: yes)
2. Read your `deploy-playbook.md`
3. Parse into numbered steps
4. Ask: "Execute all or step-by-step?"
5. Run commands, show output, wait for confirmation
6. Offer to update `ledger/CHANGELOG.md`

---

## Best Practices

1. **Keep it updated** - As deployment evolves, update playbook
2. **Include rollback** - What if deployment fails?
3. **Environment-specific** - Separate staging vs production steps
4. **Test before production** - Always deploy to staging first
5. **Log deployments** - Update CHANGELOG.md after each deploy

---

## Template Placeholders

If using the template, replace:

- `{{PROJECT_NAME}}` - Your project name
- `{{BACKEND_PLATFORM}}` - Cloud Run, Railway, AWS, etc.
- `{{FRONTEND_PLATFORM}}` - Vercel, Netlify, Firebase Hosting, etc.
- `{{BACKEND_SERVICE}}` - Service name
- `{{FRONTEND_URL}}` - Production URL
- `{{HEALTH_ENDPOINT}}` - Health check URL

---

**Version:** 3.0  
**Last Updated:** 2025-11-02

