import { getStores } from "@/actions/store"
import { getHouseholds } from "@/actions/household"
import { StoreForm } from "@/components/store-form"
import { StoreList } from "@/components/store-list"
import { HouseholdSelect } from "@/components/household-select"

export default async function StoresPage({
    searchParams,
}: {
    searchParams: { householdId?: string }
}) {
    const households = await getHouseholds()
    const activeHouseholdId = searchParams.householdId || households[0]?.id
    const activeHousehold = households.find((h) => h.id === activeHouseholdId) || households[0]

    const stores = await getStores(activeHouseholdId)

    return (
        <div className="container py-10 space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">Stores</h2>
                    <p className="text-muted-foreground">
                        Manage {activeHousehold?.name ? `${activeHousehold.name}'s` : "your household's"} favorite stores.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <HouseholdSelect households={households} />
                    {activeHouseholdId && <StoreForm householdId={activeHouseholdId} />}
                </div>
            </div>
            <StoreList stores={stores} />
        </div>
    )
}
