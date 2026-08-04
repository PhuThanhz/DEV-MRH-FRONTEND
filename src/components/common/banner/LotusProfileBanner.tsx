import React from "react";
import { Avatar, Typography, Tag } from "antd";
import {
    MailOutlined, SafetyOutlined, IdcardOutlined, ApartmentOutlined,
    CheckCircleFilled, CloseCircleFilled,
} from "@ant-design/icons";
import backgroundTrangCaNhan from "../../../../backgroundtrangcanhan.webp";

const { Text } = Typography;

export interface ILotusProfileBannerProps {
    avatarSrc?: string;
    name?: string;
    subtitle?: string; // e.g. "HỒ SƠ NHÂN SỰ" or "HỒ SƠ NGƯỜI DÙNG"
    email?: string;
    employeeCode?: string;
    roleName?: string;
    active?: boolean;
    positionsCount?: number;
    extraBadges?: React.ReactNode;
}

const LotusProfileBanner: React.FC<ILotusProfileBannerProps> = ({
    avatarSrc,
    name,
    subtitle = "HỒ SƠ NHÂN SỰ",
    email,
    employeeCode,
    roleName,
    active = true,
    positionsCount,
    extraBadges,
}) => {
    const initials = name?.charAt(0)?.toUpperCase() || "?";

    return (
        <div style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 16,
            padding: "24px 28px",
            backgroundImage: `url(${backgroundTrangCaNhan})`,
            backgroundSize: "cover",
            backgroundPosition: "center 72%",
            boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
            marginBottom: 20,
            color: "#ffffff",
            isolation: "isolate",
        }}>
            {/* Darkening gradient overlay matching manage.account hero banner to reduce glare */}
            <div style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, rgba(126, 12, 70, 0.68) 0%, rgba(170, 24, 91, 0.32) 42%, rgba(70, 9, 42, 0.12) 100%), linear-gradient(180deg, rgba(70, 9, 42, 0.04) 0%, rgba(70, 9, 42, 0.15) 100%)",
                pointerEvents: "none",
                zIndex: 1,
            }} />

            {/* Main Content Container */}
            <div style={{
                position: "relative",
                zIndex: 2,
                display: "flex",
                alignItems: "center",
                gap: 20,
                flexWrap: "wrap",
            }}>
                {/* Avatar */}
                <Avatar
                    size={76}
                    src={avatarSrc}
                    onError={() => true}
                    style={{
                        border: "3px solid rgba(255, 255, 255, 0.95)",
                        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
                        background: "rgba(255, 255, 255, 0.2)",
                        color: "#ffffff",
                        flexShrink: 0,
                        fontWeight: 800,
                        fontSize: 28,
                        backdropFilter: "blur(4px)",
                    }}
                >
                    {initials}
                </Avatar>

                {/* Info Text Block */}
                <div style={{ flex: 1, minWidth: 240 }}>
                    {/* Subtitle */}
                    <Text style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: "rgba(255, 255, 255, 0.85)",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        display: "block",
                        marginBottom: 4,
                        textShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    }}>
                        {subtitle}
                    </Text>

                    {/* Full Name & Active Tag */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                        <Text style={{
                            fontSize: 22,
                            fontWeight: 800,
                            color: "#ffffff",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                            textShadow: "0 1px 3px rgba(0,0,0,0.3)",
                        }}>
                            {name || "--"}
                        </Text>
                        {active ? (
                            <Tag icon={<CheckCircleFilled />} color="success" style={{
                                borderRadius: 20,
                                margin: 0,
                                fontWeight: 700,
                                fontSize: 11,
                                padding: "2px 10px",
                                background: "#22c55e",
                                border: "none",
                                color: "#ffffff",
                                boxShadow: "0 2px 6px rgba(34, 197, 94, 0.4)",
                            }}>
                                Hoạt động
                            </Tag>
                        ) : (
                            <Tag icon={<CloseCircleFilled />} color="error" style={{
                                borderRadius: 20,
                                margin: 0,
                                fontWeight: 700,
                                fontSize: 11,
                                padding: "2px 10px",
                                background: "#ef4444",
                                border: "none",
                                color: "#ffffff",
                                boxShadow: "0 2px 6px rgba(239, 68, 68, 0.4)",
                            }}>
                                Vô hiệu hóa
                            </Tag>
                        )}
                    </div>

                    {/* Glassmorphic Badges */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        {email && (
                            <div style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "3px 12px",
                                borderRadius: 20,
                                background: "rgba(255, 255, 255, 0.2)",
                                border: "1px solid rgba(255, 255, 255, 0.35)",
                                backdropFilter: "blur(6px)",
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#ffffff",
                            }}>
                                <MailOutlined style={{ fontSize: 13 }} />
                                {email}
                            </div>
                        )}

                        {roleName && (
                            <div style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "3px 12px",
                                borderRadius: 20,
                                background: "rgba(255, 255, 255, 0.25)",
                                border: "1px solid rgba(255, 255, 255, 0.45)",
                                backdropFilter: "blur(6px)",
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#ffffff",
                            }}>
                                <SafetyOutlined style={{ fontSize: 13 }} />
                                {roleName}
                            </div>
                        )}

                        {employeeCode && (
                            <div style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "3px 12px",
                                borderRadius: 20,
                                background: "rgba(255, 255, 255, 0.2)",
                                border: "1px solid rgba(255, 255, 255, 0.35)",
                                backdropFilter: "blur(6px)",
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#ffffff",
                            }}>
                                <IdcardOutlined style={{ fontSize: 13 }} />
                                {employeeCode}
                            </div>
                        )}

                        {positionsCount !== undefined && positionsCount > 0 && (
                            <div style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "3px 12px",
                                borderRadius: 20,
                                background: "rgba(255, 255, 255, 0.28)",
                                border: "1px solid rgba(255, 255, 255, 0.5)",
                                backdropFilter: "blur(6px)",
                                fontSize: 12,
                                fontWeight: 700,
                                color: "#ffffff",
                            }}>
                                <ApartmentOutlined style={{ fontSize: 13 }} />
                                {positionsCount} chức danh
                            </div>
                        )}

                        {extraBadges}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LotusProfileBanner;
