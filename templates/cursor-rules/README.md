# Cursor Rules Templates

Templates for creating your project's foundational cursor rules.

---

## 00-project-context.mdc.template

**Purpose:** The foundational rule that AI reads first - captures your project's essence

**Why it matters:**
- Gives AI instant context about your project
- Prevents AI from making wrong assumptions
- Sets tone and communication style
- Single source of truth for project overview

---

## How to Use (Interactive Interview)

When the setup wizard reaches Step 7 ("Document Your Project"), it should conduct an interview to populate this template.

### Interview Questions

#### 1. Basic Info
```
Let's create your project overview!

1. Project name: _______
   (e.g., "TaskMaster", "ShopEasy", "DevPortal")

2. What does your project do? (1 sentence)
   _______
   (e.g., "Task management app for remote teams")

3. What's the vibe/personality?
   _______
   (e.g., "Professional, enterprise-focused" or "Playful, user-friendly")
```

**Populates:**
- `{{PROJECT_NAME}}`
- `{{PROJECT_DESCRIPTION}}`
- `{{PROJECT_VIBE}}`

---

#### 2. Current Status
```
What stage is your project in?

a) Pre-alpha (early development, breaking changes common)
b) Alpha (testing, limited users)
c) Beta (public testing, feature-complete)
d) Production (live, stable)

Your choice: _______

Environment status: _______
(e.g., "Dev only", "Staging + Production", "Local development")

User status: _______
(e.g., "Solo dev", "Team of 5", "10,000 active users")

Testing approach: _______
(e.g., "Manual testing", "Automated CI/CD", "User beta testing")
```

**Populates:**
- `{{PROJECT_STAGE}}`
- `{{ENVIRONMENT_STATUS}}`
- `{{USER_STATUS}}`
- `{{TESTING_STATUS}}`

---

#### 3. Tech Stack (Auto-Detected + Confirmation)
```
🔍 I detected the following tech stack from your codebase:

Frontend:
  ✅ React (react in package.json)
  ✅ TypeScript (tsconfig.json found)
  ✅ Vite (vite.config.js found)

Backend:
  ✅ Node.js + Express (express in package.json)
  ✅ PostgreSQL (pg in package.json)

Is this correct? (y/n): _______

If no, what should I change?: _______
```

**If auto-detection not possible:**
```
Tell me about your tech stack:

Frontend framework: _______
(e.g., React, Vue, Svelte, Vanilla JS, none)

Backend framework: _______
(e.g., Express, FastAPI, Django, Rails, none)

Database: _______
(e.g., PostgreSQL, MySQL, MongoDB, Firestore)

Authentication: _______
(e.g., JWT, Firebase Auth, Auth0, Passport.js)

Hosting: _______
(e.g., Vercel, Netlify, AWS, Google Cloud, self-hosted)
```

**Populates:**
- `{{FRONTEND_STACK}}`
- `{{BACKEND_STACK}}`
- `{{DATABASE_STACK}}`
- `{{AUTH_STACK}}`
- `{{HOSTING_STACK}}`

---

#### 4. What's Working?
```
What features are already working?

List them (one per line, or comma-separated):
_______

Examples:
- User login and registration
- Dashboard with charts
- Payment processing
- Email notifications
```

**Populates:**
- `{{WORKING_FEATURES}}` (formatted as checklist)

---

#### 5. What's In Progress?
```
What are you currently working on?

List in-progress features:
_______

(Optional - press Enter to skip if nothing in progress)
```

**Populates:**
- `{{IN_PROGRESS_FEATURES}}` (formatted as warning checklist)

---

#### 6. Architecture Patterns (Optional)
```
Do you have specific architecture patterns or conventions?

Examples:
- "Feature-based folder structure"
- "Redux for state management"
- "RESTful API design"
- "Monorepo with workspaces"

Your patterns (or skip): _______
```

**Populates:**
- `{{ARCHITECTURE_PATTERNS}}`

---

#### 7. User Context
```
Last question: Tell me about yourself!

Your name (optional): _______
Your role: _______
(e.g., "Solo developer", "Lead engineer", "Founder")

Your experience level:
- Frontend: _______  (e.g., "Proficient", "Learning", "Expert")
- Backend: _______
- DevOps: _______

Communication preference:
(e.g., "Code examples", "Step-by-step", "High-level concepts")
_______
```

**Populates:**
- `{{USER_CONTEXT}}`

---

#### 8. Quick Answers (Auto-Generated)
```
I'll auto-generate the "Common Questions" section based on your answers!

✅ Generated quick reference for:
   - What backend are you using?
   - Is this multi-user?
   - What's the database?
   - What environment are we in?
   - What's working?
   - Where's the code?
```

**Populates:**
- `{{BACKEND_ANSWER}}`
- `{{MULTIUSER_ANSWER}}`
- `{{DATABASE_ANSWER}}`
- `{{ENVIRONMENT_ANSWER}}`
- `{{WORKING_ANSWER}}`
- `{{CODE_STRUCTURE_ANSWER}}`
- `{{PROJECT_TLDR}}`

---

## Example: Completed Interview

```
Let's create your project overview!

1. Project name: TaskMaster

2. What does your project do?
   → Task management app for remote teams

3. What's the vibe?
   → Professional, enterprise-focused, reliable

What stage is your project in?: b (Alpha)

Environment status: Staging + Production

User status: 50 beta testers

Testing approach: Automated CI/CD + manual QA

🔍 I detected: React, TypeScript, Express, PostgreSQL
Is this correct?: y

What features are working?:
- User login and registration
- Task creation and assignment
- Real-time notifications
- Team collaboration
- Stripe payment integration

What's in progress?:
- Mobile app (React Native)
- Advanced analytics dashboard

Architecture patterns?:
- Feature-based folder structure
- Redux Toolkit for state
- RESTful API with versioning

Your name: Alex
Your role: Founder + Solo Developer
Experience:
- Frontend: Proficient
- Backend: Intermediate
- DevOps: Learning

Communication preference:
→ Code examples with explanations, no jargon

✅ Generating 00-project-context.mdc...
✅ Complete! File created at .cursor/rules/00-project-context.mdc
```

---

## Manual Creation (No Wizard)

If not using the wizard:

1. Copy template to your project
```bash
cp desloppify/templates/cursor-rules/00-project-context.mdc.template .cursor/rules/00-project-context.mdc
```

2. Replace all `{{PLACEHOLDERS}}` with your values

3. Delete unused HTML comment sections

4. Test: Restart Cursor, open a file, verify rule loads

---

## Updating After Creation

Your project evolves! Update this file when:
- Tech stack changes (new framework, database migration)
- Moving between stages (alpha → beta → production)
- Major features ship
- Team grows
- Architecture patterns change

**Easy updates via `/menu`:**
```
/menu → 1 (Full Maintenance) → Check for doc updates
```

---

## Best Practices

1. **Keep it current** - Outdated context confuses AI
2. **Be specific** - "React + TypeScript" better than "JavaScript"
3. **Include philosophy** - Why you chose approach X over Y
4. **Link to details** - Reference auto-generated rules for deep dives
5. **Write for future you** - You'll forget why you made decisions

---

## Related Files

- **Auto-generated rules:** Point to these for details
  - `06-api-routes.mdc` - API endpoint documentation
  - `07-firestore-schema.mdc` - Database schema
  - `08-middleware-usage.mdc` - Middleware patterns
  
- **Project-specific docs:** Link to `desloppify-local/cursor-docs/`

---

**Version:** 3.0  
**Last Updated:** 2025-11-02  
**See:** SETUP.md for full setup workflow

