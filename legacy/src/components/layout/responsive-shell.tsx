import { Sidebar } from "./sidebar";
import { BottomNav } from "./bottom-nav";

interface ResponsiveShellProps {
    children: React.ReactNode;
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export function ResponsiveShell({ children, user }: ResponsiveShellProps) {
    return (
        <div className="flex h-[calc(100vh-3.5rem)] w-full flex-col md:h-screen md:flex-row">
            <Sidebar user={user} />
            <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
