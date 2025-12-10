"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { removeItemFromList } from "@/actions/list"
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
    onToggle: (id: string, checked: boolean) => void
    onEdit: (item: Item) => void
    itemRef?: (el: HTMLDivElement | null) => void
}

export function ListItemRow({
    listItem,
    isReadOnly,
    isHighlighted,
    onToggle,
    onEdit,
    itemRef,
}: ListItemRowProps) {
    return (
        <div
            ref={itemRef}
            className={`group flex items-center gap-3 p-3 border-b last:border-0 hover:bg-muted/30 transition-all duration-200 ${listItem.isChecked ? "opacity-50" : ""
                } ${isHighlighted ? "bg-primary/10" : ""
                }`}
            onClick={() => !isReadOnly && onToggle(listItem.id, !listItem.isChecked)}
        >
            <Checkbox
                checked={listItem.isChecked}
                onCheckedChange={() => { }} // Handled by div click
                disabled={isReadOnly}
                className="h-5 w-5 rounded-[4px] border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
            />
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
                            onEdit(listItem.item)
                        }}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Item
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={async (e) => {
                                e.stopPropagation()
                                try {
                                    await removeItemFromList(listItem.id)
                                    toast.success("Item removed")
                                } catch {
                                    toast.error("Failed to remove item")
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
    )
}
