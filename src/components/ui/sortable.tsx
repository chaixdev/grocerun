"use client"

import * as React from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DropAnimation,
    DragStartEvent,
    UniqueIdentifier,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

interface SortableListProps<T extends { id: string }> {
    items: T[]
    onReorder: (items: T[]) => void
    children: React.ReactNode
    renderOverlay?: (activeItem: T) => React.ReactNode
}

const SortableListContext = React.createContext<{
    activeId: UniqueIdentifier | null
} | null>(null)

export function SortableList<T extends { id: string }>({
    items,
    onReorder,
    children,
    renderOverlay,
}: SortableListProps<T>) {
    const [activeId, setActiveId] = React.useState<UniqueIdentifier | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id)
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (active.id !== over?.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id)
            const newIndex = items.findIndex((item) => item.id === over?.id)

            onReorder(arrayMove(items, oldIndex, newIndex))
        }

        setActiveId(null)
    }

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: "0.5",
                },
            },
        }),
    }

    const activeItem = React.useMemo(
        () => items.find((item) => item.id === activeId),
        [activeId, items]
    )

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <SortableListContext.Provider value={{ activeId }}>
                <SortableContext items={items} strategy={verticalListSortingStrategy}>
                    {children}
                </SortableContext>
            </SortableListContext.Provider>

            {renderOverlay && (
                <DragOverlay dropAnimation={dropAnimation}>
                    {activeItem ? renderOverlay(activeItem) : null}
                </DragOverlay>
            )}
        </DndContext>
    )
}

interface SortableItemProps extends React.HTMLAttributes<HTMLDivElement> {
    id: string
    asChild?: boolean
}

export const SortableItem = React.forwardRef<HTMLDivElement, SortableItemProps>(
    ({ id, asChild, className, style, ...props }, ref) => {
        const {
            attributes,
            listeners,
            setNodeRef,
            transform,
            transition,
            isDragging,
        } = useSortable({ id })

        const Comp = asChild ? Slot : "div"

        // Merge refs
        const setRef = (node: HTMLDivElement | null) => {
            setNodeRef(node)
            if (typeof ref === "function") {
                ref(node)
            } else if (ref) {
                (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
            }
        }

        return (
            <Comp
                ref={setRef}
                style={{
                    transform: CSS.Transform.toString(transform),
                    transition,
                    zIndex: isDragging ? 1 : 0,
                    ...style,
                }}
                className={cn(isDragging && "opacity-50", className)}
                {...attributes}
                {...props}
            >
                {/* We pass listeners to children via a specific handle or the whole item if desired */}
                {/* Actually, for maximum flexibility, we should probably expose listeners via context or render prop, 
                    but for now let's attach them to the root and allow a handle to override or stop propagation if needed.
                    Wait, dnd-kit recommends attaching listeners to the handle. 
                    Let's expose a SortableDragHandle component.
                */}
                <SortableItemContext.Provider value={{ listeners }}>
                    {props.children}
                </SortableItemContext.Provider>
            </Comp>
        )
    }
)
SortableItem.displayName = "SortableItem"

const SortableItemContext = React.createContext<{
    listeners: ReturnType<typeof useSortable>["listeners"]
} | null>(null)

export const SortableDragHandle = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
    const context = React.useContext(SortableItemContext)

    return (
        <button
            ref={ref}
            className={cn("cursor-grab active:cursor-grabbing touch-none", className)}
            {...context?.listeners}
            {...props}
        />
    )
})
SortableDragHandle.displayName = "SortableDragHandle"
