"use client"

import { useState, useOptimistic, useRef, useTransition } from "react"
import { addItemToList, toggleListItem, removeItemFromList, startShopping, cancelShopping } from "@/actions/list"
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
    const [optimisticItems, setOptimisticItems] = useOptimistic(
        list.items,
        (state, { itemId, isChecked }: { itemId: string; isChecked: boolean }) =>
            state.map((item) =>
                item.id === itemId ? { ...item, isChecked } : item
            )
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

    const handleToggle = (itemId: string, checked: boolean) => {
        // Capture prior state for rollback if the server update fails
        const previousChecked = optimisticItems.find(i => i.id === itemId)?.isChecked ?? false

        startTransition(async () => {
            // 1. Optimistic Update
            setOptimisticItems({ itemId, isChecked: checked })

            // 2. Auto-scroll Logic (only when checking off)
            if (checked) {
                // Calculate flat list based on CURRENT optimistic state (before this toggle applied? No, inside transition it's tricky)
                // We use the derived 'itemsBySection' from the NEXT render usually, but here we need to calculate it manually or wait.
                // Simpler: Calculate from 'optimisticItems' but manually applying the change for the logic check

                // Actually, let's just find the next item in the current 'optimisticItems' list 
                // assuming the toggle has "happened" for the logic search.

                // We need the visual order.


                // Note: logic above for uncategorized might duplicate if sectionId is null vs "uncategorized" string. 
                // Let's stick to the render logic below for consistency.

                // Re-deriving render logic for safety:
                const itemsBySection: Record<string, ListItem[]> = {}
                list.store.sections.forEach(s => itemsBySection[s.id] = [])
                itemsBySection["uncategorized"] = []

                optimisticItems.forEach(item => {
                    // Apply the toggle strictly for this calculation if it wasn't already (optimistic state updates are batched/async in React logic sometimes)
                    // But 'optimisticItems' here is the OLD state until next render.
                    // So we must manually map it.
                    const isItemChecked = item.id === itemId ? checked : item.isChecked

                    const sectionId = item.item.sectionId || "uncategorized"
                    if (!itemsBySection[sectionId]) itemsBySection[sectionId] = []
                    itemsBySection[sectionId].push({ ...item, isChecked: isItemChecked })
                })

                const visualOrder: ListItem[] = []
                list.store.sections.forEach(s => visualOrder.push(...(itemsBySection[s.id] || [])))
                visualOrder.push(...(itemsBySection["uncategorized"] || []))

                // Find index of current item
                const currentIndex = visualOrder.findIndex(i => i.id === itemId)

                // Find next UNCHECKED item after this one
                let nextItem: ListItem | undefined
                for (let i = currentIndex + 1; i < visualOrder.length; i++) {
                    if (!visualOrder[i].isChecked) {
                        nextItem = visualOrder[i]
                        break
                    }
                }

                // If no unchecked item found after, wrap around or stop? 
                // Let's stop. Or maybe look from beginning?
                // User said "next item in the list".

                if (nextItem) {
                    const el = itemRefs.current[nextItem.id]
                    if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" })
                        setHighlightedItemId(nextItem.id)
                        // Remove highlight after animation
                        setTimeout(() => setHighlightedItemId(null), 2000)
                    }
                }
            }

            // 3. Server Action
            const result = await toggleListItem({ itemId, isChecked: checked })
            if (!result.success) {
                // Roll back optimistic change on failure
                setOptimisticItems({ itemId, isChecked: previousChecked })
                toast.error(result.error || "Failed to update item")
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

    const isReadOnly = list.status === "COMPLETED"
    const isPlanningMode = list.status === "PLANNING"
    const isShoppingMode = list.status === "SHOPPING"

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
                        <div className="w-20">
                            <Label htmlFor="item-qty" className="sr-only">Qty</Label>
                            <Input
                                id="item-qty"
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={inputQty}
                                onChange={(e) => setInputQty(parseFloat(e.target.value))}
                                placeholder="1"
                                className="w-full h-11 text-center text-base border-transparent bg-muted/50 focus:bg-background transition-colors"
                            />
                        </div>
                        <div className="w-24">
                            <Label htmlFor="item-unit" className="sr-only">Unit</Label>
                            <Input
                                id="item-unit"
                                value={inputUnit}
                                onChange={(e) => setInputUnit(e.target.value)}
                                placeholder="Unit"
                                className="w-full h-11 text-base border-transparent bg-muted/50 focus:bg-background transition-colors"
                            />
                        </div>
                        <Button type="submit" disabled={isSubmitting} size="icon" className="h-11 w-11 shrink-0 rounded-lg">
                            <span className="sr-only">Add</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
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
                            <div className="space-y-2">
                                {items.map((listItem) => (
                                    <div
                                        key={listItem.id}
                                        ref={(el) => { itemRefs.current[listItem.id] = el }}
                                        className={`group flex items-center gap-3 p-3 border-b last:border-0 transition-all duration-200 ${isPlanningMode ? "" : "hover:bg-muted/30 cursor-pointer"
                                            } ${listItem.isChecked ? "opacity-50" : ""
                                            } ${highlightedItemId === listItem.id ? "bg-primary/10" : ""
                                            }`}
                                        onClick={() => !isReadOnly && !isPlanningMode && handleToggle(listItem.id, !listItem.isChecked)}
                                    >
                                        {!isPlanningMode && (
                                            <Checkbox
                                                checked={listItem.isChecked}
                                                onCheckedChange={() => { }} // Handled by div click
                                                disabled={isReadOnly}
                                                className="h-5 w-5 rounded-[4px] border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                                            />
                                        )}
                                        <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                                            <span className={`text-base font-medium truncate transition-colors ${listItem.isChecked ? "line-through text-muted-foreground" : "text-foreground"
                                                }`}>
                                                {listItem.item.name}
                                            </span>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                                                {listItem.quantity}{listItem.unit ? ` ${listItem.unit}` : "×"}
                                            </span>
                                        </div>
                                        {!isReadOnly && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">More</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation()
                                                        setEditingItem(listItem.item)
                                                        setIsEditOpen(true)
                                                    }}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit Item
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={async (e) => {
                                                            e.stopPropagation()
                                                            const result = await removeItemFromList({ listItemId: listItem.id })
                                                            if (result.success) {
                                                                toast.success("Item removed")
                                                            } else {
                                                                toast.error(result.error || "Failed to remove item")
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Remove
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
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
                        <div className="space-y-2">
                            {itemsBySection["uncategorized"].map((listItem) => (
                                <div
                                    key={listItem.id}
                                    ref={(el) => { itemRefs.current[listItem.id] = el }}
                                    className={`group flex items-center gap-3 p-3 border-b last:border-0 transition-all duration-200 ${isPlanningMode ? "" : "hover:bg-muted/30 cursor-pointer"
                                        } ${listItem.isChecked ? "opacity-50" : ""
                                        } ${highlightedItemId === listItem.id ? "bg-primary/10" : ""
                                        }`}
                                    onClick={() => !isReadOnly && !isPlanningMode && handleToggle(listItem.id, !listItem.isChecked)}
                                >
                                    {!isPlanningMode && (
                                        <Checkbox
                                            checked={listItem.isChecked}
                                            onCheckedChange={() => { }}
                                            disabled={isReadOnly}
                                            className="h-5 w-5 rounded-[4px] border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                                        />
                                    )}
                                    <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
                                        <span className={`text-base font-medium truncate transition-colors ${listItem.isChecked ? "line-through text-muted-foreground" : "text-foreground"
                                            }`}>
                                            {listItem.item.name}
                                        </span>
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground whitespace-nowrap">
                                            {listItem.quantity}{listItem.unit ? ` ${listItem.unit}` : "×"}
                                        </span>
                                    </div>
                                    {!isReadOnly && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">More</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation()
                                                    setEditingItem(listItem.item)
                                                    setIsEditOpen(true)
                                                }}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit Item
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={async (e) => {
                                                        e.stopPropagation()
                                                        const result = await removeItemFromList({ listItemId: listItem.id })
                                                        if (result.success) {
                                                            toast.success("Item removed")
                                                        } else {
                                                            toast.error(result.error || "Failed to remove item")
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Remove
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
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
                                <SelectContent>
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
