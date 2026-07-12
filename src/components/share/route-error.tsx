import { useEffect } from "react";
import { Button, Space } from "antd";
import { HomeOutlined, ReloadOutlined } from "@ant-design/icons";
import { useNavigate, useRouteError } from "react-router-dom";

const RouteErrorFallback = () => {
    const error = useRouteError() as Error | undefined;
    const navigate = useNavigate();
    const message = error?.message || "Trang đang gặp lỗi khi tải dữ liệu hoặc module giao diện.";
    const isDynamicImportError = /failed to fetch dynamically imported module|importing a module script failed/i.test(message);

    useEffect(() => {
        if (!isDynamicImportError) return;
        const reloadKey = `route-reload:${window.location.pathname}`;
        if (sessionStorage.getItem(reloadKey)) return;
        sessionStorage.setItem(reloadKey, "1");
        window.location.reload();
    }, [isDynamicImportError]);

    return (
        <div style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#fff",
            padding: 24,
            fontFamily: "'Inter', sans-serif"
        }}>
            <div style={{
                maxWidth: 560,
                width: "100%",
                border: "1px solid #ffe4ea",
                background: "#fff7f9",
                borderRadius: 16,
                padding: 28,
                boxShadow: "0 12px 32px rgba(232,99,122,0.12)"
            }}>
                <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    display: "grid",
                    placeItems: "center",
                    background: "#fff0f3",
                    color: "#e8637a",
                    fontSize: 24,
                    fontWeight: 900,
                    marginBottom: 16
                }}>
                    !
                </div>
                <h2 style={{
                    margin: "0 0 10px",
                    color: "#111827",
                    fontSize: 24,
                    lineHeight: 1.25,
                    fontWeight: 800
                }}>
                    Không tải được màn hình
                </h2>
                <p style={{
                    margin: "0 0 18px",
                    color: "#64748b",
                    fontSize: 14,
                    lineHeight: 1.7
                }}>
                    {isDynamicImportError
                        ? "Trang vừa được cập nhật. Hệ thống đang tự tải lại để đồng bộ phiên bản mới nhất."
                        : "Trang gặp sự cố khi tải. Bạn có thể thử tải lại hoặc quay về trang chủ."}
                </p>
                {import.meta.env.DEV && <div style={{
                    padding: "10px 12px",
                    background: "#fff",
                    border: "1px solid #f9c9d3",
                    borderRadius: 8,
                    color: "#9f1239",
                    fontSize: 12,
                    lineHeight: 1.5,
                    marginBottom: 18,
                    wordBreak: "break-word"
                }}>
                    {message}
                </div>}
                <Space wrap>
                    <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={() => window.location.reload()}
                        style={{ background: "#e8637a", borderColor: "#e8637a", borderRadius: 8 }}
                    >
                        Tải lại
                    </Button>
                    <Button icon={<HomeOutlined />} onClick={() => navigate("/")}>
                        Về trang chủ
                    </Button>
                </Space>
            </div>
        </div>
    );
};

export default RouteErrorFallback;
