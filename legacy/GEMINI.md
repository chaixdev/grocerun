# Grocerun Core Development Philosophy

## Principle

**Build a codebase so clear, robust, and structured that an AI agent can navigate, understand, and extend it with minimal friction. Clarity is velocity.**

## Decision Framework

**Engineering Principles (The North Star):**
- **KISS (Keep It Simple, Stupid)**: Complexity is a liability. If a simple solution works, use it.
- **YAGNI (You Ain't Gonna Need It)**: Don't build for hypothetical futures. Solve the problem in front of you.
- **DRY (Don't Repeat Yourself)**: Abstract common logic, but beware of hasty abstractions that couple unrelated code.
- **SOLID**: Apply these principles to keep the codebase flexible and maintainable, especially in the Backend.
- **Clean Code**: Code is read much more often than it is written. Optimize for readability.

## When to Favor Different Approaches

### Favor Simplicity (KISS/YAGNI) When:
- **Defining Interfaces**: Keep DTOs and interfaces flat and obvious.
- **Routing**: Use standard, predictable routing patterns.
- **Configuration**: Use environment variables and strongly typed config services.

### Favor Robustness (SOLID) When:
- **Error Handling**: Agents need explicit error states to debug effectively. Never swallow errors.
- **Data Sync**: List collaboration relies on accurate, real-time state.
- **State Management**: Use predictable state containers. Avoid hidden side effects.

### Favor Flexibility (Clean Code) When:
- **Store Layouts**: The data model must accommodate varying store structures.
- **AI Context**: Leave breadcrumbs (comments, clear variable names) that help future agents understand *why* a decision was made.

## Agentic Workflow Guidelines

- **Plan First**: Before writing code, outline the plan.
- **Propose Alternatives**: For complex tasks, propose 2-3 approaches with trade-offs before implementing.
- **Read Context**: Always read relevant files before modifying. Don't guess.
- **Verify**: Run tests or build steps after every significant change.
- **Atomic Steps**: Break complex tasks into smaller, verifiable steps.

## Stack-Specific Guidelines

### Frontend (Next.js)
- **Structure**: Group related features (components, hooks, types) together.
- **Server vs Client**: Be explicit about boundaries (`'use client'`, `'use server'`).
- **Optimistic UI**: Implement for high-frequency user actions (e.g., checking off items).
- **Styling**: **Tailwind CSS** and **Shadcn UI** are the standard. Focus on composition over custom CSS.
- **Aesthetics**:
    - **Visual Excellence**: The app should feel premium (Glassmorphism, vibrant colors, smooth gradients).
    - **Dynamic**: Use micro-animations for interactions (hover, click, check-off).
    - **Responsiveness**: Mobile-first, but "wow" the user on all devices.

### Backend (NestJS)
- **Architecture**: Strictly follow NestJS module architecture. It provides a predictable map for agents.
- **DTOs**: Use `class-validator` and `class-transformer`. This ensures types are enforced at runtime, catching agent hallucinations early.
- **OpenAPI**: Maintain Swagger/OpenAPI decorators. This allows agents to understand the API surface area instantly.

## Code Quality Standards

- **Self-Documenting**: Variable and function names must be descriptive. `processData` is bad; `sortItemsByStoreSection` is good.
- **Linting**: Zero tolerance for lint errors.
- **Testing**:
    - **Unit**: For all business logic.
    - **Integration**: For API endpoints.
    - **E2E**: For critical user flows.

## Anti-Patterns to Avoid

### ❌ Don't:
- Create massive files (>300 lines) unless necessary.
- Use `any` or loose typing.
- Leave "dead code" or commented-out blocks (confuses agents).
- Rely on implicit global state.

### ✅ Do:
- Add JSDoc/TSDoc for complex logic.
- Create explicit types for all API responses.
- Use meaningful file names that reflect the content.

## Core Principle Reminder

**We are building a system where human intent translates seamlessly into software. The code is the medium of communication. Keep it clean, keep it typed, keep it explicit.**
