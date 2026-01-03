import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"
import Link from "next/link"
import { User } from "next-auth"

interface HeaderProps {
    user?: User
}

export function Header({ user }: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center gap-6 font-bold text-xl">
                    <Link href="/" className="flex items-center gap-2 hover:no-underline">
                        <span className="text-primary">Grocerun</span>
                    </Link>

                </div>

                <div className="flex items-center gap-4">
                    <ModeToggle />
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
                </div>
            </div>
        </header>
    )
}
