import { Store, Settings, LucideIcon, ScrollText } from 'lucide-react'

export interface NavigationItem {
    title: string
    href: string
    icon: LucideIcon
}

export const navigationItems: NavigationItem[] = [
    {
        title: 'Lists',
        href: '/lists',
        icon: ScrollText,
    },
    {
        title: 'Stores',
        href: '/stores',
        icon: Store,
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
    },
]
