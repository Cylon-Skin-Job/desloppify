# Cursor Command Templates

This directory contains templates for the 4 core Cursor commands used in streamlined project workflows.

## Available Templates

### Core Commands
- **`maintenance.md.template`** - Full codebase maintenance and validation
- **`session-end.md.template`** - Quick session commit with context capture
- **`sync.md.template`** - Submodule sync and diff management
- **`deploy.md.template`** - Deployment with validation checks

## How to Use Templates

### 1. Copy to Your Project
```bash
# From your project root
mkdir -p .cursor/commands
cp .desloppify/templates/cursor-commands/*.md.template .cursor/commands/
```

### 2. Customize Placeholders
Edit each copied file to replace template placeholders with project-specific values:

#### maintenance.md.template
- `{{MAINTENANCE_RULE_PATH}}` → `.cursor/rules/98-maintenance-cleanup.mdc`
- `{{CURSOR_RULES_PATH}}` → `.cursor/rules/`
- `{{PROJECT_CONTEXT_RULE}}` → `.cursor/rules/00-project-context.mdc`
- `{{SYSTEM_INVENTORY_RULE}}` → `.cursor/rules/69-system-inventory.mdc`
- `{{NOT_VALIDATED_STATUS}}` → `⚠️ Not Validated`
- `{{PASSED_STATUS}}` → `✅ Passed`
- `{{FAILED_STATUS}}` → `❌ Failed`

#### session-end.md.template
- `{{WISDOM_SUBMODULE_PATH}}` → `.cursor/shared-wisdom`
- `{{DESLOPPIFY_SUBMODULE_PATH}}` → `.desloppify`
- `{{PROJECT_CONTEXT_RULE}}` → `.cursor/rules/00-project-context.mdc`
- `{{SYSTEM_INVENTORY_RULE}}` → `.cursor/rules/69-system-inventory.mdc`
- `{{NOT_VALIDATED_STATUS}}` → `⚠️ Not Validated`
- `{{PASSED_STATUS}}` → `✅ Passed`
- `{{FAILED_STATUS}}` → `❌ Failed`
- `{{PARTIAL_STATUS}}` → `🚧 Partial`

#### sync.md.template
- `{{WISDOM_SUBMODULE_PATH}}` → `.cursor/shared-wisdom`
- `{{DESLOPPIFY_SUBMODULE_PATH}}` → `.desloppify`

#### deploy.md.template
- `{{PROJECT_NAME}}` → Your project name
- `{{DEPLOYMENT_STATUS}}` → "Pre-alpha, dev environment only"
- `{{ENVIRONMENT_STATUS}}` → "Dev only"
- `{{NOT_VALIDATED_STATUS}}` → `⚠️ Not Validated`
- `{{PASSED_STATUS}}` → `✅ Passed`
- `{{FRONTEND_PLATFORM}}` → "Firebase Hosting"
- `{{BACKEND_PLATFORM}}` → "Cloud Run"
- `{{BACKEND_RUNTIME}}` → "Node.js"
- `{{BACKEND_SERVICE}}` → "your-api-service"
- `{{DATABASE_CONFIG}}` → "Firestore"
- `{{WEBHOOK_CONFIG}}` → "Stripe webhooks"
- `{{FRONTEND_DEPLOY_RULE}}` → `.cursor/rules/92-deploy-frontend.mdc`
- `{{BACKEND_DEPLOY_RULE}}` → `.cursor/rules/91-deploy-backend.mdc`

### 3. Rename Files
Remove `.template` extension:
```bash
cd .cursor/commands
mv maintenance.md.template maintenance.md
mv session-end.md.template session-end.md
mv sync.md.template sync.md
mv deploy.md.template deploy.md
```

## Command Workflow Overview

### 1. `/maintenance` (Full Health Check)
- Sync submodules and capture wisdom
- Run comprehensive validation
- Check all cursor rules and docs for staleness
- Update session ledger
- Commit all changes

### 2. `/end-session` (Quick Commit)
- Sync submodules and check for wisdom opportunities
- Light doc checks and TODO updates
- Capture session context
- Commit (marked as "Not Validated")

### 3. `/sync` (Submodule Management)
- Pull latest from shared-wisdom and desloppify
- Show what changed
- Push local changes if any
- Update parent repo references

### 4. `/deploy` (Deployment)
- Check validation status (warn if not validated)
- Guide through deployment playbooks
- Ensure pre-deploy checks pass

## Integration with Existing Scripts

These commands reference existing npm scripts:
- `npm run docs:check` - Auto-generates rules + validates
- `npm run validate:state` - State management validation
- `npm run maintenance:cleanup-report` - Orphaned file detection
- `npm run maintenance:stale-docs` - Doc staleness checks
- `npm run maintenance:dependency-health` - Security/dependency checks
- `npm run session:summary` - Session file generation
- `npm run lint:styles` - CSS validation

## Customization Guidelines

### Adapting to Your Project
- **Tech Stack:** Update references to match your frontend/backend platforms
- **File Paths:** Adjust rule paths and submodule locations
- **Environment:** Modify deployment environments and status messages
- **Validation Status:** Customize the validation status indicators
- **Workflow Steps:** Add project-specific validation or deployment steps

### Extending Commands
- Add new workflow steps in the appropriate sections
- Include project-specific npm scripts or commands
- Add custom validation checks or deployment requirements
- Update examples with realistic project scenarios

## Best Practices

### Command Design
- Keep workflows focused and actionable
- Include clear decision points and prompts
- Reference existing scripts rather than duplicating logic
- Use consistent status indicators and messaging

### Template Maintenance
- Update templates when new workflows are added
- Keep placeholders clear and well-documented
- Test templates in multiple project types
- Document any breaking changes to placeholders

## Related Files

- `../system-inventory.md.template` - Project system inventory template
- `../TODO.md.template` - TODO list template
- `../NAMING_STYLE_GUIDE.md.template` - Naming conventions template
- `../../../scripts/` - Supporting validation and generation scripts

