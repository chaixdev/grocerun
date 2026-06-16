# Coding Standards

**Status:** Established
**Category:** Universal / Cross-Cutting
**Context:** TypeScript/Node/React/NestJS projects

Canonical, portable coding standards. These are reusable across projects
in the same stack. Deviations require a documented decision.

These are universal rules — not tied to any codebase or toolchain.
Project-specific conventions belong in separate rule files.

---

## 1. TypeScript Idioms

### 1.1 Strict Nulls

- Enable `strict: true` in `tsconfig.json`. Never disable it.
- Prefer `??` over `||` for default values (the latter coalesces falsy values).
- Use optional chaining (`?.`) for nullable property access.

**Correct:**
```typescript
const name = user?.profile?.name ?? "Unknown";
const items = response.data ?? [];
```

**Incorrect:**
```typescript
const name = user && user.profile && user.profile.name || "Unknown";
const items = response.data || []; // rejects empty arrays
```

### 1.2 Discriminated Unions

Prefer discriminated unions over `switch` on strings for multi-outcome results.

**Correct:**
```typescript
type LockResult =
  | { allowed: true }
  | { allowed: false; reason: "not_shopping" | "locked_to_other" | "no_list" };

function checkLock(list: List, user: User): LockResult {
  if (list.status !== "SHOPPING") return { allowed: false, reason: "not_shopping" };
  if (list.assignedTo !== user.sub) return { allowed: false, reason: "locked_to_other" };
  return { allowed: true };
}
```

**Incorrect:**
```typescript
function checkLock(list: List, user: User): boolean {
  if (list.status !== "SHOPPING") return false;
  if (list.assignedTo !== user.sub) return false;
  return true;
}
// Caller has no idea *why* the lock failed.
```

### 1.3 Zod Validation

All API inputs must pass through a Zod schema at the boundary.

**Server:**
```typescript
// Never hand-validate. Use createZodDto + global ZodValidationPipe.
import { createZodDto } from "nestjs-zod";
import { z } from "zod";

const CreateListSchema = z.object({
  storeId: z.string().min(1),
  name: z.string().min(1).max(100),
});

class CreateListDto extends createZodDto(CreateListSchema) {}

@Controller("lists")
class ListsController {
  @Post()
  create(@Body() dto: CreateListDto) {
    // dto is already validated and typed
  }
}
```

**Client:**
```typescript
// Form schemas derive from shared DTOs — never duplicate.
import { CreateListSchema } from "@grocerun/dto";

const formSchema = CreateListSchema.omit({ storeId: true }).extend({
  storeId: z.string().optional(),
});
```

### 1.4 No `any`

Use `unknown` and narrow with type guards. `any` is a bug magnet.

**Correct:**
```typescript
function parseResponse(data: unknown): User {
  if (typeof data !== "object" || data === null) throw new Error("Invalid");
  // narrow further with checks...
  return data as User;
}
```

**Incorrect:**
```typescript
function parseResponse(data: any): User {
  return data; // completely unchecked
}
```

If a third-party library forces `any` (e.g., RxDB), isolate it behind a typed
facade and keep the cast as narrow as possible.

---

## 2. Error Handling

### 2.1 Server (NestJS)

Throw framework-level exceptions. Do not return discriminated union error
results — exceptions are the standard NestJS error model.

**Correct:**
```typescript
@Get(":id")
async findOne(@Param("id") id: string) {
  const entity = await this.service.findById(id);
  if (!entity) throw new NotFoundException(`Entity ${id} not found`);
  return entity;
}
```

**Incorrect:**
```typescript
@Get(":id")
async findOne(@Param("id") id: string) {
  const entity = await this.service.findById(id);
  if (!entity) return { error: "not found" }; // HTTP 200 with error body
  return entity;
}
```

- Exception messages go to the client — keep them user-facing.
- For structured error data, include a machine-readable `code` field:
  ```typescript
  throw new BadRequestException({
    statusCode: 400,
    code: "NEEDS_SECTION",
    message: "Item must belong to a section",
  });
  ```
- Service methods that check auth/access should be named `assert*` to
  signal they throw on failure (e.g., `assertOwnership`, `assertShoppingLock`).

### 2.2 Client (React)

**Correct:**
```typescript
function ItemForm({ onSuccess, onError }: { onSuccess: () => void; onError: (e: Error) => void }) {
  const mutation = useMutation({
    mutationFn: createItem,
    onSuccess,
    onError: (err) => {
      toast.error(err.message);
      onError?.(err);
    },
  });
  // ...
}
```

**Incorrect:**
```typescript
function ItemForm() {
  const handleSubmit = async (data: ItemData) => {
    try {
      await createItem(data);
      // No user feedback on success. No error handling.
    } catch (e) {
      // Silent failure.
    }
  };
}
```

- API errors should surface via toast or error boundary, not silently.
- Data-mutation hooks must expose `onError` callbacks for callers.
- Async components must render error UI (not just loading spinners).

