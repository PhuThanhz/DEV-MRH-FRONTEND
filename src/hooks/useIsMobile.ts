/**
 * useIsMobile.ts
 * Dùng để: detect xem đang xem trên mobile hay desktop (dựa vào window width)
 * Dùng trong: ExpandedRow.tsx, TokenCard.tsx, index.tsx
 */

import { useState, useEffect } from "react";

export function useIsMobile(breakpoint = 640): boolean {
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth < breakpoint : false
    );

    useEffect(() => {
        if (typeof window === "undefined") return;
        const handler = () => setIsMobile(window.innerWidth < breakpoint);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, [breakpoint]);

    return isMobile;
}