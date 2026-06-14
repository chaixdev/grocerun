
import { useEffect, useRef, useState } from "react"
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
    isLocked?: boolean
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
    isLocked = false,
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
    const isInteractionDisabled = isReadOnly || isLocked

    // Optimistic checked state: flip immediately on tap without waiting for RxDB.
    const [optimisticChecked, setOptimisticChecked] = useState(listItem.isChecked)
    useEffect(() => {
        setOptimisticChecked(listItem.isChecked)
    }, [listItem.isChecked])

    // Optimistic quantity state: update immediately on tap so the stepper
    // reflects the new value without waiting for the RxDB round-trip.
    const committedQty = isShoppingMode
        ? (listItem.purchasedQuantity ?? listItem.quantity)
        : listItem.quantity
    const [optimisticQty, setOptimisticQty] = useState(committedQty)

    // When RxDB emits an updated value, sync the optimistic state.
    useEffect(() => {
        setOptimisticQty(committedQty)
    }, [committedQty])

    // Debounce the actual mutation: fire 300ms after the last tap.
    // Shopping-mode quantity changes implicitly check the item.
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingQtyRef = useRef<{ qty: number; unit: string | undefined } | null>(null)
    const onToggleRef = useRef(onToggle)
    onToggleRef.current = onToggle
    const onUpdateQuantityRef = useRef(onUpdateQuantity)
    onUpdateQuantityRef.current = onUpdateQuantity

    const flushQtyWrite = (qty: number, unit: string | undefined) => {
        pendingQtyRef.current = { qty, unit }
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            pendingQtyRef.current = null
            if (isPlanningMode) {
                onUpdateQuantity?.(listItem.id, qty, unit)
            } else {
                // Shopping mode: quantity changes always check the item.
                onToggle(listItem.id, true, qty)
            }
        }, 300)
    }
    // Flush any pending write on unmount — don't silently drop the user's edit.
    useEffect(() => () => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current)
            const pending = pendingQtyRef.current
            if (pending) {
                if (isPlanningMode) {
                    onUpdateQuantityRef.current?.(listItem.id, pending.qty, pending.unit)
                } else {
                    onToggleRef.current(listItem.id, true, pending.qty)
                }
            }
        }
    }, [isPlanningMode, listItem.id])

    return (
        <div
            ref={itemRef}
            data-testid={`list-item-row-${listItem.item.name.toLowerCase().replace(/\s+/g, '-')}`}
            className={`group flex items-center gap-3 p-3 border-b last:border-0 transition-all duration-200 ${isPlanningMode || isInteractionDisabled ? "" : "hover:bg-muted/30 cursor-pointer"} ${optimisticChecked ? "opacity-50" : ""} ${isHighlighted ? "bg-primary/10" : ""} ${isLocked ? "opacity-70" : ""}`}
            onClick={() => {
                if (!isInteractionDisabled && !isPlanningMode) {
                    const next = !optimisticChecked
                    setOptimisticChecked(next)
                    onToggle(listItem.id, next, undefined)
                }
            }}
        >
            {/* 1. Checkbox */}
            {(!isPlanningMode || isReadOnly) && (
                <Checkbox
                    checked={optimisticChecked}
                    onCheckedChange={() => { }} // Handled by div click
                    disabled={isInteractionDisabled}
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
                        value={optimisticQty}
                        unit={listItem.unit}
                        plannedValue={isShoppingMode ? listItem.quantity : undefined}
                        onChange={(qty, unit) => {
                            if (isInteractionDisabled) {
                                return
                            }
                            // Optimistically update the displayed value immediately,
                            // before the async RxDB write completes.
                            setOptimisticQty(qty)
                            // Shopping-mode quantity changes implicitly check the item.
                            if (isShoppingMode && !optimisticChecked) {
                                setOptimisticChecked(true)
                            }
                            // Debounce the actual write so rapid taps produce one mutation.
                            flushQtyWrite(qty, unit)
                        }}
                    />
                )}
            </div>

            {/* 3. Item Name */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <span
                    data-testid="item-name"
                    className={`text-base font-medium truncate transition-colors ${optimisticChecked ? "line-through text-muted-foreground/70" : "text-foreground"}`}
                >
                    {listItem.item.name}
                </span>
            </div>

            {/* 4. Actions (Desktop: Hover, Mobile: Dropdown) */}
            {isPlanningMode && !isInteractionDisabled && (
                <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
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
