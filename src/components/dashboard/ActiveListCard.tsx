import Link from "next/link"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBasket, ShoppingCart, ListChecks, CalendarDays } from "lucide-react"
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
            <Card className={cn(
                "group hover:bg-accent/50 transition-all cursor-pointer h-full flex flex-col justify-between overflow-hidden relative border-l-4",
                isShopping ? "border-l-green-500 shadow-md" : "border-l-blue-400"
            )}>
                {/* Status Indicator Glow (Shopping Mode) */}
                {isShopping && (
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShoppingBasket className="w-24 h-24 text-green-500 -mr-4 -mt-4 rotate-12" />
                    </div>
                )}

                <CardHeader className="pb-2 space-y-0">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {storeName}
                            </span>
                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                {list.name}
                            </h3>
                        </div>
                        <div className={cn(
                            "p-2 rounded-full",
                            isShopping ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        )}>
                            {isGeneral ? <ListChecks size={20} /> : <ShoppingCart size={20} />}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pb-2">
                    <div className="flex items-center gap-2">
                        <Badge variant={isShopping ? "default" : "secondary"} className={cn(
                            isShopping && "bg-green-600 hover:bg-green-700"
                        )}>
                            {list._count.items} items
                        </Badge>
                        {isShopping && (
                            <span className="text-xs font-medium text-green-600 dark:text-green-500 animate-pulse">
                                Live Shopping
                            </span>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="pt-2 text-xs text-muted-foreground border-t bg-muted/20">
                    <div className="flex items-center gap-1">
                        <CalendarDays size={12} />
                        <span>
                            Updated {new Date(list.updatedAt).toLocaleDateString()}
                        </span>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    )
}
