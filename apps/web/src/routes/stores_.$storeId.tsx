import { useState, useCallback } from "react"
import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router"
import { useParams, Link } from "@tanstack/react-router"
import { enforceAppLogin } from "@/core/auth/guard"
import { SectionForm } from "@/features/stores/components/SectionForm"
import { SectionList } from "@/features/stores/components/SectionList"
import { useStore, useUpdateStore } from "@/features/stores/hooks/useStore"
import { StoreLists } from "@/features/lists/components/StoreLists"
import { StoreDeleteSection } from "@/features/stores/components/StoreSettings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Check, Pencil, X } from "lucide-react"
import { PageLoading } from "@/components/ui/page-loading"

export const Route = createFileRoute("/stores_/$storeId")({
    beforeLoad: enforceAppLogin,
    component: lazyRouteComponent(() => import("./stores_.$storeId"), "StoreDetailsPage"),
})

type EditingField = "name" | "location" | null

export function StoreDetailsPage() {
    const { storeId } = useParams({ from: "/stores_/$storeId" })
    const { data: store, isLoading, error } = useStore(storeId)
    const updateStore = useUpdateStore(storeId)
    const [editingField, setEditingField] = useState<EditingField>(null)
    const [editValue, setEditValue] = useState("")

    const startEditing = useCallback((field: "name" | "location", currentValue: string) => {
        setEditingField(field)
        setEditValue(currentValue)
    }, [])

    const cancelEditing = useCallback(() => {
        setEditingField(null)
        setEditValue("")
    }, [])

    const saveEdit = useCallback(() => {
        if (!store || !editingField) return
        const trimmed = editValue.trim()
        // Don't save if unchanged
        const current = editingField === "name" ? store.name : (store.location || "")
        if (trimmed === current) {
            cancelEditing()
            return
        }
        const data = {
            name: editingField === "name" ? trimmed : store.name,
            location: editingField === "location" ? trimmed : (store.location ?? undefined),
        }
        updateStore.mutate(data)
        cancelEditing()
    }, [store, editingField, editValue, updateStore, cancelEditing])

    const handleEditKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter") saveEdit()
            if (e.key === "Escape") cancelEditing()
        },
        [saveEdit, cancelEditing],
    )

    if (isLoading) return <PageLoading />

    if (error || !store) {
        return (
            <div className="container py-10 text-center text-muted-foreground">
                Store not found.
            </div>
        )
    }

    return (
        <div className="container py-10 space-y-8">
            <div className="flex items-start gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/stores">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1 space-y-1">
                    {/* Inline-editable store name */}
                    {editingField === "name" ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={handleEditKeyDown}
                                className="text-3xl font-bold tracking-tight h-auto py-1 px-2"
                                autoFocus
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={saveEdit}>
                                <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={cancelEditing}>
                                <X className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="text-3xl font-bold tracking-tight hover:text-primary/80 transition-colors group flex items-center gap-2 bg-transparent border-0 p-0 cursor-pointer"
                            onClick={() => startEditing("name", store.name)}
                            aria-label={`Store name: ${store.name}. Click to edit.`}
                        >
                            {store.name}
                            <Pencil className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    )}

                    {/* Inline-editable location */}
                    {editingField === "location" ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={handleEditKeyDown}
                                placeholder="Address or area"
                                className="text-muted-foreground h-auto py-1 px-2"
                                autoFocus
                            />
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={saveEdit}>
                                <Check className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={cancelEditing}>
                                <X className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            className="text-muted-foreground hover:text-foreground/80 transition-colors group flex items-center gap-2 bg-transparent border-0 p-0 cursor-pointer"
                            onClick={() => startEditing("location", store.location || "")}
                            aria-label={`Location: ${store.location || "Not set"}. Click to edit.`}
                        >
                            {store.location || "No location set"}
                            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-8">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Sections (Aisles)</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Define the sections of this store in the order you encounter them.
                        Drag to reorder.
                    </p>
                    <SectionForm storeId={store.id} />
                    <SectionList storeId={store.id} />
                </div>

                <StoreLists storeId={store.id} />
            </div>

            {/* Danger zone — collapsed at page bottom */}
            <div className="pt-4 border-t">
                <details className="group">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors select-none">
                        Delete this store…
                    </summary>
                    <div className="mt-4 p-6 border border-destructive/20 rounded-lg bg-destructive/5">
                        <StoreDeleteSection storeId={store.id} storeName={store.name} />
                    </div>
                </details>
            </div>
        </div>
    )
}
