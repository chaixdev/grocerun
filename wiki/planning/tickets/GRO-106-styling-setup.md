# GRO-106: Tailwind + Shadcn UI Setup

**Status:** 🔲 In Progress  
**Phase:** 0 - Architecture Foundation  
**User Story:** N/A (Infrastructure)

## Description
Set up Tailwind CSS and Shadcn UI component library in the client application.

## Acceptance Criteria
- [x] Tailwind CSS installed and configured
- [x] PostCSS configured with `@tailwindcss/postcss`
- [ ] Shadcn UI initialized
- [ ] Base components copied (Button, Input, Card)
- [ ] Theme configuration (colors, fonts)
- [ ] Dark mode support via CSS variables

## Implementation Notes
- Using Tailwind CSS 4.x (requires `@tailwindcss/postcss` plugin)
- Shadcn UI for consistent component library
- Port color scheme from legacy app

## Files to Create
- `apps/client/tailwind.config.js` ✅
- `apps/client/postcss.config.js` ✅
- `apps/client/src/index.css` (with Tailwind directives) ✅
- `apps/client/components.json` (Shadcn config)
- `apps/client/src/components/ui/` (Shadcn components)