### 2.3 Sync Handlers

Sync push handlers must not throw — return structured conflict documents,
not HTTP errors, when an operation is blocked.

**Correct:**
```typescript
async pushItems(items: PushItem[]) {
  for (const item of items) {
    const lock = checkShoppingLock(item.listId, currentUser);
    if (!lock.allowed) {
      return [{ id: item.id, conflict: true, reason: lock.reason }];
    }
    // ... process
  }
}
```

**Incorrect:**
```typescript
async pushItems(items: PushItem[]) {
  for (const item of items) {
    const lock = checkShoppingLock(item.listId, currentUser);
    if (!lock.allowed) throw new ForbiddenException(); // Breaks RxDB protocol
  }
}
```

---

## 3. Logging

- Server: framework `Logger` with contextual prefix (`new Logger("ModuleName")`).
  **All logs must be structured JSON** — see [production-quality.md §2](./production-quality.md)
  for the full observability standard (correlation IDs, severity taxonomy, instrumented metrics).

**Correct:**
```typescript
private readonly logger = new Logger(SseBroadcastService.name);

async broadcast(userId: string, event: ResyncEvent) {
  this.notifyUser(userId, event).catch((err) => {
    this.logger.warn(`SSE broadcast failed for user ${userId}`, err.stack);
  });
}
```

**Incorrect:**
```typescript
async broadcast(userId: string, event: ResyncEvent) {
  this.notifyUser(userId, event).catch(() => {}); // Silent failure
}
```

- `.catch()` blocks in fire-and-forget operations must log at `warn` level —
  never silent.
- Never log tokens, passwords, PII, or full request bodies.
- Frontend: `console.error` for actionable errors. Use diagnostic overlays
  for dev-time event buses.

---

## 4. Testing

Core rules: use real databases (never mock the ORM), assert behavior not
implementation, CI blocks merge on test failure. See
[testing-standards.md](./testing-standards.md) for the full test pyramid,
required test scenarios per feature type, and Playwright conventions.

---

## 5. Git Conventions

- [Conventional Commits](https://www.conventionalcommits.org/):
  `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Branch naming: `feature/<desc>`, `fix/<desc>`, `refactor/<desc>`.
- One logical change per commit. No "WIP" or "save" commits on main.
- PRs must pass typecheck and tests before merge.
- Amend/rebase local commits freely; never force-push shared branches.

---

## 6. Anti-Patterns

| Pattern | Problem | Do Instead |
|---------|---------|------------|
| `any` type | Loses all type safety | Use `unknown` + type guards |
| `\|\|` for defaults | Coalesces falsy values (`0`, `""`, `false`) | Use `??` |
| Returning error objects from controllers | HTTP 200 with error body confuses clients | Throw `HttpException` subclasses |
| Silent `.catch()` | Failures go undetected | Log at `warn` level minimum |
| Duplicating Zod schemas | Schema drift between client and server | Derive from shared DTOs |
| `select *` / no `select` | Over-fetches, hides query contract | Always specify explicit fields |
| Mocking the ORM in tests | Tests mocks, not real behavior | Use real test database |
| Logging PII/tokens | Security breach | Never log sensitive data |
| Commit message pile-ups on main | Dirty history | Squash or rebase locally first |
| Commented-out code "just in case" | Dead code rots, confuses readers | Delete it; git history preserves it |

---

## 7. Implementation Rules

1. All `tsconfig.json` files have `strict: true` — verify on new packages
2. Every API endpoint has a Zod DTO in the shared package — no hand-parsing
3. Every async React component renders loading + error + success states
4. NestJS controllers use constructor injection only — no `@Inject()` on properties
5. Database queries never concatenate user input — always parameterized
6. Log statements are audited for tokens, passwords, and PII before commit
7. `any` type is only permitted behind typed facades wrapping third-party code
8. Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/)
9. Dead or commented-out code is removed before PR merge
10. CI pipeline passes (typecheck + tests) before merge is allowed

---

## Related Documents

| File | Scope |
|------|-------|
| [prisma.md](./prisma.md) | Database: soft-delete, queries, transactions |
| [nestjs.md](./nestjs.md) | NestJS: modules, controllers, services |
| [react.md](./react.md) | React: components, hooks, state architecture |
| [rxdb.md](./rxdb.md) | RxDB: replication, local-first, offline |
| [auth.md](./auth.md) | Auth: OIDC, JWT, guards, lock identity |
| [monorepo-boundaries.md](./monorepo-boundaries.md) | Imports, shared code, wiki hierarchy |
| [testing-standards.md](./testing-standards.md) | Test pyramid, integration tests, Playwright |
| [production-quality.md](./production-quality.md) | Performance, observability, reliability |
| [ci-guardrails.md](./ci-guardrails.md) | CI gates, lint rules, PR enforcement |
