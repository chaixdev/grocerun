# Grocerun Development Workflow (SDLC)

## Core Philosophy
**See**: `GEMINI.md` for core principles (KISS, YAGNI, SOLID).
**Goal**: Balance structured, robust code with the agility of a solo developer.

## Issue/Feature Implementation Workflow

### Phase 1: Context Gathering
Before writing code, ensure complete understanding:
1.  **Read Vision**: Review `pitch.md` and `GEMINI.md`.
2.  **Audit Existing**: Check relevant components in `app/`, `components/`, and `lib/`.
3.  **Check Data**: Review `prisma/schema.prisma` for data model implications.

### Phase 2: Solution Design (The "Plan")
**Artifact**: `implementation_plan.md`
1.  **Draft Plan**: Create or update `implementation_plan.md` for the feature.
2.  **Propose Alternatives**: If complex, outline 2-3 approaches (e.g., "Server Action vs API Route", "Client State vs URL State").
3.  **Select Approach**: Evaluate based on Simplicity (KISS) and Robustness.

### Phase 3: User Alignment
1.  **Review**: Present the plan to the User via `notify_user`.
2.  **Iterate**: Refine based on feedback.
3.  **Approval**: **MANDATORY** before writing implementation code.

### Phase 4: Test-Driven / Component-Driven Implementation
**Prerequisite**: Approved Plan.

1.  **Data Layer**: Update `schema.prisma` and run `npx prisma migrate dev` (or `db push` for prototyping).
2.  **Logic/Utils**: Write unit tests (`npm test`) for pure business logic (e.g., sorting, pricing).
3.  **Components**: Build UI components in isolation (Storybook optional, or just test page).
4.  **Integration**: Connect UI to Data (Server Actions / API).

**Tech Stack Specifics**:
- **Frontend**: Next.js App Router, Tailwind CSS, Shadcn UI.
- **Backend**: Next.js Server Actions (preferred for simple mutations) or Route Handlers.
- **DB**: Prisma + SQLite.

### Phase 5: Verification
**Gate**: "Show Me It Works"

1.  **Automated Checks**:
    - `npm run lint`: No lint errors.
    - `npm run type-check`: No TS errors.
    - `npm test`: All unit tests pass.
2.  **Manual Verification**:
    - Run `npm run dev`.
    - Walk through the user flow.
    - Verify database state (Prisma Studio).
3.  **User Demo**: Create a `walkthrough.md` or simple screenshot/video proof if requested.

### Phase 6: Documentation & Commit
1.  **Update Docs**: Update `task.md` (mark complete), `GEMINI.md` (if rules changed).
2.  **Commit**:
    ```bash
    git add .
    git commit -m "feat: [description]"
    ```

## Quality Assurance Checklist
- [ ] **Type Safety**: No `any`, full DTOs/Interfaces.
- [ ] **Error Handling**: UI handles loading/error states gracefully.
- [ ] **Mobile Responsiveness**: Verified on mobile view.
- [ ] **Clean Code**: No console logs, unused imports, or dead code.
