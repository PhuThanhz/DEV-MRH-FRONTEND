import React from "react";
import { Card } from "antd";
import "./StatCard.css";

export type StatCardVariant =
    | "completion"
    | "average"
    | "excellent"
    | "improvement"
    | "purple"
    | "blue"
    | "green"
    | "amber"
    | "red";

export interface StatCardProps {
    title: React.ReactNode;
    value: React.ReactNode;
    icon?: React.ReactNode;
    variant?: StatCardVariant;
    extra?: React.ReactNode;
    loading?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    variant = "blue",
    extra,
    loading = false,
    className = "",
    style,
    onClick,
}) => {
    const cardClassName = `stat-card stat-card-${variant} ${className} ${onClick ? "stat-card-clickable" : ""}`.trim();

    return (
        <Card
            className={cardClassName}
            variant="borderless"
            loading={loading}
            onClick={onClick}
            style={style}
            styles={{ body: { padding: "20px 24px" } }}
        >
            <div className="stat-card-content">
                <div>
                    <span className="stat-card-title">{title}</span>
                    <div className="stat-card-value-container">
                        <span className="stat-card-value">{value}</span>
                        {extra}
                    </div>
                </div>
                {icon && (
                    <div className="stat-card-icon-wrapper">
                        {icon}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default StatCard;
