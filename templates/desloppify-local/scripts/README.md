# desloppify-local/scripts

**Purpose:** Project-specific generators and validators

---

## What Goes Here

### Generators
Auto-generate cursor rules by scanning your codebase:
- `generate-api-routes-rule.mjs` - Express API endpoints → `06-api-routes.mdc`
- `generate-schema-rule.mjs` - Firestore usage → `07-firestore-schema.mdc`
- `generate-middleware-rule.mjs` - Express middleware → `08-middleware-usage.mdc`
- `generate-scripts-inventory-rule.mjs` - Scripts folder → `10-scripts-inventory.mdc`

### Validators
Enforce project-specific conventions:
- `validate-todo-contract.mjs` - TODO.md ↔ code linkage
- `validate-state-management.mjs` - Centralized state rules
- `validate-*.mjs` - Your custom validators

### Config
- `docs-check.config.json` - Paths and settings for your project

---

## Tech Stack Detection → Generators

Based on what the setup wizard detects, it will copy the appropriate generators:

### If Express Detected
```
✅ Express (routes/ folder + express in package.json)

Copy these generators:
- desloppify/scripts/modules/express/generate-api-routes-rule.mjs
- desloppify/scripts/modules/express/generate-middleware-rule.mjs
```

### If Firebase Detected
```
✅ Firebase (firebase-admin in package.json)

Copy these generators:
- desloppify/scripts/modules/firebase/generate-schema-rule.mjs
```

### If scripts/ Folder Detected
```
✅ Scripts folder found

Copy this generator:
- desloppify/scripts/modules/maintenance/generate-scripts-inventory-rule.mjs
```

### If TODO.md Detected
```
✅ TODO.md found

Copy this validator:
- desloppify/scripts/modules/todo-system/validate-todo-contract.mjs
```

### If State Management Pattern Detected
```
✅ State management (app-state.js or similar)

Copy this validator:
- desloppify/scripts/modules/state-management/validate-state-management.mjs
```

---

## Manual Setup (No Wizard)

If setting up manually:

1. **Check your tech stack**
2. **Copy relevant generators from `desloppify/scripts/modules/`**
3. **Update paths in each generator** (usually just `projectRoot`)
4. **Import in `scripts/docs-check.js`**
5. **Test with `npm run docs:check`**

---

## File Inventory

After setup, you should have:

```
desloppify-local/scripts/
├── README.md                           ← You are here
├── docs-check.config.json              ← Your project's paths
│
├── generate-api-routes-rule.mjs        ← If Express
├── generate-middleware-rule.mjs        ← If Express
├── generate-schema-rule.mjs            ← If Firebase
├── generate-scripts-inventory-rule.mjs ← If scripts/ folder
│
├── validate-todo-contract.mjs          ← If TODO.md
└── validate-state-management.mjs       ← If state management
```

---

## Config File (docs-check.config.json)

**Purpose:** Tell generators where to find your code

**Default template:**
```json
{
  "routesDir": "routes",
  "serverFile": "server.js",
  "frontendJs": "index.js",
  "htmlFiles": ["*.html"],
  "httpVerbs": ["GET", "POST", "PUT", "DELETE", "PATCH"],
  "apiDoc": "docs/backend/api.md",
  "middlewareDoc": "docs/backend/middleware.md",
  "jsFiles": ["index.js", "js/**/*.js"],
  "cssFiles": ["css/**/*.css"],
  "enabledModules": {
    "express": false,
    "firebase": false,
    "stateManagement": false,
    "todoSystem": false
  }
}
```

**Customize for your project:**
- Update paths to match your structure
- Enable modules you're using
- Add custom settings as needed

---

**Version:** 3.0  
**Last Updated:** 2025-11-02

