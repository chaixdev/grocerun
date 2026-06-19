
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useUpdateItem } from "../hooks/useItems"

interface Section {
    id: string
    name: string
}

interface Item {
    id: string
    name: string
    sectionId: string | null
    defaultUnit: string | null
    note: string | null
}

interface EditItemDialogProps {
    item: Item
    sections: Section[]
    listId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function EditItemDialog({ item, sections, listId, open, onOpenChange, onSuccess }: EditItemDialogProps) {
    const [name, setName] = useState(item.name)
    const [sectionId, setSectionId] = useState(item.sectionId || "uncategorized")
    const [defaultUnit, setDefaultUnit] = useState(item.defaultUnit || "")
    const [commentEnabled, setCommentEnabled] = useState(Boolean(item.note?.trim()))
    const [note, setNote] = useState(item.note || "")

    const updateItem = useUpdateItem()

    // No useEffect to sync form state from props — the parent passes
    // key={editingItem.id} which remounts this component when switching
    // items, re-running the useState initializers above. This prevents
    // RxDB subscription re-renders from wiping in-progress edits.

    const handleSave = () => {
        if (!name.trim()) return

        updateItem.mutate(
            {
                itemId: item.id,
                name: name.trim(),
                sectionId: sectionId === "uncategorized" ? undefined : sectionId,
                defaultUnit: defaultUnit.trim() || undefined,
                note: commentEnabled ? note.trim() : "",
                listId,
            },
            {
                onSuccess: () => {
                    onOpenChange(false)
                    onSuccess?.()
                },
            }
        )
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
                            <SelectContent className="max-h-60">
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
                    <div className="grid gap-3 rounded-lg border p-3">
                        <label htmlFor="edit-comment-toggle" className="flex items-center gap-2 text-sm font-medium">
                            <Checkbox
                                id="edit-comment-toggle"
                                checked={commentEnabled}
                                onCheckedChange={(checked) => {
                                    const enabled = checked === true
                                    setCommentEnabled(enabled)
                                    if (!enabled) setNote("")
                                }}
                            />
                            Comment
                        </label>
                        {commentEnabled && (
                            <textarea
                                id="edit-note"
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Brand, allergy, or shopping reminder"
                                className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={updateItem.isPending}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
