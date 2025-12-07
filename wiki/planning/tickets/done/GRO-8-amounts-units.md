# GRO-8: Amounts & Units

**Phase**: 3 - Refinement
**Status**: Done

## Context
Users need to specify *how much* of an item to buy (e.g., "2 gallons" of milk). This preference should be remembered. During shopping, they might buy a different amount, which should be flagged in the summary if it's *less* than requested.

## Requirements

### 1. List Creation (Simple Input)
-   **Input Fields**:
    -   Item Name (Text)
    -   Quantity (Number, default 1)
    -   Unit (Text, optional, e.g., "gal", "pcs")
-   **Default Unit**: When adding an item, pre-fill the unit with `Item.defaultUnit` if available.
-   **Update Catalog**: When adding an item with a unit, update `Item.defaultUnit`.

### 2. In-Store Execution (Deviation)
-   **Display**: Show quantity/unit prominently (e.g., "2 gal").
-   **Edit on Check**: Allow user to modify the *purchased* amount when checking off.
    -   *Default*: Assumes purchased amount == requested amount.
    -   *Interaction*: Maybe a stepper or long-press to edit? Or a simple "Edit" button.

### 3. Trip Completion (Summary Logic)
-   **Missing Item Logic**:
    -   If `purchasedAmount < requestedAmount`: Flag as "Partially Found" or "Missing".
    -   If `purchasedAmount >= requestedAmount`: Considered "Found".
-   **Summary Dialog**: Show these discrepancies.

## Technical Changes

### Schema
-   `Item`: Add `defaultUnit` (String?).
-   `ListItem`:
    -   Add `quantity` (Float, default 1).
    -   Add `unit` (String?).
    -   Add `purchasedQuantity` (Float?).

### UI
-   `ListEditor`: Update input parsing.
-   `ListItem`: Display quantity. Add UI to edit purchased quantity.
-   `TripSummary`: Update logic to compare requested vs purchased.
