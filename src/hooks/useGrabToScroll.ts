import { useRef, useEffect } from "react";

/**
 * Reusable hook to enable mouse grab-to-scroll on horizontal overflow containers.
 * Useful for tables with sticky columns on desktop.
 */
export const useGrabToScroll = () => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;

        const handleMouseDown = (e: MouseEvent) => {
            // Only start dragging on left mouse click
            if (e.button !== 0) return;

            // Avoid dragging when clicking on inputs, buttons, or interactive Ant Design elements
            const target = e.target as HTMLElement;
            if (
                target.closest(
                    "button, input, select, textarea, [role=\"button\"], a, " +
                    ".ant-select, .ant-radio-wrapper, .ant-radio-button-wrapper, .ant-input-number, " +
                    ".evaluation-score-picker"
                )
            ) {
                return;
            }

            isDown = true;
            container.style.cursor = "grabbing";
            container.style.userSelect = "none";
            startX = e.pageX - container.offsetLeft;
            scrollLeft = container.scrollLeft;
        };

        const handleMouseLeave = () => {
            isDown = false;
            container.style.cursor = "grab";
            container.style.userSelect = "";
        };

        const handleMouseUp = () => {
            isDown = false;
            container.style.cursor = "grab";
            container.style.userSelect = "";
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - container.offsetLeft;
            const walk = (x - startX) * 1.5; // Drag speed multiplier
            container.scrollLeft = scrollLeft - walk;
        };

        container.addEventListener("mousedown", handleMouseDown);
        container.addEventListener("mouseleave", handleMouseLeave);
        container.addEventListener("mouseup", handleMouseUp);
        container.addEventListener("mousemove", handleMouseMove);

        container.style.cursor = "grab";

        return () => {
            container.removeEventListener("mousedown", handleMouseDown);
            container.removeEventListener("mouseleave", handleMouseLeave);
            container.removeEventListener("mouseup", handleMouseUp);
            container.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return containerRef;
};
