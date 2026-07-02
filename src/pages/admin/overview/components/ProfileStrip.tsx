import React from "react";
import { Avatar } from "antd";
import { useAppSelector } from "@/redux/hooks";
import type { IUserPosition } from "@/types/backend";

const PINK = "#ec4899";

const wrapStyle: React.CSSProperties = {
    background: "linear-gradient(135deg, #fff 0%, #fdf2f8 100%)",
    borderRadius: 20,
    border: "1px solid #f0e6ec",
    boxShadow: "0 8px 32px rgba(236,72,153,0.08)",
    padding: "clamp(18px, 3vw, 24px)",
    display: "flex",
    alignItems: "center",
    gap: 18,
    flexWrap: "wrap",
    boxSizing: "border-box",
};

const metaRowStyle: React.CSSProperties = {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 8,
};

const tagStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "#6b7280",
    background: "#fff",
    border: "1px solid #f0e6ec",
    borderRadius: 999,
    padding: "3px 10px",
};

const positionBtnBase: React.CSSProperties = {
    fontSize: 12.5,
    fontWeight: 700,
    padding: "6px 14px",
    borderRadius: 999,
    cursor: "pointer",
    transition: "all 0.15s",
    whiteSpace: "nowrap",
};

const getInitials = (name?: string) =>
    name ? name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "US";

const positionLabel = (p: IUserPosition) =>
    p.department?.name || p.section?.name || p.company?.name || "Vị trí";

interface Props {
    positions: IUserPosition[];
    selectedId?: string;
    onSelect: (id: string) => void;
}

const ProfileStrip = ({ positions, selectedId, onSelect }: Props) => {
    const user = useAppSelector((s) => s.account.user);
    const backendURL = import.meta.env.VITE_BACKEND_URL;

    const avatarSrc = user?.avatar
        ? `${backendURL}/api/v1/files/public?fileName=${encodeURIComponent(user.avatar)}&folder=avatar`
        : undefined;

    const selected = positions.find((p) => p.id === selectedId) || positions[0];

    return (
        <div style={wrapStyle}>
            <Avatar
                size={72}
                src={avatarSrc}
                style={{
                    background: "linear-gradient(135deg, #ec4899, #a855f7)",
                    fontWeight: 800,
                    fontSize: 26,
                    color: "#fff",
                    flexShrink: 0,
                    border: "3px solid #fff",
                    boxShadow: "0 4px 14px rgba(236,72,153,0.25)",
                }}
            >
                {!user?.avatar && getInitials(user?.name)}
            </Avatar>

            <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", lineHeight: 1.2 }}>
                    {user?.name || "Người dùng"}
                </div>
                {selected?.jobTitle?.nameVi && (
                    <div style={{ fontSize: 14, fontWeight: 600, color: PINK, marginTop: 3 }}>
                        {selected.jobTitle.nameVi}
                        {selected.jobTitle.band ? ` · ${selected.jobTitle.band}` : ""}
                    </div>
                )}
                <div style={metaRowStyle}>
                    {user?.userInfo?.employeeCode && <span style={tagStyle}>Mã NV: {user.userInfo.employeeCode}</span>}
                    {user?.email && <span style={tagStyle}>{user.email}</span>}
                    {selected?.company?.name && <span style={tagStyle}>{selected.company.name}</span>}
                    {selected?.department?.name && <span style={tagStyle}>{selected.department.name}</span>}
                    {selected?.section?.name && <span style={tagStyle}>{selected.section.name}</span>}
                </div>

                {positions.length > 1 && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                        {positions.map((p) => {
                            const active = p.id === selected?.id;
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => onSelect(p.id)}
                                    style={{
                                        ...positionBtnBase,
                                        background: active ? PINK : "#fff",
                                        color: active ? "#fff" : "#6b7280",
                                        border: `1px solid ${active ? PINK : "#e5e7eb"}`,
                                    }}
                                >
                                    {positionLabel(p)}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(ProfileStrip);
