import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./table-scrollbar.css";

const ROOT_VISIBLE_CLASS = "lotus-page-scrolled";
const REVEAL_AFTER_SCROLL_PX = 32;

export const TABLE_STICKY = Object.freeze({
    offsetHeader: 56,
    offsetScroll: 8,
});

/**
 * Owns the shared visibility behavior for every Ant Design table scrollbar.
 * It mutates one root class instead of updating React state while scrolling.
 */
const TableScrollbarController = () => {
    const { pathname } = useLocation();

    useEffect(() => {
        const root = document.documentElement;
        let animationFrame: number | null = null;
        let hasRevealedScrollbar = false;

        const revealScrollbar = () => {
            if (hasRevealedScrollbar || animationFrame !== null) return;

            animationFrame = window.requestAnimationFrame(() => {
                animationFrame = null;
                if (window.scrollY <= REVEAL_AFTER_SCROLL_PX) return;

                hasRevealedScrollbar = true;
                root.classList.add(ROOT_VISIBLE_CLASS);
                window.removeEventListener("scroll", revealScrollbar);
            });
        };

        root.classList.remove(ROOT_VISIBLE_CLASS);
        revealScrollbar();
        window.addEventListener("scroll", revealScrollbar, { passive: true });

        return () => {
            window.removeEventListener("scroll", revealScrollbar);
            if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
            root.classList.remove(ROOT_VISIBLE_CLASS);
        };
    }, [pathname]);

    return null;
};

export default TableScrollbarController;
