import React, { useState } from "react";
import {
    LockOutlined,
    SendOutlined,
    InboxOutlined,
    AuditOutlined,
} from "@ant-design/icons";

import ProcedureTable from "./ProcedureTable";
import ShareLogTable from "../components/ShareLogTable";
import ViewProcedure from "../view.procedure";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { useProcedureByIdQuery } from "@/hooks/useProcedure";

interface IProps {
    companyId?: number;
    departmentId?: number;
}

// ── Admin badge ──
const AdminBadge = () => (
    <span style={{
        fontSize: 10, fontWeight: 600,
        padding: "1px 5px", borderRadius: 3,
        background: "#fff1f2", color: "#be123c",
        border: "0.5px solid #fecdd3",
        marginLeft: 4, lineHeight: "16px",
    }}>
        Admin
    </span>
);

// ── Sub-view chip bar — khác về hình dạng với TabBar cha (underline)
// Dùng pill/chip để user không nhầm đây là tab navigation ──
const ChipBar: React.FC<{
    items: { key: string; icon: React.ReactNode; label: string; badge?: React.ReactNode }[];
    active: string;
    onChange: (key: string) => void;
}> = ({ items, active, onChange }) => (
    <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "12px 0 16px",
        borderBottom: "0.5px solid #f0f0f0",
        marginBottom: 20,
        flexWrap: "wrap",
    }}>
        {items.map((item) => {
            const isActive = item.key === active;
            return (
                <button
                    key={item.key}
                    onClick={() => onChange(item.key)}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "5px 14px",
                        fontSize: 12,
                        fontWeight: isActive ? 500 : 400,
                        color: isActive ? "#534AB7" : "#6b7280",
                        background: isActive ? "#EEEDFE" : "transparent",
                        border: isActive ? "0.5px solid #AFA9EC" : "0.5px solid #e5e7eb",
                        borderRadius: 20,          // pill shape — rõ ràng KHÔNG phải tab
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        whiteSpace: "nowrap",
                        lineHeight: "20px",
                    }}
                >
                    <span style={{
                        display: "flex",
                        fontSize: 12,
                        opacity: isActive ? 1 : 0.5,
                        color: isActive ? "#534AB7" : "inherit",
                    }}>
                        {item.icon}
                    </span>
                    {item.label}
                    {item.badge}
                </button>
            );
        })}
    </div>
);

const ConfidentialProcedureView: React.FC<IProps> = ({ companyId, departmentId }) => {
    const [activeView, setActiveView] = useState("list");
    const [viewProcedureId, setViewProcedureId] = useState<number | null>(null);

    const canSeeSent = useAccess(ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.SHARE_LOG_SENT);
    const canSeeReceived = useAccess(ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.SHARE_LOG_RECEIVED);
    const canSeeAudit = useAccess(ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.SHARE_LOG_ALL);

    const { data: viewProcedureData } = useProcedureByIdQuery(
        "CONFIDENTIAL",
        viewProcedureId ?? undefined
    );

    const chips = [
        { key: "list", icon: <LockOutlined />, label: "Danh sách" },
        ...(canSeeSent ? [{ key: "sent", icon: <SendOutlined />, label: "Đã gửi" }] : []),
        ...(canSeeReceived ? [{ key: "received", icon: <InboxOutlined />, label: "Đã nhận" }] : []),
        ...(canSeeAudit ? [{
            key: "audit",
            icon: <AuditOutlined />,
            label: "Audit log",
            badge: <AdminBadge />,
        }] : []),
    ];

    return (
        <div style={{ marginTop: 4 }}>
            <ChipBar
                items={chips}
                active={activeView}
                onChange={setActiveView}
            />

            <div>
                {activeView === "list" && (
                    <ProcedureTable
                        type="CONFIDENTIAL"
                        companyId={companyId}
                        departmentId={departmentId}
                    />
                )}
                {activeView === "sent" && (
                    <ShareLogTable
                        mode="sent"
                        open={activeView === "sent"}
                        onViewProcedure={(id) => setViewProcedureId(id)}
                    />
                )}
                {activeView === "received" && (
                    <ShareLogTable
                        mode="received"
                        open={activeView === "received"}
                        onViewProcedure={(id) => setViewProcedureId(id)}
                    />
                )}
                {activeView === "audit" && (
                    <ShareLogTable
                        mode="audit"
                        open={activeView === "audit"}
                        onViewProcedure={(id) => setViewProcedureId(id)}
                    />
                )}
            </div>

            <ViewProcedure
                type="CONFIDENTIAL"
                open={!!viewProcedureData && viewProcedureId !== null}
                onClose={() => setViewProcedureId(null)}
                dataInit={viewProcedureData ?? null}
            />
        </div>
    );
};

export default ConfidentialProcedureView;