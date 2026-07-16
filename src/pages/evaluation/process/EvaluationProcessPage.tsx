import { useState, useMemo, useEffect } from "react";
import { UserOutlined, TeamOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import PageContainer from "@/components/common/data-table/PageContainer";
import MyEvaluationPage from "../my-records/MyEvaluationPage";
import PendingManagerEvaluationPage from "../manager/PendingManagerEvaluationPage";
import PendingApprovalPage from "../approval/PendingApprovalPage";
import { ALL_PERMISSIONS } from "@/config/permissions";
import useAccess from "@/hooks/useAccess";
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
            canViewMyEval && {
                key: "MY_EVAL" as TabType,
                label: "Tự đánh giá",
                icon: <UserOutlined />,
            },
            canViewManagerEval && {
                key: "MANAGER_EVAL" as TabType,
                label: "Chấm trực tiếp",
                icon: <TeamOutlined />,
            },
            canViewApproverEval && {
                key: "APPROVER_EVAL" as TabType,
                label: "Duyệt cấp trên",
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

    const activeDescription = useMemo(() => {
        switch (activeTab) {
            case "MY_EVAL":
                return "Các bản đánh giá cần bạn tự hoàn tất hoặc xác nhận kết quả.";
            case "MANAGER_EVAL":
                return "Các hồ sơ bạn phụ trách chấm điểm với vai trò quản lý trực tiếp.";
            case "APPROVER_EVAL":
                return "Các hồ sơ đang chờ bạn duyệt cấp trên trước khi chốt kết quả.";
            default:
                return "";
        }
    }, [activeTab]);

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
                .evaluation-process-toolbar {
                    margin-bottom: 22px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 18px;
                }
                .evaluation-process-toolbar__meta {
                    min-width: 260px;
                }
                .evaluation-process-toolbar__eyebrow {
                    margin-bottom: 5px;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    color: #94a3b8;
                }
                .evaluation-process-toolbar__description {
                    margin: 0;
                    color: #475569;
                    font-size: 13px;
                    line-height: 1.45;
                }
                .evaluation-process-tabs {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 5px;
                    border: 1px solid #e5e7eb;
                    border-radius: 999px;
                    background: rgba(248, 250, 252, 0.92);
                    box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
                }
                .evaluation-process-tab {
                    border: 0;
                    border-radius: 999px;
                    padding: 10px 16px;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: transparent;
                    color: #64748b;
                    font-size: 13px;
                    font-weight: 750;
                    white-space: nowrap;
                    cursor: pointer;
                    transition: color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
                }
                .evaluation-process-tab:hover {
                    color: #0f172a;
                    background: #ffffff;
                }
                .evaluation-process-tab--active {
                    color: #e8356d;
                    background: #ffffff;
                    box-shadow: 0 8px 20px rgba(232, 53, 109, 0.14);
                }
                .evaluation-process-tab:focus-visible {
                    outline: 3px solid rgba(232, 53, 109, 0.22);
                    outline-offset: 2px;
                }
                @media (max-width: 768px) {
                    .evaluation-process-toolbar {
                        align-items: stretch;
                        flex-direction: column;
                    }
                    .evaluation-process-toolbar__meta {
                        min-width: 0;
                    }
                    .evaluation-process-tabs {
                        width: 100%;
                        overflow-x: auto;
                        justify-content: flex-start;
                    }
                }
            `}</style>
            
            <div className="evaluation-process-container">
                <div className="evaluation-process-toolbar">
                    <div className="evaluation-process-toolbar__meta">
                        <div className="evaluation-process-toolbar__eyebrow">Vai trò xử lý</div>
                        <p className="evaluation-process-toolbar__description">{activeDescription}</p>
                    </div>

                    <div className="evaluation-process-tabs" role="tablist" aria-label="Vai trò xử lý đánh giá">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                type="button"
                                role="tab"
                                aria-selected={activeTab === tab.key}
                                className={`evaluation-process-tab${activeTab === tab.key ? " evaluation-process-tab--active" : ""}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
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
