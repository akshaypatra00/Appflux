
"use client"

import { useEffect } from "react"

export function ViewTracker({ appId }: { appId: string }) {
    useEffect(() => {
        // Fire and forget view increment
        fetch(`/api/apps/view?id=${appId}`, { method: 'POST' }).catch(console.error);
    }, [appId]);

    return null; // Invisible component
}
