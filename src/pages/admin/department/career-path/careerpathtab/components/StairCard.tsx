import { useState } from "react";
import { Typography, Tooltip, Space } from "antd";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ICareerPath } from "@/types/backend";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { T, getHue } from "../constants";

const { Text } = Typography;

// ── Pink chip token ───────────────────────────────────────────────
const CHIP = {
    bg: "rgba(255,45,85,0.08)",
    border: "rgba(255,45,85,0.22)",
    text: "#c0185a",
};

interface StairCardProps {
    item: ICareerPath;
    index: number;
    rank: number;
    totalRanks: number;
    onView: (r: ICareerPath) => void;
    onEdit: (r: ICareerPath) => void;
    onDelete: (r: ICareerPath) => void;
}

const StairCard = ({ item, index, rank, totalRanks, onView, onEdit, onDelete }: StairCardProps) => {
    const [hov, setHov] = useState(false);
    const h = getHue(index);

    const indent = ((totalRanks - 1 - rank) / Math.max(totalRanks - 1, 1)) * 22;

    return (
        <div
            style={{
                display: "flex",
                alignItems: "stretch",
                paddingLeft: `${indent}%`,
                marginBottom: 5,
            }}
        >
            {/* Accent stripe */}
            <div style={{
                width: 3,
                flexShrink: 0,
                borderRadius: "3px 0 0 3px",
                background: h.stripe,
                opacity: hov ? 1 : 0.7,
                transition: "opacity 0.15s",
            }} />

            {/* Body */}
            <div
                onMouseEnter={() => setHov(true)}
                onMouseLeave={() => setHov(false)}
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "11px 14px 11px 14px",
                    background: hov ? T.s1 : T.white,
                    border: `1px solid ${hov ? T.lineMed : T.lineStr}`,
                    borderLeft: "none",
                    borderRadius: "0 10px 10px 0",
                    transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
                    boxShadow: hov
                        ? "0 2px 12px rgba(0,0,0,0.09), 0 1px 3px rgba(0,0,0,0.06)"
                        : "0 1px 2px rgba(0,0,0,0.05)",
                    cursor: "default",
                }}
            >
                {/* Step index */}
                <span style={{
                    width: 28,
                    flexShrink: 0,
                    fontSize: 11,
                    fontWeight: 600,
                    color: hov ? T.ink3 : T.ink4,
                    letterSpacing: 0.2,
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                    transition: "color 0.15s",
                    userSelect: "none",
                }}>
                    {String(index + 1).padStart(2, "0")}
                </span>

                {/* Dot */}
                <div style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: h.dot,
                    opacity: hov ? 1 : 0.8,
                    transition: "opacity 0.15s",
                    boxShadow: hov ? `0 0 0 3px ${h.chipBg}` : "none",
                }} />

                {/* Title */}
                <Text
                    ellipsis
                    style={{
                        flex: 1,
                        fontSize: 13.5,
                        fontWeight: hov ? 600 : 500,
                        color: hov ? T.ink : T.ink2,
                        letterSpacing: -0.2,
                        lineHeight: "18px",
                        transition: "color 0.15s, font-weight 0.15s",
                        minWidth: 0,
                        display: "block",
                    }}
                >
                    {item.jobTitleName || "—"}
                </Text>

                {/* Level code chip — màu hồng nhạt */}
                <div style={{
                    flexShrink: 0,
                    padding: "2px 9px",
                    borderRadius: 5,
                    background: CHIP.bg,
                    border: `1px solid ${CHIP.border}`,
                    fontSize: 11,
                    fontWeight: 700,
                    color: CHIP.text,
                    letterSpacing: 0.5,
                    fontVariantNumeric: "tabular-nums",
                }}>
                    {item.positionLevelCode ?? "—"}
                </div>

                {/* Actions */}
                <Space
                    size={12}
                    style={{
                        flexShrink: 0,
                        opacity: hov ? 1 : 0,
                        transform: hov ? "translateX(0)" : "translateX(6px)",
                        transition: "opacity 0.15s, transform 0.15s",
                        pointerEvents: hov ? "auto" : "none",
                    }}
                >
                    <Access permission={ALL_PERMISSIONS.CAREER_PATHS.GET_BY_ID} hideChildren>
                        <Tooltip title="Xem" mouseEnterDelay={0.6}>
                            <EyeOutlined
                                style={{ fontSize: 16, color: "#1677ff", cursor: "pointer" }}
                                onClick={() => onView(item)}
                            />
                        </Tooltip>
                    </Access>

                    <Access permission={ALL_PERMISSIONS.CAREER_PATHS.UPDATE} hideChildren>
                        <Tooltip title="Sửa" mouseEnterDelay={0.6}>
                            <EditOutlined
                                style={{ fontSize: 16, color: "#fa8c16", cursor: "pointer" }}
                                onClick={() => onEdit(item)}
                            />
                        </Tooltip>
                    </Access>

                    <Access permission={ALL_PERMISSIONS.CAREER_PATHS.DEACTIVATE} hideChildren>
                        <Tooltip title="Xóa" mouseEnterDelay={0.6}>
                            <DeleteOutlined
                                style={{ fontSize: 16, color: "#ff4d4f", cursor: "pointer" }}
                                onClick={() => onDelete(item)}
                            />
                        </Tooltip>
                    </Access>
                </Space>
            </div>
        </div>
    );
};

export default StairCard;