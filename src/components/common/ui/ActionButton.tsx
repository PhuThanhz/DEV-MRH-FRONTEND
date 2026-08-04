import { Button, Tooltip } from "antd";
import type { ButtonProps } from "antd";
import type { TooltipProps } from "antd";
import React from "react";

export type ActionVariant =
    | "view"
    | "edit"
    | "settings"
    | "progress"
    | "download"
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
    /* Base Action Button Style - Refined Flat Clean Tiles */
    .app-action-button {
        width: 30px !important;
        min-width: 30px !important;
        height: 30px !important;
        padding: 0 !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 7px !important;
        border: 1px solid #e2e8f0 !important;
        color: #475569 !important;
        background: #f8fafc !important;
        transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease !important;
        cursor: pointer !important;
        outline: none !important;
        box-shadow: none !important;
    }
    
    .app-action-button:hover,
    .app-action-button:focus-visible {
        transform: translateY(-1px) !important;
        box-shadow: none !important;
    }
    
    .app-action-button:active {
        transform: scale(0.95) !important;
        box-shadow: none !important;
    }

    /* Force ALL icons to be strictly identical in dimension & alignment */
    .app-action-button .anticon {
        font-size: 15px !important;
        width: 15px !important;
        height: 15px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        line-height: 1 !important;
    }
    .app-action-button .anticon > svg {
        width: 15px !important;
        height: 15px !important;
        font-size: 15px !important;
        display: block !important;
    }

    /* View Action - Soft Blue Pastel */
    .app-action-button.is-view {
        color: #2563eb !important;
        background: #eff6ff !important;
        border-color: #dbeafe !important;
    }
    .app-action-button.is-view:hover {
        color: #1d4ed8 !important;
        background: #dbeafe !important;
        border-color: #bfdbfe !important;
    }

    /* Edit Action - Soft Amber Pastel */
    .app-action-button.is-edit {
        color: #b45309 !important;
        background: #fffbeb !important;
        border-color: #fef3c7 !important;
    }
    .app-action-button.is-edit:hover {
        color: #92400e !important;
        background: #fef3c7 !important;
        border-color: #fde68a !important;
    }

    /* Settings Action - Soft Violet Pastel */
    .app-action-button.is-settings {
        color: #7c3aed !important;
        background: #f5f3ff !important;
        border-color: #ede9fe !important;
    }
    .app-action-button.is-settings:hover {
        color: #6d28d9 !important;
        background: #ede9fe !important;
        border-color: #ddd6fe !important;
    }

    /* Progress Action - Soft Cyan Pastel */
    .app-action-button.is-progress {
        color: #0891b2 !important;
        background: #ecfeff !important;
        border-color: #cffafe !important;
    }
    .app-action-button.is-progress:hover {
        color: #0e7490 !important;
        background: #cffafe !important;
        border-color: #a5f3fc !important;
    }

    /* Download Action - Soft Rose Brand */
    .app-action-button.is-download {
        color: #be345d !important;
        background: #fff1f5 !important;
        border-color: #fce0e8 !important;
    }
    .app-action-button.is-download:hover {
        color: #9f274b !important;
        background: #ffe4ec !important;
        border-color: #f8c8d7 !important;
    }

    /* Success Action - Soft Emerald Pastel */
    .app-action-button.is-success {
        color: #166534 !important;
        background: #f0fdf4 !important;
        border-color: #dcfce7 !important;
    }
    .app-action-button.is-success:hover {
        color: #14532d !important;
        background: #dcfce7 !important;
        border-color: #bbf7d0 !important;
    }

    /* Danger Action - Soft Rose Pastel */
    .app-action-button.is-danger {
        color: #dc2626 !important;
        background: #fef2f2 !important;
        border-color: #fee2e2 !important;
    }
    .app-action-button.is-danger:hover {
        color: #b91c1c !important;
        background: #fee2e2 !important;
        border-color: #fecaca !important;
    }

    /* Default / More Action - Soft Slate Neutral */
    .app-action-button.is-default,
    .app-action-button:not([class*="is-"]) {
        color: #475569 !important;
        background: #f8fafc !important;
        border-color: #e2e8f0 !important;
    }
    .app-action-button.is-default:hover,
    .app-action-button:not([class*="is-"]):hover {
        color: #1e293b !important;
        background: #f1f5f9 !important;
        border-color: #cbd5e1 !important;
    }

    .app-action-button[disabled],
    .app-action-button[disabled]:hover {
        color: #cbd5e1 !important;
        background: transparent !important;
        border-color: transparent !important;
        transform: none !important;
        box-shadow: none !important;
        cursor: not-allowed !important;
    }
`;

const ensureStyles = () => {
    if (typeof document === "undefined") return;
    let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!el) {
        el = document.createElement("style");
        el.id = STYLE_ID;
        document.head.appendChild(el);
    }
    el.textContent = ACTION_BUTTON_STYLES;
};

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
    (
        { variant = "default", tooltip, tooltipPlacement, className, ...props },
        ref
    ) => {
        ensureStyles();

        const cls = [
            "app-action-button",
            variant !== "default" ? `is-${variant}` : "is-default",
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
