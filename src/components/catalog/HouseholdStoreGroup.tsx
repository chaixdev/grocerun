import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CatalogHousehold } from "@/actions/catalog"
import { StoreCard } from "./StoreCard"

interface HouseholdStoreGroupProps {
    household: CatalogHousehold
}

export function HouseholdStoreGroup({ household }: HouseholdStoreGroupProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">{household.name}</h2>
                <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Add store to {household.name}</span>
                </Button>
            </div>

            {household.stores.length === 0 ? (
                <div className="p-8 border rounded-lg bg-muted/20 border-dashed text-center">
                    <p className="text-muted-foreground">No stores yet.</p>
                    <Button variant="link" className="mt-2 h-auto p-0">
                        Add your first store
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {household.stores.map((store) => (
                        <StoreCard key={store.id} store={store} />
                    ))}
                </div>
            )}
        </div>
    )
}
