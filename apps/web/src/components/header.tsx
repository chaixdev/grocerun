import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"
import { Link } from "@tanstack/react-router"

interface HeaderProps {
    user?: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
}

export function Header({ user }: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center gap-6 font-bold text-xl">
                    <Link to="/" className="flex items-center gap-2 hover:no-underline">
                        <img src="/icon.svg" alt="" width={28} height={28} className="h-7 w-7" />
                        <span className="text-primary">Grocerun</span>
                    </Link>

                </div>

                <div className="flex items-center gap-4">
                    <ModeToggle />
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
                </div>
            </div>
        </header>
    )
}
