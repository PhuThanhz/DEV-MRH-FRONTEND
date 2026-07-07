import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Result, Spin, Button, Card, Space, Tag, Descriptions } from "antd";
import { QrcodeOutlined, HomeOutlined, FileTextOutlined } from "@ant-design/icons";
import { useAppSelector } from "@/redux/hooks";
import { callFetchDossierByQrToken } from "@/config/api";
import DossierDocumentList from "./components/DossierDocumentList";
import type { IAccountingDossier } from "@/types/backend";
import dayjs from "dayjs";

const DOSSIER_STATUS_LABEL: Record<string, { color: string; label: string }> = {
    DRAFT: { color: "default", label: "Nháp" },
    SUBMITTED: { color: "blue", label: "Chờ duyệt" },
    IN_REVIEW: { color: "processing", label: "Đang duyệt" },
    RETURN_REQUESTED: { color: "warning", label: "Yêu cầu hoàn trả" },
    RETURNED: { color: "orange", label: "Đã hoàn trả" },
    APPROVED: { color: "success", label: "Đã duyệt" },
    REJECTED: { color: "error", label: "Đã từ chối" },
    TERMINATED: { color: "error", label: "Đã chấm dứt" },
    ARCHIVED: { color: "purple", label: "Đã lưu trữ" },
};

const DossierQrDetail = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAppSelector((state) => state.account);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<IAccountingDossier | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated) {
            const token_stored = localStorage.getItem("access_token");
            if (!token_stored) {
                navigate(`/login?callback=/admin/accounting-dossiers/qr/${token}`, { replace: true });
                return;
            }
            return;
        }

        if (token) fetchDossier();
    }, [isAuthenticated, isLoading, token]);

    const fetchDossier = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await callFetchDossierByQrToken(token!);
            if (res.data) {
                setData(res.data);
            } else {
                throw new Error("Không tìm thấy bộ chứng từ");
            }
        } catch (err: any) {
            setError(err?.message || "Không có quyền truy cập bộ chứng từ này");
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
                <Spin size="large" tip="Đang kiểm tra quyền truy cập..." />
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
                <Spin size="large" tip="Đang tải chi tiết bộ chứng từ..." />
            </div>
        );
    }

    if (error) {
        return (
            <Result
                status="warning"
                icon={<QrcodeOutlined style={{ color: "#faad14" }} />}
                title="Không thể truy cập tài liệu"
                subTitle={error}
                extra={[
                    <Button type="primary" key="home" onClick={() => navigate("/admin")}>
                        Về trang chủ
                    </Button>,
                    <Button key="retry" onClick={fetchDossier}>
                        Thử lại
                    </Button>
                ]}
            />
        );
    }

    if (!data) return null;

    const statusObj = DOSSIER_STATUS_LABEL[data.status] || { color: "default", label: data.status };

    return (
        <div style={{ padding: "24px 16px", maxWidth: 1000, margin: "0 auto" }}>
            <Card
                title={
                    <Space>
                        <FileTextOutlined style={{ color: "#be185d" }} />
                        <span>Tra cứu Bộ chứng từ qua QR</span>
                    </Space>
                }
                extra={
                    <Button icon={<HomeOutlined />} onClick={() => navigate("/admin")}>
                        Về trang chủ
                    </Button>
                }
                style={{
                    borderRadius: 16,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                    border: "1px solid #e5e7eb",
                }}
            >
                <Descriptions title="Thông tin bộ hồ sơ" bordered column={{ xs: 1, sm: 2 }} style={{ marginBottom: 24 }}>
                    <Descriptions.Item label="Mã bộ chứng từ">
                        <Tag color="magenta" style={{ fontSize: 13, padding: "4px 8px", borderRadius: 6, fontWeight: 600 }}>
                            {data.dossierCode || `BCT-${data.id}`}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        <Tag color={statusObj.color} style={{ fontSize: 12, padding: "2px 8px", borderRadius: 4 }}>
                            {statusObj.label}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Công ty">
                        {data.company?.name || "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phòng ban">
                        {data.department?.name || "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Nội dung" span={2}>
                        {data.content}
                    </Descriptions.Item>
                    <Descriptions.Item label="Người lập">
                        {data.createdBy || "--"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">
                        {data.createdAt ? dayjs(data.createdAt).format("DD/MM/YYYY HH:mm") : "--"}
                    </Descriptions.Item>
                </Descriptions>

                <div style={{ marginTop: 24 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 12 }}>
                        Danh sách chứng từ đính kèm
                    </div>
                    <DossierDocumentList dossier={data} editable={false} reviewable={false} />
                </div>
            </Card>
        </div>
    );
};

export default DossierQrDetail;
