import { Tabs } from "antd";
import { UserOutlined, TeamOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import PageContainer from "@/components/common/data-table/PageContainer";
import MyEvaluationPage from "../my-records/MyEvaluationPage";
import PendingManagerEvaluationPage from "../manager/PendingManagerEvaluationPage";
import PendingApprovalPage from "../approval/PendingApprovalPage";
import { useAppSelector } from "@/redux/hooks";
import { ALL_PERMISSIONS } from "@/config/permissions";

const EvaluationProcessPage = () => {
    const permissions = useAppSelector((state) => state.account.user.role.permissions);

    const checkPermission = (perm: { method: string, apiPath: string, module: string }) =>
        permissions?.some((p: any) => 
            p.apiPath === perm.apiPath && 
            p.method === perm.method && 
            p.module === perm.module
        );

    const hasManagerPerm = checkPermission(ALL_PERMISSIONS.EVALUATION.GET_PENDING_MANAGER_RECORDS);
    const hasApproverPerm = checkPermission(ALL_PERMISSIONS.EVALUATION.GET_PENDING_APPROVAL_RECORDS);

    const items = [
        {
            key: "my-eval",
            label: (
                <span style={{ fontWeight: 600 }}>
                    <UserOutlined /> Tự đánh giá
                </span>
            ),
            children: <MyEvaluationPage isTab={true} />,
        },
    ];

    if (hasManagerPerm) {
        items.push({
            key: "manager-eval",
            label: (
                <span style={{ fontWeight: 600 }}>
                    <TeamOutlined /> Quản lý đánh giá
                </span>
            ),
            children: <PendingManagerEvaluationPage isTab={true} />,
        });
    }

    if (hasApproverPerm) {
        items.push({
            key: "approver-eval",
            label: (
                <span style={{ fontWeight: 600 }}>
                    <SafetyCertificateOutlined /> Phê duyệt đánh giá
                </span>
            ),
            children: <PendingApprovalPage isTab={true} />,
        });
    }

    return (
        <div className="evaluation-process-container">
            <style>{`
                .evaluation-process-container .ant-tabs-nav {
                    margin-bottom: 0px !important;
                    background: #fff;
                    padding: 16px 24px 0 24px;
                    border-radius: 12px 12px 0 0;
                    border: 1px solid #e2e8f0;
                    border-bottom: none;
                }
                .evaluation-process-container .ant-tabs-content-holder {
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    border-top: none;
                    border-radius: 0 0 12px 12px;
                }
                /* Hide the individual PageContainer padding if it's inside a tab */
                .evaluation-process-container .page-container {
                    padding: 16px !important;
                    border: none !important;
                    box-shadow: none !important;
                }
                .evaluation-process-container .page-title {
                    display: none !important;
                }
            `}</style>
            
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#1e293b' }}>
                    Quy trình đánh giá
                </h2>
                <div style={{ marginLeft: 16, background: '#f1f5f9', padding: '4px 12px', borderRadius: 99, fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                    Quản lý toàn bộ luồng thực hiện
                </div>
            </div>

            <Tabs 
                defaultActiveKey="my-eval" 
                items={items} 
                size="large"
                tabBarStyle={{ margin: 0 }}
            />
        </div>
    );
};

export default EvaluationProcessPage;
