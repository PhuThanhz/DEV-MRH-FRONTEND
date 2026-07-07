/**
 * DrawerCloseButton — Shared floating close button for Lotus drawers.
 *
 * Variants:
 *   "right"  — pill sticking out to the left of a right-side drawer
 *   "bottom" — pill sticking out above a bottom drawer (default LotusDetailDrawer style)
 */

import { CloseOutlined } from "@ant-design/icons";

interface DrawerCloseButtonProps {
    onClick: () => void;
    /** Layout variant matching the drawer placement */
    variant?: "right" | "bottom";
    ariaLabel?: string;
    /** Override top/left position if needed */
    top?: number | string;
    left?: number | string;
    /** Size: "sm" | "md" (default "md") */
    size?: "sm" | "md";
}

const SIZE = {
    sm: { w: 40, h: 40, icon: 14 },
    md: { w: 52, h: 52, icon: 18 },
} as const;

const DrawerCloseButton = ({
    onClick,
    variant = "bottom",
    ariaLabel = "Đóng",
    top,
    left,
    size = "md",
}: DrawerCloseButtonProps) => {
    const { w, h, icon } = SIZE[size];

    /* ── right-side drawer: pill protruding to the LEFT ── */
    const rightStyle: React.CSSProperties = {
        position: "absolute",
        left: left ?? -w,
        top: top ?? 20,
        width: w,
        height: h,
        borderRadius: "999px 0 0 999px",
        background: "linear-gradient(135deg, #f06292 0%, #f5317f 60%, #e84373 100%)",
        border: "1px solid rgba(255,255,255,0.28)",
        boxShadow: "-4px 8px 24px rgba(232, 67, 115, 0.32)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 10000,
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        paddingRight: 6,
    };

    /* ── bottom drawer: pill protruding to the LEFT of the panel edge ── */
    const bottomStyle: React.CSSProperties = {
        position: "absolute",
        left: left ?? -w,
        top: top ?? 20,
        width: w,
        height: h,
        borderRadius: "22px 0 0 22px",
        background: "linear-gradient(135deg, #f06292 0%, #e84373 100%)",
        border: "1px solid rgba(255,255,255,0.34)",
        boxShadow: "0 12px 28px rgba(232, 67, 115, 0.32)",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        zIndex: 1,
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        paddingRight: 8,
    };

    const baseStyle = variant === "right" ? rightStyle : bottomStyle;

    return (
        <button
            type="button"
            aria-label={ariaLabel}
            onClick={onClick}
            style={baseStyle}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 14px 32px rgba(232, 67, 115, 0.42)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = baseStyle.boxShadow as string;
            }}
            onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.95)";
            }}
            onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
            }}
        >
            <CloseOutlined style={{ fontSize: icon }} />
        </button>
    );
};

export default DrawerCloseButton;
