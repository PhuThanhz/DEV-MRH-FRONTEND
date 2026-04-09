import { useState } from "react";
import PageContainer from "@/components/common/data-table/PageContainer";
import TabBar from "@/components/common/tabs/TabBar";

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

import {
    FileTextOutlined,
    InboxOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    AppstoreOutlined,
} from "@ant-design/icons";
import { Badge } from "antd";

type TabKey = "my" | "inbox" | "published" | "rejected" | "all";

const TABS = [
    { key: "my", label: "JD của tôi", icon: <FileTextOutlined />, permission: ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_MY },
    { key: "inbox", label: "JD cần xử lý", icon: <InboxOutlined />, permission: ALL_PERMISSIONS.JD_FLOW.FETCH_INBOX },
    { key: "published", label: "JD đã ban hành", icon: <CheckCircleOutlined />, permission: ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_PUBLISHED },
    { key: "rejected", label: "JD đã từ chối", icon: <CloseCircleOutlined />, permission: ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_REJECTED },
    { key: "all", label: "Tất cả JD", icon: <AppstoreOutlined />, permission: ALL_PERMISSIONS.JOB_DESCRIPTIONS.GET_ALL },
] as const;

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
        my: canMy,
        inbox: canInbox,
        published: canPublished,
        rejected: canRejected,
        all: canAll,
    };

    const visibleTabs = TABS.filter((tab) => accessMap[tab.key]);

    const tabItems = visibleTabs.map((tab) => {
        const showBadge = tab.key === "inbox" && inboxCount > 0;

        return {
            key: tab.key,
            icon: tab.icon,
            label: (
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {tab.label}
                    {showBadge && (
                        <Badge
                            count={inboxCount}
                            size="small"
                            style={{ backgroundColor: "#E8356D" }}
                        />
                    )}
                </span>
            ),
        };
    });

    return (
        <PageContainer title="Quản lý Mô Tả Công Việc">
            <div
                style={{
                    background: "#fff",
                    borderRadius: 12,
                    border: "0.5px solid #e8e8e8",
                    overflow: "hidden",
                }}
            >
                {/* TAB BAR */}
                <div style={{ padding: "12px 14px", borderBottom: "0.5px solid #e8e8e8" }}>
                    <TabBar
                        tabs={tabItems}
                        activeKey={activeTab}
                        onChange={setActiveTab}
                    />
                </div>

                {/* TAB CONTENT */}
                <div style={{ padding: 24 }}>
                    {activeTab === "my" && canMy && <MyJobDescriptionsTab />}
                    {activeTab === "inbox" && canInbox && <JdInboxTab />}
                    {activeTab === "published" && canPublished && <PublishedJdTab />}
                    {activeTab === "rejected" && canRejected && <RejectedJdTab />}
                    {activeTab === "all" && canAll && <AllJobDescriptionsTab />}
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