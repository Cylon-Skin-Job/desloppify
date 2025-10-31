# Maintenance Module

**Project health monitoring and cleanup utilities**

This module provides tools for keeping your project clean and up-to-date.

---

## What's Included

### `detect-stale-docs.mjs`
Detects documentation that's older than the code it documents.

**Usage:**
```javascript
import { detectStaleDocs } from '../desloppify/scripts/modules/maintenance/detect-stale-docs.mjs';

const staleFiles = detectStaleDocs({
  docsPath: 'docs/',
  codePath: 'src/'
});
```

**What it checks:**
- Compares modification times of docs vs code
- Flags docs that haven't been updated when code changed
- Helps prevent outdated documentation

---

### `detect-roadmap-changes.mjs`
Tracks changes to roadmap/planning documents.

**Usage:**
```javascript
import { detectRoadmapChanges } from '../desloppify/scripts/modules/maintenance/detect-roadmap-changes.mjs';

const changes = detectRoadmapChanges({
  roadmapPath: 'docs/ROADMAP.md'
});
```

**What it checks:**
- Detects uncommitted changes to roadmap
- Tracks TODO item modifications
- Helps ensure planning docs stay in sync with git

---

### `dependency-health.mjs`
Checks npm dependencies for security issues and outdated packages.

**Usage:**
```javascript
import { checkDependencyHealth } from '../desloppify/scripts/modules/maintenance/dependency-health.mjs';

const health = await checkDependencyHealth({
  packageJsonPath: 'package.json',
  checkAudit: true,
  checkOutdated: true
});
```

**What it checks:**
- npm audit for security vulnerabilities
- Outdated packages (major, minor, patch)
- Unused dependencies (if configured)
- Unused npm scripts (if configured)

---

### `generate-cleanup-report.mjs`
Generates suggestions for files/code that can be pruned.

**Usage:**
```javascript
import { generateCleanupReport } from '../desloppify/scripts/modules/maintenance/generate-cleanup-report.mjs';

const report = generateCleanupReport({
  projectRoot: process.cwd(),
  checkBackups: true,
  checkLogs: true,
  checkTodos: true
});
```

**What it detects:**
- Backup files (.bak, ~, .old)
- Old log files
- Completed TODOs that can be archived
- Secrets accidentally committed
- Large files that should be gitignored

---

## When to Use

Run maintenance checks:
- **Before commits** - Catch stale docs, uncommitted roadmap changes
- **Weekly** - Check dependency health, generate cleanup report
- **Before releases** - Full health check to ensure everything is clean

---

## Integration

Add to your `docs-check.js` orchestrator:

```javascript
import { detectStaleDocs } from '../desloppify/scripts/modules/maintenance/detect-stale-docs.mjs';
import { checkDependencyHealth } from '../desloppify/scripts/modules/maintenance/dependency-health.mjs';
import { generateCleanupReport } from '../desloppify/scripts/modules/maintenance/generate-cleanup-report.mjs';

// Run maintenance checks
const staleDocs = detectStaleDocs({ docsPath: 'docs/', codePath: 'src/' });
const depHealth = await checkDependencyHealth({ checkAudit: true });
const cleanup = generateCleanupReport({ projectRoot: process.cwd() });
```

Or add npm scripts:

```json
{
  "scripts": {
    "maintenance:docs": "node desloppify/scripts/modules/maintenance/detect-stale-docs.mjs",
    "maintenance:deps": "node desloppify/scripts/modules/maintenance/dependency-health.mjs",
    "maintenance:cleanup": "node desloppify/scripts/modules/maintenance/generate-cleanup-report.mjs"
  }
}
```

---

## Philosophy

**Keep projects clean by default.**

These tools make it easy to spot cruft before it accumulates. Run them regularly and your codebase stays lean and healthy.

