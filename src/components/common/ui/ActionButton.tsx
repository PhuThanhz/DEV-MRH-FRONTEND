import { Button, Tooltip } from "antd";
import type { ButtonProps } from "antd";
import type { TooltipProps } from "antd";
import React from "react";

export type ActionVariant =
    | "view"
    | "edit"
    | "settings"
    | "progress"
    | "success"
    | "danger"
    | "default";

interface ActionButtonProps extends Omit<ButtonProps, "type" | "variant"> {
    variant?: ActionVariant;
    tooltip?: React.ReactNode;
    tooltipPlacement?: TooltipProps["placement"];
}

const STYLE_ID = "app-action-button-styles";
const ACTION_BUTTON_STYLES = `
    .app-action-button {
        width: 30px !important;
        min-width: 30px !important;
        height: 30px !important;
        padding: 0 !important;
        display: inline-grid !important;
        place-items: center;
        border-radius: 6px !important;
        border: 1px solid transparent !important;
        color: #64748b !important;
        background: #f8fafc !important;
        border-color: #eef2f6 !important;
        transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease, transform 160ms ease !important;
    }
    .app-action-button:hover,
    .app-action-button:focus-visible {
        color: #334155 !important;
        background: #f1f5f9 !important;
        border-color: #e2e8f0 !important;
    }
    .app-action-button:active { transform: scale(0.96); }
    .app-action-button.is-view { color: #2563eb !important; background: #eff6ff !important; border-color: #dbeafe !important; }
    .app-action-button.is-view:hover { color: #1d4ed8 !important; background: #dbeafe !important; border-color: #bfdbfe !important; }
    .app-action-button.is-edit { color: #b45309 !important; background: #fffbeb !important; border-color: #fef3c7 !important; }
    .app-action-button.is-edit:hover { color: #92400e !important; background: #fef3c7 !important; border-color: #fde68a !important; }
    .app-action-button.is-settings { color: #d94c66 !important; background: #fff1f4 !important; border-color: #ffe0e6 !important; }
    .app-action-button.is-settings:hover { color: #be3450 !important; background: #ffe4e9 !important; border-color: #fecdd6 !important; }
    .app-action-button.is-progress { color: #0e7490 !important; background: #ecfeff !important; border-color: #cffafe !important; }
    .app-action-button.is-progress:hover { color: #155e75 !important; background: #cffafe !important; border-color: #a5f3fc !important; }
    .app-action-button.is-success { color: #15803d !important; background: #f0fdf4 !important; border-color: #dcfce7 !important; }
    .app-action-button.is-success:hover { color: #166534 !important; background: #dcfce7 !important; border-color: #bbf7d0 !important; }
    .app-action-button.is-danger { color: #dc2626 !important; background: #fef2f2 !important; border-color: #fee2e2 !important; }
    .app-action-button.is-danger:hover { color: #b91c1c !important; background: #fee2e2 !important; border-color: #fecaca !important; }
    .app-action-button[disabled],
    .app-action-button[disabled]:hover {
        color: #cbd5e1 !important;
        background: transparent !important;
        border-color: transparent !important;
        transform: none !important;
    }
    @media (prefers-reduced-motion: reduce) {
        .app-action-button { transition: none !important; }
    }
`;

const ensureStyles = () => {
    if (typeof document === "undefined") return;
    if (document.getElementById(STYLE_ID)) return;
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = ACTION_BUTTON_STYLES;
    document.head.appendChild(el);
};

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
    (
        { variant = "default", tooltip, tooltipPlacement, className, ...props },
        ref
    ) => {
        ensureStyles();

        const cls = [
            "app-action-button",
            variant !== "default" ? `is-${variant}` : "",
            className ?? "",
        ]
            .filter(Boolean)
            .join(" ");

        const btn = (
            <Button ref={ref} type="text" size="small" className={cls} {...props} />
        );

        if (!tooltip) return btn;

        return (
            <Tooltip title={tooltip} placement={tooltipPlacement}>
                {btn}
            </Tooltip>
        );
    }
);

ActionButton.displayName = "ActionButton";

export default ActionButton;
