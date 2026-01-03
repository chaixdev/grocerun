"use client"

import { useState, useOptimistic, useRef, useTransition } from "react"
import { addItemToList, toggleListItem, removeItemFromList, startShopping, cancelShopping, updateListItemQuantity } from "@/actions/list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ItemAutocomplete } from "./ItemAutocomplete"
import { Checkbox } from "@/components/ui/checkbox"
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
import { completeList } from "@/actions/list"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Pencil, Trash2, ShoppingCart, CheckCheck, X } from "lucide-react"
import { ListItemRow } from "./ListItemRow"
import { useScreenWakeLock } from "@/hooks/use-screen-wake-lock"
import { QuantityStepper } from "./QuantityStepper"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditItemDialog } from "./EditItemDialog"

interface Section {
    id: string
    name: string
}

interface Item {
    id: string
    name: string
    sectionId: string | null
    defaultUnit: string | null
    purchaseCount?: number
}

interface ListItem {
    id: string
    isChecked: boolean
    quantity: number
    unit: string | null
    purchasedQuantity: number | null
    item: Item
}

interface ListData {
    id: string
    store: {
        id: string
        sections: Section[]
    }
    items: ListItem[]
    status: string
    updatedAt: Date
}

interface ListEditorProps {
    list: ListData
}

