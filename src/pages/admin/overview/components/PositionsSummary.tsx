import React from "react";
import { BankOutlined, ApartmentOutlined, ClusterOutlined, IdcardOutlined } from "@ant-design/icons";
import type { IUserPosition } from "@/types/backend";

const PINK = "#ec4899";

const SOURCE_META = {
    COMPANY: { icon: <BankOutlined />, label: "Công ty", hue: "#0066ff" },
    DEPARTMENT: { icon: <ApartmentOutlined />, label: "Phòng ban", hue: "#af52de" },
    SECTION: { icon: <ClusterOutlined />, label: "Bộ phận", hue: "#ff9500" },
} as const;

const wrapStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 20,
    border: "1px solid #f0e6ec",
    boxShadow: "0 8px 32px rgba(236,72,153,0.08)",
    padding: "clamp(18px, 3vw, 28px)",
    boxSizing: "border-box",
};

const headerRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    flexWrap: "wrap",
};

const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 18,
    fontWeight: 800,
    color: "#111827",
    display: "flex",
    alignItems: "center",
    gap: 10,
};

const chipBase: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    padding: "4px 10px",
    borderRadius: 999,
    whiteSpace: "nowrap",
    color: "#334155",
    background: "#f1f5f9",
};

const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: 14,
};

const cardStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
    padding: "16px 18px",
    borderRadius: 16,
    border: "1px solid #ececf0",
    background: "#fff",
    minHeight: 84,
    boxSizing: "border-box",
};

const iconBoxBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    borderRadius: 12,
    flexShrink: 0,
    fontSize: 20,
};

const unitName = (p: IUserPosition) =>
    p.section?.name || p.department?.name || p.company?.name || "—";

const PositionCard = React.memo(({ p }: { p: IUserPosition }) => {
    const meta = SOURCE_META[p.source] ?? SOURCE_META.COMPANY;
    return (
        <div style={cardStyle}>
            <span style={{ ...iconBoxBase, color: meta.hue, background: `${meta.hue}14` }}>
                {meta.icon}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ ...chipBase, fontSize: 10.5, color: meta.hue, background: `${meta.hue}14` }}>
                        {meta.label}
                    </span>
                    {p.jobTitle?.band && (
                        <span style={{ ...chipBase, fontSize: 10.5 }}>{p.jobTitle.band}</span>
                    )}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1c1c1e", marginTop: 6, lineHeight: 1.3 }}>
                    {p.jobTitle?.nameVi || "Chưa gán chức danh"}
                </div>
                <div style={{ fontSize: 12.5, color: "#8e8e93", marginTop: 3 }}>{unitName(p)}</div>
            </div>
        </div>
    );
});
PositionCard.displayName = "PositionCard";

interface Props {
    positions: IUserPosition[];
}

const PositionsSummary = ({ positions }: Props) => {
    if (!positions.length) return null;

    return (
        <div style={wrapStyle}>
            <div style={headerRowStyle}>
                <h3 style={titleStyle}>
                    <IdcardOutlined style={{ color: PINK }} />
                    Vị trí đang giữ
                </h3>
                <span style={{ ...chipBase, marginLeft: "auto" }}>
                    {positions.length} vị trí
                </span>
            </div>

            <div style={gridStyle}>
                {positions.map((p) => (
                    <PositionCard key={p.id} p={p} />
                ))}
            </div>
        </div>
    );
};

export default React.memo(PositionsSummary);
