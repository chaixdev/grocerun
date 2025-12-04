import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8 relative">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Welcome to <span className="text-primary">Grocerun</span>
        </h1>
        <p className="text-xl text-muted-foreground">
          Smart shopping list app for the modern household.
        </p>
      </div>

      <div className="grid gap-4 w-full max-w-sm">
        <div className="p-6 border rounded-lg shadow-sm bg-card text-card-foreground">
          <h2 className="text-lg font-semibold mb-2">Design System Check</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Primary Color</span>
              <div className="h-8 w-8 rounded bg-primary"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Destructive Color</span>
              <div className="h-8 w-8 rounded bg-destructive"></div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Muted Color</span>
              <div className="h-8 w-8 rounded bg-muted"></div>
            </div>
          </div>
        </div>

        <button className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "h-10 px-4 py-2"
        )}>
          This is a Primary Button
        </button>
      </div>
    </main>
  );
}
