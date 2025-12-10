"use client"

import { useState, useEffect, useCallback } from "react"
import { reorderSections, deleteSection, updateSection, createSection } from "@/actions/section"
import { Button } from "@/components/ui/button"
import { GripVertical, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { SortableList, SortableItem, SortableDragHandle } from "@/components/ui/sortable"
import { useListNavigation } from "@/features/lists"
import { cn } from "@/lib/utils"

interface Section {
    id: string
    name: string
    order: number
}

interface SectionListProps {
    sections: Section[]
    storeId: string
}

import { debounce } from "lodash"
import { useMemo } from "react"

// ...

export function SectionList({ sections: initialSections, storeId }: SectionListProps) {
    const [sections, setSections] = useState(initialSections)
    const [focusIndex, setFocusIndex] = useState<number | null>(null)
    const [pendingName, setPendingName] = useState("")

    useEffect(() => {
        setSections(initialSections)
    }, [initialSections])

    const handleReorder = async (newSections: Section[]) => {
        setSections(newSections)
        try {
            await reorderSections(storeId, newSections.map(s => s.id))
        } catch {
            toast.error("Failed to save order")
            setSections(sections) // Revert
        }
    }

    // Debounced update ONLY for existing items
    const debouncedUpdate = useMemo(
        () => debounce(async (id: string, name: string) => {
            try {
                await updateSection(id, name)
            } catch {
                // silent fail
            }
        }, 500),
        []
    )
    useEffect(() => {
        return () => {
            debouncedUpdate.cancel()
        }
    }, [debouncedUpdate])

    const saveTempSection = useCallback(async (section: Section) => {
        if (!section.name.trim()) return
        try {
            const newSection = await createSection({
                name: section.name,
                storeId,
                order: section.order
            })

            setSections(prev => prev.map(s => s.id === section.id ? newSection : s))
        } catch {
            toast.error("Failed to create section")
        }
    }, [storeId])

    const handleAdd = useCallback((index: number) => {
        // 1. Check if the PREVIOUS item (where Enter was pressed) needs saving
        const prevIndex = index - 1
        if (prevIndex >= 0 && prevIndex < sections.length) {
            const prevSection = sections[prevIndex]
            if (prevSection.id.startsWith("temp-") && prevSection.name.trim()) {
                saveTempSection(prevSection)
            }
        }

        // 3. Create new local temp section
        const tempId = `temp-${Date.now()}`
        const newSection = { id: tempId, name: "", order: index }

        const newSections = [...sections]
        newSections.splice(index, 0, newSection)
        setSections(newSections)
        setFocusIndex(index)
    }, [sections, saveTempSection])

    const handleAppend = async () => {
        if (!pendingName.trim()) return

        const tempId = `temp-${Date.now()}`
        const newSection = { id: tempId, name: pendingName, order: sections.length }

        setSections([...sections, newSection])
        setPendingName("")

        // Save immediately
        saveTempSection(newSection)
    }

    const handleRemove = useCallback(async (index: number) => {
        const section = sections[index]
        if (!section) return

        const newSections = sections.filter((_, i) => i !== index)
        setSections(newSections)

        // If it's a temp section, just remove it locally
        if (section.id.startsWith("temp-")) return

        try {
            await deleteSection(section.id)
            toast.success("Section deleted")
        } catch {
            toast.error("Failed to delete section")
            setSections(sections) // Revert
        }
    }, [sections])

    const { registerRef, handleKeyDown, itemRefs } = useListNavigation({
        items: sections,
        onAdd: (index) => handleAdd(index),
        onRemove: (index) => handleRemove(index),
        onFocus: (index) => itemRefs.current[index]?.focus(),
    })

    useEffect(() => {
        if (focusIndex !== null && sections[focusIndex]) {
            const section = sections[focusIndex]
            itemRefs.current[focusIndex]?.focus()

            if (!section.id.startsWith("temp-")) {
                setFocusIndex(null)
            }
        }
    }, [focusIndex, sections, itemRefs])

    const handleUpdateName = (id: string, name: string) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, name } : s))

        // Only debounce update for REAL items
        if (!id.startsWith("temp-")) {
            debouncedUpdate(id, name)
        }
    }

    return (
        <div className="space-y-2">
            <SortableList items={sections} onReorder={handleReorder}>
                {sections.map((section, index) => (
                    <SortableItem key={section.id} id={section.id} className="flex items-center gap-2 group">
                        <SortableDragHandle className="opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-muted rounded">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </SortableDragHandle>

                        <Input
                            ref={registerRef(index)}
                            value={section.name}
                            onChange={(e) => handleUpdateName(section.id, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className={cn(
                                "flex-1 border-none shadow-none focus-visible:ring-0 px-0 h-9 font-medium",
                                section.name === "" && "placeholder:text-muted-foreground/50"
                            )}
                            placeholder="Section name..."
                        />

                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                            onClick={() => handleRemove(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </SortableItem>
                ))}
            </SortableList>

            {/* Persistent Empty Item at Bottom */}
            <div className="flex items-center gap-2 px-2">
                <div className="p-2 w-8" /> {/* Spacer for drag handle */}
                <Input
                    value={pendingName}
                    onChange={(e) => setPendingName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            handleAppend()
                        }
                    }}
                    className="flex-1 border-none shadow-none focus-visible:ring-0 px-0 h-9 font-medium placeholder:text-muted-foreground/50"
                    placeholder="Add section..."
                />
                <div className="w-8" /> {/* Spacer for delete button */}
            </div>
        </div>
    )
}
