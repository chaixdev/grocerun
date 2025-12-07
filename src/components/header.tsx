import { auth } from "@/auth"
import { ModeToggle } from "@/components/mode-toggle"
import { UserNav } from "@/components/user-nav"
import Link from "next/link"

export async function Header() {
    const session = await auth()

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
            <div className="container flex h-14 items-center justify-between">
                <div className="flex items-center gap-6 font-bold text-xl">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-primary">Grocerun</span>
                    </Link>
                    {session?.user && (
                        <nav className="flex items-center gap-4 text-sm font-medium">
                            <Link href="/dashboard/stores" className="transition-colors hover:text-primary">
                                Stores
                            </Link>
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <ModeToggle />
                    {session?.user ? (
                        <UserNav user={session.user} />
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
