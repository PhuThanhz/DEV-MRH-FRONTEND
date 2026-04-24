import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import type { IResPublicProcedureDTO } from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

import {
    Button, Card, Col, Divider, Progress, Row, Skeleton,
    Space, Tag, Typography, Input, theme, Flex,
} from "antd";
import {
    BankOutlined, CalendarOutlined, ClockCircleOutlined,
    DownloadOutlined, EyeOutlined, FilePdfOutlined, FileWordOutlined,
    FileExcelOutlined, FileImageOutlined, FileOutlined, LockOutlined,
    PaperClipOutlined, TeamOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { useToken } = theme;

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    NEED_CREATE: { label: "Cần xây dựng mới", color: "warning" },
    IN_PROGRESS: { label: "Đang hiệu lực", color: "success" },
    NEED_UPDATE: { label: "Đang cập nhật", color: "processing" },
    TERMINATED: { label: "Hết hiệu lực", color: "error" },
};

const EXT_ICON: Record<string, React.ReactNode> = {
    PDF: <FilePdfOutlined style={{ color: "#ef4444" }} />,
    DOCX: <FileWordOutlined style={{ color: "#3b82f6" }} />,
    DOC: <FileWordOutlined style={{ color: "#3b82f6" }} />,
    XLSX: <FileExcelOutlined style={{ color: "#10b981" }} />,
    XLS: <FileExcelOutlined style={{ color: "#10b981" }} />,
    PNG: <FileImageOutlined style={{ color: "#8b5cf6" }} />,
    JPG: <FileImageOutlined style={{ color: "#8b5cf6" }} />,
    JPEG: <FileImageOutlined style={{ color: "#8b5cf6" }} />,
};

const BASE_URL = import.meta.env.VITE_BACKEND_URL as string;

function getFileIcon(ext: string) {
    return EXT_ICON[ext.toUpperCase()] ?? <FileOutlined style={{ color: "#6b7280" }} />;
}

function getProgressColor(pct: number) {
    if (pct >= 90) return "#ef4444";
    if (pct >= 60) return "#f59e0b";
    return "#10b981";
}

const SectionLabel = ({ icon, text }: { icon?: React.ReactNode; text: string }) => (
    <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {icon && <span style={{ marginRight: 5 }}>{icon}</span>}
        {text}
    </Text>
);

