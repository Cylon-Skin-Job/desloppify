# {{PROJECT_NAME}} Deployment Playbook

**Purpose:** Step-by-step guide for deploying to {{ENVIRONMENT}}

**Last Updated:** {{DATE}}

---

## 🎯 Deployment Overview

**Backend:** {{BACKEND_PLATFORM}} ({{BACKEND_SERVICE}})  
**Frontend:** {{FRONTEND_PLATFORM}}  
**Database:** {{DATABASE_PLATFORM}}  
**Environment:** {{ENVIRONMENT}}

---

## ✅ Pre-Deploy Checklist

Before deploying, verify:

- [ ] All changes committed to git
- [ ] On correct branch (`main` for production, `dev` for staging)
- [ ] Run `npm run docs:check` - all validators pass
- [ ] Environment variables configured
- [ ] Secrets up-to-date in platform
- [ ] Database migrations ready (if any)

---

## 📋 Deployment Steps

### Step 1: Run Full Validation

```bash
npm run docs:check
```

**Expected:** All checks pass  
**If failures:** Fix issues before proceeding

---

### Step 2: Build (If Needed)

**Backend:**
```bash
# {{BACKEND_BUILD_COMMAND}}
# Example: npm run build
```

**Frontend:**
```bash
# {{FRONTEND_BUILD_COMMAND}}
# Example: npm run build
```

---

### Step 3: Deploy Backend

```bash
# {{BACKEND_DEPLOY_COMMAND}}
# Example for Cloud Run:
# gcloud run deploy {{BACKEND_SERVICE}} \
#   --source . \
#   --region us-central1 \
#   --allow-unauthenticated

# Example for Railway:
# git push railway main

# Example for Vercel (API):
# vercel --prod
```

**Expected:** Deployment succeeds, service URL provided

**Verify backend:**
```bash
curl {{BACKEND_URL}}/health
# Should return: {"status": "ok"}
```

---

### Step 4: Database Migrations (If Needed)

```bash
# {{MIGRATION_COMMAND}}
# Example: npm run migrate:prod
```

**Note:** Some platforms (Firestore, MongoDB Atlas) don't require migrations

---

### Step 5: Deploy Frontend

```bash
# {{FRONTEND_DEPLOY_COMMAND}}
# Example for Vercel:
# vercel --prod

# Example for Firebase Hosting:
# firebase deploy --only hosting:production

# Example for Netlify:
# netlify deploy --prod
```

**Expected:** Deployment succeeds, frontend URL provided

---

### Step 6: Post-Deploy Verification

**Health Checks:**
- [ ] Backend health endpoint: {{BACKEND_URL}}/health
- [ ] Frontend loads: {{FRONTEND_URL}}
- [ ] API calls work from frontend

**Smoke Tests:**
- [ ] {{CRITICAL_FEATURE_1}} works
- [ ] {{CRITICAL_FEATURE_2}} works
- [ ] {{CRITICAL_FEATURE_3}} works

**If anything fails:** See "Rollback" section below

---

### Step 7: Update Changelog

```bash
# Log deployment in desloppify-local/ledger/CHANGELOG.md
echo "## $(date '+%Y-%m-%d %H:%M') - {{ENVIRONMENT}}" >> desloppify-local/ledger/CHANGELOG.md
echo "- Commit: $(git rev-parse --short HEAD)" >> desloppify-local/ledger/CHANGELOG.md
echo "- Backend: {{BACKEND_SERVICE}}" >> desloppify-local/ledger/CHANGELOG.md
echo "- Frontend: {{FRONTEND_URL}}" >> desloppify-local/ledger/CHANGELOG.md
echo "- Status: ✅ Deployed" >> desloppify-local/ledger/CHANGELOG.md
echo "" >> desloppify-local/ledger/CHANGELOG.md
```

Or update manually via `/menu` → 4 (End Session)

---

## 🔄 Rollback Plan

**If deployment fails or critical issues found:**

### Backend Rollback
```bash
# {{BACKEND_ROLLBACK_COMMAND}}
# Example for Cloud Run:
# gcloud run services update-traffic {{BACKEND_SERVICE}} \
#   --to-revisions=PREVIOUS_REVISION=100

# Example for Railway:
# Use Railway dashboard to revert to previous deployment

# Example for Vercel:
# vercel rollback
```

### Frontend Rollback
```bash
# {{FRONTEND_ROLLBACK_COMMAND}}
# Example for Vercel:
# vercel rollback

# Example for Firebase Hosting:
# firebase hosting:rollback

# Example for Netlify:
# netlify rollback
```

---

## 🔐 Environment Variables

**Required for {{ENVIRONMENT}}:**

Backend:
- `{{ENV_VAR_1}}` - {{ENV_VAR_1_DESCRIPTION}}
- `{{ENV_VAR_2}}` - {{ENV_VAR_2_DESCRIPTION}}
- `{{ENV_VAR_3}}` - {{ENV_VAR_3_DESCRIPTION}}

Frontend:
- `{{FRONTEND_ENV_VAR_1}}` - {{FRONTEND_ENV_VAR_1_DESCRIPTION}}
- `{{FRONTEND_ENV_VAR_2}}` - {{FRONTEND_ENV_VAR_2_DESCRIPTION}}

**How to set:**
```bash
# {{PLATFORM_ENV_SET_COMMAND}}
# Example for Railway:
# railway variables set KEY=value

# Example for Vercel:
# vercel env add KEY

# Example for Cloud Run:
# gcloud run services update {{BACKEND_SERVICE}} \
#   --set-env-vars KEY=value
```

---

## 📊 Monitoring

**After deployment, monitor:**

- **Logs:** {{LOGS_URL}}
- **Metrics:** {{METRICS_URL}}
- **Error Tracking:** {{ERROR_TRACKING_URL}}
- **Uptime:** {{UPTIME_MONITORING_URL}}

---

## 🚨 Emergency Contacts

- **Owner:** {{OWNER_NAME}} ({{OWNER_CONTACT}})
- **Platform Support:** {{PLATFORM_SUPPORT_URL}}

---

## 📝 Notes

{{DEPLOYMENT_NOTES}}
<!-- Add any project-specific notes, gotchas, or reminders here -->

---

**Version:** 1.0  
**Last Successful Deploy:** {{LAST_DEPLOY_DATE}}  
**Deploy Frequency:** {{DEPLOY_FREQUENCY}}

