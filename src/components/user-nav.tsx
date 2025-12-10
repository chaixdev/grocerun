"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"

interface UserNavProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
}

export function UserNav({ user }: UserNavProps) {
    return (
        <Link href="/settings">
            <button className="relative h-8 w-8 rounded-full outline-none ring-offset-background transition-all hover:opacity-80 focus:ring-2 focus:ring-ring focus:ring-offset-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || ""} alt={user.name || "User avatar"} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                        {user.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                </Avatar>
            </button>
        </Link>
    )
}
