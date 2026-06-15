# App Feature Tour

This guide walks through everything the Grocerun app does, from sign-in to trip
completion. It is written for people using the app on their phone or desktop.

## Signing in

Grocerun uses Google Sign-In. Tap the **Sign in with Google** button on the
login page, pick your Google account, and you are in.

The app keeps you signed in across visits. If you come back after closing the
browser tab, you will be taken straight to your lists.

## Households

A household is your shared shopping space. Everyone in a household sees the
same stores, sections, and lists.

### Create a household

From `/households`, tap **New Household**, give it a name, and save. The first
household is typically created automatically when you sign in.

### Manage members

Each household card shows whether you are the **Owner** or a **Member**. Owners
can rename and delete the household and invite new members.

### Invite someone

1. As owner, tap **Invite** on the household card.
2. A single-use code appears — copy it and share it (text, email, whatever).
3. The recipient opens the app, goes to **Settings → Households**, pastes the
   code, and taps **Join Household**.

Invitation codes expire after 24 hours by default.

### Leave or delete

- Members can **Leave** the household.
- Owners can **Delete** the household only if they are the last member.

## Stores

A store is a physical grocery location. Each store lives inside a household.

### Add a store

From `/stores`, tap **Add Store**. Give it a name and optionally a location.

### Sections (aisles)

Inside each store, you define sections in the order you walk through the store.
For example: Produce → Dairy → Bakery → Frozen → Checkout.

- **Add a section**: Tap **Add Section**, type the name, press Enter.
- **Reorder sections**: Drag the handle on the right to rearrange.
- **Rename or delete**: Tap the section name or the delete icon.

## Shopping Lists

A list is a single shopping trip for one store. Only one active list can exist
per store at a time.

### Create a list

From `/lists`, find the store you want to shop at and tap **New List**.

### Add items

Type an item name in the input field. The app suggests matching items from your
catalog. If it is a brand-new item, a dialog asks which section it belongs in.
Tap the item to add it with a default quantity of 1.

Adjust quantity with the **+ / −** stepper, or tap the quantity number to edit
it directly.

### Planning mode

A new list starts in **Planning** mode. You can add, edit, and remove items
freely. When you are ready to shop, tap the **Go Shopping** button (disabled if
the list is empty).

## Shopping mode

When you tap **Go Shopping**:

- Items are grouped by section, with sticky section headers.
- The screen stays on (wake lock) while you shop.
- Tap an item to check it off — the list auto-scrolls to the next unchecked
  item.
- Newly added items flash briefly to draw your attention.

### Shopping lock

While you are in Shopping mode, other household members see a banner: "X is
shopping" and the list becomes read-only. They can still watch the list update
in real time.

### Cancel shopping

Tap **Cancel Shopping** to return to Planning mode. All checked items are
preserved.

## Completing a trip

Tap **Finish** to see the Trip Summary:

- If all items are checked: "All done!" — tap **Complete Trip**.
- If some items are unchecked: a list of missing items is shown. You can
  **Resume Shopping** or **Complete Trip** anyway.

Completed lists are archived and visible in the "Archived" section under each
store.

## Settings

Open `/settings` from the bottom nav or sidebar.

| Section | What you can do |
|---|---|
| Profile | Update display name and avatar URL |
| Appearance | Toggle between Light, Dark, and System theme |
| Households | Create, join, or leave households |

## Mobile navigation

On phones, a bottom tab bar lets you switch between:

| Tab | Destination |
|---|---|
| Lists | `/lists` — your active shopping lists |
| Stores | `/stores` — manage stores and sections |
| Settings | `/settings` — profile, theme, households |

On desktop, the same navigation appears as a collapsible sidebar.

## Coming later

Offline shopping (Phase 4), voice input, and smart recipe integration are
planned but not yet available.

---

**Last Updated:** June 15, 2026
