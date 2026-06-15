---
name: grocerun-documentation-extraction
description: Use after Grocerun feature acceptance or review findings to decide whether wiki docs, ADRs, patterns, rules, guides, or tickets need updating.
---

# Grocerun Documentation Extraction

Use this skill after implementation/review/UAT to promote durable knowledge into
canonical documentation.

## Routing table

| Durable knowledge | Destination |
|---|---|
| Architectural decision | `wiki/adr/` |
| Stable implementation pattern | `wiki/patterns/` |
| Coding convention or recurring rule | `wiki/rules/` |
| Developer procedure | `wiki/development/` |
| Domain concept | `wiki/concepts/` |
| Current phase/status | `planning/tickets/PROJECT-STATUS.md` |
| Follow-up work | `planning/tickets/` or intake |

## Extraction checklist

```markdown
## Documentation Extraction

- **User/developer guide update:** yes/no — rationale
- **Pattern doc:** yes/no — rationale
- **Coding rule:** yes/no — rationale
- **ADR:** yes/no — rationale
- **Project status:** yes/no — rationale
- **Follow-up ticket/intake item:** yes/no — rationale
```

## Repeated findings

If oracle, UAT, or implementation notes reveal recurring issues, decide whether
they should become:

- a coding rule
- a stable implementation pattern
- a planning template section
- an ADR update
- a developer guide note
- a follow-up ticket instead of canonical documentation
