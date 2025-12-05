"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateItem } from "@/actions/item"
import { toast } from "sonner"

interface Section {
    id: string
    name: string
}

interface Item {
    id: string
    name: string
    sectionId: string | null
    defaultUnit: string | null
}

interface EditItemDialogProps {
    item: Item
    sections: Section[]
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function EditItemDialog({ item, sections, open, onOpenChange, onSuccess }: EditItemDialogProps) {
    const [name, setName] = useState(item.name)
    const [sectionId, setSectionId] = useState(item.sectionId || "uncategorized")
    const [defaultUnit, setDefaultUnit] = useState(item.defaultUnit || "")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSave = async () => {
        if (!name.trim()) return

        setIsSubmitting(true)
        try {
            await updateItem({
                itemId: item.id,
                name: name.trim(),
                sectionId: sectionId === "uncategorized" ? undefined : sectionId,
                defaultUnit: defaultUnit.trim() || undefined,
            })
            toast.success("Item updated")
            onOpenChange(false)
            onSuccess?.()
        } catch {
            toast.error("Failed to update item")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Item</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-name">Name</Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-section">Section</Label>
                        <Select value={sectionId} onValueChange={setSectionId}>
                            <SelectTrigger id="edit-section">
                                <SelectValue placeholder="Select a section" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                                {sections.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-unit">Default Unit</Label>
                        <Input
                            id="edit-unit"
                            value={defaultUnit}
                            onChange={(e) => setDefaultUnit(e.target.value)}
                            placeholder="e.g., pcs, kg"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
