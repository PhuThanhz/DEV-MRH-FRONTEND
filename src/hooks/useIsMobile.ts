import { useEffect, useState } from "react";

export const RESPONSIVE_BREAKPOINTS = {
    mobile: 640,
    desktop: 1024,
    wideDesktop: 1367,
} as const;

type BreakpointState = {
    isMobile: boolean;
    isTablet: boolean;
    isSmallLaptop: boolean;
    isDesktop: boolean;
    width: number;
};

const getViewportWidth = () => (typeof window !== "undefined" ? window.innerWidth : 1024);

const getBreakpointState = (): BreakpointState => {
    const width = getViewportWidth();

    return {
        isMobile: width < RESPONSIVE_BREAKPOINTS.mobile,
        isTablet: width >= RESPONSIVE_BREAKPOINTS.mobile && width < RESPONSIVE_BREAKPOINTS.desktop,
        isSmallLaptop: width >= RESPONSIVE_BREAKPOINTS.desktop && width < RESPONSIVE_BREAKPOINTS.wideDesktop,
        isDesktop: width >= RESPONSIVE_BREAKPOINTS.desktop,
        width,
    };
};

const sameBreakpointState = (a: BreakpointState, b: BreakpointState) =>
    a.isMobile === b.isMobile &&
    a.isTablet === b.isTablet &&
    a.isSmallLaptop === b.isSmallLaptop &&
    a.isDesktop === b.isDesktop;

export function useBreakpoint(): BreakpointState {
    const [state, setState] = useState<BreakpointState>(() => getBreakpointState());

    useEffect(() => {
        if (typeof window === "undefined") return;

        const mobileQuery = window.matchMedia(`(max-width: ${RESPONSIVE_BREAKPOINTS.mobile - 1}px)`);
        const desktopQuery = window.matchMedia(`(min-width: ${RESPONSIVE_BREAKPOINTS.desktop}px)`);
        const wideDesktopQuery = window.matchMedia(`(min-width: ${RESPONSIVE_BREAKPOINTS.wideDesktop}px)`);

        let rafId: number | null = null;
        const update = () => {
            if (rafId !== null) return;
            rafId = window.requestAnimationFrame(() => {
                rafId = null;
                const next = getBreakpointState();
                setState((prev) => (sameBreakpointState(prev, next) ? prev : next));
            });
        };

        update();
        mobileQuery.addEventListener("change", update);
        desktopQuery.addEventListener("change", update);
        wideDesktopQuery.addEventListener("change", update);
        window.addEventListener("resize", update);

        return () => {
            if (rafId !== null) window.cancelAnimationFrame(rafId);
            mobileQuery.removeEventListener("change", update);
            desktopQuery.removeEventListener("change", update);
            wideDesktopQuery.removeEventListener("change", update);
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
