import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { DatabaseOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import PageContainer from "@/components/common/data-table/PageContainer";
import MyEvaluationPage from "../my-records/MyEvaluationPage";
import PendingEvaluationPage from "./PendingEvaluationPage";
import { ALL_PERMISSIONS } from "@/config/permissions";
import useAccess from "@/hooks/useAccess";
import TabBar, { type TabItem } from "@/components/common/tabs/TabBar";
import { useEvaluationTaskCountsQuery } from "@/hooks/useEvaluations";

type TabType = "MY_EVAL" | "PENDING_EVAL" | "ALL_EVAL";

const renderTaskTabLabel = (label: string, count: number) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
        {label}
        {count > 0 && (
            <span style={{
                minWidth: 20,
                height: 20,
                padding: "0 6px",
                borderRadius: 5,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fee2e2",
                color: "#dc2626",
                fontSize: 11,
                fontWeight: 700,
            }}>
                {count > 99 ? "99+" : count}
            </span>
        )}
    </span>
);

const EvaluationProcessPage = () => {
    // ===================== PERMISSION =====================
    const canViewMyEval = useAccess(ALL_PERMISSIONS.EVALUATION.GET_MY_RECORDS);
    const canViewManagerEval = useAccess(ALL_PERMISSIONS.EVALUATION.GET_PENDING_MANAGER_RECORDS);
    const canViewApproverEval = useAccess(ALL_PERMISSIONS.EVALUATION.GET_PENDING_APPROVAL_RECORDS);
    const canViewPendingEval = canViewManagerEval || canViewApproverEval;
    const canViewAllEval = useAccess(ALL_PERMISSIONS.EVALUATION.GET_ALL_RECORDS);

    const taskCountsQuery = useEvaluationTaskCountsQuery(canViewMyEval || canViewPendingEval);
    const myPendingCount = taskCountsQuery.data?.myPending || 0;
    const pendingCount = (taskCountsQuery.data?.pendingManager || 0)
        + (taskCountsQuery.data?.pendingApproval || 0);

    // ===================== BUILD TABS =====================
    const tabs = useMemo<TabItem<TabType>[]>(() => {
        return [
            canViewMyEval && {
                key: "MY_EVAL" as TabType,
                label: renderTaskTabLabel("Đánh giá của tôi", myPendingCount),
                icon: <UserOutlined />,
            },
            canViewPendingEval && {
                key: "PENDING_EVAL" as TabType,
                label: renderTaskTabLabel("Cần xử lý", pendingCount),
                icon: <TeamOutlined />,
            },
            canViewAllEval && {
                key: "ALL_EVAL" as TabType,
                label: "Tất cả đánh giá",
                icon: <DatabaseOutlined />,
            },
        ].filter(Boolean) as TabItem<TabType>[];
    }, [canViewAllEval, canViewMyEval, canViewPendingEval, myPendingCount, pendingCount]);

    // ===================== ACTIVE TAB =====================
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get("tab") as TabType;

    const activeTab = useMemo<TabType>(() => {
        if (tabs.length && tabs.find(t => t.key === tabParam)) {
            return tabParam;
        }
        return tabs[0]?.key || "MY_EVAL";
    }, [tabs, tabParam]);

    const setActiveTab = (tab: TabType) => {
        setSearchParams(current => {
            const next = new URLSearchParams(current);
            next.set("tab", tab);
            return next;
        });
    };

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
                <div style={{ marginBottom: 24 }}>
                    <TabBar tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />
                </div>

                {/* CONTENT */}
                {activeTab === "MY_EVAL" && canViewMyEval && (
                    <MyEvaluationPage isTab={true} />
                )}
                {activeTab === "PENDING_EVAL" && canViewPendingEval && (
                    <PendingEvaluationPage isTab={true} />
                )}
                {activeTab === "ALL_EVAL" && canViewAllEval && (
                    <MyEvaluationPage isTab={true} viewMode="all" />
                )}
            </div>
        </PageContainer>
    );
};

export default EvaluationProcessPage;
