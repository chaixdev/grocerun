
import { Link } from "@tanstack/react-router";
import { UserNav } from "@/components/user-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { navigationItems } from "@/core/config/navigation";

interface SidebarProps {
    user?: {
        name?: string | null;
        email?: string | null;
        image?: string | null;
    };
}

export function Sidebar({ user }: SidebarProps) {
    return (
        <aside className="hidden w-64 flex-col border-r bg-background md:flex">
            <div className="flex h-14 items-center border-b px-4">
                <Link to="/" className="flex items-center gap-2 hover:no-underline">
                    <img src="/icon.svg" alt="" width={28} height={28} className="h-7 w-7" />
                    <span className="text-lg font-semibold text-primary">Grocerun</span>
                </Link>
            </div>
            <nav className="flex-1 space-y-1 p-4">
                {navigationItems.map((item) => (
                    <Link
                        key={item.href}
                        to={item.href}
                        activeOptions={{ exact: false }}
                        activeProps={{ className: "bg-accent text-accent-foreground" }}
                        inactiveProps={{ className: "text-muted-foreground" }}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                    </Link>
                ))}
            </nav>
            <div className="border-t p-4">
                <div className="flex items-center justify-between">
                    {user ? (
                        <UserNav user={user} />
                    ) : (
                        <Link
                            to="/login"
                            className="text-sm font-medium text-muted-foreground hover:text-primary"
                        >
                            Login
                        </Link>
                    )}
                    <ModeToggle />
                </div>
            </div>
        </aside>
    );
}
