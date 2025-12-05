"use client"

import { useState, useOptimistic, useRef, startTransition } from "react"
import { addItemToList, toggleListItem } from "@/actions/list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { TripSummary } from "./trip-summary"
import { completeList } from "@/actions/list"
import { useRouter } from "next/navigation"

interface Section {
    id: string
    name: string
}

interface Item {
    id: string
    name: string
    sectionId: string | null
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

    const handleAddItem = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!inputValue.trim()) return

        setIsSubmitting(true)
        try {
            const result = await addItemToList({
                listId: list.id,
                name: inputValue.trim(),
                quantity: inputQty,
                unit: inputUnit.trim() || undefined,
            })

            if (result.status === "ADDED") {
                setInputValue("")
                setInputQty(1)
                setInputUnit("")
                toast.success("Item added")
            } else if (result.status === "ALREADY_EXISTS") {
                setInputValue("")
                toast.info("Item already in list")
            } else if (result.status === "NEEDS_SECTION") {
                setNewItemName(inputValue.trim())
                if (list.store.sections.length > 0) {
                    setSelectedSection(list.store.sections[0].id)
                }
                setIsDialogOpen(true)
            }
        } catch {
            toast.error("Failed to add item")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleConfirmNewItem = async () => {
        if (!newItemName) return

        setIsSubmitting(true)
        try {
            await addItemToList({
                listId: list.id,
                name: newItemName,
                sectionId: selectedSection || undefined,
                quantity: inputQty,
                unit: inputUnit.trim() || undefined,
            })
            setInputValue("")
            setNewItemName(null)
            setInputQty(1)
            setInputUnit("")
            setIsDialogOpen(false)
            toast.success("Item created and added")
        } catch {
            toast.error("Failed to create item")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggle = async (itemId: string, checked: boolean) => {
        // 1. Optimistic Update
        startTransition(() => {
            setOptimisticItems({ itemId, isChecked: checked })
        })

        // 2. Auto-scroll Logic (only when checking off)
        if (checked) {
            // Calculate flat list based on CURRENT optimistic state (before this toggle applied? No, inside transition it's tricky)
            // We use the derived 'itemsBySection' from the NEXT render usually, but here we need to calculate it manually or wait.
            // Simpler: Calculate from 'optimisticItems' but manually applying the change for the logic check

            // Actually, let's just find the next item in the current 'optimisticItems' list 
            // assuming the toggle has "happened" for the logic search.

            // We need the visual order.
            const flatItems: ListItem[] = []
            list.store.sections.forEach((s) => {
                const items = optimisticItems.filter(i => (i.item.sectionId || "uncategorized") === s.id)
                flatItems.push(...items)
            })
            const uncategorized = optimisticItems.filter(i => !i.item.sectionId || i.item.sectionId === "uncategorized")
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
        try {
            await toggleListItem(itemId, checked)
        } catch {
            toast.error("Failed to update item")
        }
    }

    const handleFinishShopping = () => {
        setIsSummaryOpen(true)
    }

    const handleCompleteTrip = async () => {
        setIsCompleting(true)
        try {
            await completeList(list.id)
            toast.success("Trip completed!")
            router.push(`/dashboard/stores/${list.store.id}`)
        } catch {
            toast.error("Failed to complete trip")
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

    return (
        <div className="space-y-8 pb-32">
            {isReadOnly && (
                <div className="bg-muted/50 border rounded-lg p-4 text-center text-muted-foreground">
                    This trip was completed on {new Date(list.updatedAt).toLocaleDateString()}.
                </div>
            )}

            {!isReadOnly && (
                <form onSubmit={handleAddItem} className="flex gap-2 sticky top-4 z-10 bg-background/95 backdrop-blur p-2 -mx-2 rounded-lg border shadow-sm items-end">
                    <div className="flex-1 space-y-1">
                        <Label htmlFor="item-name" className="sr-only">Item Name</Label>
                        <Input
                            id="item-name"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Item name..."
                            className="w-full"
                        />
                    </div>
                    <div className="w-20 space-y-1">
                        <Label htmlFor="item-qty" className="sr-only">Qty</Label>
                        <Input
                            id="item-qty"
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={inputQty}
                            onChange={(e) => setInputQty(parseFloat(e.target.value))}
                            placeholder="1"
                            className="w-full text-center"
                        />
                    </div>
                    <div className="w-24 space-y-1">
                        <Label htmlFor="item-unit" className="sr-only">Unit</Label>
                        <Input
                            id="item-unit"
                            value={inputUnit}
                            onChange={(e) => setInputUnit(e.target.value)}
                            placeholder="Unit"
                            className="w-full"
                        />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                        Add
                    </Button>
                </form>
            )}

            <div className="space-y-6">
                {list.store.sections.map((section) => {
                    const items = itemsBySection[section.id] || []
                    if (items.length === 0) return null

                    return (
                        <div key={section.id} className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider sticky top-20 bg-background/90 backdrop-blur py-2 z-0">
                                {section.name}
                            </h3>
                            <div className="space-y-2">
                                {items.map((listItem) => (
                                    <div
                                        key={listItem.id}
                                        ref={(el) => { itemRefs.current[listItem.id] = el }}
                                        className={`flex items-center gap-3 p-4 border rounded-xl transition-all duration-300 ${listItem.isChecked ? "bg-muted/30 border-transparent" : "bg-card border-border shadow-sm"
                                            } ${highlightedItemId === listItem.id ? "ring-2 ring-primary ring-offset-2 scale-[1.02]" : ""
                                            }`}
                                        onClick={() => !isReadOnly && handleToggle(listItem.id, !listItem.isChecked)}
                                    >
                                        <Checkbox
                                            checked={listItem.isChecked}
                                            onCheckedChange={() => { }} // Handled by div click for larger target
                                            disabled={isReadOnly}
                                            className="h-6 w-6 rounded-full data-[state=checked]:bg-muted-foreground data-[state=checked]:border-muted-foreground"
                                        />
                                        <div className="flex-1 flex items-baseline gap-2">
                                            <span className={`text-lg font-medium transition-colors ${listItem.isChecked ? "line-through text-muted-foreground/50" : "text-foreground"
                                                }`}>
                                                {listItem.item.name}
                                            </span>
                                            {(listItem.quantity !== 1 || listItem.unit) && (
                                                <span className={`text-sm ${listItem.isChecked ? "text-muted-foreground/50" : "text-muted-foreground"
                                                    }`}>
                                                    {listItem.quantity} {listItem.unit}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}

                {/* Uncategorized Items */}
                {(itemsBySection["uncategorized"]?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider sticky top-20 bg-background/90 backdrop-blur py-2 z-0">
                            Uncategorized
                        </h3>
                        <div className="space-y-2">
                            {itemsBySection["uncategorized"].map((listItem) => (
                                <div
                                    key={listItem.id}
                                    ref={(el) => { itemRefs.current[listItem.id] = el }}
                                    className={`flex items-center gap-3 p-4 border rounded-xl transition-all duration-300 ${listItem.isChecked ? "bg-muted/30 border-transparent" : "bg-card border-border shadow-sm"
                                        } ${highlightedItemId === listItem.id ? "ring-2 ring-primary ring-offset-2 scale-[1.02]" : ""
                                        }`}
                                    onClick={() => !isReadOnly && handleToggle(listItem.id, !listItem.isChecked)}
                                >
                                    <Checkbox
                                        checked={listItem.isChecked}
                                        onCheckedChange={() => { }}
                                        disabled={isReadOnly}
                                        className="h-6 w-6 rounded-full data-[state=checked]:bg-muted-foreground data-[state=checked]:border-muted-foreground"
                                    />
                                    <div className="flex-1 flex items-baseline gap-2">
                                        <span className={`text-lg font-medium transition-colors ${listItem.isChecked ? "line-through text-muted-foreground/50" : "text-foreground"
                                            }`}>
                                            {listItem.item.name}
                                        </span>
                                        {(listItem.quantity !== 1 || listItem.unit) && (
                                            <span className={`text-sm ${listItem.isChecked ? "text-muted-foreground/50" : "text-muted-foreground"
                                                }`}>
                                                {listItem.quantity} {listItem.unit}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Footer */}
            {!isReadOnly && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur border-t flex justify-center z-50">
                    <Button
                        size="lg"
                        className="w-full max-w-md shadow-lg"
                        onClick={handleFinishShopping}
                    >
                        Finish Shopping ({optimisticItems.filter(i => i.isChecked).length}/{optimisticItems.length})
                    </Button>
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
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmNewItem} disabled={isSubmitting}>
                            Save & Add
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
