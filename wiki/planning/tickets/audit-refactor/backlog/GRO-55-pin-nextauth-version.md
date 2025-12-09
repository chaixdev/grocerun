# GRO-55: Pin NextAuth to Exact Version

**Phase:** 1 (Foundation)  
**Priority:** Medium  
**Audit Item:** #7  
**Depends On:** None  
**Blocks:** None (can be done anytime)

---

## Problem

`package.json` uses `"next-auth": "^5.0.0-beta.30"` with a caret (`^`), meaning:
- Any `npm install` could pull a newer beta version
- Beta versions may have breaking changes
- Builds could fail unexpectedly

---

## Solution

Pin to exact version by removing the caret.

---

## Implementation Steps

### 1. Update package.json

Change:
```json
"next-auth": "^5.0.0-beta.30"
```

To:
```json
"next-auth": "5.0.0-beta.30"
```

### 2. Regenerate Lock File

```bash
rm -rf node_modules package-lock.json
npm install
```

### 3. Verify Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] `next-auth` version in `package.json` has no caret prefix
- [ ] `package-lock.json` updated
- [ ] `npm run build` passes
- [ ] Auth flow still works (manual verification)

---

## Future Consideration

- Monitor NextAuth v5 stable release
- Create follow-up ticket to upgrade when stable
