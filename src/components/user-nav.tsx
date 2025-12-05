"use client"

import { signOut } from "next-auth/react"
import Link from "next/link"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import * as Avatar from "@radix-ui/react-avatar"
import { LogOut, Users } from "lucide-react"

interface UserNavProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
    }
}

export function UserNav({ user }: UserNavProps) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="relative h-8 w-8 rounded-full outline-none ring-offset-background transition-all hover:opacity-80 focus:ring-2 focus:ring-ring focus:ring-offset-2">
                    <Avatar.Root className="relative flex h-full w-full shrink-0 overflow-hidden rounded-full border">
                        <Avatar.Image
                            src={user.image || ""}
                            alt={user.name || "User avatar"}
                            className="aspect-square h-full w-full object-cover"
                        />
                        <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground text-xs font-medium">
                            {user.email?.[0]?.toUpperCase() || "U"}
                        </Avatar.Fallback>
                    </Avatar.Root>
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                    align="end"
                    sideOffset={5}
                >
                    <div className="flex items-center justify-start gap-2 p-2">
                        <div className="flex flex-col space-y-1 leading-none">
                            {user.name && <p className="font-medium">{user.name}</p>}
                            {user.email && (
                                <p className="w-[200px] truncate text-xs text-muted-foreground">
                                    {user.email}
                                </p>
                            )}
                        </div>
                    </div>
                    <DropdownMenu.Separator className="-mx-1 my-1 h-px bg-muted" />
                    <DropdownMenu.Item asChild>
                        <Link
                            href="/dashboard/households"
                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        >
                            <Users className="mr-2 h-4 w-4" />
                            <span>Households</span>
                        </Link>
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="-mx-1 my-1 h-px bg-muted" />
                    <DropdownMenu.Item
                        className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                        onSelect={() => signOut({ callbackUrl: "/" })}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    )
}
