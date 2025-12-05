# GRO-10: UI/UX Overhaul

**Phase**: 4 - Polish & Delight
**Priority**: High
**Status**: Planning

## Goal
Transform the functional "rope bridge" MVP into a modern, compelling, and highly usable mobile-first application.

## Design Pillars
1.  **Mobile-First Ergonomics**: Key actions (add item, check off) must be thumb-accessible.
2.  **Visual Clarity**: Information hierarchy must be obvious. Quantities and units should be distinct from item names.
3.  **Delight**: Interactions should feel snappy and satisfying (e.g., checking off an item).
4.  **Modern Aesthetic**: Move away from "default Bootstrap/Shadcn" look.

## Proposed Changes

### 1. Theme & Typography
-   **Style**: "Compact Modern" (Linear-esque). High density, utility-focused.
-   **Font**: `Inter` (Clean, geometric sans).
-   **Colors**:
    -   **Base**: Neutral Grays (Slate/Zinc).
    -   **Accent**: **Spring Green** (Mint/Emerald) - *User Request*.
    -   **Surface**: White/Off-white with subtle borders (1px solid gray-200).

### 2. Dashboard (`StoreLists`)
-   **Layout**: Compact list cards.
-   **Visuals**: Minimalist. Use borders instead of heavy shadows.
-   **Hero**: Simple greeting, maybe a "Quick Add" button.

### 3. List View (`ListEditor`)
-   **Density**: Reduce padding. Make rows slimmer.
-   **Input**: Keep at top (for now) but style it to blend with the header.
-   **Checkboxes**: Custom styled (Square with rounded corners, green check).
-   **Typography**:
    -   Item Name: Medium weight, dark gray.
    -   Quantity/Unit: Monospace or pill badge, lighter gray.
-   **Actions**: Subtle hover states.

### 4. Trip Summary
-   Make the dialog feel like a "Receipt" or a "Mission Report".
-   Confetti or success animation on completion.

## Technical Tasks
-   [ ] Install `next-themes` (if not already) and configure dark mode.
-   [ ] Update `tailwind.config.ts` with new color tokens.
-   [ ] Refactor `ListEditor` layout for mobile ergonomics.
-   [ ] Add `framer-motion` for micro-interactions (optional but recommended for "delight").