export function ListEditor({ list }: ListEditorProps) {
    const router = useRouter()
    const [inputValue, setInputValue] = useState("")
    const [inputQty, setInputQty] = useState(1)
    const [inputUnit, setInputUnit] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Optimistic UI
    type OptimisticAction =
        | { type: "TOGGLE"; itemId: string; isChecked: boolean; purchasedQuantity?: number | null }
        | { type: "UPDATE_QTY"; itemId: string; quantity: number; unit?: string }
        | { type: "REMOVE"; itemId: string }

    // Optimistic UI
    const [optimisticItems, setOptimisticItems] = useOptimistic(
        list.items,
        (state, action: OptimisticAction) => {
            switch (action.type) {
                case "TOGGLE":
                    return state.map((item) =>
                        item.id === action.itemId ? {
                            ...item,
                            isChecked: action.isChecked,
                            purchasedQuantity: action.purchasedQuantity !== undefined ? action.purchasedQuantity : item.purchasedQuantity
                        } : item
                    )
                case "UPDATE_QTY":
                    return state.map((item) =>
                        item.id === action.itemId ? {
                            ...item,
                            quantity: action.quantity,
                            unit: action.unit !== undefined ? action.unit : item.unit
                        } : item
                    )
                case "REMOVE":
                    return state.filter((item) => item.id !== action.itemId)
                default:
                    return state
            }
        }
    )

    // Refs for auto-scroll
    const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})
    const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null)

    // State for "New Item" dialog
    const [newItemName, setNewItemName] = useState<string | null>(null)
    const [selectedSection, setSelectedSection] = useState<string>("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    // Trip Completion State
    const [isSummaryOpen, setIsSummaryOpen] = useState(false)
    const [isCompleting, setIsCompleting] = useState(false)

    // Edit Item State
    const [editingItem, setEditingItem] = useState<Item | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)

    // Screen Wake Lock for Shopping Mode
    const isReadOnly = list.status === "COMPLETED"
    const isPlanningMode = list.status === "PLANNING"
    const isShoppingMode = list.status === "SHOPPING"

    useScreenWakeLock(isShoppingMode)

    const handleAddItem = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (isSubmitting) return
        if (!inputValue.trim()) return

        setIsSubmitting(true)
        try {
            const result = await addItemToList({
                listId: list.id,
                name: inputValue.trim(),
                quantity: inputQty,
                unit: inputUnit.trim() || undefined,
            })

            if (result.status === "ADDED" && result.listItem) {
                setInputValue("")
                setInputQty(1)
                setInputUnit("")
                toast.success("Item added")
                // Highlight the newly added item after re-render
                setTimeout(() => {
                    const el = itemRefs.current[result.listItem.id]
                    if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" })
                        setHighlightedItemId(result.listItem.id)
                        setTimeout(() => setHighlightedItemId(null), 2000)
                    }
                }, 100)
            } else if (result.status === "ALREADY_EXISTS") {
                setInputValue("")
                toast.info("Item already in list")
            } else if (result.status === "NEEDS_SECTION") {
                setNewItemName(inputValue.trim())
                setSelectedSection("") // Default to uncategorized
                setIsDialogOpen(true)
            } else if (result.status === "ERROR") {
                toast.error(result.error || "Failed to add item")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    // Handle selection from autocomplete - directly add the item
    const handleSelectFromAutocomplete = async (item: {
        id: string
        name: string
        sectionId: string | null
        defaultUnit: string | null
    }) => {
        setIsSubmitting(true)
        try {
            const result = await addItemToList({
                listId: list.id,
                name: item.name,
                sectionId: item.sectionId || undefined,
                quantity: inputQty,
                unit: item.defaultUnit || inputUnit.trim() || undefined,
            })

            if (result.status === "ADDED" && result.listItem) {
                setInputValue("")
                setInputQty(1)
                setInputUnit("")
                toast.success(`Added ${item.name}`)
                // Highlight the newly added item after re-render
                setTimeout(() => {
                    const el = itemRefs.current[result.listItem.id]
                    if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" })
                        setHighlightedItemId(result.listItem.id)
                        setTimeout(() => setHighlightedItemId(null), 2000)
                    }
                }, 100)
            } else if (result.status === "ALREADY_EXISTS") {
                setInputValue("")
                toast.info(`${item.name} is already in list`)
            } else if (result.status === "ERROR") {
                toast.error(result.error || "Failed to add item")
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleConfirmNewItem = async () => {
        if (!newItemName || isSubmitting) return

        setIsSubmitting(true)
        try {
            const result = await addItemToList({
                listId: list.id,
                name: newItemName,
                sectionId: selectedSection && selectedSection !== "uncategorized" ? selectedSection : null,
                quantity: inputQty,
                unit: inputUnit.trim() || undefined,
            })

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
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggle = (itemId: string, checked: boolean, purchasedQuantity?: number) => {
        // Capture prior state for rollback if the server update fails
        // We can't easily strict-rollback with just one variable for all actions, 
        // but for toggle we know the opposite.

        startTransition(async () => {
            // 1. Optimistic Update
            // If checking, we use the provided purchasedQuantity or default to null? 
            // Actually, if purchasedQuantity is undefined, it implies generic toggle.
            // If checking: purchasedQuantity = provided ?? item.quantity.
            // If unchecking: purchasedQuantity = null.
            // But here we just pass what we know to the reducer.
            // Wait, the reducer needs to know if we should set it to null or not.
            // If checked=false, we should set purchasedQuantity=null.
            // If checked=true, we set it to valid number if provided.

            // The reducer logic above preserves it if undefined. We need to be specific.
            const newPurchasedQuantity = checked ? (purchasedQuantity ?? null) : null
            // Note: If checking and no specific qty provided, backend defaults to planned.
            // Ideally optimistic UI should too?
            // If checking and purchasedQuantity is undefined, we assume Bought=Planned.
            const optimisticPurchasedQty = checked
                ? (purchasedQuantity !== undefined ? purchasedQuantity : optimisticItems.find(i => i.id === itemId)?.quantity ?? null) // Default to planned quantity visually?
                // Actually the backend sets purchasedQuantity = quantity if not provided.
                // So optimistic UI should too if we want to be accurate.
                // However, ListItemRow logic: `const hasDeviation = listItem.purchasedQuantity !== null`
                // If purchasedQuantity == quantity, hasDeviation is false (Wait, `!= null` logic).
                // Actually, if purchasedQuantity is set equal to quantity, hasDeviation is true by that check?
                // Let's check ListItemRow again:
                // `const hasDeviation = listItem.purchasedQuantity !== null`
                // Yes. So if we save 2 (when plan is 2), it shows as deviation?
                // Backend logic: `purchasedQuantity: isChecked ? (purchasedQuantity ?? listItem.quantity) : null`
                // So it ALWAYS saves a purchasedQuantity when checked.
                // So `listItem.purchasedQuantity` will always be non-null for checked items (except for legacy data).
                // So "hasDeviation" logic in Row might need tuning: `purchasedQuantity != quantity`.
                : null

            setOptimisticItems({
                type: "TOGGLE",
                itemId,
                isChecked: checked,
                purchasedQuantity: optimisticPurchasedQty
            })

            // 2. Auto-scroll Logic (only when checking off)
            if (checked) {
                // Re-deriving render logic for safety:
                const itemsBySection: Record<string, ListItem[]> = {}
                list.store.sections.forEach(s => itemsBySection[s.id] = [])
                itemsBySection["uncategorized"] = []

                optimisticItems.forEach(item => {
                    const isItemChecked = item.id === itemId ? checked : item.isChecked
                    const sectionId = item.item.sectionId || "uncategorized"
                    if (!itemsBySection[sectionId]) itemsBySection[sectionId] = []
                    itemsBySection[sectionId].push({ ...item, isChecked: isItemChecked })
                })

                const visualOrder: ListItem[] = []
                list.store.sections.forEach(s => visualOrder.push(...(itemsBySection[s.id] || [])))
                visualOrder.push(...(itemsBySection["uncategorized"] || []))

                const currentIndex = visualOrder.findIndex(i => i.id === itemId)

                let nextItem: ListItem | undefined
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

            // 3. Server Action
            const result = await toggleListItem({ itemId, isChecked: checked, purchasedQuantity })
            if (!result.success) {
                // Rollback
                setOptimisticItems({ type: "TOGGLE", itemId, isChecked: !checked })
                toast.error(result.error || "Failed to update item")
            }
        })
    }

    const handleUpdateQuantity = async (itemId: string, quantity: number, unit?: string) => {
        startTransition(async () => {
            // We need previous state for rollback, but let's just use router.refresh on error for non-toggle actions for simplicity
            // or assume success.
            const item = optimisticItems.find(i => i.id === itemId)
            const oldQty = item?.quantity ?? 1
            const oldUnit = item?.unit

            setOptimisticItems({ type: "UPDATE_QTY", itemId, quantity, unit })

            const result = await updateListItemQuantity({ listItemId: itemId, quantity, unit })
            if (!result.success) {
                toast.error(result.error || "Failed to update quantity")
                // Rollback
                setOptimisticItems({ type: "UPDATE_QTY", itemId, quantity: oldQty, unit: oldUnit || undefined })
            }
        })
    }

    const handleRemoveItem = async (itemId: string) => {
        startTransition(async () => {
            // Simplification: Not full optimistic rollback support for add/remove yet without more complex state
            // But we can remove it optimistically.
            setOptimisticItems({ type: "REMOVE", itemId })

            const result = await removeItemFromList({ listItemId: itemId })
            if (result.success) {
                toast.success("Item removed")
            } else {
                toast.error(result.error || "Failed to remove item")
                // Rollback: Hard to rollback a removal without re-adding. 
                // We'd need to keep the deleted item in memory.
                // For now, trigger refresh to get it back.
                router.refresh()
            }
        })
    }

    const handleFinishShopping = () => {
        setIsSummaryOpen(true)
    }

    const handleCompleteTrip = async () => {
        setIsCompleting(true)
        const result = await completeList({ listId: list.id })
        if (result.success) {
            toast.success("Trip completed!")
            router.push(`/stores/${list.store.id}`)
        } else {
            toast.error(result.error || "Failed to complete trip")
            setIsCompleting(false)
        }
    }

    // Group items by section (using optimisticItems)
    const itemsBySection: Record<string, ListItem[]> = {}
    list.store.sections.forEach((s) => {
        itemsBySection[s.id] = []
    })
    itemsBySection["uncategorized"] = []

    optimisticItems.forEach((listItem) => {
        const sectionId = listItem.item.sectionId || "uncategorized"
        if (!itemsBySection[sectionId]) {
            itemsBySection[sectionId] = []
        }
        itemsBySection[sectionId].push(listItem)
    })

    // Calculate missing items from optimistic state
    const missingItems = optimisticItems
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
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="shrink-0">
                            <QuantityStepper
                                value={inputQty}
                                unit={inputUnit}
                                onChange={(qty, unit) => {
                                    setInputQty(qty)
                                    setInputUnit(unit || "")
                                }}
                            />
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="h-8 px-3 shrink-0 rounded-lg text-sm font-medium">
                            Add
                        </Button>
                    </form>
                </div>
            )}

            <div className="space-y-6">
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

                {/* Uncategorized Items */}
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
            </div>


            {/* Floating Action Button or Footer based on State */}
            {!isReadOnly && (
                <div className="fixed bottom-24 md:bottom-6 left-0 right-0 px-4 flex justify-center z-50 pointer-events-none">
                    <div className="pointer-events-auto flex items-center gap-2">
                        {list.status === "PLANNING" ? (
                            <Button
                                size="lg"
                                className="h-14 rounded-full shadow-xl px-8 bg-primary hover:bg-primary/90 transition-all active:scale-95 font-semibold"
                                onClick={async () => {
                                    const result = await startShopping({ listId: list.id })
                                    if (result.success) {
                                        router.refresh()
                                        toast.success("Shopping mode activated! 🛒")
                                    } else {
                                        toast.error(result.error || "Failed to start shopping")
                                    }
                                }}
                                disabled={optimisticItems.length === 0}
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
                                    onClick={async () => {
                                        const result = await cancelShopping({ listId: list.id })
                                        if (result.success) {
                                            router.refresh()
                                            toast("Shopping Cancelled", { description: "List reverted to planning mode." })
                                        } else {
                                            toast.error(result.error || "Failed to cancel shopping")
                                        }
                                    }}
                                >
                                    <X className="h-5 w-5" />
                                    <span className="sr-only">Cancel Shopping</span>
                                </Button>
                                <Button
                                    size="lg"
                                    className="h-14 rounded-full shadow-xl px-6 bg-tangerine hover:bg-tangerine/90 text-white transition-all active:scale-95"
                                    onClick={handleFinishShopping}
                                >
                                    <CheckCheck className="mr-2 h-5 w-5" />
                                    Finish ({optimisticItems.filter(i => i.isChecked).length}/{optimisticItems.length})
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
                isSubmitting={isCompleting}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
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
                                <SelectTrigger>
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
                        <Button type="button" onClick={handleConfirmNewItem} disabled={isSubmitting}>
                            Save & Add
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {
                editingItem && (
                    <EditItemDialog
                        item={{
                            id: editingItem.id,
                            name: editingItem.name,
                            sectionId: editingItem.sectionId,
                            defaultUnit: editingItem.defaultUnit
                        }}
                        sections={list.store.sections}
                        open={isEditOpen}
                        onOpenChange={setIsEditOpen}
                        onSuccess={() => {
                            setEditingItem(null)
                            router.refresh()
                        }}
                    />
                )
            }
        </div>
    )
}
