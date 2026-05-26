import { useState, useMemo, useEffect } from "react";
import { UserOutlined, TeamOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import PageContainer from "@/components/common/data-table/PageContainer";
import MyEvaluationPage from "../my-records/MyEvaluationPage";
import PendingManagerEvaluationPage from "../manager/PendingManagerEvaluationPage";
import PendingApprovalPage from "../approval/PendingApprovalPage";
import { ALL_PERMISSIONS } from "@/config/permissions";
import useAccess from "@/hooks/useAccess";
import TabBar from "@/components/common/tabs/TabBar";
import type { TabItem } from "@/components/common/tabs/TabBar";

type TabType = "MY_EVAL" | "MANAGER_EVAL" | "APPROVER_EVAL";

const EvaluationProcessPage = () => {
    // ===================== PERMISSION =====================
    const canViewMyEval = useAccess(ALL_PERMISSIONS.EVALUATION.GET_MY_RECORDS);
    const canViewManagerEval = useAccess(ALL_PERMISSIONS.EVALUATION.GET_PENDING_MANAGER_RECORDS);
    const canViewApproverEval = useAccess(ALL_PERMISSIONS.EVALUATION.GET_PENDING_APPROVAL_RECORDS);

    // ===================== BUILD TABS =====================
    const tabs = useMemo<TabItem<TabType>[]>(() => {
        return [
            // Luôn hiển thị tab nhân viên đánh giá (có thể ẩn nếu k có quyền, nhưng mặc định ai cũng có)
            canViewMyEval && {
                key: "MY_EVAL" as TabType,
                label: "Nhân viên đánh giá",
                icon: <UserOutlined />,
            },
            canViewManagerEval && {
                key: "MANAGER_EVAL" as TabType,
                label: "QL trực tiếp đánh giá",
                icon: <TeamOutlined />,
            },
            canViewApproverEval && {
                key: "APPROVER_EVAL" as TabType,
                label: "QL gián tiếp phê duyệt",
                icon: <SafetyCertificateOutlined />,
            },
        ].filter(Boolean) as TabItem<TabType>[];
    }, [canViewMyEval, canViewManagerEval, canViewApproverEval]);

    // ===================== ACTIVE TAB =====================
    const [activeTab, setActiveTab] = useState<TabType>("MY_EVAL");

    useEffect(() => {
        if (!tabs.length) return;
        if (!tabs.find(t => t.key === activeTab)) {
            setActiveTab(tabs[0].key);
        }
    }, [tabs, activeTab]);

    if (!tabs.length) {
        return (
            <PageContainer title="Tiến trình đánh giá">
                <div style={{ padding: 24 }}>
                    Bạn không có quyền truy cập
                </div>
            </PageContainer>
        );
    }

    return (
        <PageContainer title="Tiến trình đánh giá">
            {/* Ẩn các style mặc định của PageContainer padding cho các sub-page */}
            <style>{`
                .evaluation-process-container .page-container {
                    padding: 0px !important;
                    border: none !important;
                    box-shadow: none !important;
                    background: transparent !important;
                }
                .evaluation-process-container .page-title {
                    display: none !important;
                }
            `}</style>
            
            <div className="evaluation-process-container">
                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center' }}>
                    <TabBar tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
                </div>

                {/* CONTENT */}
                {activeTab === "MY_EVAL" && canViewMyEval && (
                    <MyEvaluationPage isTab={true} />
                )}
                {activeTab === "MANAGER_EVAL" && canViewManagerEval && (
                    <PendingManagerEvaluationPage isTab={true} />
                )}
                {activeTab === "APPROVER_EVAL" && canViewApproverEval && (
                    <PendingApprovalPage isTab={true} />
                )}
            </div>
        </PageContainer>
    );
};

export default EvaluationProcessPage;
