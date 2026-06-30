import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "antd";
import { CloseOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { findGuideById, type LotusGuide } from "./guideRegistry";
import useGuidePermission from "@/hooks/useGuidePermission";

// Inject keyframes once at module load — không re-insert mỗi render
const STYLE_ID = "lotus-guide-keyframes";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
        @keyframes lotusGuideStepIn {
            from { opacity: 0; transform: translate3d(0, 8px, 0); filter: blur(1px); }
            to   { opacity: 1; transform: translate3d(0, 0, 0); filter: blur(0); }
        }
    `;
    document.head.appendChild(style);
}

const GUIDE_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const GUIDE_MOVE = `transform 0.64s ${GUIDE_EASE}`;
const GUIDE_SIZE = `width 0.64s ${GUIDE_EASE}, height 0.64s ${GUIDE_EASE}, border-radius 0.64s ${GUIDE_EASE}`;
const GUIDE_MODAL_SETTLE_MS = 300;
const GUIDE_TARGET_SETTLE_MS = 80;
const GUIDE_NEXT_TARGET_TIMEOUT_MS = 2400;

type Rect = {
    top: number;
    left: number;
    width: number;
    height: number;
    borderRadius?: string;
};

type LotusGuideContextValue = {
    activeGuide: LotusGuide | null;
    activeStepIndex: number;
    startGuide: (guideId: string) => void;
    stopGuide: () => void;
    canStartGuide: (guide: LotusGuide) => boolean;
};

const LotusGuideContext = createContext<LotusGuideContextValue | null>(null);

const getTargetRect = (targetId: string): Rect | null => {
    const elements = document.querySelectorAll(`[data-guide-id="${targetId}"]`);
    let element: HTMLElement | null = null;
    for (let i = 0; i < elements.length; i++) {
        const r = elements[i].getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
            element = elements[i] as HTMLElement;
            break;
        }
    }
    if (!element && (targetId.startsWith(".") || targetId.startsWith("#"))) {
        const fallbackElements = document.querySelectorAll(targetId);
        for (let i = 0; i < fallbackElements.length; i++) {
            const r = fallbackElements[i].getBoundingClientRect();
            if (r.width > 0 && r.height > 0) {
                element = fallbackElements[i] as HTMLElement;
                break;
            }
        }
    }
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
        borderRadius: style.borderRadius,
    };
};

const getTargetElement = (targetId: string): HTMLElement | null => {
    const guideElements = document.querySelectorAll(`[data-guide-id="${targetId}"]`);
    for (let i = 0; i < guideElements.length; i++) {
        const rect = guideElements[i].getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) return guideElements[i] as HTMLElement;
    }
    if (targetId.startsWith(".") || targetId.startsWith("#")) {
        const fallbackElements = document.querySelectorAll(targetId);
        for (let i = 0; i < fallbackElements.length; i++) {
            const rect = fallbackElements[i].getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) return fallbackElements[i] as HTMLElement;
        }
    }
    return null;
};

const LotusGuidePlayer: React.FC<{
    guide: LotusGuide;
    stepIndex: number;
    setStepIndex: React.Dispatch<React.SetStateAction<number>>;
    onClose: () => void;
}> = ({ guide, stepIndex, setStepIndex, onClose }) => {
    const [targetRect, setTargetRect] = useState<Rect | null>(null);
    const [missingTarget, setMissingTarget] = useState(false);
    const pendingAdvanceRef = useRef<number | null>(null);
    const pendingAdvanceObserverRef = useRef<MutationObserver | null>(null);
    const step = guide.steps[stepIndex];
    const total = guide.steps.length;

    const clearPendingAdvance = useCallback(() => {
        if (pendingAdvanceRef.current !== null) {
            window.clearTimeout(pendingAdvanceRef.current);
            pendingAdvanceRef.current = null;
        }
        pendingAdvanceObserverRef.current?.disconnect();
        pendingAdvanceObserverRef.current = null;
    }, []);

    const closeCurrentModalTarget = useCallback(() => {
        if (!step?.targetId.includes("ant-modal-content")) return false;
        const element = getTargetElement(step.targetId);
        const modal = element?.closest(".ant-modal") as HTMLElement | null;
        const closeButton = modal?.querySelector(".ant-modal-close") as HTMLButtonElement | null;
        closeButton?.click();
        return !!closeButton;
    }, [step]);

    const updateTarget = useCallback(() => {
        if (!step) return;
        const rect = getTargetRect(step.targetId);
        setTargetRect((prev) => {
            if (!prev && !rect) return prev;
            if (prev && rect && prev.top === rect.top && prev.left === rect.left && prev.width === rect.width && prev.height === rect.height && prev.borderRadius === rect.borderRadius) {
                return prev;
            }
            return rect;
        });
        setMissingTarget(!rect);
    }, [step]);

    useEffect(() => {
        if (!step) return;
        setMissingTarget(false);
        let element = document.querySelector(`[data-guide-id="${step.targetId}"]`) as HTMLElement | null;
        if (!element && (step.targetId.startsWith(".") || step.targetId.startsWith("#"))) {
            element = document.querySelector(step.targetId) as HTMLElement | null;
        }
        const targetRect = element?.getBoundingClientRect();
        const isModalTarget = step.targetId.includes("ant-modal-content") || !!step.inModal;
        const isTargetVisible = targetRect
            ? targetRect.top >= 0 && targetRect.left >= 0 && targetRect.bottom <= window.innerHeight && targetRect.right <= window.innerWidth
            : false;
        if (element && !isModalTarget && !isTargetVisible) {
            element.scrollIntoView({ behavior: "instant", block: "center", inline: "center" });
        }

        let frame: number | null = null;
        const scheduleUpdate = () => {
            if (frame !== null) return;
            frame = window.requestAnimationFrame(() => {
                frame = null;
                updateTarget();
            });
        };

        // Modal: dùng MutationObserver thay vì setTimeout cố định
        let observer: MutationObserver | null = null;
        let resizeObserver: ResizeObserver | null = null;
        let settleTimers: number[] = [];

        if (isModalTarget) {
            let found = false;
            const observeTargetSize = (el: HTMLElement) => {
                resizeObserver?.disconnect();
                resizeObserver = new ResizeObserver(scheduleUpdate);
                resizeObserver.observe(el);
            };
            const settleModalTarget = (el: HTMLElement) => {
                observeTargetSize(el);
                const motionElement = (el.closest(".ant-modal") as HTMLElement | null) ?? el;
                let settled = false;
                const finish = () => {
                    if (settled) return;
                    settled = true;
                    motionElement.removeEventListener("transitionend", finish);
                    updateTarget();
                };
                motionElement.addEventListener("transitionend", finish, { once: true });
                settleTimers.push(window.setTimeout(finish, GUIDE_MODAL_SETTLE_MS));
                settleTimers.push(window.setTimeout(updateTarget, 620));
            };
            observer = new MutationObserver(() => {
                if (found) return;
                const el = getTargetElement(step.targetId);
                if (el) {
                    found = true;
                    settleModalTarget(el);
                    observer?.disconnect();
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
            const existing = getTargetElement(step.targetId);
            if (existing) {
                found = true;
                settleModalTarget(existing);
                observer.disconnect();
            }
        } else {
            settleTimers = [window.setTimeout(updateTarget, 80)];
        }

        if (!isModalTarget) updateTarget();

        window.addEventListener("resize", scheduleUpdate);
        window.addEventListener("scroll", scheduleUpdate, true);
        return () => {
            if (frame !== null) window.cancelAnimationFrame(frame);
            observer?.disconnect();
            resizeObserver?.disconnect();
            settleTimers.forEach((timer) => window.clearTimeout(timer));
            window.removeEventListener("resize", scheduleUpdate);
            window.removeEventListener("scroll", scheduleUpdate, true);
        };
    }, [step, updateTarget]);

    useEffect(() => {
        return () => {
            clearPendingAdvance();
        };
    }, [clearPendingAdvance]);

    // Handle auto-advance for "click" actionType
    useEffect(() => {
        if (!step || step.actionType !== "click") return;

        const waitForNextTarget = (nextIndex: number) => {
            const nextStep = guide.steps[nextIndex];
            if (!nextStep) return;

            const advance = (settleDelay = GUIDE_TARGET_SETTLE_MS) => {
                clearPendingAdvance();
                pendingAdvanceRef.current = window.setTimeout(() => {
                    setStepIndex(nextIndex);
                    pendingAdvanceRef.current = null;
                }, settleDelay);
            };

            if (getTargetElement(nextStep.targetId)) {
                advance();
                return;
            }

            pendingAdvanceObserverRef.current = new MutationObserver(() => {
                if (getTargetElement(nextStep.targetId)) {
                    advance();
                }
            });
            pendingAdvanceObserverRef.current.observe(document.body, { childList: true, subtree: true });
            pendingAdvanceRef.current = window.setTimeout(() => advance(0), GUIDE_NEXT_TARGET_TIMEOUT_MS);
        };

        const handleClick = (e: MouseEvent) => {
            let element = document.querySelector(`[data-guide-id="${step.targetId}"]`);
            if (!element && (step.targetId.startsWith(".") || step.targetId.startsWith("#"))) {
                element = document.querySelector(step.targetId);
            }
            if (element && element.contains(e.target as Node)) {
                if (stepIndex < total - 1) {
                    clearPendingAdvance();
                    waitForNextTarget(Math.min(total - 1, stepIndex + 1));
                } else {
                    onClose();
                }
            }
        };

        // Use capture phase to ensure we catch the click before react handlers might unmount things
        document.addEventListener("click", handleClick, true);
        return () => {
            document.removeEventListener("click", handleClick, true);
            clearPendingAdvance();
        };
    }, [clearPendingAdvance, guide.steps, step, setStepIndex, total, onClose, stepIndex]);

    const highlight = useMemo(() => {
        const isModalTarget = step?.targetId.includes("ant-modal-content") || !!step?.inModal;
        const padding = step?.targetId.includes("ant-modal-content") ? 0 : isModalTarget ? 10 : 6;
        return targetRect
            ? {
                top: targetRect.top - window.scrollY - padding,
                left: targetRect.left - window.scrollX - padding,
                width: targetRect.width + padding * 2,
                height: targetRect.height + padding * 2,
                borderRadius: isModalTarget ? targetRect.borderRadius : undefined,
                isModalTarget,
            }
            : null;
    }, [targetRect, step?.targetId, step?.inModal]);

    const cardStyle = useMemo<React.CSSProperties>(() => {
        const cardWidth = 300;
        const cardHeight = 220;
        if (!highlight) {
            return {
                transform: `translate(calc(50vw - ${cardWidth / 2}px), calc(50vh - 100px))`,
                width: cardWidth,
            };
        }

        const gap = 14;
        const preferred = step.placement || "bottom";
        let left = highlight.left;
        let top = highlight.top + highlight.height + gap;

        if (preferred === "top") top = highlight.top - 190 - gap;
        if (preferred === "left") {
            left = highlight.left - cardWidth - gap;
            top = highlight.top + highlight.height / 2 - cardHeight / 2;
        }
        if (preferred === "right") {
            left = highlight.left + highlight.width + gap;
            top = highlight.top + highlight.height / 2 - cardHeight / 2;
        }

        if (step.targetId === "lotus-assistant-entry") {
            left = Math.max(14, highlight.left - cardWidth - 18);
            top = Math.min(window.innerHeight - 250, Math.max(90, highlight.top - 120));
        }

        left = Math.max(14, Math.min(left, window.innerWidth - cardWidth - 14));
        top = Math.max(14, Math.min(top, window.innerHeight - 250));

        if (step.targetId.includes("ant-modal-content") && (preferred === "left" || preferred === "right")) {
            const targetRight = highlight.left + highlight.width;
            const targetBottom = highlight.top + highlight.height;
            const hasRoomOnRight = targetRight + gap + cardWidth <= window.innerWidth - 14;
            const hasRoomOnLeft = highlight.left - gap - cardWidth >= 14;
            const belowTop = targetBottom + gap;
            const belowLeft = highlight.left + highlight.width / 2 - cardWidth / 2;
            const hasRoomBelow = belowTop + cardHeight <= window.innerHeight - 14;
            const modalSideTop = highlight.top;

            top = modalSideTop;

            if (preferred === "right" && hasRoomOnRight) {
                left = targetRight + gap;
                top = modalSideTop;
            } else if (preferred === "left" && hasRoomOnLeft) {
                left = highlight.left - cardWidth - gap;
                top = modalSideTop;
            } else if (hasRoomBelow) {
                left = belowLeft;
                top = belowTop;
            } else {
                left = preferred === "left" ? 14 : window.innerWidth - cardWidth - 14;
                top = modalSideTop;
            }

            left = Math.max(14, Math.min(left, window.innerWidth - cardWidth - 14));
            top = Math.max(14, Math.min(top, window.innerHeight - cardHeight - 14));
        }

        const targetElement = getTargetElement(step.targetId);
        const popupElement = targetElement?.closest(".ant-dropdown, .ant-dropdown-menu, .ant-select-dropdown") as HTMLElement | null;
        if (popupElement && (preferred === "left" || preferred === "right")) {
            const popupRect = popupElement.getBoundingClientRect();
            const popupLeft = popupRect.left;
            const popupTop = popupRect.top;
            const popupRight = popupRect.right;
            const hasRoomOnPopupLeft = popupLeft - gap - cardWidth >= 14;
            const hasRoomOnPopupRight = popupRight + gap + cardWidth <= window.innerWidth - 14;

            if (preferred === "left" && hasRoomOnPopupLeft) {
                left = popupLeft - cardWidth - gap;
            } else if (preferred === "right" && hasRoomOnPopupRight) {
                left = popupRight + gap;
            } else if (hasRoomOnPopupLeft) {
                left = popupLeft - cardWidth - gap;
            } else if (hasRoomOnPopupRight) {
                left = popupRight + gap;
            } else {
                left = Math.max(14, Math.min(highlight.left - cardWidth - gap, window.innerWidth - cardWidth - 14));
            }

            top = popupTop;
            top = Math.max(14, Math.min(top, window.innerHeight - cardHeight - 14));
        }

        return { transform: `translate3d(${left}px, ${top}px, 0)`, width: cardWidth };
    }, [highlight, step.placement, step.targetId]);

    if (!step) return null;

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 12000, pointerEvents: "none" }}>
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(15, 23, 42, 0.42)",
                    opacity: highlight ? 0 : 1,
                    transition: "opacity 0.3s ease",
                    pointerEvents: "none",
                }}
            />

            {highlight && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 1,
                        top: 0,
                        left: 0,
                        transform: `translate3d(${highlight.left}px, ${highlight.top}px, 0)`,
                        width: highlight.width,
                        height: highlight.height,
                        boxSizing: "border-box",
                        borderRadius: highlight.borderRadius ?? 16,
                        border: highlight.isModalTarget ? "3px solid #ff4f9a" : "2px solid #ff5fa2",
                        boxShadow: highlight.isModalTarget
                            ? "0 0 0 9999px rgba(15,23,42,0.58), 0 0 0 7px rgba(255,255,255,0.9), inset 0 0 0 2px rgba(255,255,255,0.92), 0 18px 44px rgba(255,79,154,0.42)"
                            : "0 0 0 9999px rgba(15,23,42,0.65), 0 0 0 5px rgba(255,255,255,0.72), 0 14px 36px rgba(255,95,162,0.28)",
                        background: highlight.isModalTarget ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                        pointerEvents: "none",
                        transition: `${GUIDE_MOVE}, ${GUIDE_SIZE}, opacity 0.24s ease-out, box-shadow 0.42s ease-out`,
                        willChange: "transform, width, height, border-radius",
                    }}
                >
                    {highlight.isModalTarget && (
                        <div
                            style={{
                                position: "absolute",
                                top: -13,
                                left: 14,
                                padding: "3px 9px",
                                borderRadius: 999,
                                background: "#ff4f9a",
                                color: "#fff",
                                fontSize: 11,
                                fontWeight: 800,
                                lineHeight: 1.2,
                                boxShadow: "0 6px 18px rgba(255,79,154,0.32)",
                                whiteSpace: "nowrap",
                            }}
                        >
                            Đang hướng dẫn
                        </div>
                    )}
                </div>
            )}

            <div
                style={{
                    position: "absolute",
                    zIndex: 2,
                    top: 0,
                    left: 0,
                    ...cardStyle,
                    pointerEvents: "auto",
                    background: "#fff",
                    border: "1px solid rgba(226,232,240,0.95)",
                    borderRadius: 16,
                    boxShadow: "0 24px 60px rgba(15,23,42,0.24)",
                    overflow: "hidden",
                    minHeight: 236,
                    transition: `${GUIDE_MOVE}, opacity 0.24s ease-out, box-shadow 0.42s ease-out`,
                    willChange: "transform",
                }}
            >
                <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div>
                        <div style={{ color: "#e94d83", fontSize: 11, fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase" }}>
                            Lotus hướng dẫn
                        </div>
                        <div style={{ color: "#0f172a", fontSize: 15, fontWeight: 800, marginTop: 2 }}>
                            {guide.title}
                        </div>
                    </div>
                    <button
                        aria-label="Đóng hướng dẫn"
                        onClick={onClose}
                        style={{ width: 28, height: 28, border: 0, borderRadius: "50%", background: "#f8fafc", color: "#64748b", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#64748b"; }}
                    >
                        <CloseOutlined />
                    </button>
                </div>

                <div key={step.id} style={{ padding: 14, minHeight: 114, animation: `lotusGuideStepIn 0.32s ${GUIDE_EASE} both` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {guide.steps.map((item, index) => (
                                <div
                                    key={item.id}
                                    style={{
                                        width: index === stepIndex ? 22 : 7,
                                        height: 7,
                                        borderRadius: 99,
                                        background: index <= stepIndex ? "#e94d83" : "#e5e7eb",
                                        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                                    }}
                                />
                            ))}
                            <span style={{ color: "#64748b", fontSize: 12, fontWeight: 800, marginLeft: 4 }}>
                                {stepIndex + 1}/{total}
                            </span>
                        </div>
                        <div style={{ width: 78, height: 6, background: "#f1f5f9", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ width: `${((stepIndex + 1) / total) * 100}%`, height: "100%", background: "linear-gradient(90deg, #ff5fa2, #e94d83)", transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }} />
                        </div>
                    </div>
                    <h4 style={{ margin: 0, color: "#111827", fontSize: 15, fontWeight: 800, lineHeight: 1.25 }}>
                        {step.title}
                    </h4>
                    <p style={{ margin: "7px 0 0", color: "#475569", fontSize: 12.5, lineHeight: 1.5 }}>
                        {missingTarget
                            ? "Không tìm thấy vị trí cần chỉ dẫn trên màn hình hiện tại. Có thể giao diện đã đổi hoặc bạn cần mở đúng trang trước."
                            : step.description}
                    </p>
                </div>

                <div style={{ padding: "10px 14px 14px", display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <Button
                        icon={<LeftOutlined />}
                        disabled={stepIndex === 0}
                        onClick={() => {
                            const closedModal = closeCurrentModalTarget();
                            if (closedModal) {
                                window.setTimeout(() => {
                                    setStepIndex((value) => Math.max(0, value - 1));
                                }, 360);
                                return;
                            }
                            setStepIndex((value) => Math.max(0, value - 1));
                        }}
                        style={{ borderRadius: 10 }}
                    >
                        Quay lại
                    </Button>
                    {step.actionType !== "click" && (
                        <Button
                            type="primary"
                            icon={stepIndex === total - 1 ? undefined : <RightOutlined />}
                            onClick={() => {
                                if (stepIndex === total - 1) {
                                    onClose();
                                    return;
                                }
                                setStepIndex((value) => Math.min(total - 1, value + 1));
                            }}
                            style={{ borderRadius: 10, background: "#e94d83", borderColor: "#e94d83", fontWeight: 700 }}
                        >
                            {stepIndex === total - 1 ? "Hoàn tất" : "Tiếp tục"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export const LotusGuideProvider = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeGuide, setActiveGuide] = useState<LotusGuide | null>(null);
    const [activeStepIndex, setActiveStepIndex] = useState(0);
    const [pendingGuideId, setPendingGuideId] = useState<string | null>(null);

    const { canStartGuide } = useGuidePermission();

    const startGuide = useCallback((guideId: string) => {
        const guide = findGuideById(guideId);
        if (!guide) return;
        if (!canStartGuide(guide)) return;

        const isOnGuideRoute = guide.routePattern
            ? guide.routePattern.test(location.pathname)
            : (location.pathname === guide.routePrefix || (!guide.exactRoute && location.pathname.startsWith(`${guide.routePrefix}/`)));

        if (!isOnGuideRoute) {
            setActiveGuide(null);
            setActiveStepIndex(0);
            setPendingGuideId(guideId);
            navigate(guide.routePrefix);
            return;
        }

        setActiveGuide(guide);
        setActiveStepIndex(0);
    }, [location.pathname, navigate, canStartGuide]);

    useEffect(() => {
        if (!pendingGuideId) return;

        const guide = findGuideById(pendingGuideId);
        if (!guide) {
            setPendingGuideId(null);
            return;
        }

        const isOnGuideRoute = guide.routePattern
            ? guide.routePattern.test(location.pathname)
            : (location.pathname === guide.routePrefix || (!guide.exactRoute && location.pathname.startsWith(`${guide.routePrefix}/`)));

        if (!isOnGuideRoute) return;

        const timer = window.setTimeout(() => {
            setActiveGuide(guide);
            setActiveStepIndex(0);
            setPendingGuideId(null);
        }, 420);

        return () => window.clearTimeout(timer);
    }, [location.pathname, pendingGuideId]);

    const stopGuide = useCallback(() => {
        setActiveGuide(null);
        setActiveStepIndex(0);
        setPendingGuideId(null);
    }, []);

    // Tự động dừng guide nếu người dùng chuyển sang trang không nằm trong flow
    useEffect(() => {
        if (!activeGuide) return;

        const onStartRoute = activeGuide.routePattern
            ? activeGuide.routePattern.test(location.pathname)
            : location.pathname === activeGuide.routePrefix || location.pathname.startsWith(`${activeGuide.routePrefix}/`);

        const onAllowedRoute = (activeGuide.allowedRoutes ?? []).some(p => p.test(location.pathname));

        if (!onStartRoute && !onAllowedRoute) {
            stopGuide();
        }
    }, [location.pathname, activeGuide, stopGuide]);

    const value = useMemo(
        () => ({ activeGuide, activeStepIndex, startGuide, stopGuide, canStartGuide }),
        [activeGuide, activeStepIndex, startGuide, stopGuide, canStartGuide]
    );

    return (
        <LotusGuideContext.Provider value={value}>
            {children}
            {activeGuide && (
                <LotusGuidePlayer
                    guide={activeGuide}
                    stepIndex={activeStepIndex}
                    setStepIndex={setActiveStepIndex}
                    onClose={stopGuide}
                />
            )}
        </LotusGuideContext.Provider>
    );
};

export const useLotusGuide = () => {
    const context = useContext(LotusGuideContext);
    if (!context) {
        return {
            activeGuide: null,
            activeStepIndex: 0,
            startGuide: () => undefined,
            stopGuide: () => undefined,
            canStartGuide: () => false,
        };
    }
    return context;
};
