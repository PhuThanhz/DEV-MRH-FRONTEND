import type { CSSProperties, ReactNode } from "react";
import {
    CheckCircleFilled,
    ExclamationCircleFilled,
    InfoCircleFilled,
    WarningFilled,
} from "@ant-design/icons";

type SystemAlertVariant = "success" | "error" | "warning" | "info";

interface SystemAlertProps {
    variant?: SystemAlertVariant;
    title?: ReactNode;
    description?: ReactNode;
    children?: ReactNode;
    compact?: boolean;
    style?: CSSProperties;
    className?: string;
}

const VARIANT_STYLES: Record<SystemAlertVariant, {
    icon: ReactNode;
    bg: string;
    border: string;
    title: string;
    text: string;
    iconBg: string;
    accent: string;
}> = {
    success: {
        icon: <CheckCircleFilled />,
        bg: "#f0fdf4",
        border: "#bbf7d0",
        title: "#166534",
        text: "#15803d",
        iconBg: "#dcfce7",
        accent: "linear-gradient(180deg, #34d399 0%, #10b981 100%)",
    },
    error: {
        icon: <ExclamationCircleFilled />,
        bg: "#fff7f7",
        border: "#fca5a5",
        title: "#991b1b",
        text: "#b91c1c",
        iconBg: "#fee2e2",
        accent: "linear-gradient(180deg, #fb7185 0%, #ef4444 100%)",
    },
    warning: {
        icon: <WarningFilled />,
        bg: "#fffbeb",
        border: "#fcd34d",
        title: "#92400e",
        text: "#b45309",
        iconBg: "#fef3c7",
        accent: "linear-gradient(180deg, #fbbf24 0%, #f97316 100%)",
    },
    info: {
        icon: <InfoCircleFilled />,
        bg: "#f8fafc",
        border: "#bfdbfe",
        title: "#1e3a8a",
        text: "#334155",
        iconBg: "#dbeafe",
        accent: "linear-gradient(180deg, #f85f93 0%, #e8356d 52%, #a855f7 100%)",
    },
};

const SystemAlert = ({
    variant = "info",
    title,
    description,
    children,
    compact = false,
    style,
    className,
}: SystemAlertProps) => {
    const config = VARIANT_STYLES[variant];

    return (
        <div
            role="alert"
            className={className}
            style={{
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "flex-start",
                gap: compact ? 10 : 12,
                padding: compact ? "10px 12px 10px 14px" : "14px 16px 14px 18px",
                borderRadius: compact ? 10 : 14,
                border: `1px solid ${config.border}`,
                background: config.bg,
                color: config.text,
                fontFamily: "var(--ant-font-family), Inter, -apple-system, BlinkMacSystemFont, sans-serif",
                boxShadow: compact ? "none" : "0 10px 24px rgba(15, 23, 42, 0.04)",
                ...style,
            }}
        >
            <span
                aria-hidden
                style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: config.accent,
                }}
            />
            <span
                style={{
                    width: compact ? 26 : 32,
                    height: compact ? 26 : 32,
                    marginTop: 1,
                    flex: "0 0 auto",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: compact ? 9 : 11,
                    background: config.iconBg,
                    color: config.text,
                    fontSize: compact ? 14 : 16,
                }}
            >
                {config.icon}
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
                {title && (
                    <div
                        style={{
                            color: config.title,
                            fontSize: compact ? 13 : 14,
                            fontWeight: 760,
                            lineHeight: 1.45,
                        }}
                    >
                        {title}
                    </div>
                )}
                {description && (
                    <div
                        style={{
                            marginTop: title ? 4 : 0,
                            color: config.text,
                            fontSize: compact ? 12.5 : 13,
                            fontWeight: 500,
                            lineHeight: 1.6,
                        }}
                    >
                        {description}
                    </div>
                )}
                {children && (
                    <div style={{ marginTop: title || description ? 10 : 0 }}>
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SystemAlert;
