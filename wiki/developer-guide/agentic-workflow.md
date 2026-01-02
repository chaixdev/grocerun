# Agentic Development Workflow

This document outlines the standard operating procedure for AI agents (and human developers) working on Grocerun tickets. Follow this process strictly to ensure architectural integrity and code quality.

## 1. Planning Phase

**Trigger:** User provides a Ticket Number (e.g., "GRO-110").

1.  **Context Gathering**:
    *   Read the ticket file from `wiki/planning/tickets/`.
    *   Identify and read relevant context mentioned in the ticket (Design Docs, User Stories, existing source code, component files).
    *   *Goal:* Build a complete mental model of the requirement.

2.  **Architectural Assessment**:
    *   Analyze how this feature impacts the current system (Database, Sync Protocol, UI Components).
    *   Identify potential risks (breaking changes, performance bottlenecks, schema conflicts).

3.  **Strategy Proposal**:
    *   Develop **3 Distinct Strategies** to solve the problem.
    *   For each strategy, provide:
        *   **Description**: High-level approach.
        *   **Fit**: How it integrates with the current code and overarching architecture (Local-First).
        *   **Pros**: Benefits of this approach.
        *   **Cons**: Drawbacks or trade-offs.
    *   *Constraint:* Strategies 2 and 3 must offer meaningful trade-offs (e.g., "Quick & Dirty" vs. "Robust & Complex" vs. "Experimental/Novel"), addressing the cons of the previous proposals.

4.  **Recommendation & Consensus**:
    *   State your **Preferred Solution** clearly.
    *   **STOP and AWAIT** user feedback.
    *   Discuss and refine the approach until the user explicitly approves a plan.

## 2. Execution Phase

**Trigger:** User approves a strategy.

1.  **Preparation**:
    *   Ensure `git status` is clean.
    *   Create a new branch: `git checkout -b feature/GRO-XXX-description`.

2.  **Implementation**:
    *   Write code following the [DevOps Philosophy](./devops-philosophy.md) and [Architecture](./architecture.md) guidelines.
    *   Commit frequently: Each reasonably scoped step should be a separate commit.

3.  **Validation Loop**:
    *   Verify the solution locally (run tests, check UI, verify DB state).
    *   If verification is difficult (e.g., complex sync scenarios), ask the user for assistance.
    *   **Iterate** until the solution is functional and robust.

4.  **User Sign-off**:
    *   Demonstrate the working solution to the user.
    *   The phase is **NOT complete** until the user is satisfied and has validated the implementation locally.

## 3. Debrief Phase

**Trigger:** Implementation is validated and approved.

1.  **Documentation Update**:
    *   Update **Reference Documentation** in `wiki/` (e.g., `architecture.md`, `domain_model.md`).
    *   *Critical:* Ensure ALL existing documentation is consistent with the new implementation. If code changed, docs must change.

2.  **New Design Artifacts**:
    *   Assess if a new mechanism was introduced.
    *   If yes, create a new design document in `wiki/design/` (e.g., `wiki/design/new-sync-mechanism.md`).

3.  **Finalization**:
    *   Commit the documentation changes.
    *   Push the branch: `git push -u origin feature/GRO-XXX`.
    *   Mark the ticket as **Done** in the roadmap and ticket file.
