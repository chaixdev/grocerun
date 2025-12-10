"use client";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;

export function AppVersion() {
    if (!APP_VERSION) return null;

    return (
        <div className="fixed bottom-2 right-2 text-xs text-muted-foreground opacity-50 hover:opacity-100 transition-opacity">
            v{APP_VERSION}
        </div>
    );
}

