# Scripts Templates

Templates for project-specific maintenance and validation orchestration.

---

## docs-check.js.template

**Purpose:** The main orchestrator that runs all validators and generators

**What it does:**
1. Pre-flight check (detect interactive code)
2. Run universal validators (from desloppify)
3. Run project-specific validators (from desloppify-local)
4. Track completion status
5. Generate reports

**How to use:**

### 1. Copy to your project
```bash
cp desloppify/templates/scripts/docs-check.js.template scripts/docs-check.js
cp desloppify/templates/scripts/docs-check.config.json.template desloppify-local/scripts/docs-check.config.json
```

### 2. Replace placeholders

**In `scripts/docs-check.js`:**

| Placeholder | Replace With | Example |
|-------------|--------------|---------|
| `{{PROJECT_NAME}}` | Your project name | `RavenOS` |
| `{{HTML_FILE}}` | Main HTML file | `RavenOS.html` or `index.html` |
| `{{JS_FILES}}` | Array of JS file paths | `path.join(repoRoot, 'index.js')` |
| `{{GENERATOR_IMPORTS}}` | Import statements for generators | See below |
| `{{VALIDATOR_IMPORTS}}` | Import statements for validators | See below |
| `{{PROJECT_VALIDATORS}}` | Function definitions | See below |
| `{{PROJECT_CHECKS}}` | Check entries for pipeline | `['TODO contracts', checkTodoContracts]` |
| `{{GENERATOR_CALLS}}` | Generator function calls | `await generateAPIRoutes();` |

**In `desloppify-local/scripts/docs-check.config.json`:**
- Adjust paths to match your project structure
- Enable/disable modules based on your tech stack

### 3. Add project-specific code

**Example: Add TODO validator**

```javascript
// 1. Add import (replace {{VALIDATOR_IMPORTS}})
import { validateTodoContracts } from '../desloppify-local/scripts/validate-todo-contract.mjs';

// 2. Add function (replace {{PROJECT_VALIDATORS}})
async function checkTodoContracts() {
  const results = { passed: true, messages: [] };
  try {
    const issues = await validateTodoContracts({
      projectRoot: repoRoot,
      quiet: true
    });
    if (issues.length > 0) {
      results.passed = false;
      results.messages = issues;
    }
  } catch (err) {
    results.passed = false;
    results.messages.push(`TODO contract error: ${err.message}`);
  }
  return results;
}

// 3. Add to checks pipeline (replace {{PROJECT_CHECKS}})
['TODO contract validation', checkTodoContracts],
```

**Example: Add API routes generator**

```javascript
// 1. Add import (replace {{GENERATOR_IMPORTS}})
import { generateAPIRoutes } from '../desloppify-local/scripts/generate-api-routes-rule.mjs';

// 2. Add call at end (replace {{GENERATOR_CALLS}})
await generateAPIRoutes();
ok('API routes rule updated');
```

### 4. Test it
```bash
npm run docs:check
```

---

## Modular Design

The template is designed to be modular:

### Universal (Always Available)
From `desloppify/scripts/`:
- Core validators (function-call-validator)
- Bug pattern detectors (null-access, data-shape, security, memory-leaks)
- Contract enforcers (return-types, nullability, async-boundaries, etc.)

### Project-Specific (You Add)
From `desloppify-local/scripts/`:
- Generators (API routes, Firebase schema, middleware, etc.)
- Custom validators (TODO contracts, state management, etc.)

### Configuration (You Customize)
From `desloppify-local/scripts/docs-check.config.json`:
- File paths
- Enabled modules
- Project-specific settings

---

## Auto-Detection (For Setup Wizard)

When setting up a new project, the wizard can auto-populate based on detected tech stack:

**If Express detected:**
```javascript
// Add to imports
import { generateAPIRoutes } from '../desloppify-local/scripts/generate-api-routes-rule.mjs';
import { generateMiddleware } from '../desloppify-local/scripts/generate-middleware-rule.mjs';

// Add to generator calls
await generateAPIRoutes();
await generateMiddleware();
```

