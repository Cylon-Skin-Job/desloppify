# Express Module

**Optional module for Express.js backend projects**

---

## What It Does

- **API Route Documentation:** Auto-generates documentation from route definitions
- **Middleware Tracking:** Documents middleware usage patterns
- **Auto-Documentation:** Generates `.cursor/rules/` files from backend code

---

## Scripts

| Script | Purpose |
|--------|---------|
| `generate-api-routes-rule.mjs` | Scans routes/ and generates API docs |
| `generate-middleware-rule.mjs` | Scans middleware/ and generates usage guide |

---

## Configuration

Enable in `desloppify.config.js`:

```javascript
modules: {
  express: {
    enabled: true,
    routesDir: 'routes',
    middlewareDir: 'middleware'
  }
}
```

---

## Usage

**Generate API route docs:**
```bash
node scripts/modules/express/generate-api-routes-rule.mjs
```

**Generate middleware docs:**
```bash
node scripts/modules/express/generate-middleware-rule.mjs
```

---

## Requirements

- Express.js installed
- Routes defined in `routes/` directory
- Middleware defined in `middleware/` directory

---

## When to Use

**Enable this module if:**
- You use Express.js for backend
- You want auto-generated API documentation
- You want middleware usage tracked

**Skip this module if:**
- Frontend-only project
- Using different backend framework (Fastify, Koa, etc.)

