import { useState } from "react";
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

type TabKey = "my" | "inbox" | "published" | "rejected" | "all";

const ACCENT = "#b5294a";
const ACCENT_BG = "#fce8eb";
const ACCENT_BORDER = "#f0aab8";

const IconDoc = () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="1" width="10" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 5h6M5 8h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
);
const IconInbox = () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path d="M2 10l1.5-7h9L14 10" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M1.5 10h4a.5.5 0 00.5-.5v-1h4v1a.5.5 0 00.5.5h4v3a.5.5 0 01-.5.5h-13a.5.5 0 01-.5-.5v-3z" stroke="currentColor" strokeWidth="1.4" />
    </svg>
);
const IconCheck = () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const IconClose = () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
        <path d="M5.5 5.5l5 5M10.5 5.5l-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
);
const IconGrid = () => (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="9" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
);

const TABS: {
    key: TabKey;
    label: string;
    icon: React.ReactNode;
    permission: { method: string; apiPath: string; module: string };
}[] = [
        { key: "my", label: "JD của tôi", icon: <IconDoc />, permission: ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_MY },
        { key: "inbox", label: "JD cần xử lý", icon: <IconInbox />, permission: ALL_PERMISSIONS.JD_FLOW.FETCH_INBOX },
        { key: "published", label: "JD đã ban hành", icon: <IconCheck />, permission: ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_PUBLISHED },
        { key: "rejected", label: "JD đã từ chối", icon: <IconClose />, permission: ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_REJECTED },
        { key: "all", label: "Tất cả JD", icon: <IconGrid />, permission: ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_ALL },
    ];

const JobDescriptionPage = () => {
    const { data } = useJdFlowInboxQuery();
    const inboxCount = data?.length ?? 0;

    const [activeTab, setActiveTab] = useState<TabKey>("my");
    const [openModal, setOpenModal] = useState(false);
    const [editRecord, setEditRecord] = useState<IJobDescription | null>(null);

    const canMy = useAccess(ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_MY);
    const canInbox = useAccess(ALL_PERMISSIONS.JD_FLOW.FETCH_INBOX);
    const canPublished = useAccess(ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_PUBLISHED);
    const canRejected = useAccess(ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_REJECTED);
    const canAll = useAccess(ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_ALL);

    const accessMap: Record<TabKey, boolean> = {
        my: canMy, inbox: canInbox, published: canPublished,
        rejected: canRejected, all: canAll,
    };

    const visibleTabs = TABS.filter((tab) => accessMap[tab.key]);

    return (
        <PageContainer title="Quản lý Mô Tả Công Việc">
            <div style={{
                background: "#fff",
                borderRadius: 12,
                border: "0.5px solid #e8e8e8",
                overflow: "hidden",
            }}>
                {/* TAB BAR */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "12px 14px",
                    background: "#fff",
                    borderBottom: "0.5px solid #e8e8e8",
                    overflowX: "auto",
                    scrollbarWidth: "none" as const,
                }}>
                    {visibleTabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        const showBadge = tab.key === "inbox" && inboxCount > 0;

                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    padding: "6px 14px",
                                    border: `0.5px solid ${isActive ? ACCENT_BORDER : "#e0e0e0"}`,
                                    borderRadius: 99,
                                    background: isActive ? ACCENT_BG : "transparent",
                                    cursor: "pointer",
                                    fontFamily: "inherit",
                                    fontSize: 13,
                                    fontWeight: isActive ? 500 : 400,
                                    color: isActive ? ACCENT : "#8c8c8c",
                                    whiteSpace: "nowrap",
                                    transition: "all 0.15s ease",
                                    flexShrink: 0,
                                }}
                            >
                                <span style={{
                                    display: "flex",
                                    alignItems: "center",
                                    opacity: isActive ? 1 : 0.5,
                                    transition: "opacity 0.15s",
                                }}>
                                    {tab.icon}
                                </span>

                                {tab.label}

                                {showBadge && (
                                    <span style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        minWidth: 17,
                                        height: 17,
                                        padding: "0 5px",
                                        background: isActive ? "#f0aab8" : "#f0f0f0",
                                        color: isActive ? ACCENT : "#888",
                                        borderRadius: 99,
                                        fontSize: 11,
                                        fontWeight: 500,
                                        lineHeight: 1,
                                    }}>
                                        {inboxCount}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* TAB CONTENT */}
                <div style={{ padding: 24, background: "#fff" }}>
                    {activeTab === "my" && canMy && <MyJobDescriptionsTab />}
                    {activeTab === "inbox" && canInbox && <JdInboxTab />}
                    {activeTab === "published" && canPublished && <PublishedJdTab />}
                    {activeTab === "rejected" && canRejected && <RejectedJdTab />}
                    {activeTab === "all" && canAll && <AllJobDescriptionsTab />}
                </div>
            </div>

            <ModalJobDescription
                open={openModal}
                onClose={() => { setOpenModal(false); setEditRecord(null); }}
                editRecord={editRecord}
            />
        </PageContainer>
    );
};

export default JobDescriptionPage;