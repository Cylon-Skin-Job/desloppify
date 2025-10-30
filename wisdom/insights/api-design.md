# API Design Insights

**Category:** Insights  
**Last updated:** 2025-10-29

---

## Middleware Stack with Clear Responsibilities

**Problem:** Every route duplicates auth checks, logging, error handling. Hard to maintain consistency.

**Solution:** Middleware stack where each piece has ONE job:
1. CORS (allow origins)
2. Logging (request tracking)
3. Auth (verify token, attach user)
4. Business logic (route handler)
5. Error handler (catch all errors)

**Why it works:**
- DRY (don't repeat yourself)
- Easy to add/remove functionality
- Clear separation of concerns
- Testable in isolation

**Source:** RavenOS  
**Code:** `middleware/cors.js`, `middleware/logging.js`, `middleware/subscription.js`, `middleware/errorHandler.js`

**Example:**
```javascript
// Apply to all routes
app.use(cors);
app.use(logging);

// Apply to protected routes
app.post('/api/chat', verifyAuth, requireActiveSubscription, async (req, res) => {
  // Route logic here - user already verified
});

// Error handler LAST
app.use(errorHandler);
```

