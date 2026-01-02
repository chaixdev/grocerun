import { getHouseholds } from "@/actions/household"
import { HouseholdForm } from "@/features/households"
import { HouseholdList } from "@/features/households"

export default async function HouseholdsPage() {
    const households = await getHouseholds()

    return (
        <div className="container py-10 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Households</h2>
                    <p className="text-muted-foreground">
                        Manage your households and shared lists.
                    </p>
                </div>
                <HouseholdForm />
            </div>
            <HouseholdList households={households} />
        </div>
    )
}
