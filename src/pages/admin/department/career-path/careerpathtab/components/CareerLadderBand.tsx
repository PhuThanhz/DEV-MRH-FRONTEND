import { useState } from "react";
import { Typography } from "antd";
import type { ICareerPath, IResCareerPathBandGroup } from "@/types/backend";
import { T, getHue } from "../constants";
import CareerLadderFlat from "./CareerLadderFlat";
import EmptyState from "./EmptyState";

const { Text } = Typography;

interface CareerLadderBandProps {
    groups: IResCareerPathBandGroup[];
    onView: (r: ICareerPath) => void;
    onEdit: (r: ICareerPath) => void;
    onDelete: (r: ICareerPath) => void;
}

const CareerLadderBand = ({ groups, onView, onEdit, onDelete }: CareerLadderBandProps) => {
    const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});
    const toggle = (band: string) =>
        setOpenKeys((prev) => ({ ...prev, [band]: !prev[band] }));

    if (groups.length === 0) return <EmptyState label="Chưa có dữ liệu theo band" />;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {groups.map((group, gi) => {
                const h = getHue(gi);
                const isOpen = openKeys[group.band] !== false;
                return (
                    <div
                        key={group.band}
                        style={{
                            background: T.white,
                            border: `1px solid ${isOpen ? h.chipBorder : T.line}`,
                            borderRadius: 12,
                            overflow: "hidden",
                            transition: "border-color 0.15s, box-shadow 0.15s",
                            boxShadow: isOpen
                                ? `0 4px 16px rgba(0,0,0,0.08)`
                                : "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                    >
                        {/* Band header */}
                        <div
                            onClick={() => toggle(group.band)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "12px 16px",
                                cursor: "pointer",
                                borderBottom: isOpen ? `1px solid ${T.line}` : "none",
                                background: isOpen ? T.s1 : T.white,
                                transition: "background 0.15s",
                                userSelect: "none",
                            }}
                        >
                            <div style={{
                                width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                                background: h.dot,
                                boxShadow: isOpen ? `0 0 0 3px ${h.chipBg}` : "none",
                                transition: "box-shadow 0.15s",
                            }} />

                            <div style={{
                                padding: "2px 10px",
                                borderRadius: 6,
                                background: isOpen ? h.chipBg : T.s2,
                                border: `1px solid ${isOpen ? h.chipBorder : T.line}`,
                                fontSize: 12,
                                fontWeight: 700,
                                color: isOpen ? h.chip : T.ink3,
                                letterSpacing: 0.3,
                                transition: "all 0.15s",
                            }}>
                                {group.band}
                            </div>

                            <Text style={{ fontSize: 12.5, fontWeight: 500, color: T.ink4 }}>
                                {group.positions?.length ?? 0} chức danh
                            </Text>

                            <div style={{ flex: 1 }} />

                            <svg
                                width="14" height="14" viewBox="0 0 14 14"
                                style={{
                                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                    transition: "transform 0.2s cubic-bezier(.4,0,.2,1)",
                                    color: T.ink4,
                                }}
                            >
                                <path
                                    d="M3 5.5L7 9L11 5.5"
                                    stroke="currentColor"
                                    strokeWidth="1.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    fill="none"
                                />
                            </svg>
                        </div>

                        {isOpen && (
                            <div style={{ padding: "16px 16px 12px" }}>
                                <CareerLadderFlat
                                    paths={group.positions ?? []}
                                    onView={onView}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                    showHeader={false}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default CareerLadderBand;