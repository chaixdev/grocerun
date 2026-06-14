# Brainstorm

Speculative solution exploration and design proposals.

Documents here explore **how** to solve a problem. They are not committed work
items, and the solutions they describe may change significantly before
implementation.

## Naming Convention

All files use an ISO datetime prefix: `YYYY-MM-DDTHHMM_topic-slug.md`

This ensures chronological sorting and disambiguates same-day iterations.
Generate with: `date +%Y-%m-%dT%H%M`

## Promotion

When a brainstorm proposal is accepted as a work item:
1. Create a ticket in `planning/tickets/` with the scoped implementation plan
2. Link back to the brainstorm doc for design rationale
3. The brainstorm doc remains as historical context

When the implementation is complete and the solution is stable, promote:
- Architectural decisions → `wiki/adr/`
- Stable mechanisms → `wiki/patterns/`
- Durable abstractions → `wiki/concepts/`
