"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Minus, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

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

interface ListItemRowProps {
    listItem: ListItem
    isReadOnly: boolean
    isHighlighted: boolean
    isPlanningMode: boolean
    onToggle: (id: string, checked: boolean) => void
    onEdit: (item: Item) => void
    onRemove: (id: string) => void
    onUpdateQuantity?: (id: string, quantity: number, unit?: string) => void
    itemRef?: (el: HTMLDivElement | null) => void
}

export function ListItemRow({
    listItem,
    isReadOnly,
    isHighlighted,
    isPlanningMode,
    onToggle,
    onEdit,
    onRemove,
    onUpdateQuantity,
    itemRef,
}: ListItemRowProps) {
    const [isPopoverOpen, setIsPopoverOpen] = useState(false)
    const [manualQty, setManualQty] = useState(listItem.quantity.toString())
    const [manualUnit, setManualUnit] = useState(listItem.unit || "")

    const handleManualSubmit = (e?: React.FormEvent) => {
        e?.preventDefault()
        const qty = parseFloat(manualQty)
        if (!isNaN(qty) && qty > 0) {
            onUpdateQuantity?.(listItem.id, qty, manualUnit.trim() || undefined)
            setIsPopoverOpen(false)
        }
    }

    return (
        <div
            ref={itemRef}
            className={`group flex items-center gap-3 p-3 border-b last:border-0 transition-all duration-200 ${isPlanningMode ? "" : "hover:bg-muted/30 cursor-pointer"} ${listItem.isChecked ? "opacity-50" : ""} ${isHighlighted ? "bg-primary/10" : ""}`}
            onClick={() => !isReadOnly && !isPlanningMode && onToggle(listItem.id, !listItem.isChecked)}
        >
            {/* 1. Checkbox */}
            {(!isPlanningMode || isReadOnly) && (
                <Checkbox
                    checked={listItem.isChecked}
                    onCheckedChange={() => { }} // Handled by div click in shopping mode
                    disabled={isReadOnly}
                    className="h-5 w-5 rounded-[4px] border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all shrink-0"
                />
            )}

            {/* 2. Quantity Controls (Left side now) */}
            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                {isPlanningMode ? (
                    <div className="flex items-center bg-muted/50 rounded-lg p-0.5 shadow-sm border border-transparent hover:bg-muted/70 transition-colors">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-background hover:shadow-sm"
                            onClick={() => {
                                // Round up current quantity then subtract 1 to get next lower whole number
                                // e.g. 1.5 -> ceil(1.5)=2 -> 2-1=1
                                // e.g. 1   -> ceil(1)=1   -> 1-1=0 (clamped to 0.1)
                                const current = listItem.quantity
                                const nextWhole = Math.ceil(current) - 1
                                const newQty = Math.max(0.1, nextWhole)
                                onUpdateQuantity?.(listItem.id, newQty, listItem.unit || undefined)
                            }}
                        >
                            <Minus className="h-3 w-3" />
                        </Button>

                        <Popover open={isPopoverOpen} onOpenChange={(open: boolean) => {
                            if (open) {
                                setManualQty(listItem.quantity.toString())
                                setManualUnit(listItem.unit || "")
                            }
                            setIsPopoverOpen(open)
                        }}>
                            <PopoverTrigger asChild>
                                <button className="px-2 min-w-[3rem] text-center text-sm font-medium hover:text-primary transition-colors">
                                    {listItem.quantity}{listItem.unit && <span className="text-[10px] text-muted-foreground ml-0.5 uppercase tracking-wide">{listItem.unit}</span>}
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3" align="center" side="top">
                                <form onSubmit={handleManualSubmit} className="space-y-3">
                                    <h4 className="font-medium text-sm text-center">Update Quantity</h4>
                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <Label htmlFor={`qty-${listItem.id}`} className="sr-only">Quantity</Label>
                                            <Input
                                                id={`qty-${listItem.id}`}
                                                type="number"
                                                step="0.001"
                                                min="0.001"
                                                value={manualQty}
                                                onChange={(e) => setManualQty(e.target.value)}
                                                className="h-9 text-center border-transparent bg-muted/50 focus:bg-background transition-colors"
                                                placeholder="Qty"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="w-20">
                                            <Label htmlFor={`unit-${listItem.id}`} className="sr-only">Unit</Label>
                                            <Input
                                                id={`unit-${listItem.id}`}
                                                value={manualUnit}
                                                onChange={(e) => setManualUnit(e.target.value)}
                                                className="h-9 text-center border-transparent bg-muted/50 focus:bg-background transition-colors"
                                                placeholder="Unit"
                                            />
                                        </div>
                                    </div>
                                    <Button type="submit" size="sm" className="w-full h-8">
                                        Apply
                                    </Button>
                                </form>
                            </PopoverContent>
                        </Popover>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md hover:bg-background hover:shadow-sm"
                            onClick={() => {
                                // Round down current quantity then add 1 to get next upper whole number
                                // e.g. 1.5 -> floor(1.5)=1 -> 1+1=2
                                // e.g. 1   -> floor(1)=1   -> 1+1=2
                                const current = listItem.quantity
                                const nextWhole = Math.floor(current) + 1
                                onUpdateQuantity?.(listItem.id, nextWhole, listItem.unit || undefined)
                            }}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                ) : (
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-muted text-muted-foreground whitespace-nowrap border border-border/50">
                        {listItem.quantity}{listItem.unit && <span className="text-[10px] ml-0.5 uppercase tracking-wide">{listItem.unit}</span>}
                    </span>
                )}
            </div>

            {/* 3. Item Name */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span className={`text-base font-medium truncate transition-colors ${listItem.isChecked ? "line-through text-muted-foreground/70" : "text-foreground"}`}>
                    {listItem.item.name}
                </span>
                {/* Optional: Show section name faintly if we ever want a flat view, but currently grouped by section */}
            </div>

            {/* 4. Actions Menu */}
            {!isReadOnly && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-foreground transition-all" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">More</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onEdit(listItem.item)
                        }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Item
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation()
                                onRemove(listItem.id)
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    )
}
