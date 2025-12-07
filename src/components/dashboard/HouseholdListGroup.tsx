import { ActiveListCard } from "./ActiveListCard"
import { DashboardHousehold } from "@/actions/dashboard"

interface HouseholdListGroupProps {
    household: DashboardHousehold
}

export function HouseholdListGroup({ household }: HouseholdListGroupProps) {
    // Flatten lists to render them in a single grid, but keep store context
    const allLists = household.stores.flatMap(store =>
        store.lists.map(list => ({ ...list, storeName: store.name }))
    )

    if (allLists.length === 0) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight">{household.name}</h2>
                <div className="p-8 border rounded-lg bg-muted/20 border-dashed text-center">
                    <p className="text-muted-foreground">No active lists</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">{household.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allLists.map(list => (
                    <ActiveListCard
                        key={list.id}
                        list={list}
                        storeName={list.storeName}
                    />
                ))}
            </div>
        </div>
    )
}
