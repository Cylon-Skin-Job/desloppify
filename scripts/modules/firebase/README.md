# Firebase Module

**Optional module for Firebase/Firestore projects**

---

## What It Does

- **Schema Drift Detection:** Compares live Firestore structure against expected baseline
- **Firestore Scan:** Analyzes code for Firestore usage patterns
- **Auto-Documentation:** Generates `.cursor/rules/` documentation from database structure

---

## Scripts

| Script | Purpose |
|--------|---------|
| `firebase-scan.mjs` | Scans codebase for Firestore reads/writes |
| `generate-schema-rule.mjs` | Auto-generates database schema documentation |

---

## Configuration

Enable in `desloppify.config.js`:

```javascript
modules: {
  firebase: {
    enabled: true,
    schemaFile: 'scripts/firebase-expected.json'
  }
}
```

---

## Usage

**Scan Firestore usage:**
```bash
node scripts/modules/firebase/firebase-scan.mjs
```

**Generate schema rule:**
```bash
node scripts/modules/firebase/generate-schema-rule.mjs
```

---

## Requirements

- Firebase Admin SDK installed
- Firestore database configured
- Baseline schema snapshot (`firebase-expected.json`)

---

## When to Use

**Enable this module if:**
- You use Firebase/Firestore
- You want schema drift detection
- You want auto-generated database docs

**Skip this module if:**
- Not using Firebase
- Using different database (PostgreSQL, MongoDB, etc.)

