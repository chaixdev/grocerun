"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { GripVertical, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { SortableList, SortableItem, SortableDragHandle } from "@/components/ui/sortable"
import { useListNavigation } from "@/features/lists"
import { cn } from "@/lib/utils"
import { debounce } from "lodash"
import {
    useSections, useCreateSection, useUpdateSection,
    useDeleteSection, useReorderSections,
    type Section,
} from "@/features/stores"
import { PageLoading } from "@/components/ui/page-loading"

export function SectionList({ storeId }: { storeId: string }) {
    const { data: querySections, isLoading } = useSections(storeId)
    const createSectionMutation = useCreateSection(storeId)
    const updateSectionMutation = useUpdateSection(storeId)
    const deleteSectionMutation = useDeleteSection(storeId)
    const reorderSectionsMutation = useReorderSections(storeId)

    // Local state for optimistic DnD reorder + inline editing
    const [sections, setSections] = useState<Section[]>([])
    const [focusIndex, setFocusIndex] = useState<number | null>(null)
    const [pendingName, setPendingName] = useState("")

    // Sync from query data (replaces the old useEffect on initialSections prop)
    useEffect(() => {
        if (querySections) {
            setSections(querySections)
        }
    }, [querySections])

    const handleReorder = async (newSections: Section[]) => {
        const previousSections = sections
        setSections(newSections)
        try {
            await reorderSectionsMutation.mutateAsync(
                newSections.filter(s => !s.id.startsWith("temp-")).map(s => s.id)
            )
        } catch {
            setSections(previousSections)
        }
    }

    // Stable ref to mutation so the debounced function doesn't get recreated
    const updateMutationRef = useRef(updateSectionMutation)
    updateMutationRef.current = updateSectionMutation

    const debouncedUpdate = useMemo(
        () => debounce(async (id: string, name: string) => {
            try {
                await updateMutationRef.current.mutateAsync({ id, name })
            } catch {
                console.error("Failed to update section")
            }
        }, 500),
        [] // stable — never recreated
    )
    useEffect(() => {
        return () => {
            debouncedUpdate.cancel()
        }
    }, [debouncedUpdate])

    const saveTempSection = useCallback(async (section: Section) => {
        if (!section.name.trim()) return
        try {
            const created = await createSectionMutation.mutateAsync({
                name: section.name,
                order: section.order,
            })
            setSections(prev => prev.map(s => s.id === section.id ? created : s))
        } catch {
            // Error toast handled by the mutation hook
        }
    }, [createSectionMutation])

    const handleAdd = useCallback((index: number) => {
        const prevIndex = index - 1
        if (prevIndex >= 0 && prevIndex < sections.length) {
            const prevSection = sections[prevIndex]
            if (prevSection.id.startsWith("temp-") && prevSection.name.trim()) {
                saveTempSection(prevSection)
            }
        }

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

        saveTempSection(newSection)
    }

    const handleRemove = useCallback(async (index: number) => {
        const section = sections[index]
        if (!section) return

        const previousSections = sections
        setSections(sections.filter((_, i) => i !== index))

        if (section.id.startsWith("temp-")) return

        try {
            await deleteSectionMutation.mutateAsync(section.id)
        } catch {
            setSections(previousSections)
        }
    }, [sections, deleteSectionMutation])

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

        if (!id.startsWith("temp-")) {
            debouncedUpdate(id, name)
        }
    }

    if (isLoading) return <PageLoading />

    return (
        <div className="space-y-2">
            <SortableList items={sections} onReorder={handleReorder}>
                {sections.map((section, index) => (
                    <SortableItem key={section.id} id={section.id} className="flex items-center gap-2 group">
                        <SortableDragHandle className="p-2 text-muted-foreground/50 hover:text-foreground transition-colors rounded">
                            <GripVertical className="h-4 w-4" />
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
                            className="h-8 w-8 text-muted-foreground/50 hover:text-destructive transition-colors"
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
