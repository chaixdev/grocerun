"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { QuantityStepper } from "./QuantityStepper"

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

interface ListItemRowProps {
    listItem: ListItem
    isReadOnly: boolean
    isHighlighted: boolean
    isPlanningMode: boolean
    onToggle: (id: string, checked: boolean, purchasedQuantity?: number) => void
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

    // Logic:
    // Planning Mode: 
    //   - Value: quantity
    //   - OnChange: onUpdateQuantity
    // Shopping Mode:
    //   - Value: purchasedQuantity ?? quantity
    //   - PlannedValue: quantity (to show deviation)
    //   - OnChange: onToggle(id, true, newValue) -> Implicitly check items when qty changes

    // "Shopping Mode" for UI purposes implies not planning mode and not read only
    const isShoppingMode = !isPlanningMode && !isReadOnly

    return (
        <div
            ref={itemRef}
            className={`group flex items-center gap-3 p-3 border-b last:border-0 transition-all duration-200 ${isPlanningMode ? "" : "hover:bg-muted/30 cursor-pointer"} ${listItem.isChecked ? "opacity-50" : ""} ${isHighlighted ? "bg-primary/10" : ""}`}
            onClick={() => {
                if (!isReadOnly && !isPlanningMode) {
                    // Implicit toggle: Bought = Planned (reset purchasedQuantity to null if unchecking)
                    onToggle(listItem.id, !listItem.isChecked, undefined)
                }
            }}
        >
            {/* 1. Checkbox */}
            {(!isPlanningMode || isReadOnly) && (
                <Checkbox
                    checked={listItem.isChecked}
                    onCheckedChange={() => { }} // Handled by div click
                    disabled={isReadOnly}
                    className="h-5 w-5 rounded-[4px] border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all shrink-0"
                />
            )}

            {/* 2. Quantity Controls */}
            <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                {isReadOnly ? (
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-muted text-muted-foreground whitespace-nowrap border border-border/50">
                        {listItem.quantity}{listItem.unit && <span className="text-[10px] ml-0.5 uppercase tracking-wide">{listItem.unit}</span>}
                    </span>
                ) : (
                    <QuantityStepper
                        value={isShoppingMode ? (listItem.purchasedQuantity ?? listItem.quantity) : listItem.quantity}
                        unit={listItem.unit}
                        plannedValue={isShoppingMode ? listItem.quantity : undefined}
                        onChange={(qty, unit) => {
                            if (isPlanningMode) {
                                onUpdateQuantity?.(listItem.id, qty, unit)
                            } else {
                                // Shopping Mode: Update purchasedQuantity ONLY.
                                // User request: "modifying the quantity ... shouldn't do that [check off item]"
                                // We pass the CURRENT isChecked state so it doesn't toggle.
                                onToggle(listItem.id, listItem.isChecked, qty)
                            }
                        }}
                    />
                )}
            </div>

            {/* 3. Item Name */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span className={`text-base font-medium truncate transition-colors ${listItem.isChecked ? "line-through text-muted-foreground/70" : "text-foreground"}`}>
                    {listItem.item.name}
                </span>
            </div>

            {/* 4. Actions (Desktop: Hover, Mobile: Dropdown) */}
            {isPlanningMode && !isReadOnly && (
                <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground md:opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(listItem.item)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit Item
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onRemove(listItem.id)}
                                className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-900/30"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </div>
    )
}
