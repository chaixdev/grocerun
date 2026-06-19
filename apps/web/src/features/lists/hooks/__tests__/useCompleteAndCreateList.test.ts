import { describe, it, expect, beforeEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { toast } from "sonner"
import { useCompleteAndCreateList } from "../useCompleteAndCreateList"
import { useCompleteList, useCreateList } from "../useLists"
import { useAddItem } from "../useAddItem"

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted above imports by vitest)
// ---------------------------------------------------------------------------

vi.mock("sonner", () => {
  const toast = Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  })
  return { toast }
})

vi.mock("../useLists", () => ({
  useCompleteList: vi.fn(),
  useCreateList: vi.fn(),
}))

vi.mock("../useAddItem", () => ({
  useAddItem: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const missingItems = [
  { id: "item-1", name: "Milk", quantity: 2, unit: "gallon" },
  { id: "item-2", name: "Bread", quantity: 1, unit: null },
  { id: "item-3", name: "Eggs", quantity: 12, unit: "count" },
]

const defaultNewList = {
  id: "new-list-id",
  name: "New List",
  storeId: "store-1",
  status: "PLANNING" as const,
  updatedAt: "2024-01-01T00:00:00Z",
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
})

/** Create fresh mock objects for the three hook dependencies. */
function setupMocks() {
  const mockCompleteList = { mutateAsync: vi.fn() }
  const mockCreateList = { mutateAsync: vi.fn() }
  const mockAddItem = { mutateAsync: vi.fn() }

  vi.mocked(useCompleteList).mockReturnValue(mockCompleteList as unknown as ReturnType<typeof useCompleteList>)
  vi.mocked(useCreateList).mockReturnValue(mockCreateList as unknown as ReturnType<typeof useCreateList>)
  vi.mocked(useAddItem).mockReturnValue(mockAddItem as unknown as ReturnType<typeof useAddItem>)

  return { mockCompleteList, mockCreateList, mockAddItem }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useCompleteAndCreateList", () => {
  it("happy path — all items added successfully", async () => {
    const { mockCompleteList, mockCreateList, mockAddItem } = setupMocks()

    mockCompleteList.mutateAsync.mockResolvedValue({ success: true })
    mockCreateList.mutateAsync.mockResolvedValue(defaultNewList)
    mockAddItem.mutateAsync.mockResolvedValue({ status: "ADDED" })

    const { result } = renderHook(() => useCompleteAndCreateList())

    const outcome = await act(async () => {
      return result.current.execute("list-1", "store-1", missingItems)
    })

    expect(outcome).toEqual({
      completeSucceeded: true,
      createSucceeded: true,
      addedCount: 3,
      failedCount: 0,
    })

    expect(toast.success).toHaveBeenCalledWith(
      "New list created with 3 items.",
    )
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("completeList fails — execution stops early", async () => {
    const { mockCompleteList, mockCreateList, mockAddItem } = setupMocks()

    mockCompleteList.mutateAsync.mockRejectedValue(
      new Error("complete failed"),
    )

    const { result } = renderHook(() => useCompleteAndCreateList())

    const outcome = await act(async () => {
      return result.current.execute("list-1", "store-1", missingItems)
    })

    expect(outcome).toEqual({
      completeSucceeded: false,
      createSucceeded: false,
      addedCount: 0,
      failedCount: 0,
    })

    expect(mockCreateList.mutateAsync).not.toHaveBeenCalled()
    expect(mockAddItem.mutateAsync).not.toHaveBeenCalled()
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("createList fails after completeList succeeds", async () => {
    const { mockCompleteList, mockCreateList, mockAddItem } = setupMocks()

    mockCompleteList.mutateAsync.mockResolvedValue({ success: true })
    mockCreateList.mutateAsync.mockRejectedValue(
      new Error("create failed"),
    )

    const { result } = renderHook(() => useCompleteAndCreateList())

    const outcome = await act(async () => {
      return result.current.execute("list-1", "store-1", missingItems)
    })

    expect(outcome).toEqual({
      completeSucceeded: true,
      createSucceeded: false,
      addedCount: 0,
      failedCount: 0,
      errorMessage: "Failed to create new list",
    })

    expect(toast.error).toHaveBeenCalledWith(
      "Trip completed, but failed to create new list.",
    )
    expect(mockAddItem.mutateAsync).not.toHaveBeenCalled()
  })

  it("partial addItem failures", async () => {
    const { mockCompleteList, mockCreateList, mockAddItem } = setupMocks()

    mockCompleteList.mutateAsync.mockResolvedValue({ success: true })
    mockCreateList.mutateAsync.mockResolvedValue(defaultNewList)

    // 2 succeed, 1 returns an ERROR status
    mockAddItem.mutateAsync
      .mockResolvedValueOnce({ status: "ADDED" })
      .mockResolvedValueOnce({ status: "ADDED" })
      .mockResolvedValueOnce({ status: "ERROR", error: "Item not found" })

    const { result } = renderHook(() => useCompleteAndCreateList())

    const outcome = await act(async () => {
      return result.current.execute("list-1", "store-1", missingItems)
    })

    expect(outcome).toEqual({
      completeSucceeded: true,
      createSucceeded: true,
      addedCount: 2,
      failedCount: 1,
    })

    // failedCount > 0 → aggregated toast (default export, not toast.success)
    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining("2 items added"),
    )
    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining("1 failed"),
    )
    expect(toast.success).not.toHaveBeenCalled()
  })

  it("addItem throws (network error) — counts as failed and continues", async () => {
    const { mockCompleteList, mockCreateList, mockAddItem } = setupMocks()

    mockCompleteList.mutateAsync.mockResolvedValue({ success: true })
    mockCreateList.mutateAsync.mockResolvedValue(defaultNewList)

    // 2 succeed, 1 throws
    mockAddItem.mutateAsync
      .mockResolvedValueOnce({ status: "ADDED" })
      .mockResolvedValueOnce({ status: "ADDED" })
      .mockRejectedValueOnce(new Error("Network error"))

    const { result } = renderHook(() => useCompleteAndCreateList())

    const outcome = await act(async () => {
      return result.current.execute("list-1", "store-1", missingItems)
    })

    expect(outcome).toEqual({
      completeSucceeded: true,
      createSucceeded: true,
      addedCount: 2,
      failedCount: 1,
    })
  })

  it("tracks isExecuting state correctly", async () => {
    const { mockCompleteList, mockCreateList, mockAddItem } = setupMocks()

    // Defer the complete promise so we can observe the in-flight state
    let resolveComplete!: (value: unknown) => void
    const completePromise = new Promise((resolve) => {
      resolveComplete = resolve
    })

    mockCompleteList.mutateAsync.mockReturnValue(completePromise)
    mockCreateList.mutateAsync.mockResolvedValue(defaultNewList)
    mockAddItem.mutateAsync.mockResolvedValue({ status: "ADDED" })

    const { result } = renderHook(() => useCompleteAndCreateList())

    // Before execution
    expect(result.current.isExecuting).toBe(false)

    // Start execution (the sync part triggers setIsExecuting(true))
    let executePromise: Promise<unknown>
    act(() => {
      executePromise = result.current.execute("list-1", "store-1", missingItems)
    })

    // During execution — step 1 is awaiting our deferred promise
    expect(result.current.isExecuting).toBe(true)

    // Let the full chain complete
    await act(async () => {
      resolveComplete({ success: true })
      await executePromise
    })

    // After execution
    expect(result.current.isExecuting).toBe(false)
  })
})
