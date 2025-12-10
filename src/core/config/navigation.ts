import { Home, Store, Settings, LucideIcon } from 'lucide-react'

export interface NavigationItem {
    title: string
    href: string
    icon: LucideIcon
}

export const navigationItems: NavigationItem[] = [
    {
        title: 'Lists',
        href: '/lists',
        icon: Home,
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
