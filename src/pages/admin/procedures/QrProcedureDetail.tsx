import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Result, Spin, Button } from "antd";
import { QrcodeOutlined } from "@ant-design/icons";
import { useAppSelector } from "@/redux/hooks";
import axios from "@/config/axios-customize";
import ViewProcedure from "./view.procedure";
import type { IProcedure, ProcedureType } from "@/types/backend";

const QrProcedureDetail = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAppSelector((state) => state.account);

    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<IProcedure | null>(null);
    const [type, setType] = useState<ProcedureType>("COMPANY");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Chờ check auth xong
        if (isLoading) return;

        // Chưa đăng nhập → redirect về login, giữ lại đường dẫn để quay lại sau
        if (!isAuthenticated) {
            const token_stored = localStorage.getItem("access_token");
            if (!token_stored) {
                // ✅ Chỉ dùng token từ useParams, bỏ hết Zalo params
                navigate(`/login?callback=/admin/procedures/qr/${token}`, { replace: true });
                return;
            }
            return;
        }

        // Đã đăng nhập → gọi API
        if (token) fetchProcedure();
    }, [isAuthenticated, isLoading, token]);

    const fetchProcedure = async () => {
        setLoading(true);
        setError(null);
        try {
            const res: any = await axios.get(`/api/v1/procedures/qr/${token}`);
            const procedure = res?.data;
            if (!procedure) throw new Error("Không tìm thấy quy trình");

            // Xác định type từ data trả về
            if (procedure.departments !== undefined) {
                setType("DEPARTMENT");
            } else if (procedure.accessList !== undefined) {
                setType("CONFIDENTIAL");
            } else {
                setType("COMPANY");
            }

            setData(procedure);
        } catch (err: any) {
            setError(err?.message ?? "Không có quyền xem quy trình này");
        } finally {
            setLoading(false);
        }
    };

    // Đang check auth
    if (isLoading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
                <Spin size="large" tip="Đang tải..." />
            </div>
        );
    }

    // Đang gọi API
    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
                <Spin size="large" tip="Đang tải quy trình..." />
            </div>
        );
    }

    // Lỗi
    if (error) {
        return (
            <Result
                status="warning"
                icon={<QrcodeOutlined style={{ color: "#faad14" }} />}
                title="Không thể xem quy trình"
                subTitle={error}
                extra={
                    <Button type="primary" onClick={() => navigate("/admin")}>
                        Về trang chủ
                    </Button>
                }
            />
        );
    }

    // Không có data
    if (!data) return null;

    // Có data → mở ViewProcedure luôn
    return (
        <ViewProcedure
            type={type}
            open={true}
            onClose={() => navigate("/admin")}
            dataInit={data}
        />
    );
};

export default QrProcedureDetail;