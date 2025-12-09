# Architecture and Code Quality Audit

**Date:** December 9, 2025  
**Auditor:** Senior Architect Review  
**Scope:** Full TypeScript codebase analysis

---

## Summary

This audit covers the Grocerun codebase - a Next.js 16 application using React 19, Prisma 7 with SQLite, and NextAuth v5 for authentication. The application is a grocery list management tool supporting multi-household collaboration.

Overall, the codebase demonstrates good structure and modern patterns. The following actionable items are organized by risk level for prioritization.

---

## Critical Issues

### 1. Confusing Comment in item.ts

- `risk level: nitpick`
- In [src/actions/item.ts](src/actions/item.ts#L17), there is a standalone `// ...` comment that appears to be a remnant of refactoring. The `UpdateItemSchema` is properly defined and used by the `updateItem()` function.
- Remove the confusing comment to improve code clarity.

---

### 2. Missing Error Typing in Catch Blocks

- `risk level: medium`
- Throughout the server actions (e.g., [src/actions/household.ts](src/actions/household.ts), [src/actions/invitation.ts](src/actions/invitation.ts), [src/actions/list.ts](src/actions/list.ts)), catch blocks use bare `catch (error)` or `catch { }` without proper error typing or logging. For example, `renameHousehold` at line 48-70 catches errors but only returns generic messages.
- Proper error typing (`catch (error: unknown)`) and structured logging would improve debugging, observability, and production issue diagnosis.

---

### 3. Inconsistent Error Handling Patterns Across Actions

- `risk level: medium`
- Server actions use mixed return patterns: some throw errors (e.g., `createStore`, `updateHousehold`), while others return `{ success: false, error: string }` objects (e.g., `renameHousehold`, `deleteHousehold`). See [src/actions/household.ts](src/actions/household.ts) and [src/actions/store.ts](src/actions/store.ts) for contrasting patterns.
- Inconsistent patterns make client-side error handling unpredictable and increase the cognitive load for developers. Standardize on one approach (preferably structured responses for server actions).

---

### 4. Raw SQL Query Pattern Documentation

- `risk level: low`
- In [src/actions/item.ts](src/actions/item.ts#L72-L82), the `searchItems` function builds a `LIKE` pattern with string interpolation before passing to `$queryRaw`. The current implementation is safe because Prisma's tagged template literals properly parameterize the query.
- Add a code comment documenting why this pattern is safe to prevent confusion in future refactors.

---

### 5. Missing Rate Limiting on Invitation Creation

- `risk level: medium`
- The `createInvitation` function in [src/actions/invitation.ts](src/actions/invitation.ts#L11-L41) has no rate limiting. A malicious user could spam invitation creation, potentially causing database bloat or abuse.
- Implement rate limiting at the application or middleware level for sensitive operations like invitation generation.

---

### 6. Prisma Dependency in Production Dependencies

- `risk level: low`
- In [package.json](package.json#L33), `prisma` CLI is listed in `dependencies` instead of `devDependencies`. While this is intentional for the Docker build process (as noted in Dockerfile), it increases the production bundle unnecessarily if not carefully pruned.
- Document this decision clearly or consider restructuring the Docker build to avoid shipping CLI tools in production.

---

### 7. nextauth Beta Version in Production

- `risk level: medium`
- [package.json](package.json#L28) shows `"next-auth": "^5.0.0-beta.30"` - a beta version is being used in what appears to be production code. Beta APIs may have breaking changes.
- Monitor for stable release and have a plan to upgrade. Consider pinning to an exact version to prevent unexpected breaking changes during npm install.

---

### 8. Missing Input Validation on Some Server Actions

- `risk level: medium`
- Several server actions accept raw string parameters without Zod validation: `deleteStore(id: string)`, `deleteSection(id: string)`, `updateSection(id: string, name: string)` in [src/actions/section.ts](src/actions/section.ts). While the database layer provides some safety, input validation should be consistent.
- Apply Zod schemas consistently to all server action inputs for defense in depth.

---

### 9. useMediaQuery SSR Hydration Mismatch Risk

- `risk level: low`
- In [src/hooks/use-media-query.ts](src/hooks/use-media-query.ts#L6), `useState(false)` is the initial value, but on the client it immediately queries `window.matchMedia`. This can cause hydration mismatches on server-rendered pages.
- Consider using `useState<boolean | null>(null)` and handling the undefined state, or using a library like `usehooks-ts` that handles this properly.

---

### 10. Debounce Cleanup Without Cancellation Reference

- `risk level: nitpick`
- In [src/components/section-list.tsx](src/components/section-list.tsx#L42-L50), `debouncedUpdate` is created with `useMemo` and cleaned up in `useEffect`. The current cleanup implementation is correct.
- Consider adding an `isMounted` flag for additional safety, though this is overly cautious for this use case.

---

### 11. Large Component File - ListEditor

- `risk level: low`
- [src/components/list-editor.tsx](src/components/list-editor.tsx) is over 450 lines with complex state management, multiple inline handlers, and duplicated rendering logic for sectioned vs uncategorized items.
- Refactor into smaller components: extract `ListItemRow`, `SectionGroup`, and move handlers into custom hooks for better testability and maintainability.

---

### 12. Duplicated Navigation Items Configuration

- `risk level: nitpick`
- Navigation items are duplicated between [src/components/layout/sidebar.tsx](src/components/layout/sidebar.tsx#L7-L21) and [src/components/layout/bottom-nav.tsx](src/components/layout/bottom-nav.tsx#L6-L20). Both define the same `items` array.
- Extract to a shared constant in a config file to ensure consistency and reduce maintenance burden.

---

### 13. Unused StoreSettingsPageProps Interface

- `risk level: nitpick`
- In [src/app/stores/[storeId]/settings/page.tsx](src/app/stores/[storeId]/settings/page.tsx#L14-L18), `StoreSettingsPageProps` interface is defined but never used (the function uses inline type annotation instead).
- Remove the unused interface to reduce dead code.

---

### 14. Form Submit Button Missing Loading State in HouseholdForm

- `risk level: low`
- In [src/components/household-form.tsx](src/components/household-form.tsx#L53), the submit button doesn't show a loading indicator during form submission, unlike other forms in the codebase (e.g., StoreForm).
- Add `disabled` state and loading spinner for consistent UX across all forms.

---

### 15. Missing Cascade Delete Consideration for Items

- `risk level: medium`
- In [prisma/schema.prisma](prisma/schema.prisma#L71), `Item.sectionId` relation to `Section` does not have `onDelete: SetNull` or explicit handling. If a section is deleted, items pointing to it may become orphaned or cause constraint errors.
- Add `onDelete: SetNull` to the Section relation on Item model to gracefully handle section deletions.

---

### 16. No Index on Frequently Queried Fields

- `risk level: medium`
- In [prisma/schema.prisma](prisma/schema.prisma), several frequently filtered fields lack indexes: `List.status`, `ListItem.isChecked`, `Item.purchaseCount`. The `Invitation.token` has an index which is good.
- Add database indexes for fields used in WHERE clauses and ORDER BY for better query performance as data grows.

---

### 17. Hardcoded Strings for List Status Checks

- `risk level: low`
- Throughout the codebase, list status is checked using string literals like `"COMPLETED"`, `"PLANNING"`, `"SHOPPING"` (e.g., [src/actions/list.ts](src/actions/list.ts#L111), [src/components/store-lists.tsx](src/components/store-lists.tsx#L30)).
- Export the enum values from Prisma client or create a shared constants file to prevent typos and enable IDE autocomplete.

---

### 18. Missing Environment Variable Validation

- `risk level: medium`
- Environment variables like `DATABASE_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` are accessed directly via `process.env` without runtime validation (e.g., [src/auth.config.ts](src/auth.config.ts#L6-L7), [src/lib/prisma.ts](src/lib/prisma.ts#L5)).
- Use a library like `zod` or `@t3-oss/env-nextjs` to validate environment variables at startup and fail fast with clear error messages.

---

### 19. Optimistic UI Rollback May Flash Incorrect State

- `risk level: nitpick`
- In [src/components/list-editor.tsx](src/components/list-editor.tsx#L186-L234), the optimistic UI implementation correctly rolls back on failure, but there's a brief visual flash.
- This is a UX polish item, not a code quality issue. Consider adding a more graceful rollback animation when time permits.

---

### 20. No Request Cancellation in ItemAutocomplete

- `risk level: nitpick`
- In [src/components/item-autocomplete.tsx](src/components/item-autocomplete.tsx#L37-L62), the `lastQueryRef` pattern prevents duplicate processing of stale results, which is the correct behavior. However, requests are still fired.
- Using `AbortController` to cancel previous requests is a nice-to-have optimization but not critical.

---

### 21. Missing Accessibility Labels on Interactive Elements

- `risk level: low`
- Several interactive elements lack proper ARIA labels. For example, the checkbox in [src/components/list-editor.tsx](src/components/list-editor.tsx#L330) has no `aria-label` describing what item it controls.
- Add descriptive ARIA labels for screen reader users, especially for checkboxes and icon-only buttons.

---

### 22. Implicit Any in Generic Type Parameters

- `risk level: nitpick`
- In [src/components/ui/sortable.tsx](src/components/ui/sortable.tsx#L22), the generic `T extends { id: string }` is good, but `renderOverlay` callback could benefit from stricter typing.
- Add explicit return types to improve type inference and documentation.

---

### 23. No Pagination for List Queries

- `risk level: medium`
- Functions like `getHouseholds`, `getStores`, `getLists` in the actions files return all records without pagination. As users accumulate data, this could cause performance issues.
- Implement cursor-based or offset pagination for list queries to handle scale.

---

### 24. Missing CSRF Protection Documentation

- `risk level: low`
- Server actions in Next.js 14+ have built-in CSRF protection, but this is not documented. The auth setup doesn't explicitly mention security considerations.
- Add security documentation explaining the CSRF protection mechanism for future maintainers.

---

### 25. Missing Error Boundary Components

- `risk level: medium`
- The application lacks React Error Boundary components. If a component throws during render, the entire page crashes. Only server-side try/catch exists (e.g., [src/app/stores/page.tsx](src/app/stores/page.tsx#L14-L25)).
- Add Error Boundary components at route and feature levels to gracefully handle client-side errors.

---

### 26. Inconsistent Date Handling

- `risk level: low`
- Some components use `date-fns` formatters ([src/components/store-lists.tsx](src/components/store-lists.tsx#L7)), while others use `toLocaleDateString()` directly ([src/components/household-list.tsx](src/components/household-list.tsx#L33)).
- Standardize on `date-fns` across the codebase for consistent date formatting and timezone handling.

---

### 27. AppVersion Component Uses useEffect Unnecessarily

- `risk level: nitpick`
- In [src/components/app-version.tsx](src/components/app-version.tsx#L7-L13), `NEXT_PUBLIC_APP_VERSION` is a compile-time constant but is being set in useEffect. This causes an unnecessary re-render.
- Access `process.env.NEXT_PUBLIC_APP_VERSION` directly in the render or use a simple constant.

---

### 28. Missing Loading States for Page Transitions

- `risk level: low`
- Route changes between pages don't show loading indicators. Next.js supports `loading.tsx` files for streaming, but none are implemented in the app directory.
- Add `loading.tsx` files to route segments for better perceived performance during navigation.

---

### 29. No Unit Tests or Integration Tests Present

- `risk level: high`
- The codebase has no visible test files (no `__tests__` directories, no `.test.ts` files, no testing dependencies in package.json).
- Implement a testing strategy with Jest/Vitest for unit tests and Playwright/Cypress for E2E tests. Priority should be given to server actions and critical user flows.

---

### 30. Unused Import Trash2 in StoreSettingsForm

- `risk level: nitpick`
- In [src/components/stores/StoreSettingsForm.tsx](src/components/stores/StoreSettingsForm.tsx#L8), `Trash2` is imported but never used (delete functionality was moved to `StoreDeleteSection`).
- Remove the unused import to keep the code clean.

---

### 31. Missing Middleware Protection for API Routes

- `risk level: low`
- The proxy middleware in [src/proxy.ts](src/proxy.ts) protects page routes but explicitly excludes `api` routes via the matcher pattern. The health check endpoint at `/api/health` is intentionally public, but other API routes might need protection.
- Review API route protection requirements and add authentication checks where needed.

---

### 32. Toast Messages Lack Consistent Duration

- `risk level: nitpick`
- Toast notifications throughout the codebase use default durations. Some messages are more important than others (errors vs success).
- Configure Sonner with different durations for different toast types (longer for errors, shorter for success).

---

### 33. Schema Validation Inconsistency Between Frontend and Backend

- `risk level: low`
- `StoreSchema` in [src/schemas/store.ts](src/schemas/store.ts) is used in both client forms and server actions, which is good. However, [src/actions/household.ts](src/actions/household.ts#L9-L11) defines its own `HouseholdSchema` inline.
- Move all schemas to a centralized location (`src/schemas/` or `src/lib/schemas/`) for consistency and reusability.

---

### 34. Missing SEO Metadata on Dynamic Pages

- `risk level: low`
- Dynamic pages like `/stores/[storeId]` and `/lists/[listId]` don't generate dynamic metadata. The root layout sets basic metadata in [src/app/layout.tsx](src/app/layout.tsx#L8-L11), but page-specific titles would improve UX.
- Add `generateMetadata` functions to dynamic route pages to show contextual page titles.

---

### 35. No Retry Logic for Failed Database Operations

- `risk level: low`
- Database operations throughout the codebase don't implement retry logic for transient failures. SQLite is generally reliable, but network issues in other database setups could cause problems.
- Consider implementing retry logic for critical operations or document that SQLite's file-based nature makes this less of a concern.

---

## Recommendations Priority Matrix

| Priority | Count | Items |
|----------|-------|-------|
| Critical | 0 | - |
| High | 1 | #29 (No tests) |
| Medium | 10 | #2, #3, #5, #7, #8, #15, #16, #18, #23, #25 |
| Low | 14 | #4, #6, #9, #11, #14, #17, #21, #24, #26, #28, #31, #33, #34, #35 |
| Nitpick | 10 | #1, #10, #12, #13, #19, #20, #22, #27, #30, #32 |

---

## Next Steps

1. **Immediate**: Set up testing infrastructure (#29)
2. **Short-term**: Standardize error handling (#2, #3), add input validation (#8), and implement environment variable validation (#18)
3. **Medium-term**: Add pagination (#23), error boundaries (#25), and database indexes (#16)
4. **Ongoing**: Address low-priority and nitpick items during regular maintenance
