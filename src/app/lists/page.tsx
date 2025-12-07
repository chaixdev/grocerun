import { auth } from "@/auth";

export default async function ListsPage() {
    const session = await auth();

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
            <h1 className="text-3xl font-bold">Lists Dashboard</h1>
            <p className="text-xl">
                Welcome back, <span className="font-semibold text-primary">{session?.user?.email}</span>
            </p>
            <div className="p-4 border rounded bg-muted">
                <p>Active lists will appear here (GRO-38).</p>
            </div>
        </div>
    );
}
