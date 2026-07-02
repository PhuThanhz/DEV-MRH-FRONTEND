import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
    LockOutlined,
    SendOutlined,
    InboxOutlined,
    AuditOutlined,
} from "@ant-design/icons";

import ProcedureTable from "./table/ProcedureTable";
import ShareLogTable from "./table/ShareLogTable";
import ViewProcedure from "../view.procedure";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { useProcedureByIdQuery } from "@/hooks/useProcedure";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "antd";

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
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: 4,
        background: "#f1f5f9", // slate-100
        borderRadius: 20,
        marginBottom: 20,
        flexWrap: "wrap",
        border: "1px solid #e2e8f0", // slate-200
    }}>
        <style>{`
            .custom-chip-button:hover {
                color: #534AB7 !important;
                background: rgba(255, 255, 255, 0.4) !important;
            }
            .custom-chip-button:hover span {
                color: #534AB7 !important;
            }
        `}</style>
        {items.map((item) => {
            const isActive = item.key === active;
            return (
                <button
                    key={item.key}
                    onClick={() => onChange(item.key)}
                    className="custom-chip-button"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 16px",
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "#534AB7" : "#475569", // slate-600 when inactive
                        background: isActive ? "#ffffff" : "transparent",
                        border: "none",
                        borderRadius: 16,
                        boxShadow: isActive ? "0 2px 8px rgba(15, 23, 42, 0.08)" : "none",
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        whiteSpace: "nowrap",
                        lineHeight: "20px",
                        outline: "none",
                    }}
                >
                    <span style={{
                        display: "inline-flex",
                        fontSize: 14,
                        color: isActive ? "#534AB7" : "#64748b",
                        transition: "color 0.2s ease",
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

    const [searchParams, setSearchParams] = useSearchParams();
    useEffect(() => {
        const viewIdStr = searchParams.get("viewId");
        const tab = searchParams.get("tab")?.toLowerCase();
        if (tab === "confidential" && viewIdStr) {
            const viewId = Number(viewIdStr);
            if (!isNaN(viewId)) {
                setViewProcedureId(viewId);
                // Clear viewId from URL
                searchParams.delete("viewId");
                setSearchParams(searchParams, { replace: true });
            }
        }
    }, [searchParams, setSearchParams]);

    const canSeeSent = useAccess(ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.SHARE_LOG_SENT);
    const canSeeReceived = useAccess(ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.SHARE_LOG_RECEIVED);
    const canSeeAudit = useAccess(ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.SHARE_LOG_ALL);

    const { items: notifItems, markOneRead } = useNotifications();
    const unreadConfidentialCount = notifItems.filter(
        (i) => !i.isRead && i.module === "CONFIDENTIAL_PROCEDURES"
    ).length;

    // Tự động đánh dấu đã đọc các thông báo quy trình bảo mật khi xem tab "Đã nhận"
    useEffect(() => {
        if (activeView === "received") {
            const unreadConfidentialNotifs = notifItems.filter(
                (i) => !i.isRead && i.module === "CONFIDENTIAL_PROCEDURES"
            );
            unreadConfidentialNotifs.forEach((notif) => {
                markOneRead(notif);
            });
        }
    }, [activeView, notifItems, markOneRead]);

    const { data: viewProcedureData } = useProcedureByIdQuery(
        "CONFIDENTIAL",
        viewProcedureId ?? undefined
    );

    const chips = [
        { key: "list", icon: <LockOutlined />, label: "Danh sách" },
        ...(canSeeSent ? [{ key: "sent", icon: <SendOutlined />, label: "Đã gửi" }] : []),
        ...(canSeeReceived ? [{
            key: "received",
            icon: <InboxOutlined />,
            label: "Đã nhận",
            badge: unreadConfidentialCount > 0 ? (
                <Badge
                    count={unreadConfidentialCount}
                    size="small"
                    style={{ backgroundColor: "#534AB7", marginLeft: 4 }}
                />
            ) : null
        }] : []),
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