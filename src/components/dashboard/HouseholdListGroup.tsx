import { ActiveListCard } from "./ActiveListCard"

interface HouseholdListGroupProps {
    household: {
        id: string
        name: string
        stores: {
            id: string
            name: string
            lists: {
                id: string
                name: string
                status: string
                updatedAt: Date
                _count: { items: number }
            }[]
        }[]
    }
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