**If Firebase detected:**
```javascript
// Add to imports
import { generateFirebaseSchema } from '../desloppify-local/scripts/generate-schema-rule.mjs';

// Add to generator calls
await generateFirebaseSchema();
```

**If scripts/ folder detected:**
```javascript
// Add to imports
import { generateScriptsInventory } from '../desloppify-local/scripts/generate-scripts-inventory-rule.mjs';

// Add to generator calls
await generateScriptsInventory();
```

---

## Adding New Validators

### 1. Create validator in desloppify-local/scripts/
```javascript
// desloppify-local/scripts/my-custom-validator.mjs
export async function validateMyFeature(options) {
  const issues = [];
  // Your validation logic
  return issues;
}
```

### 2. Import in docs-check.js
```javascript
import { validateMyFeature } from '../desloppify-local/scripts/my-custom-validator.mjs';
```

### 3. Create wrapper function
```javascript
async function checkMyFeature() {
  const results = { passed: true, messages: [] };
  try {
    const issues = await validateMyFeature({ projectRoot: repoRoot, quiet: true });
    if (issues.length > 0) {
      results.passed = false;
      results.messages = issues;
    }
  } catch (err) {
    results.passed = false;
    results.messages.push(`My feature check error: ${err.message}`);
  }
  return results;
}
```

### 4. Add to checks pipeline
```javascript
const checks = [
  // ... existing checks
  ['My custom feature', checkMyFeature],
];
```

---

## Adding New Generators

### 1. Create generator in desloppify-local/scripts/
```javascript
// desloppify-local/scripts/generate-my-rule.mjs
export async function generateMyRule() {
  // Scan codebase
  // Generate .cursor/rules/XX-my-rule.mdc
  console.log('✅ Generated: .cursor/rules/XX-my-rule.mdc');
}
```

### 2. Import in docs-check.js
```javascript
import { generateMyRule } from '../desloppify-local/scripts/generate-my-rule.mjs';
```

### 3. Call in generator section
```javascript
try {
  await generateMyRule();
  ok('Custom rule generated');
} catch (err) {
  console.error('⚠️  Failed to generate custom rule:', err.message);
}
```

---

## File Paths Reference

```
your-project/
├── scripts/
│   └── docs-check.js                           ← Copy from template
│
├── desloppify/                                  ← Submodule (universal)
│   ├── scripts/
│   │   ├── core/                               (Always imported)
│   │   ├── bug-patterns/                       (Always imported)
│   │   ├── contracts/                          (Always imported)
│   │   └── modules/                            (Copy to desloppify-local as needed)
│   │
│   └── templates/
│       └── scripts/
│           ├── docs-check.js.template          ← You are here
│           ├── docs-check.config.json.template
│           └── README.md
│
└── desloppify-local/                           ← Project-specific
    └── scripts/
        ├── docs-check.config.json              ← Copy from template
        ├── generate-*.mjs                      ← Your generators
        └── validate-*.mjs                      ← Your validators
```

---

## Best Practices

1. **Keep universal code in desloppify** - Validators that work for any project
2. **Keep project code in desloppify-local** - Generators and validators specific to your project
3. **Use config file** - Avoid hardcoding paths in docs-check.js
4. **Test incrementally** - Add one validator at a time
5. **Non-interactive only** - Pre-flight check will catch interactive code

---

## Troubleshooting

**"Module not found" error:**
- Check import paths (relative to `scripts/`)
- Verify generator/validator file exists in `desloppify-local/scripts/`

**"Validation hangs indefinitely":**
- Run with `--trace-warnings` to debug
- Check pre-flight logs for interactive code detection
- Ensure no `readline`, `prompt()`, or `process.stdin` usage

**"Config not found" error:**
- Create `desloppify-local/scripts/docs-check.config.json`
- Or template will use defaults

---

**Version:** 3.0  
**Last Updated:** 2025-11-02  
**See:** SETUP.md for full integration guide

