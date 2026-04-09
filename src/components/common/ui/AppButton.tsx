import { Button } from "antd";
import type { ButtonProps } from "antd";
import React from "react";

type AppVariant = "primary" | "outline" | "text";

interface AppButtonProps extends ButtonProps {
    appVariant?: AppVariant;
}

const baseStyle: React.CSSProperties = {
    borderRadius: 10,
    fontWeight: 500,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
};

const variantStyles: Record<AppVariant, React.CSSProperties> = {
    primary: {
        backgroundColor: "#ff5fa2",
        color: "#fff",
        border: "none",
        boxShadow: "0 2px 6px rgba(255, 95, 162, 0.35)",
    },
    outline: {
        backgroundColor: "#fff",
        color: "#ff5fa2",
        border: "1px solid #ff5fa2",
    },
    text: {
        backgroundColor: "transparent",
        color: "#ff5fa2",
        border: "none",
        boxShadow: "none",
    },
};

const AppButton: React.FC<AppButtonProps> = ({
    appVariant = "primary",
    style,
    children,
    ...props
}) => {
    return (
        <Button
            {...props}
            style={{
                ...baseStyle,
                ...variantStyles[appVariant],
                ...style,
            }}
            onMouseEnter={(e) => {
                if (appVariant === "primary") {
                    e.currentTarget.style.backgroundColor = "#ff4b97";
                    e.currentTarget.style.boxShadow =
                        "0 4px 10px rgba(255, 95, 162, 0.45)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                }
            }}
            onMouseLeave={(e) => {
                if (appVariant === "primary") {
                    e.currentTarget.style.backgroundColor = "#ff5fa2";
                    e.currentTarget.style.boxShadow =
                        "0 2px 6px rgba(255, 95, 162, 0.35)";
                    e.currentTarget.style.transform = "translateY(0)";
                }
            }}
            onMouseDown={(e) => {
                if (appVariant === "primary") {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                        "0 1px 3px rgba(255, 95, 162, 0.4)";
                }
            }}
        >
            {children}
        </Button>
    );
};

export default AppButton;