const PublicProcedureView = () => {
    const { token: routeToken } = useParams<{ token: string }>();
    const { token: designToken } = useToken();

    const [loading, setLoading] = useState(true);
    const [requirePin, setRequirePin] = useState(false);
    const [pin, setPin] = useState(["", "", "", "", "", ""]);
    const [pinLoading, setPinLoading] = useState(false);
    const [data, setData] = useState<IResPublicProcedureDTO | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { if (routeToken) fetchView(); }, [routeToken]);

    const fetchView = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${BASE_URL}/api/public/view/${routeToken}`);
            const json = await res.json();
            if (!res.ok) { setError(json?.message ?? "Không thể xem quy trình"); return; }
            if (json?.data?.requirePin) { setRequirePin(true); return; }
            setData(json?.data);
        } catch { setError("Không thể kết nối đến máy chủ"); }
        finally { setLoading(false); }
    };

    const handlePinInput = (idx: number, val: string) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...pin]; next[idx] = val; setPin(next);
        if (val && idx < 5) document.getElementById(`pin-${idx + 1}`)?.focus();
    };

    const handlePinKey = (idx: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !pin[idx] && idx > 0)
            document.getElementById(`pin-${idx - 1}`)?.focus();
    };

    const handleVerifyPin = async () => {
        const code = pin.join("");
        if (code.length !== 6) { notify.warning("Vui lòng nhập đủ 6 số"); return; }
        setPinLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/api/public/view/${routeToken}/verify-pin`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin: code }),
            });
            const json = await res.json();
            if (!res.ok) { notify.error(json?.message ?? "Mã PIN không đúng"); return; }
            setData(json?.data); setRequirePin(false);
        } catch { notify.error("Không thể kết nối đến máy chủ"); }
        finally { setPinLoading(false); }
    };

    const pageStyle: React.CSSProperties = {
        minHeight: "100vh",
        background: designToken.colorBgLayout,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 16px 64px",
    };

    const centeredPageStyle: React.CSSProperties = {
        minHeight: "100vh",
        background: designToken.colorBgLayout,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
    };

    const containerStyle: React.CSSProperties = {
        width: "100%",
        maxWidth: 600,
    };

    if (loading) return (
        <div style={centeredPageStyle}>
            <div style={containerStyle}>
                <Card style={{ borderRadius: 16 }}>
                    <Skeleton active avatar paragraph={{ rows: 4 }} />
                </Card>
            </div>
        </div>
    );

    if (error) return (
        <div style={centeredPageStyle}>
            <div style={{ ...containerStyle, maxWidth: 420 }}>
                <Card style={{ borderRadius: 20, boxShadow: "0 4px 32px rgba(0,0,0,0.08)", textAlign: "center" }}
                    styles={{ body: { padding: "40px 32px" } }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: "50%",
                        background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center",
                        margin: "0 auto 16px",
                    }}>
                        <LockOutlined style={{ fontSize: 24, color: designToken.colorError }} />
                    </div>
                    <Title level={4} style={{ margin: "0 0 8px" }}>Không thể truy cập</Title>
                    <Text type="secondary" style={{ fontSize: 14 }}>{error}</Text>
                    <Divider style={{ margin: "20px 0 12px" }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Liên hệ người chia sẻ để được hỗ trợ.
                    </Text>
                </Card>
            </div>
        </div>
    );

    if (requirePin) return (
        <div style={centeredPageStyle}>
            <div style={{ ...containerStyle, maxWidth: 380 }}>
                <Card
                    style={{ borderRadius: 20, boxShadow: "0 4px 32px rgba(0,0,0,0.08)" }}
                    styles={{ body: { padding: 40 } }}
                >
                    <Flex vertical align="center" gap={8} style={{ marginBottom: 32 }}>
                        <img src="/logo/LOGOFINAL.png" alt="LOTUS HRM" style={{ width: 52, height: 52, objectFit: "contain" }} />
                        <Title level={4} style={{ margin: 0 }}>Nhập mã PIN</Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Tài liệu được bảo vệ bằng mã PIN 6 số
                        </Text>
                    </Flex>

                    <Flex justify="center" gap={8} style={{ marginBottom: 28 }}>
                        {pin.map((v, i) => (
                            <Input
                                key={i}
                                id={`pin-${i}`}
                                value={v}
                                maxLength={1}
                                onChange={e => handlePinInput(i, e.target.value)}
                                onKeyDown={e => handlePinKey(i, e)}
                                style={{
                                    width: 48, height: 52,
                                    textAlign: "center",
                                    fontSize: 20, fontWeight: 700,
                                    borderRadius: 12,
                                }}
                            />
                        ))}
                    </Flex>

                    <Button
                        type="primary"
                        block
                        size="large"
                        loading={pinLoading}
                        onClick={handleVerifyPin}
                        style={{ borderRadius: 12, height: 46 }}
                    >
                        Xác nhận
                    </Button>

                    <Divider plain style={{ marginTop: 24, marginBottom: 0 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>Liên hệ người chia sẻ nếu quên mã</Text>
                    </Divider>
                </Card>
            </div>
        </div>
    );

    if (!data) return null;

    const status = STATUS_MAP[data.status ?? ""] ?? { label: data.status ?? "--", color: "default" };
    const pct = data.maxAccessCount ? Math.round((data.accessCount ?? 0) / data.maxAccessCount * 100) : null;

    return (
        <div style={pageStyle}>
            <div style={containerStyle}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 20 }}>
                    <Flex align="center" gap={10}>
                        <img src="/logo/LOGOFINAL.png" alt="LOTUS HRM" style={{ width: 32, height: 32, objectFit: "contain" }} />
                        <Text strong style={{ fontSize: 12, letterSpacing: "0.1em", color: designToken.colorTextSecondary, textTransform: "uppercase" }}>
                            Lotus HRM
                        </Text>
                    </Flex>
                    <Tag color="default" style={{ borderRadius: 20, fontSize: 11, padding: "2px 10px" }}>
                        Tài liệu nội bộ
                    </Tag>
                </Flex>

                <Card style={{ borderRadius: 16, marginBottom: 16, overflow: "hidden" }} styles={{ body: { padding: 0 } }}>
                    <div style={{ height: 4, background: "linear-gradient(90deg, #f43f5e, #ec4899)" }} />
                    <div style={{ padding: "20px 24px 24px" }}>
                        <Space size={6} wrap style={{ marginBottom: 12 }}>
                            <Tag color="default" style={{ fontWeight: 600, borderRadius: 6, fontSize: 12 }}>{data.procedureCode}</Tag>
                            <Tag color={status.color} style={{ fontWeight: 600, borderRadius: 6, fontSize: 12 }}>{status.label}</Tag>
                            {data.version && (
                                <Tag style={{ fontWeight: 600, borderRadius: 6, fontSize: 12, color: designToken.colorTextSecondary }}>
                                    v{data.version}
                                </Tag>
                            )}
                        </Space>
                        <Title level={4} style={{ margin: 0, lineHeight: 1.4 }}>{data.procedureName}</Title>
                    </div>
                </Card>

                <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                    {data.departmentName && (
                        <Col span={12}>
                            <Card style={{ borderRadius: 12, height: "100%" }} styles={{ body: { padding: "14px 16px" } }}>
                                <SectionLabel icon={<BankOutlined />} text="Phòng ban" />
                                <div style={{ marginTop: 6 }}><Text strong style={{ fontSize: 14 }}>{data.departmentName}</Text></div>
                            </Card>
                        </Col>
                    )}
                    {data.sectionName && (
                        <Col span={12}>
                            <Card style={{ borderRadius: 12, height: "100%" }} styles={{ body: { padding: "14px 16px" } }}>
                                <SectionLabel icon={<TeamOutlined />} text="Bộ phận" />
                                <div style={{ marginTop: 6 }}><Text strong style={{ fontSize: 14 }}>{data.sectionName}</Text></div>
                            </Card>
                        </Col>
                    )}
                    {data.issuedDate && (
                        <Col span={12}>
                            <Card style={{ borderRadius: 12, height: "100%" }} styles={{ body: { padding: "14px 16px" } }}>
                                <SectionLabel icon={<CalendarOutlined />} text="Ngày ban hành" />
                                <div style={{ marginTop: 6 }}><Text strong style={{ fontSize: 14 }}>{dayjs(data.issuedDate).format("DD/MM/YYYY")}</Text></div>
                            </Card>
                        </Col>
                    )}
                    {data.expiresAt && (
                        <Col span={12}>
                            <Card style={{ borderRadius: 12, height: "100%", background: "#fffbeb", borderColor: "#fde68a" }} styles={{ body: { padding: "14px 16px" } }}>
                                <SectionLabel icon={<ClockCircleOutlined />} text="Link hết hạn" />
                                <div style={{ marginTop: 6 }}>
                                    <Text strong style={{ fontSize: 14, color: "#b45309" }}>{dayjs(data.expiresAt).format("DD/MM/YYYY HH:mm")}</Text>
                                </div>
                            </Card>
                        </Col>
                    )}
                </Row>

                {data.note && (
                    <Card style={{ borderRadius: 12, marginBottom: 16 }} styles={{ body: { padding: "16px 20px" } }}>
                        <SectionLabel text="Ghi chú" />
                        <Paragraph style={{ marginTop: 8, marginBottom: 0, fontSize: 14, color: designToken.colorTextSecondary }}>
                            {data.note}
                        </Paragraph>
                    </Card>
                )}

                {data.fileUrls && data.fileUrls.length > 0 && (
                    <Card style={{ borderRadius: 12, marginBottom: 16 }} styles={{ body: { padding: "16px 20px" } }}>
                        <SectionLabel icon={<PaperClipOutlined />} text={`Tài liệu đính kèm (${data.fileUrls.length})`} />
                        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                            {data.fileUrls.map((url, idx) => {
                                const name = decodeURIComponent(url.split("/").pop() ?? `Tài liệu ${idx + 1}`);
                                const ext = name.split(".").pop()?.toUpperCase() ?? "FILE";
                                return (
                                    <div key={idx} style={{
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        background: designToken.colorFillAlter, border: `1px solid ${designToken.colorBorderSecondary}`,
                                        borderRadius: 10, padding: "10px 14px", gap: 8,
                                    }}>
                                        <Flex align="center" gap={10} style={{ minWidth: 0, flex: 1 }}>
                                            <span style={{ fontSize: 20, flexShrink: 0 }}>{getFileIcon(ext)}</span>
                                            <Text style={{ fontSize: 13, fontWeight: 500, flex: 1 }} ellipsis={{ tooltip: name }}>{name}</Text>
                                        </Flex>
                                        <Space size={6} style={{ flexShrink: 0 }}>
                                            <Button size="small" icon={<EyeOutlined />} href={url} target="_blank" rel="noreferrer" style={{ borderRadius: 8 }}>Xem</Button>
                                            {data.allowDownload && (
                                                <Button size="small" type="primary" danger icon={<DownloadOutlined />} href={url} download style={{ borderRadius: 8 }}>Tải</Button>
                                            )}
                                        </Space>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {data.maxAccessCount != null && (
                    <Card style={{ borderRadius: 12, marginBottom: 16 }} styles={{ body: { padding: "16px 20px" } }}>
                        <Flex justify="space-between" align="center" style={{ marginBottom: 10 }}>
                            <SectionLabel text="Lượt truy cập" />
                            <Text strong style={{ fontSize: 13 }}>
                                {data.accessCount}
                                <Text type="secondary" style={{ fontSize: 13, margin: "0 4px" }}>/</Text>
                                {data.maxAccessCount}
                            </Text>
                        </Flex>
                        <Progress
                            percent={pct ?? 0}
                            showInfo={false}
                            strokeColor={getProgressColor(pct ?? 0)}
                            trailColor={designToken.colorFillSecondary}
                            strokeLinecap="round"
                            size={["100%", 6] as any}
                        />
                    </Card>
                )}

                <div style={{ textAlign: "center", paddingTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11, letterSpacing: "0.04em" }}>
                        Tài liệu nội bộ · Không sao chép hoặc phân phối trái phép
                    </Text>
                </div>
            </div>
        </div>
    );
};

export default PublicProcedureView;