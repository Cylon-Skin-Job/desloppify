# Authentication Debug Clues

**Category:** Debug  
**Last updated:** 2025-10-29

---

## Symptoms: User logged out unexpectedly, token errors, 401 on valid user

- [ ] **Token expired?**
  - Check: When was user last authenticated?
  - Fix: Refresh token or re-authenticate
  - Why: Firebase tokens expire after 1 hour

- [ ] **Token not attached to requests?**
  - Check: Network tab → Authorization header present?
  - Fix: Ensure token is retrieved and sent with every API call
  - Why: Backend can't verify without token

- [ ] **Verifying token on backend?**
  - Check: Backend logs for verification errors
  - Fix: Use Firebase Admin SDK to verify token
  - Why: Never trust client, always verify server-side

