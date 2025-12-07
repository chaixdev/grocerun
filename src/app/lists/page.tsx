import { auth } from "@/auth";
import { getDashboardData } from "@/actions/dashboard";
import { HouseholdListGroup } from "@/components/dashboard/HouseholdListGroup";
import { redirect } from "next/navigation";

export default async function ListsPage() {
    const session = await auth();
    if (!session?.user) redirect("/login");

    let households = [];

    try {
        households = await getDashboardData();
    } catch (error) {
        console.error("Dashboard page error:", error);
        return (
            <div className="container max-w-4xl mx-auto py-12 px-4 text-center">
                <div className="p-8 border rounded-lg bg-destructive/10 border-destructive/20">
                    <h2 className="text-lg font-semibold text-destructive mb-2">Something went wrong</h2>
                    <p className="text-muted-foreground mb-4">
                        We couldn't load your lists. Please try again later.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto py-8 px-4 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Lists</h1>
                <p className="text-muted-foreground">
                    Active shopping lists for your households.
                </p>
            </div>

            <div className="space-y-12">
                {households.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-muted/20 border-dashed">
                        <p className="text-lg font-medium">No households found</p>
                        <p className="text-muted-foreground mt-1">
                            Create or join a household to get started.
                        </p>
                    </div>
                ) : (
                    households.map((household) => (
                        <HouseholdListGroup
                            key={household.id}
                            household={household}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
