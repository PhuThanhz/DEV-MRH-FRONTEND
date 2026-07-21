import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { DatabaseOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import { Badge } from "antd";
import PageContainer from "@/components/common/data-table/PageContainer";
import MyEvaluationPage from "../my-records/MyEvaluationPage";
import PendingEvaluationPage from "./PendingEvaluationPage";
import { ALL_PERMISSIONS } from "@/config/permissions";
import useAccess from "@/hooks/useAccess";
import TabBar, { type TabItem } from "@/components/common/tabs/TabBar";
import { useEvaluationTaskCountsQuery } from "@/hooks/useEvaluations";

type TabType = "MY_EVAL" | "PENDING_EVAL" | "ALL_EVAL";

const renderTaskTabLabel = (label: string, count: number, active: boolean) => (
    <Badge 
        count={count} 
        color={active ? "#e8637a" : "#e2e8f0"} 
        style={{ 
            color: active ? "#ffffff" : "#475569",
            fontWeight: 700,
            fontSize: 10,
            border: "1.5px solid #ffffff",
            boxShadow: "0 1px 3px rgba(15, 23, 42, 0.15)",
        }}
        offset={[8, -8]}
    >
        <span>{label}</span>
    </Badge>
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

    // ===================== ACTIVE TAB =====================
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get("tab") as TabType;

    const activeTab = useMemo<TabType>(() => {
        const allowedTabs: TabType[] = [];
        if (canViewMyEval) allowedTabs.push("MY_EVAL");
        if (canViewPendingEval) allowedTabs.push("PENDING_EVAL");
        if (canViewAllEval) allowedTabs.push("ALL_EVAL");

        if (tabParam && allowedTabs.includes(tabParam)) {
            return tabParam;
        }
        return allowedTabs[0] || "MY_EVAL";
    }, [canViewAllEval, canViewMyEval, canViewPendingEval, tabParam]);

    // ===================== BUILD TABS =====================
    const tabs = useMemo<TabItem<TabType>[]>(() => {
        return [
            canViewMyEval && {
                key: "MY_EVAL" as TabType,
                label: renderTaskTabLabel("Đánh giá của tôi", myPendingCount, activeTab === "MY_EVAL"),
                icon: <UserOutlined />,
            },
            canViewPendingEval && {
                key: "PENDING_EVAL" as TabType,
                label: renderTaskTabLabel("Cần xử lý", pendingCount, activeTab === "PENDING_EVAL"),
                icon: <TeamOutlined />,
            },
            canViewAllEval && {
                key: "ALL_EVAL" as TabType,
                label: "Tất cả đánh giá",
                icon: <DatabaseOutlined />,
            },
        ].filter(Boolean) as TabItem<TabType>[];
    }, [canViewAllEval, canViewMyEval, canViewPendingEval, myPendingCount, pendingCount, activeTab]);

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
