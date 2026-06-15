---
name: grocerun-doc-writer
description: >
  Produces a wiki markdown file following the target folder's README template.
  Load when asked to "document this", "write a wiki doc", or "create technical
  design doc".
---

# Grocerun Documentation Writer

## What I Do

I produce a markdown file in `wiki/{folder}/` following the folder's README template.
I document implemented mechanisms, not speculative designs. I will NOT produce
planning docs, ADRs, or user-guides — those have their own separate conventions.

## Inputs Required

- The target wiki folder (e.g. `wiki/technical-design/`)
- That folder's `README.md` — defines template outline, scope boundaries, and naming
- Source code implementing the feature — I read source, never document from memory

## Methodology

### Framework

Four principles guide every document:

1. **Source-as-truth** — every behavioral claim is traceable to `path/to/file.ts:line`
2. **README-driven** — the folder README is the authoritative spec for scope and shape
3. **Mermaid-or-nothing** — every diagram must be Mermaid (`stateDiagram-v2`,
   `sequenceDiagram`, `graph TB`, `erDiagram`); ASCII art is never acceptable
4. **Cross-link discipline** — every doc links to related docs using relative wiki paths
   (e.g. `[text](../architecture/domain-model.md)`)

### Invariants

These must always be true regardless of topic:

- All diagrams use ` ```mermaid ` fences — zero ASCII art
- All source references use `apps/server/src/.../file.ts:42-58` format
- Entity and field names match `schema.prisma` or `apps/_shared/dtos/` exactly
- No stale terminology: no `CatalogItem`, `clerkId`, `NextAuth`, or `PostgreSQL`
  unless the project actually still uses them
- The document slug matches the topic name in the folder README's candidate list

### Pipeline

1. **Read the folder README** — extract the template outline, scope boundaries, "what does
   not belong here" table, and naming conventions
2. **Read the source code** — trace the full mechanism end to end across all files listed
   in the task prompt
3. **Draft following the README outline** — include only sections that clarify the
   mechanism (not every section every time); prefer the README's prescribed structure
4. **Render ALL diagrams as Mermaid** — consult the `mermaid-writer` skill for syntax
   gotchas when uncertain about a diagram type
5. **Cross-check**: source file paths are real, entity names match Prisma/DTOs, cross-links
   resolve to existing files, no stale terminology

### Consistency Rules (hard)

| Rule | Check |
|------|-------|
| Source references | Every behavioral claim cites `file:line` |
| Diagram format | Every diagram is ` ```mermaid `; zero ASCII art |
| Terminology | Field names match `schema.prisma`; no outdated auth/DB terms |
| Cross-links | All `../folder/doc.md` links resolve to existing files |
| Slug naming | kebab-case, matches the folder README's candidate slugs |
| One mechanism per doc | One markdown file per feature — do not merge unrelated topics |

## Output Format

Write exactly one file: `wiki/{folder}/{topic-slug}.md`

Follow the folder README's prescribed outline. If the README specifies sections
(Purpose, Scope, State Model, Call Sequence, Layer Boundaries, Key Types, Failure Modes,
Tests, Related Docs), use them. Skip sections that do not clarify the mechanism.

Naming convention:
- `topic-slug.md` (kebab-case, match the folder README's candidate list)
- Example: `shopping-list-state-machine.md`, `rxdb-sync-protocol.md`
- Do NOT use dates in wiki doc filenames — dates belong in `planning/`

## Edge Cases

### No folder yet
If the topic needs a folder that doesn't exist, stop and ask the user. State what folder,
why it's needed, and how it fits in the wiki taxonomy. Do not create folders without approval.

### Stale existing doc
If a wiki page for this feature already exists but is outdated:
1. Compare against current source code
2. List what's stale (wrong field names, missing states, outdated paths)
3. Ask the user whether to replace in-place or create a new version

### Template mismatch
If the folder README's outline does not fit the mechanism, state which sections are
forced and which are natural. Ask the user whether to adapt or skip.

### Source code not found
If referenced source paths do not exist, stop and ask. Do not document from memory.

## Composability

### Upstream skills

- `grocerun-knowledge-sources` — identifies the correct wiki folder and key source files
  for a given topic
- `grocerun-coding-style` — provides naming and convention rules docs must reference

### Downstream

- The orchestrator reads the produced markdown and may delegate review to
  `grocerun-deep-reviewer`
- Future `grocerun-doc-writer` invocations may cite this doc via cross-links
