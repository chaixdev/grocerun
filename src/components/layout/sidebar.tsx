"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
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
    const pathname = usePathname();

    return (
        <aside className="hidden w-64 flex-col border-r bg-background md:flex">
            <div className="flex h-14 items-center border-b px-4">
                <span className="text-lg font-semibold text-primary">Grocerun</span>
            </div>
            <nav className="flex-1 space-y-1 p-4">
                {navigationItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                            pathname === item.href
                                ? "bg-accent text-accent-foreground"
                                : "text-muted-foreground"
                        )}
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
                            href="/login"
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
