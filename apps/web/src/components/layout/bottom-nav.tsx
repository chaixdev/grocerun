
import { Link } from "@tanstack/react-router";
import { navigationItems } from "@/core/config/navigation";

export function BottomNav() {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background px-4 md:hidden">
            {navigationItems.map((item) => (
                <Link
                    key={item.href}
                    to={item.href}
                    activeOptions={{ exact: false }}
                    activeProps={{ className: "text-primary" }}
                    inactiveProps={{ className: "text-muted-foreground" }}
                    className="flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors hover:text-primary"
                >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                </Link>
            ))}
        </nav>
    );
}
