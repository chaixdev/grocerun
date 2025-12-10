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
    const isPlanningMode = list.status === "PLANNING"
    const isGeneral = storeName.toLowerCase() === "general"

    return (
        <Link href={`/lists/${list.id}`}>
            <Card className={cn(
                "group hover:bg-primary/10 transition-all cursor-pointer h-full flex flex-col justify-between overflow-hidden relative border-l-4",
                isShopping ? "border-l-primary shadow-md bg-primary/5" : "border-l-primary/40 hover:border-l-primary"
            )}>
                {/* Status Indicator Glow (Shopping Mode) */}
                {isShopping && (
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <ShoppingBasket className="w-24 h-24 text-primary -mr-4 -mt-4 rotate-12" />
                    </div>
                )}
                
                {/* Planning Mode Background Indicator */}
                {isPlanningMode && (
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary -mr-4 -mt-4 rotate-12">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                    </div>
                )}

                <CardHeader className="pb-2 space-y-0">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-semibold uppercase tracking-wider flex items-center gap-1">
                                    <ScrollText className="h-3 w-3" />
                                    <span>List</span>
                                </span>
                                <span className="text-muted-foreground/40">•</span>
                                <div className="flex items-center gap-1 text-primary font-medium">
                                    <CalendarDays size={12} />
                                    <span suppressHydrationWarning>{new Date(list.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <span className="text-muted-foreground/40">•</span>
                                {isShopping && (
                                    <Badge variant="default" className="text-[9px] font-bold uppercase tracking-wider animate-pulse">
                                        Shopping
                                    </Badge>
                                )}
                                {isPlanningMode && (
                                    <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider border-primary/20 text-primary">
                                        Planning
                                    </Badge>
                                )}
                            </div>
                            <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                                {storeName}
                            </h3>
                        </div>
                        <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-semibold",
                            isShopping
                                ? "bg-primary text-primary-foreground border-transparent shadow-sm"
                                : "bg-primary/10 text-primary border-primary/20"
                        )}>
                            {isGeneral ? <ListChecks size={12} /> : <ShoppingBasket size={12} />}
                            <span>{list._count.items}</span>
                        </div>
                    </div>
                </CardHeader>




            </Card >
        </Link >
    )
}
