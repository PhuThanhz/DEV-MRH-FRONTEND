import { useEffect, useState } from "react";

export const RESPONSIVE_BREAKPOINTS = {
    mobile: 640,
    desktop: 1024,
} as const;

type BreakpointState = {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    width: number;
};

const getViewportWidth = () => (typeof window !== "undefined" ? window.innerWidth : 1024);

const getBreakpointState = (): BreakpointState => {
    const width = getViewportWidth();

    return {
        isMobile: width < RESPONSIVE_BREAKPOINTS.mobile,
        isTablet: width >= RESPONSIVE_BREAKPOINTS.mobile && width < RESPONSIVE_BREAKPOINTS.desktop,
        isDesktop: width >= RESPONSIVE_BREAKPOINTS.desktop,
        width,
    };
};

export function useBreakpoint(): BreakpointState {
    const [state, setState] = useState<BreakpointState>(() => getBreakpointState());

    useEffect(() => {
        if (typeof window === "undefined") return;

        const mobileQuery = window.matchMedia(`(max-width: ${RESPONSIVE_BREAKPOINTS.mobile - 1}px)`);
        const desktopQuery = window.matchMedia(`(min-width: ${RESPONSIVE_BREAKPOINTS.desktop}px)`);
        const update = () => setState(getBreakpointState());

        update();
        mobileQuery.addEventListener("change", update);
        desktopQuery.addEventListener("change", update);
        window.addEventListener("resize", update);

        return () => {
            mobileQuery.removeEventListener("change", update);
            desktopQuery.removeEventListener("change", update);
            window.removeEventListener("resize", update);
        };
    }, []);

    return state;
}

export function useIsMobile(breakpoint: number = RESPONSIVE_BREAKPOINTS.mobile): boolean {
    const [isMobile, setIsMobile] = useState(() => getViewportWidth() < breakpoint);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
        const update = () => setIsMobile(mediaQuery.matches);

        update();
        mediaQuery.addEventListener("change", update);

        return () => mediaQuery.removeEventListener("change", update);
    }, [breakpoint]);

    return isMobile;
}
