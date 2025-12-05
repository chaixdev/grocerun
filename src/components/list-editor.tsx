"use client"

import { useState } from "react"
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
    item: Item
}

interface ListData {
    id: string
    store: {
        sections: Section[]
    }
    items: ListItem[]
}

interface ListEditorProps {
    list: ListData
}

export function ListEditor({ list }: ListEditorProps) {
    const [inputValue, setInputValue] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // State for "New Item" dialog
    const [newItemName, setNewItemName] = useState<string | null>(null)
    const [selectedSection, setSelectedSection] = useState<string>("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const handleAddItem = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!inputValue.trim()) return

        setIsSubmitting(true)
        try {
            const result = await addItemToList({
                listId: list.id,
                name: inputValue.trim(),
            })

            if (result.status === "ADDED") {
                setInputValue("")
                toast.success("Item added")
            } else if (result.status === "ALREADY_EXISTS") {
                setInputValue("")
                toast.info("Item already in list")
            } else if (result.status === "NEEDS_SECTION") {
                // Trigger Dialog
                setNewItemName(inputValue.trim())
                // Default to first section if available, or empty
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
                sectionId: selectedSection || undefined, // If empty, backend handles it (though schema might want it, we'll see)
            })
            setInputValue("")
            setNewItemName(null)
            setIsDialogOpen(false)
            toast.success("Item created and added")
        } catch {
            toast.error("Failed to create item")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleToggle = async (itemId: string, checked: boolean) => {
        try {
            await toggleListItem(itemId, checked)
        } catch {
            toast.error("Failed to update item")
        }
    }

    // Group items by section
    const itemsBySection: Record<string, ListItem[]> = {}

    // Initialize with all sections to preserve order
    list.store.sections.forEach((s) => {
        itemsBySection[s.id] = []
    })
    itemsBySection["uncategorized"] = []

    list.items.forEach((listItem) => {
        const sectionId = listItem.item.sectionId || "uncategorized"
        if (!itemsBySection[sectionId]) {
            itemsBySection[sectionId] = []
        }
        itemsBySection[sectionId].push(listItem)
    })

    return (
        <div className="space-y-8">
            <form onSubmit={handleAddItem} className="flex gap-2">
                <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Add item (e.g. Milk)..."
                    className="flex-1"
                    autoFocus
                />
                <Button type="submit" disabled={isSubmitting}>
                    Add
                </Button>
            </form>

            <div className="space-y-6">
                {list.store.sections.map((section) => {
                    const items = itemsBySection[section.id] || []
                    if (items.length === 0) return null

                    return (
                        <div key={section.id} className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                                {section.name}
                            </h3>
                            <div className="space-y-2">
                                {items.map((listItem) => (
                                    <div key={listItem.id} className="flex items-center gap-2 p-2 border rounded-lg bg-card">
                                        <Checkbox
                                            checked={listItem.isChecked}
                                            onCheckedChange={(checked) => handleToggle(listItem.id, checked as boolean)}
                                        />
                                        <span className={listItem.isChecked ? "line-through text-muted-foreground" : ""}>
                                            {listItem.item.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}

                {/* Uncategorized Items */}
                {(itemsBySection["uncategorized"]?.length ?? 0) > 0 && (
                    <div className="space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                            Uncategorized
                        </h3>
                        <div className="space-y-2">
                            {itemsBySection["uncategorized"].map((listItem) => (
                                <div key={listItem.id} className="flex items-center gap-2 p-2 border rounded-lg bg-card">
                                    <Checkbox
                                        checked={listItem.isChecked}
                                        onCheckedChange={(checked) => handleToggle(listItem.id, checked as boolean)}
                                    />
                                    <span className={listItem.isChecked ? "line-through text-muted-foreground" : ""}>
                                        {listItem.item.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

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
