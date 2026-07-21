import React from "react";
import Access from "@/components/share/access";

type Permission = {
    method: string;
    apiPath: string;
    module: string;
};

export type TabItem<T extends string = string> = {
    key: T;
    label: React.ReactNode;
    icon?: React.ReactNode;
    permission?: Permission;
    hidden?: boolean;
};

type Props<T extends string> = {
    tabs: TabItem<T>[];
    activeKey: T;
    onChange: (key: T) => void;
    variant?: "default" | "subtle" | "line";
};

const getTabStyle = (active: boolean, variant: "default" | "subtle" | "line"): React.CSSProperties => ({
    position: "relative",
    overflow: "visible",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: variant === "default" ? 8 : 7,
    boxSizing: "border-box",
    minHeight: variant === "line" ? 42 : variant === "default" ? 42 : 44,
    padding: variant === "line" ? "10px 2px" : variant === "default" ? "8px 14px" : "7px 14px",
    borderRadius: variant === "line" ? 0 : variant === "subtle" ? 6 : 8,
    border: variant === "line"
        ? "none"
        : variant === "subtle"
            ? `1px solid ${active ? "#cbd5e1" : "transparent"}`
            : "1px solid transparent",
    borderBottom: variant === "line" ? `2px solid ${active ? "#E8356D" : "transparent"}` : undefined,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: active ? 700 : 600,
    color: active
        ? (variant === "subtle" ? "#1e293b" : "#E8356D")
        : "#64748b",
    background: variant === "line" ? "transparent" : active ? "#ffffff" : "transparent",
    outline: "none",
    boxShadow: active
        ? (variant === "default"
            ? "inset 0 0 0 1.5px #E8356D"
            : variant === "subtle"
                ? "0 1px 2px rgba(15, 23, 42, 0.06)"
                : "none")
        : "none",
    transition: "color 0.15s ease, background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
    letterSpacing: 0,
    lineHeight: 1.2,
    whiteSpace: "nowrap",
    flexShrink: 0,
    WebkitTapHighlightColor: "transparent",
});

function TabBar<T extends string>({ tabs, activeKey, onChange, variant = "default" }: Props<T>) {
    return (
        <>
            <style>{`
            .tab-bar__item:not(.tab-bar__item--active):hover {
                color: #334155 !important;
                background: rgba(255, 255, 255, 0.72) !important;
            }
            .tab-bar__item:focus-visible {
                outline: 2px solid rgba(232, 53, 109, 0.28) !important;
                outline-offset: 2px;
            }
            .tab-bar__item--subtle:focus-visible {
                outline-color: rgba(71, 85, 105, 0.32) !important;
            }
            .tab-bar__item--line:not(.tab-bar__item--active):hover {
                background: transparent !important;
                color: #0f172a !important;
            }
        `}</style>
            <div
                style={{
                    overflowX: "auto",
                    overflowY: "visible",
                    padding: "10px 0",
                    WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                }}
                className="hide-scrollbar"
            >
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        background: variant === "line" ? "transparent" : variant === "subtle" ? "#f8fafc" : "#f2f2f7",
                        border: variant === "line" ? "none" : variant === "subtle" ? "1px solid #e2e8f0" : "none",
                        borderBottom: variant === "line" ? "1px solid #e2e8f0" : undefined,
                        borderRadius: variant === "line" ? 0 : variant === "subtle" ? 8 : 12,
                        padding: variant === "line" ? 0 : 3,
                        gap: variant === "line" ? 24 : variant === "default" ? 3 : 2,
                        minWidth: "max-content",
                    }}
                >
                    {tabs.map((tab) => {
                        if (tab.hidden) return null;

                        const button = (
                            <button
                                key={tab.key}
                                type="button"
                                className={`tab-bar__item tab-bar__item--${variant}${activeKey === tab.key ? " tab-bar__item--active" : ""}`}
                                onClick={() => onChange(tab.key)}
                                style={getTabStyle(activeKey === tab.key, variant)}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        );

                        return tab.permission ? (
                            <Access key={tab.key} permission={tab.permission} hideChildren>
                                {button}
                            </Access>
                        ) : button;
                    })}
                </div>
            </div>
        </>
    );
}

export default TabBar;

/*
 * Thêm vào global CSS (ví dụ index.css hoặc globals.css):
 *
 * .hide-scrollbar::-webkit-scrollbar {
 *   display: none;
 * }
 */
