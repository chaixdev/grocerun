// Shared query keys for household-related queries.
// Extracted to break circular dependency between useHouseholds and useInvitations.

export const householdKeys = {
  all: ["households"] as const,
}

export const settingsHouseholdKeys = {
  all: ["settings-households"] as const,
}
