import { useState } from "react";
import { Typography, Tooltip, Space } from "antd";
import { EditOutlined, EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ICareerPath } from "@/types/backend";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { T, getHue } from "../constants";

const { Text } = Typography;

const CHIP = {
    bg: "rgba(255,45,85,0.08)",
    border: "rgba(255,45,85,0.22)",
    text: "#c0185a",
};

export const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
    useState(() => {
        const handler = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    });
    return isMobile;
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
    const isMobile = useIsMobile();
    const h = getHue(index);

    const maxIndent = isMobile ? 28 : 22;
    const indent = ((totalRanks - 1 - rank) / Math.max(totalRanks - 1, 1)) * maxIndent;

    const borderColor = hov ? T.lineMed : T.lineStr;

    return (
        <div style={{
            display: "flex",
            alignItems: "stretch",
            paddingLeft: `${indent}%`,
            marginBottom: 5,
        }}>
            {/* Accent stripe */}
            <div style={{
                width: 3,
                flexShrink: 0,
                borderRadius: "3px 0 0 3px",
                background: h.stripe,
                opacity: hov ? 1 : 0.7,
                transition: "opacity 0.15s",
            }} />

            {/* Body — dùng individual border properties, không mix shorthand */}
            <div
                onMouseEnter={() => !isMobile && setHov(true)}
                onMouseLeave={() => !isMobile && setHov(false)}
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? 8 : 12,
                    padding: isMobile ? "10px 10px" : "11px 14px",
                    background: hov ? T.s1 : T.white,
                    // ✅ Tách riêng 4 border, không dùng shorthand + borderLeft cùng lúc
                    borderTop: `1px solid ${borderColor}`,
                    borderRight: `1px solid ${borderColor}`,
                    borderBottom: `1px solid ${borderColor}`,
                    borderLeft: "none",
                    borderRadius: "0 10px 10px 0",
                    transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
                    boxShadow: hov
                        ? "0 2px 12px rgba(0,0,0,0.09), 0 1px 3px rgba(0,0,0,0.06)"
                        : "0 1px 2px rgba(0,0,0,0.05)",
                    cursor: "default",
                    flexWrap: isMobile ? "wrap" : "nowrap",
                    minWidth: 0,
                }}
            >
                {/* Step index */}
                <span style={{
                    width: 24,
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
                <Text ellipsis style={{
                    flex: isMobile ? "1 1 0" : 1,
                    fontSize: isMobile ? 13 : 13.5,
                    fontWeight: hov ? 600 : 500,
                    color: hov ? T.ink : T.ink2,
                    letterSpacing: -0.2,
                    lineHeight: "18px",
                    transition: "color 0.15s, font-weight 0.15s",
                    minWidth: 0,
                    display: "block",
                }}>
                    {item.jobTitleName || "—"}
                </Text>

                {/* Chip + Actions */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: isMobile ? 6 : 10,
                    flexShrink: 0,
                }}>
                    {/* Level code chip */}
                    <div style={{
                        padding: "2px 9px",
                        borderRadius: 5,
                        background: CHIP.bg,
                        border: `1px solid ${CHIP.border}`,
                        fontSize: 11,
                        fontWeight: 700,
                        color: CHIP.text,
                        letterSpacing: 0.5,
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap",
                    }}>
                        {item.positionLevelCode ?? "—"}
                    </div>

                    {/* Actions */}
                    <Space
                        size={isMobile ? 10 : 12}
                        style={{
                            flexShrink: 0,
                            opacity: isMobile ? 1 : hov ? 1 : 0,
                            transform: (!isMobile && !hov) ? "translateX(6px)" : "translateX(0)",
                            transition: "opacity 0.15s, transform 0.15s",
                            pointerEvents: (isMobile || hov) ? "auto" : "none",
                        }}
                    >
                        <Access permission={ALL_PERMISSIONS.CAREER_PATHS.GET_BY_ID} hideChildren>
                            <Tooltip title="Xem" mouseEnterDelay={0.6}>
                                <EyeOutlined
                                    style={{
                                        fontSize: isMobile ? 17 : 16,
                                        color: "#1677ff",
                                        cursor: "pointer",
                                        padding: isMobile ? 4 : 0,
                                    }}
                                    onClick={() => onView(item)}
                                />
                            </Tooltip>
                        </Access>

                        <Access permission={ALL_PERMISSIONS.CAREER_PATHS.UPDATE} hideChildren>
                            <Tooltip title="Sửa" mouseEnterDelay={0.6}>
                                <EditOutlined
                                    style={{
                                        fontSize: isMobile ? 17 : 16,
                                        color: "#fa8c16",
                                        cursor: "pointer",
                                        padding: isMobile ? 4 : 0,
                                    }}
                                    onClick={() => onEdit(item)}
                                />
                            </Tooltip>
                        </Access>

                        <Access permission={ALL_PERMISSIONS.CAREER_PATHS.DEACTIVATE} hideChildren>
                            <Tooltip title="Xóa" mouseEnterDelay={0.6}>
                                <DeleteOutlined
                                    style={{
                                        fontSize: isMobile ? 17 : 16,
                                        color: "#ff4d4f",
                                        cursor: "pointer",
                                        padding: isMobile ? 4 : 0,
                                    }}
                                    onClick={() => onDelete(item)}
                                />
                            </Tooltip>
                        </Access>
                    </Space>
                </div>
            </div>
        </div>
    );
};

export default StairCard;