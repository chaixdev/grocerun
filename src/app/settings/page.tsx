import { auth } from "@/core/auth";
import { prisma } from "@/core/db";
import { SettingsForm } from "@/components/settings-form";
import { redirect } from "next/navigation";

import { appConfig } from "@/core/config";

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    let user;
    try {
        user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                households: {
                    include: { _count: { select: { users: true } } }
                }
            },
        });
    } catch (error) {
        console.error("Settings page - failed to fetch user:", error);
        redirect("/login");
    }

    // If user doesn't exist in database but has valid session, it means the database
    // was reset or JWT token is stale. Show a message and force logout via client-side.
    if (!user) {
        console.error("Settings page - user not found in database:", session.user.id);
        return (
            <div className="container max-w-2xl py-10 space-y-8">
                <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                    <div className="p-8 border rounded-lg bg-destructive/10 border-destructive/20 text-center max-w-md">
                        <h2 className="text-lg font-semibold text-destructive mb-2">Session Expired</h2>
                        <p className="text-muted-foreground mb-4">
                            Your session is no longer valid. Please sign in again.
                        </p>
                        <form action={async () => {
                            "use server"
                            const { signOut } = await import("@/core/auth")
                            await signOut({ redirectTo: "/login" })
                        }}>
                            <button type="submit" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                Sign In Again
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // Settings page is accessible even without households
    // Users can update profile and will see household invitation section

    return (
        <div className="container max-w-2xl py-10 space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your account settings and preferences.
                </p>
            </div>
            <SettingsForm
                user={user}
                households={user.households}
                invitationTimeoutMinutes={appConfig.invitation.expiresInMinutes}
            />
        </div>
    );
}
