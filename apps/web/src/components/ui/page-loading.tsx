import { Loader2 } from "lucide-react"

export function PageLoading() {
  return (
    <div className="flex items-center justify-center h-full min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  )
}
