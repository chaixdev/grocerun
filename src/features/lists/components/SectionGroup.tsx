"use client"

import { ListItemRow } from "./ListItemRow"

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

interface Section {
    id: string
    name: string
}

interface SectionGroupProps {
    section: Section
    items: ListItem[]
    isReadOnly: boolean
    highlightedItemId: string | null
    isPlanningMode: boolean
    onToggle: (id: string, checked: boolean) => void
    onEdit: (item: Item) => void
    onRemove: (id: string) => void
    onUpdateQuantity?: (id: string, quantity: number, unit?: string) => void
    itemRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
}

export function SectionGroup({
    section,
    items,
    isReadOnly,
    highlightedItemId,
    isPlanningMode,
    onToggle,
    onEdit,
    onRemove,
    onUpdateQuantity,
    itemRefs,
}: SectionGroupProps) {
    if (items.length === 0) return null

    return (
        <div className="space-y-2">
            <h3 className="font-bold text-sm text-primary uppercase tracking-wider sticky top-20 bg-background/95 backdrop-blur py-2 z-10 border-b border-border/40">
                {section.name}
            </h3>
            <div className="space-y-2">
                {items.map((listItem) => (
                    <ListItemRow
                        key={listItem.id}
                        listItem={listItem}
                        isReadOnly={isReadOnly}
                        isHighlighted={highlightedItemId === listItem.id}
                        isPlanningMode={isPlanningMode}
                        onToggle={onToggle}
                        onEdit={onEdit}
                        onRemove={onRemove}
                        onUpdateQuantity={onUpdateQuantity}
                        itemRef={(el) => { itemRefs.current[listItem.id] = el }}
                    />
                ))}
            </div>
        </div>
    )
}
