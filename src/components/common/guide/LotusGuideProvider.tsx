import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Button } from "antd";
import { CloseOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { findGuideById, type LotusGuide } from "./guideRegistry";

type Rect = {
    top: number;
    left: number;
    width: number;
    height: number;
};

type LotusGuideContextValue = {
    activeGuide: LotusGuide | null;
    activeStepIndex: number;
    startGuide: (guideId: string) => void;
    stopGuide: () => void;
};

const LotusGuideContext = createContext<LotusGuideContextValue | null>(null);

const getTargetRect = (targetId: string): Rect | null => {
    let elements = document.querySelectorAll(`[data-guide-id="${targetId}"]`);
    let element: HTMLElement | null = null;
    for (let i = 0; i < elements.length; i++) {
        const r = elements[i].getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
            element = elements[i] as HTMLElement;
            break;
        }
    }
    if (!element && (targetId.startsWith(".") || targetId.startsWith("#"))) {
        let fallbackElements = document.querySelectorAll(targetId);
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
    return {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
    };
};

const LotusGuidePlayer: React.FC<{
    guide: LotusGuide;
    stepIndex: number;
    setStepIndex: React.Dispatch<React.SetStateAction<number>>;
    onClose: () => void;
}> = ({ guide, stepIndex, setStepIndex, onClose }) => {
    const [targetRect, setTargetRect] = useState<Rect | null>(null);
    const [missingTarget, setMissingTarget] = useState(false);
    const step = guide.steps[stepIndex];
    const total = guide.steps.length;

    const updateTarget = useCallback(() => {
        if (!step) return;
        const rect = getTargetRect(step.targetId);
        setTargetRect((prev) => {
            if (!prev && !rect) return prev;
            if (prev && rect && prev.top === rect.top && prev.left === rect.left && prev.width === rect.width && prev.height === rect.height) {
                return prev;
            }
            return rect;
        });
        setMissingTarget(!rect);
    }, [step]);

    useEffect(() => {
        if (!step) return;
        let element = document.querySelector(`[data-guide-id="${step.targetId}"]`) as HTMLElement | null;
        if (!element && (step.targetId.startsWith(".") || step.targetId.startsWith("#"))) {
            element = document.querySelector(step.targetId) as HTMLElement | null;
        }
        element?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

        let frame: number;
        const loop = () => {
            updateTarget();
            frame = window.requestAnimationFrame(loop);
        };
        loop();
        
        window.addEventListener("resize", updateTarget);
        window.addEventListener("scroll", updateTarget, true);
        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("resize", updateTarget);
            window.removeEventListener("scroll", updateTarget, true);
        };
    }, [step, updateTarget]);

    // Handle auto-advance for "click" actionType
    useEffect(() => {
        if (!step || step.actionType !== "click") return;

        const handleClick = (e: MouseEvent) => {
            let element = document.querySelector(`[data-guide-id="${step.targetId}"]`);
            if (!element && (step.targetId.startsWith(".") || step.targetId.startsWith("#"))) {
                element = document.querySelector(step.targetId);
            }
            if (element && element.contains(e.target as Node)) {
                if (stepIndex < total - 1) {
                    setStepIndex((value) => Math.min(total - 1, value + 1));
                } else {
                    onClose();
                }
            }
        };

        // Use capture phase to ensure we catch the click before react handlers might unmount things
        document.addEventListener("click", handleClick, true);
        return () => document.removeEventListener("click", handleClick, true);
    }, [step, setStepIndex, total, onClose, stepIndex]);

    const highlight = targetRect
        ? {
            top: targetRect.top - window.scrollY - 6,
            left: targetRect.left - window.scrollX - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
        }
        : null;

    const cardStyle = useMemo<React.CSSProperties>(() => {
        const cardWidth = 300;
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
            top = highlight.top;
        }
        if (preferred === "right") {
            left = highlight.left + highlight.width + gap;
            top = highlight.top;
        }

        if (step.targetId === "lotus-assistant-entry") {
            left = Math.max(14, highlight.left - cardWidth - 18);
            top = Math.min(window.innerHeight - 250, Math.max(90, highlight.top - 120));
        }

        left = Math.max(14, Math.min(left, window.innerWidth - cardWidth - 14));
        top = Math.max(14, Math.min(top, window.innerHeight - 250));

        return { transform: `translate(${left}px, ${top}px)`, width: cardWidth };
    }, [highlight, step.placement]);

    if (!step) return null;

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 12000, pointerEvents: "none" }}>
            {!highlight && (
                <div style={{ position: "absolute", inset: 0, background: "rgba(15, 23, 42, 0.42)" }} />
            )}

            {highlight && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            transform: `translate(${highlight.left}px, ${highlight.top}px)`,
                            width: highlight.width,
                            height: highlight.height,
                            borderRadius: 16,
                            border: "2px solid #ff5fa2",
                            boxShadow: "0 0 0 9999px rgba(15,23,42,0.65), 0 0 0 5px rgba(255,255,255,0.72), 0 14px 36px rgba(255,95,162,0.28)",
                            background: "rgba(255,255,255,0.04)",
                            pointerEvents: "none",
                            transition: "transform 0.6s cubic-bezier(0.65, 0, 0.35, 1), width 0.6s cubic-bezier(0.65, 0, 0.35, 1), height 0.6s cubic-bezier(0.65, 0, 0.35, 1)",
                        }}
                    />
                </>
            )}

            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    ...cardStyle,
                    pointerEvents: "auto",
                    background: "#fff",
                    border: "1px solid rgba(226,232,240,0.95)",
                    borderRadius: 16,
                    boxShadow: "0 24px 60px rgba(15,23,42,0.24)",
                    overflow: "hidden",
                    transition: "transform 0.6s cubic-bezier(0.65, 0, 0.35, 1), width 0.6s cubic-bezier(0.65, 0, 0.35, 1)",
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

                <div style={{ padding: 14 }}>
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
                        onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
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

    const startGuide = useCallback((guideId: string) => {
        const guide = findGuideById(guideId);
        if (!guide) return;

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
    }, [location.pathname, navigate]);

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

    // Tự động dừng guide nếu người dùng chuyển trang
    useEffect(() => {
        if (!activeGuide) return;
        // Cho phép guide tiếp tục chạy nếu vẫn đang ở trong routePrefix của nó
        const isOnGuideRoute = location.pathname === activeGuide.routePrefix || location.pathname.startsWith(`${activeGuide.routePrefix}/`);
            
        if (!isOnGuideRoute) {
            stopGuide();
        }
    }, [location.pathname, activeGuide, stopGuide]);

    const value = useMemo(
        () => ({ activeGuide, activeStepIndex, startGuide, stopGuide }),
        [activeGuide, activeStepIndex, startGuide, stopGuide]
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
        };
    }
    return context;
};
