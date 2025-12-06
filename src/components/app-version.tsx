"use client";

import { useEffect, useState } from "react";

export function AppVersion() {
    const [version, setVersion] = useState<string | null>(null);

    useEffect(() => {
        // Access the environment variable
        const v = process.env.NEXT_PUBLIC_APP_VERSION;
        if (v) {
            setVersion(v);
        }
    }, []);

    if (!version) return null;

    return (
        <div className="fixed bottom-2 right-2 text-xs text-muted-foreground opacity-50 hover:opacity-100 transition-opacity">
            v{version}
        </div>
    );
}
