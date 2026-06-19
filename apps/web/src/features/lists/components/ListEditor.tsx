
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ItemAutocomplete } from "./ItemAutocomplete"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { TripSummary } from "./TripSummary"
import { useRouter } from "@tanstack/react-router"
import { useOidc } from "@/core/auth/oidc"
import { getCachedAppUser } from "@/core/auth/session"
import { ShoppingCart, CheckCheck, X } from "lucide-react"
import { ListItemRow } from "./ListItemRow"
import { useScreenWakeLock } from "@/hooks/use-screen-wake-lock"
import { QuantityStepper } from "./QuantityStepper"
import { EditItemDialog } from "./EditItemDialog"
import {
    useToggleItem,
    useRemoveItem,
    useUpdateItemQuantity,
    useStartShopping,
    useCancelShopping,
    useCompleteList,
} from "../hooks/useLists"
import { useAddItem } from "../hooks/useAddItem"
import { useCompleteAndCreateList } from "../hooks/useCompleteAndCreateList"
import type {
    ListDetail,
    ListDetailItem,
    ListDetailListItem,
} from "../hooks/useListQueries"

interface ListEditorProps {
    list: ListDetail
}

export function ListEditor({ list }: ListEditorProps) {
    const router = useRouter()
    const [inputValue, setInputValue] = useState("")
    const [inputQty, setInputQty] = useState(1)
    const [inputUnit, setInputUnit] = useState("")

    // Mutations
    const addItem = useAddItem()
    const toggleItem = useToggleItem()
    const removeItem = useRemoveItem()
    const updateQuantity = useUpdateItemQuantity()
    const startShoppingMut = useStartShopping()
    const cancelShoppingMut = useCancelShopping()
    const completeListMut = useCompleteList()
    const completeAndCreate = useCompleteAndCreateList()

    // Toggle: create new list from unchecked items on completion.
    // Persisted to localStorage so preference sticks across sessions.
    const CREATE_LIST_TOGGLE_KEY = "grocerun-pref-create-list-from-unchecked"
    const [createListChecked, setCreateListChecked] = useState(() => {
      try {
        const stored = localStorage.getItem(CREATE_LIST_TOGGLE_KEY)
        // Default to checked (on) if nothing stored.
        return stored !== null ? stored === "true" : true
      } catch {
        return true
      }
    })

    // Refs for auto-scroll
    const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null)

    // State for "New Item" dialog
    const [newItemName, setNewItemName] = useState<string | null>(null)
    const [selectedSection, setSelectedSection] = useState<string>("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Trip Completion State
    const [isSummaryOpen, setIsSummaryOpen] = useState(false)

    // Edit Item State
    const [editingItem, setEditingItem] = useState<ListDetailItem | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)

    // Screen Wake Lock for Shopping Mode
    const oidc = useOidc()
    const authSubject = oidc.isUserLoggedIn ? oidc.decodedIdToken.sub : getCachedAppUser()?.sub
    const isReadOnly = list.status === "COMPLETED"
    const isPlanningMode = list.status === "PLANNING"
    const isShoppingMode = list.status === "SHOPPING"
    const isLockHolder = !isShoppingMode || list.assignedTo === authSubject
    const isShoppingLockedForOtherUser = isShoppingMode && !isLockHolder

    useScreenWakeLock(isShoppingMode)

    const isSubmitting = addItem.isPending

    // Helper: highlight a newly added item after refetch
    const highlightItem = (itemId: string) => {
        setTimeout(() => {
            const el = itemRefs.current[itemId]
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" })
                setHighlightedItemId(itemId)
                setTimeout(() => setHighlightedItemId(null), 2000)
            }
        }, 100)
    }

    const handleAddItem = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (isSubmitting || isShoppingLockedForOtherUser) return
        if (!inputValue.trim()) return

        addItem.mutate(
            {
                listId: list.id,
                name: inputValue.trim(),
                quantity: inputQty,
                unit: inputUnit.trim() || undefined,
            },
            {
                onSuccess: (result) => {
                    if (result.status === "ADDED" && result.listItem) {
                        setInputValue("")
                        setInputQty(1)
                        setInputUnit("")
                        toast.success("Item added")
                        highlightItem(result.listItem.id)
                    } else if (result.status === "ALREADY_EXISTS") {
                        setInputValue("")
                        toast.info("Item already in list")
                    } else if (result.status === "NEEDS_SECTION") {
                        setNewItemName(inputValue.trim())
                        setSelectedSection("")
                        setIsDialogOpen(true)
                    } else if (result.status === "ERROR") {
                        toast.error(result.error || "Failed to add item")
                    }
                },
                onError: () => {
                    toast.error(isShoppingLockedForOtherUser ? "This list is locked by another shopper" : "Failed to add item")
                },
            }
        )
    }

    // Handle selection from autocomplete - directly add the item
    const handleSelectFromAutocomplete = (item: {
        id: string
        name: string
        sectionId: string | null
        defaultUnit: string | null
    }) => {
        addItem.mutate(
            {
                listId: list.id,
                name: item.name,
                sectionId: item.sectionId || undefined,
                quantity: inputQty,
                unit: item.defaultUnit || inputUnit.trim() || undefined,
            },
            {
                onSuccess: (result) => {
                    if (result.status === "ADDED" && result.listItem) {
                        setInputValue("")
                        setInputQty(1)
                        setInputUnit("")
                        toast.success(`Added ${item.name}`)
                        highlightItem(result.listItem.id)
                    } else if (result.status === "ALREADY_EXISTS") {
                        setInputValue("")
                        toast.info(`${item.name} is already in list`)
                    } else if (result.status === "ERROR") {
                        toast.error(result.error || "Failed to add item")
                    }
                },
                onError: () => {
                    toast.error(isShoppingLockedForOtherUser ? "This list is locked by another shopper" : "Failed to add item")
                },
            }
        )
    }

    const handleConfirmNewItem = () => {
        if (!newItemName || isSubmitting) return
        if (isShoppingLockedForOtherUser) {
            toast.error("This list is locked by another shopper")
            return
        }

        addItem.mutate(
            {
                listId: list.id,
                name: newItemName,
                sectionId: selectedSection && selectedSection !== "uncategorized" ? selectedSection : null,
                quantity: inputQty,
                unit: inputUnit.trim() || undefined,
            },
            {
                onSuccess: (result) => {
                    if (result.status === "ERROR") {
                        toast.error(result.error || "Failed to create item")
                    } else {
                        setInputValue("")
                        setNewItemName(null)
                        setInputQty(1)
                        setInputUnit("")
                        setIsDialogOpen(false)
                        toast.success("Item created and added")
                    }
                },
                onError: () => {
                    toast.error(isShoppingLockedForOtherUser ? "This list is locked by another shopper" : "Failed to create item")
                },
            }
        )
    }

    const handleToggle = (itemId: string, checked: boolean, purchasedQuantity?: number) => {
        if (isShoppingLockedForOtherUser) {
            toast.error("This list is locked by another shopper")
            return
        }
        toggleItem.mutate(
            {
                itemId,
                isChecked: checked,
                purchasedQuantity,
                listId: list.id,
            },
            {
                onSuccess: () => {
                    // Auto-scroll to next unchecked item when checking off
                    if (checked) {
                        autoScrollToNext(itemId)
                    }
                },
            }
        )
    }

    // Auto-scroll logic: find next unchecked item in section order
    const autoScrollToNext = (checkedItemId: string) => {
        const itemsBySection: Record<string, ListDetailListItem[]> = {}
        list.store.sections.forEach((s) => {
            itemsBySection[s.id] = []
        })
        itemsBySection["uncategorized"] = []

        list.items.forEach(item => {
            const sectionId = item.item.sectionId || "uncategorized"
            if (!itemsBySection[sectionId]) itemsBySection[sectionId] = []
            itemsBySection[sectionId].push(item)
        })

        const visualOrder: ListDetailListItem[] = []
        list.store.sections.forEach((s) => {
            visualOrder.push(...(itemsBySection[s.id] || []))
        })
        visualOrder.push(...(itemsBySection["uncategorized"] || []))

        const currentIndex = visualOrder.findIndex(i => i.id === checkedItemId)

        let nextItem: ListDetailListItem | undefined
        for (let i = currentIndex + 1; i < visualOrder.length; i++) {
            if (!visualOrder[i].isChecked) {
                nextItem = visualOrder[i]
                break
            }
        }

        if (nextItem) {
            const el = itemRefs.current[nextItem.id]
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "center" })
                setHighlightedItemId(nextItem.id)
                setTimeout(() => setHighlightedItemId(null), 2000)
            }
        }
    }

    const handleUpdateQuantity = (itemId: string, quantity: number, unit?: string) => {
        if (isShoppingLockedForOtherUser) {
            toast.error("This list is locked by another shopper")
            return
        }
        updateQuantity.mutate({
            listItemId: itemId,
            quantity,
            unit,
            listId: list.id,
        })
    }

    const handleRemoveItem = (itemId: string) => {
        if (isShoppingLockedForOtherUser) {
            toast.error("This list is locked by another shopper")
            return
        }
        removeItem.mutate({ listItemId: itemId, listId: list.id })
    }

    const handleFinishShopping = () => {
        setIsSummaryOpen(true)
    }

    const handleCompleteTrip = () => {
        if (createListChecked && missingItems.length > 0) {
            // Chained flow: complete → create → add unchecked items
            completeAndCreate.execute(list.id, list.store.id, missingItems).then((result) => {
                if (result.completeSucceeded) {
                    // Toast and error handling already managed by the hook
                    // and useCompleteList.onError. Navigate away — the list
                    // is now COMPLETED and read-only.
                    router.navigate({ to: "/lists" })
                }
                // If completeSucceeded is false, the error toast was already
                // shown by useCompleteList.onError. Stay on the list so the
                // user can retry or resume shopping.
            })
        } else {
            // Existing behaviour: just complete
            completeListMut.mutate(
                { listId: list.id, storeId: list.store.id },
                {
                    onSuccess: () => {
                        toast.success("Trip completed!")
                        router.navigate({ to: "/lists" })
                    },
                }
            )
        }
    }

    // Group items by section
    const itemsBySection: Record<string, ListDetailListItem[]> = {}
    list.store.sections.forEach((s) => {
        itemsBySection[s.id] = []
    })
    itemsBySection["uncategorized"] = []

    list.items.forEach((listItem) => {
        const sectionId = listItem.item.sectionId || "uncategorized"
        if (!itemsBySection[sectionId]) {
            itemsBySection[sectionId] = []
        }
        itemsBySection[sectionId].push(listItem)
    })

    // Calculate missing items
    const missingItems = list.items
        .filter(i => !i.isChecked)
        .map(i => ({
            id: i.item.id,
            name: i.item.name,
            quantity: i.quantity,
            unit: i.unit
        }))

    return (
        <div className="space-y-8 pb-32">
            {isReadOnly && (
                <div className="bg-muted/50 border rounded-lg p-4 text-center text-muted-foreground">
                    This trip was completed on {new Date(list.updatedAt).toLocaleDateString()}.
                </div>
            )}

            {!isReadOnly && (
                <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b -mx-4 px-4 py-3 mb-4">
                    {isShoppingLockedForOtherUser && (
                        <div className="mb-3 rounded-lg border border-amber-300/50 bg-amber-100/50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700/50 dark:bg-amber-900/20 dark:text-amber-200">
                            Another household member is currently shopping this list. You can follow updates live, but only they can make changes right now.
                        </div>
                    )}
                    <form onSubmit={handleAddItem} className="flex gap-2 items-center">
                        <div className="flex-1">
                            <Label htmlFor="item-name" className="sr-only">Item Name</Label>
                            <ItemAutocomplete
                                storeId={list.store.id}
                                value={inputValue}
                                onChange={setInputValue}
                                onSelect={handleSelectFromAutocomplete}
                                onSubmit={handleAddItem}
                                placeholder="Add item..."
                                disabled={isSubmitting || isShoppingLockedForOtherUser}
                            />
                        </div>
                        <div className="shrink-0">
                            <QuantityStepper
                                value={inputQty}
                                unit={inputUnit}
                                disabled={isShoppingLockedForOtherUser}
                                onChange={(qty, unit) => {
                                    setInputQty(qty)
                                    setInputUnit(unit || "")
                                }}
                            />
                        </div>
                        <Button type="submit" disabled={isSubmitting || isShoppingLockedForOtherUser} className="h-8 px-3 shrink-0 rounded-lg text-sm font-medium">
                            Add
                        </Button>
                    </form>
                </div>
            )}

            <div className="space-y-6">
                {/* Uncategorized Items — always shown first */}
                {(itemsBySection["uncategorized"]?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                        <h3 className="font-bold text-sm text-primary uppercase tracking-wider sticky top-20 bg-background/95 backdrop-blur py-2 z-10 border-b border-border/40">
                            Uncategorized
                        </h3>
                        <div className="space-y-0">
                            {itemsBySection["uncategorized"].map((listItem) => (
                                <ListItemRow
                                    key={listItem.id}
                                    listItem={listItem}
                                    isReadOnly={isReadOnly}
                                    isLocked={isShoppingLockedForOtherUser}
                                    isHighlighted={highlightedItemId === listItem.id}
                                    isPlanningMode={isPlanningMode}
                                    onToggle={handleToggle}
                                    onEdit={(item) => {
                                        setEditingItem(item)
                                        setIsEditOpen(true)
                                    }}
                                    onRemove={handleRemoveItem}
                                    onUpdateQuantity={handleUpdateQuantity}
                                    itemRef={(el) => { itemRefs.current[listItem.id] = el }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {list.store.sections.map((section) => {
                    const items = itemsBySection[section.id] || []
                    if (items.length === 0) return null

                    return (
                        <div key={section.id} className="space-y-2">
                            <h3 className="font-bold text-sm text-primary uppercase tracking-wider sticky top-20 bg-background/95 backdrop-blur py-2 z-10 border-b border-border/40">
                                {section.name}
                            </h3>
                            <div className="space-y-0">
                                {items.map((listItem) => (
                                    <ListItemRow
                                        key={listItem.id}
                                        listItem={listItem}
                                        isReadOnly={isReadOnly}
                                        isLocked={isShoppingLockedForOtherUser}
                                        isHighlighted={highlightedItemId === listItem.id}
                                        isPlanningMode={isPlanningMode}
                                        onToggle={handleToggle}
                                        onEdit={(item) => {
                                            setEditingItem(item)
                                            setIsEditOpen(true)
                                        }}
                                        onRemove={handleRemoveItem}
                                        onUpdateQuantity={handleUpdateQuantity}
                                        itemRef={(el) => { itemRefs.current[listItem.id] = el }}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>


            {/* Floating Action Button or Footer based on State */}
            {!isReadOnly && (
                <div className="fixed bottom-24 md:bottom-6 left-0 right-0 px-4 flex justify-center z-50 pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-2">
                        {list.status === "PLANNING" ? (
                            <Button
                                size="lg"
                                className="h-14 rounded-full shadow-xl px-8 bg-primary hover:bg-primary/90 transition-all active:scale-95 font-semibold"
                                onClick={() => {
                                    startShoppingMut.mutate(
                                        { listId: list.id, storeId: list.store.id },
                                        {
                                            onSuccess: () => {
                                                toast.success("Shopping mode activated! 🛒")
                                            },
                                        }
                                    )
                                }}
                                disabled={list.items.length === 0 || startShoppingMut.isPending}
                            >
                                <ShoppingCart className="mr-2 h-5 w-5" />
                                Go Shopping
                            </Button>
                        ) : (
                            <>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-14 w-14 rounded-full shadow-lg bg-background border hover:bg-muted"
                                    disabled={cancelShoppingMut.isPending || !isLockHolder}
                                    onClick={() => {
                                        cancelShoppingMut.mutate(
                                            { listId: list.id, storeId: list.store.id },
                                            {
                                                onSuccess: () => {
                                                    toast("Shopping Cancelled", { description: "List reverted to planning mode." })
                                                },
                                            }
                                        )
                                    }}
                                >
                                    <X className="h-5 w-5" />
                                    <span className="sr-only">Cancel Shopping</span>
                                </Button>
                                <Button
                                    size="lg"
                                    className="h-14 rounded-full shadow-xl px-6 bg-tangerine hover:bg-tangerine/90 text-white transition-all active:scale-95"
                                    onClick={handleFinishShopping}
                                    disabled={!isLockHolder}
                                >
                                    <CheckCheck className="mr-2 h-5 w-5" />
                                    Finish ({list.items.filter(i => i.isChecked).length}/{list.items.length})
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <TripSummary
                open={isSummaryOpen}
                onOpenChange={setIsSummaryOpen}
                onConfirm={handleCompleteTrip}
                missingItems={missingItems}
                isSubmitting={completeListMut.isPending || completeAndCreate.isExecuting}
                showCreateToggle
                createToggleChecked={createListChecked}
                onCreateToggleChange={(checked) => {
                    setCreateListChecked(checked)
                    try {
                        localStorage.setItem(CREATE_LIST_TOGGLE_KEY, String(checked))
                    } catch { /* storage unavailable — non-critical */ }
                }}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent data-testid="section-selection-dialog">
                    <DialogHeader>
                        <DialogTitle>New Item: {newItemName}</DialogTitle>
                        <DialogDescription>
                            Where should we find this in the store?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="section">Section</Label>
                            <Select value={selectedSection} onValueChange={setSelectedSection}>
                                <SelectTrigger data-testid="section-select">
                                    <SelectValue placeholder="Select a section" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    <SelectItem value="uncategorized">
                                        Uncategorized
                                    </SelectItem>
                                    {list.store.sections.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="button" data-testid="save-and-add-button" onClick={handleConfirmNewItem} disabled={isSubmitting}>
                            Save & Add
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {
                editingItem && (
                    <EditItemDialog
                        key={editingItem.id}
                        item={{
                            id: editingItem.id,
                            name: editingItem.name,
                            sectionId: editingItem.sectionId,
                            defaultUnit: editingItem.defaultUnit,
                            note: editingItem.note,
                        }}
                        sections={list.store.sections}
                        listId={list.id}
                        open={isEditOpen}
                        onOpenChange={setIsEditOpen}
                        onSuccess={() => {
                            setEditingItem(null)
                        }}
                    />
                )
            }
        </div>
    )
}
