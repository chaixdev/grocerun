"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, RotateCw } from "lucide-react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error)
    }, [error])

    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
            <Card className="w-full max-w-md border-destructive/20 bg-destructive/5">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-foreground">
                        Something went wrong!
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                    <p>We encountered an unexpected error. Please try again later.</p>
                    {process.env.NODE_ENV === "development" && (
                        <div className="mt-4 rounded bg-destructive/10 p-4 font-mono text-xs text-left overflow-auto max-h-40 text-destructive-foreground">
                            {error.message}
                            {error.digest && <div className="mt-2 text-[10px] opacity-70">Digest: {error.digest}</div>}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="justify-center">
                    <Button
                        onClick={reset}
                        variant="outline"
                        className="border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                    >
                        <RotateCw className="mr-2 h-4 w-4" />
                        Try again
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
