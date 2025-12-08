import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBasket, ShoppingCart, ListChecks, CalendarDays, ScrollText } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActiveListCardProps {
    list: {
        id: string
        name: string
        status: string
        _count: { items: number }
        updatedAt: Date
    }
    storeName: string
}

export function ActiveListCard({ list, storeName }: ActiveListCardProps) {
    const isShopping = list.status === "SHOPPING"
    const isGeneral = storeName.toLowerCase() === "general"
    return (
        <Link href={`/lists/${list.id}`}>
            <Card
                className={cn(
                    "group hover:bg-accent/50 transition-all cursor-pointer h-full relative border-l-4 overflow-hidden",
                    isShopping ? "border-l-green-500 shadow-md" : "border-l-blue-400"
                )}
            >
                {/* Background Pattern/Glow */}
                {isShopping && (
                    <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                        <ShoppingBasket className="w-24 h-24 -mr-6 -mt-6 rotate-12" />
                    </div>
                )}

                <div className="p-4 flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1.5 overflow-hidden">
                        <h3 className="font-bold text-base leading-tight truncate group-hover:text-primary transition-colors">
                            {storeName}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                            <div className="flex items-center gap-1">
                                <ScrollText size={10} />
                                <span className="uppercase tracking-wider">List</span>
                            </div>
                            <span className="text-muted-foreground/40">•</span>
                            <div className="flex items-center gap-1">
                                <CalendarDays size={10} />
                                <span>{new Date(list.updatedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0 z-10">
                        <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold",
                            isShopping
                                ? "bg-green-100/50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                                : "bg-muted/50 border-border text-muted-foreground"
                        )}>
                            <ShoppingBasket size={12} />
                            <span>{list._count.items}</span>
                        </div>
                        {isShopping && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-green-600 dark:text-green-500 animate-pulse px-1">
                                Live
                            </span>
                        )}
                    </div>
                </div>
            </Card>
        </Link>
    )
}
