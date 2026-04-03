import { useState } from "react";
import { Badge } from "antd";
import {
    FileTextOutlined,
    InboxOutlined,
    CloseCircleOutlined,
    CheckCircleOutlined,
    AppstoreOutlined,
} from "@ant-design/icons";

import PageContainer from "@/components/common/data-table/PageContainer";

import MyJobDescriptionsTab from "./tabs/MyJobDescriptionsTab";
import JdInboxTab from "./tabs/JdInboxTab";
import PublishedJdTab from "./tabs/PublishedJdTab";
import AllJobDescriptionsTab from "./tabs/AllJobDescriptionsTab";
import RejectedJdTab from "./tabs/RejectedJdTab";

import ModalJobDescription from "./modal.job-description";

import { useJdFlowInboxQuery } from "@/hooks/useJdFlow";
import type { IJobDescription } from "@/types/backend";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";

type TabKey = "inbox" | "my" | "published" | "rejected" | "all";

const ACCENT = "#e8637a";

const TABS: {
    key: TabKey;
    label: string;
    icon: React.ReactNode;
    permission: { method: string; apiPath: string; module: string };
}[] = [
        { key: "inbox", label: "JD cần xử lý", icon: <InboxOutlined />, permission: ALL_PERMISSIONS.JD_FLOW.FETCH_INBOX },
        { key: "my", label: "JD của tôi", icon: <FileTextOutlined />, permission: ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_MY },
        { key: "published", label: "JD đã ban hành", icon: <CheckCircleOutlined />, permission: ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_PUBLISHED }, // ← sửa
        { key: "rejected", label: "JD đã từ chối", icon: <CloseCircleOutlined />, permission: ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_REJECTED },  // ← sửa
        { key: "all", label: "Tất cả JD", icon: <AppstoreOutlined />, permission: ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_ALL },       // ← sửa
    ];

const JobDescriptionPage = () => {
    const { data } = useJdFlowInboxQuery();
    const inboxCount = data?.length ?? 0;

    const [activeTab, setActiveTab] = useState<TabKey>("inbox");
    const [openModal, setOpenModal] = useState(false);
    const [editRecord, setEditRecord] = useState<IJobDescription | null>(null);

    // ── Permission checks ──────────────────────────────────────
    const canInbox = useAccess(ALL_PERMISSIONS.JD_FLOW.FETCH_INBOX);
    const canMy = useAccess(ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_MY);
    const canPublished = useAccess(ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_PUBLISHED); // ← sửa
    const canRejected = useAccess(ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_REJECTED);  // ← sửa
    const canAll = useAccess(ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_ALL);       // ← sửa

    const accessMap: Record<TabKey, boolean> = {
        inbox: canInbox,
        my: canMy,
        published: canPublished, // ← sửa
        rejected: canRejected,  // ← sửa
        all: canAll,       // ← sửa
    };

    const visibleTabs = TABS.filter(tab => accessMap[tab.key]);

    return (
        <PageContainer title="Quản lý Mô Tả Công Việc">
            <div style={{
                background: "#fff",
                borderRadius: 16,
                border: "1px solid #f0f0f0",
                overflow: "hidden",
                boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
            }}>
                {/* TAB BAR */}
                <div style={{
                    display: "flex",
                    borderBottom: "1px solid #f0f0f0",
                    background: "#fafafa",
                    padding: "0 16px",
                    gap: 0,
                    overflowX: "auto",
                }}>
                    {visibleTabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "13px 20px",
                                    fontSize: 13,
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? ACCENT : "#888",
                                    background: "transparent",
                                    border: "none",
                                    borderBottom: isActive
                                        ? `2px solid ${ACCENT}`
                                        : "2px solid transparent",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    whiteSpace: "nowrap",
                                    marginBottom: -1,
                                }}
                            >
                                <span style={{
                                    fontSize: 14,
                                    color: isActive ? ACCENT : "#bbb",
                                    display: "flex",
                                    alignItems: "center",
                                }}>
                                    {tab.icon}
                                </span>

                                {tab.key === "inbox" && inboxCount > 0 ? (
                                    <Badge
                                        count={inboxCount}
                                        size="small"
                                        style={{
                                            backgroundColor: isActive ? ACCENT : "#bbb",
                                            fontSize: 11,
                                            fontWeight: 600,
                                            boxShadow: "none",
                                        }}
                                    >
                                        <span style={{ paddingRight: 6 }}>{tab.label}</span>
                                    </Badge>
                                ) : (
                                    tab.label
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* TAB CONTENT */}
                <div style={{ padding: "20px", background: "#fff" }}>
                    {activeTab === "inbox" && canInbox && <JdInboxTab />}
                    {activeTab === "my" && canMy && <MyJobDescriptionsTab />}
                    {activeTab === "published" && canPublished && <PublishedJdTab />}    {/* ← sửa */}
                    {activeTab === "rejected" && canRejected && <RejectedJdTab />}     {/* ← sửa */}
                    {activeTab === "all" && canAll && <AllJobDescriptionsTab />} {/* ← sửa */}
                </div>
            </div>

            <ModalJobDescription
                open={openModal}
                onClose={() => {
                    setOpenModal(false);
                    setEditRecord(null);
                }}
                editRecord={editRecord}
            />
        </PageContainer>
    );
};

export default JobDescriptionPage;