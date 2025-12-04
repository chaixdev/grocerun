import { signIn } from "@/auth"
import { cn } from "@/lib/utils"

export default function LoginPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-muted/40">
            <div className="mx-auto grid w-[350px] gap-6">
                <div className="grid gap-2 text-center">
                    <h1 className="text-3xl font-bold">Login</h1>
                    <p className="text-balance text-muted-foreground">
                        Sign in to your account using Google
                    </p>
                </div>
                <div className="grid gap-4">
                    <form
                        action={async () => {
                            "use server"
                            await signIn("google")
                        }}
                    >
                        <button className={cn(
                            "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                            "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
                            "h-10 px-4 py-2 w-full"
                        )}>
                            Sign in with Google
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
