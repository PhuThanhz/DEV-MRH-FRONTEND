import type { CSSProperties } from "react";
import { useBreakpoint } from "@/hooks/useIsMobile";

export const TABLE_SCROLL_X = { x: "max-content" } as const;

export const MODAL_BODY_SCROLL: CSSProperties = {
    maxHeight: "80vh",
    overflowY: "auto",
};

export const RESPONSIVE_GUTTER: [number, number] = [16, 16];

export const getModalWidth = (base: number) => {
    if (typeof window === "undefined") return base;
    const width = window.innerWidth;

    if (width < 640) return "100vw";
    if (width < 1024) return "95vw";

    return base;
};

export const useResponsiveModalWidth = (base: number) => {
    const { isMobile, isTablet } = useBreakpoint();

    if (isMobile) return "100vw";
    if (isTablet) return "95vw";

    return base;
};
