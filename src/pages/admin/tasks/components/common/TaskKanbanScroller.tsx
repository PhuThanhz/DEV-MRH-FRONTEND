import React, { useEffect, useRef, useState } from "react";

interface TaskKanbanScrollerProps {
    children: React.ReactNode;
}

export const TaskKanbanScroller: React.FC<TaskKanbanScrollerProps> = React.memo(
    ({ children }) => {
        const topScrollRef = useRef<HTMLDivElement>(null);
        const boardScrollRef = useRef<HTMLDivElement>(null);
        const [scrollWidth, setScrollWidth] = useState(0);
        const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);

        useEffect(() => {
            const top = topScrollRef.current;
            const board = boardScrollRef.current;
            if (!top || !board) return;

            let isSyncing = false;
            let syncFrame = 0;
            let measureFrame = 0;

            const syncScroll = (
                source: HTMLDivElement,
                target: HTMLDivElement
            ) => {
                if (isSyncing) return;
                isSyncing = true;

                const sourceMax = source.scrollWidth - source.clientWidth;
                const targetMax = target.scrollWidth - target.clientWidth;
                const ratio = sourceMax > 0 ? source.scrollLeft / sourceMax : 0;
                target.scrollLeft = ratio * Math.max(0, targetMax);

                window.cancelAnimationFrame(syncFrame);
                syncFrame = window.requestAnimationFrame(() => {
                    isSyncing = false;
                });
            };

            const handleTopScroll = () => syncScroll(top, board);
            const handleBoardScroll = () => syncScroll(board, top);
            const measureOverflow = () => {
                const nextScrollWidth = board.scrollWidth;
                setScrollWidth(nextScrollWidth);
                setHasHorizontalOverflow(nextScrollWidth > board.clientWidth + 1);
            };

            top.addEventListener("scroll", handleTopScroll, { passive: true });
            board.addEventListener("scroll", handleBoardScroll, { passive: true });

            const resizeObserver =
                typeof ResizeObserver !== "undefined"
                    ? new ResizeObserver(measureOverflow)
                    : null;
            resizeObserver?.observe(board);

            measureFrame = window.requestAnimationFrame(measureOverflow);

            return () => {
                top.removeEventListener("scroll", handleTopScroll);
                board.removeEventListener("scroll", handleBoardScroll);
                resizeObserver?.disconnect();
                window.cancelAnimationFrame(syncFrame);
                window.cancelAnimationFrame(measureFrame);
            };
        }, []);

        return (
            <div className="task-kanban-scroll-shell">
                <div
                    ref={topScrollRef}
                    className={`task-kanban-top-scrollbar${
                        hasHorizontalOverflow ? " is-visible" : ""
                    }`}
                    role="region"
                    aria-label="Cuộn ngang bảng tác vụ"
                    tabIndex={hasHorizontalOverflow ? 0 : -1}
                >
                    <div style={{ width: scrollWidth, height: 1 }} />
                </div>

                <div
                    ref={boardScrollRef}
                    className="task-board-scroll kanban-scroll-row"
                >
                    {children}
                </div>
            </div>
        );
    }
);

TaskKanbanScroller.displayName = "TaskKanbanScroller";
