# desloppify-local/cursor-docs

**Purpose:** Project-specific documentation for AI context (not user-facing docs)

---

## What Goes Here vs Other Doc Locations

### `docs/` (User-Facing)
✅ User guides, API reference, architecture diagrams  
✅ Getting started, tutorials, FAQs  
✅ Public documentation  
❌ Not read by AI by default

### `.cursor/rules/` (Cursor Rules)
✅ Code conventions, naming patterns  
✅ Auto-generated rules (API routes, schema)  
✅ Always loaded by AI  
❌ Should be concise, rule-focused

### `desloppify-local/cursor-docs/` (AI Context)
✅ Workflows unique to your project  
✅ Team conventions not universal enough for desloppify  
✅ Design decisions and "why" explanations  
✅ Integration guides (how X talks to Y)  
✅ Detailed patterns too long for cursor rules

**Rule of thumb:** If AI needs context but it's too detailed for a cursor rule, put it here.

---

## Typical Files

### Workflow Guides
- `github-workflow.md` - PR process, branch strategy, CI/CD
- `testing-workflow.md` - How to test features end-to-end
- `debugging-workflow.md` - Common debugging steps

### Design Decisions
- `architecture-decisions.md` - Why we chose approach X over Y
- `tech-stack-rationale.md` - Why we picked these tools
- `api-design-principles.md` - REST patterns, naming, versioning

### Integration Guides
- `stripe-integration.md` - How payment flow works
- `auth-flow.md` - How authentication is handled
- `third-party-apis.md` - External services we use

### Team Conventions
- `code-review-checklist.md` - What to check in PRs
- `commit-message-guide.md` - Commit format
- `branching-strategy.md` - How we use git branches

---

## Accessing via /menu

```
/menu → 6 (View Project Docs)
```

AI will:
- List all files in `desloppify-local/cursor-docs/`
- Let you pick one to view
- Show contents
- Offer to edit

---

## When to Create New Docs

**Create a new doc when:**
- You find yourself explaining the same workflow repeatedly
- A design decision is non-obvious
- Integration between systems is complex
- Team conventions aren't captured elsewhere

**Example scenarios:**
- "How do I add a new payment tier?" → `stripe-integration.md`
- "Why are we using X instead of Y?" → `architecture-decisions.md`
- "What's the deploy process?" → See `deploy/deploy-playbook.md` instead

---

## Format

Use standard Markdown:

```markdown
# Title

## Problem

What problem does this solve?

## Solution

How we handle it.

## Example

```code
// example
```
```

## Why This Approach

Rationale and tradeoffs.

## Related

- Link to related docs
- Link to cursor rules
```

---

## Maintenance

**Update docs when:**
- Workflows change
- New integrations added
- Design decisions evolve
- Team grows (onboarding material)

**Check for staleness:**
```
npm run maintenance:stale-docs
```

Or via `/menu` → 1 (Full Maintenance)

---

## Example: RULES_VS_DOCS_GUIDE.md

A meta-doc that helps AI decide where to put new documentation:

```markdown
# When to Create Cursor Rule vs Docs

## Cursor Rule (.cursor/rules/*.mdc)
- Code conventions (naming, formatting)
- Patterns that repeat everywhere
- Quick reference lookups
- Auto-generated documentation
- < 500 lines

## desloppify-local/cursor-docs/
- Workflows (deployment, testing)
- Design rationale
- Integration deep dives
- Team processes
- > 500 lines

## docs/ (User-Facing)
- User guides
- API reference
- Architecture diagrams
- Public documentation
```

---

## Best Practices

1. **Keep it current** - Outdated docs are worse than no docs
2. **Link related docs** - Create a web of knowledge
3. **Use examples** - Code snippets clarify faster than prose
4. **Explain "why"** - Future you will thank you
5. **Version important decisions** - Capture when/why things changed

---

**Version:** 3.0  
**Last Updated:** 2025-11-02

