import { useState } from "react";
import {
    Modal, Form, Input, InputNumber,
    DatePicker, Button, Table, Tag, Popconfirm,
    Image, Typography, Tooltip, Flex, Divider, Badge, message, Switch,
} from "antd";
import {
    ShareAltOutlined, StopOutlined, QrcodeOutlined,
    EyeOutlined, CalendarOutlined, SafetyOutlined,
    PlusOutlined, DownloadOutlined, GlobalOutlined,
    CaretDownOutlined, CaretRightOutlined,
    MailOutlined, SendOutlined,
    MobileOutlined, LaptopOutlined, TabletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { IProcedure, ProcedureType, IResShareTokenDTO } from "@/types/backend";
import {
    useShareTokensQuery,
    useCreateShareTokenMutation,
    useRevokeShareTokenMutation,
    useShareTokenAccessLogsQuery,
    useSendShareEmailMutation,
} from "@/hooks/useProcedure";

const { Text } = Typography;

// =====================================================
// PARSE USER AGENT — cải thiện độ chính xác
// Thứ tự quan trọng: kiểm tra token đặc thù trước
// =====================================================
type DeviceType = "mobile" | "tablet" | "desktop";

interface ParsedUA {
    browser: string;
    os: string;
    deviceType: DeviceType;
}

function parseUserAgentDetail(ua: string): ParsedUA {
    if (!ua) return { browser: "Không rõ", os: "Không rõ", deviceType: "desktop" };

    // ── OS detection (thứ tự quan trọng) ──
    let os = "Không rõ";
    let deviceType: DeviceType = "desktop";

    if (/iPad/.test(ua)) {
        os = "iPadOS";
        deviceType = "tablet";
    } else if (/iPhone/.test(ua)) {
        os = "iOS";
        deviceType = "mobile";
    } else if (/Android/.test(ua)) {
        // Android tablet thường không có "Mobile" trong UA
        deviceType = /Mobile/.test(ua) ? "mobile" : "tablet";
        const m = ua.match(/Android\s([\d.]+)/);
        os = `Android ${m?.[1] ?? ""}`.trim();
    } else if (/Windows NT/.test(ua)) {
        const versions: Record<string, string> = {
            "10.0": "10/11", "6.3": "8.1", "6.2": "8",
            "6.1": "7", "6.0": "Vista", "5.1": "XP",
        };
        const m = ua.match(/Windows NT ([\d.]+)/);
        const ver = versions[m?.[1] ?? ""] ?? "";
        os = ver ? `Windows ${ver}` : "Windows";
        deviceType = "desktop";
    } else if (/Mac OS X/.test(ua)) {
        // macOS vs iOS — nếu không có iPhone/iPad thì là Mac
        const m = ua.match(/Mac OS X ([\d_]+)/);
        const ver = m?.[1]?.replace(/_/g, ".") ?? "";
        os = ver ? `macOS ${ver}` : "macOS";
        deviceType = "desktop";
    } else if (/CrOS/.test(ua)) {
        os = "ChromeOS";
        deviceType = "desktop";
    } else if (/Linux/.test(ua)) {
        os = "Linux";
        deviceType = "desktop";
    }

    // ── Browser detection (thứ tự quan trọng) ──
    let browser = "Trình duyệt khác";

    if (/EdgA?\//.test(ua)) {
        // Edge Android / Edge desktop
        const m = ua.match(/Edg(?:A)?\/\s*([\d.]+)/);
        browser = `Edge ${m?.[1]?.split(".")[0] ?? ""}`;
    } else if (/OPR\//.test(ua) || /Opera\//.test(ua)) {
        const m = ua.match(/OPR\/([\d.]+)/);
        browser = `Opera ${m?.[1]?.split(".")[0] ?? ""}`;
    } else if (/FxiOS\//.test(ua)) {
        // Firefox on iOS
        const m = ua.match(/FxiOS\/([\d.]+)/);
        browser = `Firefox ${m?.[1]?.split(".")[0] ?? ""} (iOS)`;
    } else if (/Firefox\//.test(ua)) {
        const m = ua.match(/Firefox\/([\d.]+)/);
        browser = `Firefox ${m?.[1]?.split(".")[0] ?? ""}`;
    } else if (/CriOS\//.test(ua)) {
        // Chrome on iOS
        const m = ua.match(/CriOS\/([\d.]+)/);
        browser = `Chrome ${m?.[1]?.split(".")[0] ?? ""} (iOS)`;
    } else if (/SamsungBrowser\//.test(ua)) {
        const m = ua.match(/SamsungBrowser\/([\d.]+)/);
        browser = `Samsung Browser ${m?.[1]?.split(".")[0] ?? ""}`;
    } else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) {
        const m = ua.match(/Chrome\/([\d.]+)/);
        browser = `Chrome ${m?.[1]?.split(".")[0] ?? ""}`;
    } else if (/Chromium\//.test(ua)) {
        const m = ua.match(/Chromium\/([\d.]+)/);
        browser = `Chromium ${m?.[1]?.split(".")[0] ?? ""}`;
    } else if (/Version\/[\d.]+ .*Safari/.test(ua)) {
        // Safari — phải check sau Chrome vì Safari UA cũng chứa "Safari"
        const m = ua.match(/Version\/([\d.]+)/);
        browser = `Safari ${m?.[1]?.split(".")[0] ?? ""}`;
    }

    return { browser, os, deviceType };
}

function parseUserAgent(ua: string): string {
    if (!ua) return "Không rõ";
    const { browser, os } = parseUserAgentDetail(ua);
    return os && os !== "Không rõ" ? `${browser} · ${os}` : browser;
}

function getDeviceIcon(ua: string) {
    if (!ua) return <LaptopOutlined style={{ color: "#6b7280", fontSize: 12 }} />;
    const { deviceType } = parseUserAgentDetail(ua);
    if (deviceType === "mobile")
        return <MobileOutlined style={{ color: "#6b7280", fontSize: 12 }} />;
    if (deviceType === "tablet")
        return <TabletOutlined style={{ color: "#6b7280", fontSize: 12 }} />;
    return <LaptopOutlined style={{ color: "#6b7280", fontSize: 12 }} />;
}

function parseIp(ip: string): string {
    if (!ip) return "—";
    if (ip === "0:0:0:0:0:0:0:1" || ip === "::1" || ip === "127.0.0.1") return "localhost";
    // Rút gọn IPv6 nếu quá dài
    if (ip.includes(":") && ip.length > 20) return ip.slice(0, 20) + "…";
    return ip;
}

const ExpandedRow = ({ token, procedureCode }: {
    token: IResShareTokenDTO;
    procedureCode?: string;
}) => {
    const { data: logs = [], isLoading } = useShareTokenAccessLogsQuery(token.id, true);

    const logColumns = [
        {
            title: "Thời điểm",
            dataIndex: "accessedAt",
            width: 155,
            render: (v: string) => (
                <Text style={{ fontSize: 12 }}>
                    {v ? dayjs(v).format("DD/MM/YYYY HH:mm:ss") : "—"}
                </Text>
            ),
        },
        {
            title: "Địa chỉ IP",
            dataIndex: "ipAddress",
            width: 150,
            render: (v: string) => (
                <Flex align="center" gap={5}>
                    <GlobalOutlined style={{ color: "#6b7280", fontSize: 12 }} />
                    <Text style={{ fontSize: 12, fontFamily: "monospace" }}>
                        {parseIp(v)}
                    </Text>
                </Flex>
            ),
        },
        {
            title: "Thiết bị / Trình duyệt",
            dataIndex: "userAgent",
            render: (v: string) => {
                if (!v) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
                const { browser, os, deviceType } = parseUserAgentDetail(v);
                const deviceLabel = deviceType === "mobile"
                    ? "Di động" : deviceType === "tablet" ? "Máy tính bảng" : "Máy tính";
                return (
                    <Tooltip title={v} placement="topLeft">
                        <Flex align="center" gap={5}>
                            {getDeviceIcon(v)}
                            <Flex vertical gap={0}>
                                <Text style={{ fontSize: 12, lineHeight: "16px" }}>
                                    {browser}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 11, lineHeight: "14px" }}>
                                    {os} · {deviceLabel}
                                </Text>
                            </Flex>
                        </Flex>
                    </Tooltip>
                );
            },
        },
    ];

    return (
        <Flex gap={20} style={{
            padding: "12px 8px 12px 12px",
            background: "#f8fafc",
            borderRadius: 8,
            margin: "4px 0",
        }}>
            {token.qrCode && (
                <div style={{ flexShrink: 0 }}>
                    <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>
                        Mã QR
                    </Text>
                    <div style={{
                        padding: 8,
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        display: "inline-block",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                    }}>
                        <Image
                            src={`data:image/png;base64,${token.qrCode}`}
                            width={120}
                            height={120}
                            preview={{ mask: <EyeOutlined /> }}
                            style={{ borderRadius: 4, display: "block" }}
                        />
                    </div>
                    <div style={{ marginTop: 8 }}>
                        <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            style={{ borderColor: "#fcc", color: "#e8256b" }}
                            onClick={() => {
                                const a = document.createElement("a");
                                a.href = `data:image/png;base64,${token.qrCode}`;
                                a.download = `qr-${procedureCode}-${token.id}.png`;
                                a.click();
                            }}
                        >
                            Tải QR
                        </Button>
                    </div>
                </div>
            )}

            <div style={{ width: 1, background: "#e2e8f0", flexShrink: 0, margin: "0 4px" }} />

            <div style={{ flex: 1, minWidth: 0 }}>
                <Flex align="center" gap={8} style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        Lịch sử truy cập
                    </Text>
                    {logs.length > 0 && (
                        <Badge
                            count={logs.length}
                            size="small"
                            style={{ backgroundColor: "#e8256b" }}
                        />
                    )}
                </Flex>
                <Table
                    rowKey={(r: any) => r.id ?? r.accessedAt}
                    size="small"
                    loading={isLoading}
                    columns={logColumns}
                    dataSource={logs}
                    pagination={logs.length > 5 ? { pageSize: 5, size: "small" } : false}
                    locale={{ emptyText: "Chưa có lượt truy cập nào" }}
                    style={{ background: "#fff", borderRadius: 6 }}
                />
            </div>
        </Flex>
    );
};

interface IProps {
    open: boolean;
    onClose: () => void;
    procedure: IProcedure | null;
    procedureType: ProcedureType;
}

const ModalShareToken = ({ open, onClose, procedure, procedureType }: IProps) => {
    const [form] = Form.useForm();
    const [newTokenQr, setNewTokenQr] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [expandedKey, setExpandedKey] = useState<number | null>(null);
    const [autoPin, setAutoPin] = useState(true);

    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [selectedToken, setSelectedToken] = useState<IResShareTokenDTO | null>(null);
    const [emailInput, setEmailInput] = useState("");

    const procedureId = procedure?.id;

    const { data: tokens = [], isLoading } = useShareTokensQuery(
        procedureId,
        procedureType,
        open
    );

    const createMutation = useCreateShareTokenMutation();
    const revokeMutation = useRevokeShareTokenMutation(procedureId);
    const sendEmailMutation = useSendShareEmailMutation();

    const activeTokenCount = tokens.filter((t) => !t.isRevoked).length;

    const handleCreate = async () => {
        if (createMutation.isPending) return;
        const values = await form.validateFields();
        const res = await createMutation.mutateAsync({
            procedureId: procedureId!,
            data: {
                procedureType,
                autoGeneratePin: autoPin,
                pin: autoPin ? undefined : (values.pin || undefined),
                // ❌ bỏ permission
                expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined,
                maxAccessCount: values.maxAccessCount || undefined,
            },
        });
        if (res?.qrCode) setNewTokenQr(res.qrCode);
        form.resetFields();
        setAutoPin(true);  // ← SỬA ĐÂY
        setShowForm(false);
    };

    const handleClose = () => {
        setNewTokenQr(null);
        setShowForm(false);
        setExpandedKey(null);
        setEmailModalOpen(false);
        setSelectedToken(null);
        setEmailInput("");
        setAutoPin(false);
        form.resetFields();
        onClose();
    };

    const toggleExpand = (id: number) => {
        setExpandedKey(prev => prev === id ? null : id);
    };

    const handleSendSystemEmail = async (tokenId: number) => {
        const trimmed = emailInput.trim();
        if (!trimmed) {
            message.warning("Vui lòng nhập email người nhận");
            return;
        }
        await sendEmailMutation.mutateAsync({ tokenId, email: trimmed });
        setEmailModalOpen(false);
        setSelectedToken(null);
        setEmailInput("");
    };

    const handleSendPersonalEmail = (r: IResShareTokenDTO) => {
        const shareUrl = `${window.location.origin}/public/view/${r.token}`;
        const pin = r.pin ? `Mã PIN: ${r.pin}\n` : "";
        const expires = r.expiresAt
            ? `Hết hạn: ${dayjs(r.expiresAt).format("DD/MM/YYYY")}`
            : "Hết hạn: Vô thời hạn";

        const subject = encodeURIComponent(
            `[Lotus HRM] Chia sẻ quy trình — ${procedure?.procedureCode}`
        );
        const body = encodeURIComponent(
            `Xin chào,\n\nBạn được chia sẻ quyền xem quy trình trên hệ thống Lotus HRM.\n\n━━━━━━━━━━━━━━━━━━━━\n${pin}${expires}\n━━━━━━━━━━━━━━━━━━━━\n\nLink truy cập: ${shareUrl}\n\nLưu ý: Link và mã PIN chỉ dành riêng cho bạn, vui lòng không chia sẻ cho người khác.\n\nTrân trọng,\nLotus HRM`
        );
        window.open(
            `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`,
            "_blank"
        );
    };

    const columns = [
        {
            title: "",
            width: 36,
            render: (_: any, r: IResShareTokenDTO) => (
                <Button
                    type="text"
                    size="small"
                    icon={expandedKey === r.id
                        ? <CaretDownOutlined style={{ color: "#e8256b" }} />
                        : <CaretRightOutlined style={{ color: "#9ca3af" }} />
                    }
                    onClick={() => toggleExpand(r.id)}
                />
            ),
        },
        {
            title: "Hết hạn",
            width: 110,
            render: (_: any, r: IResShareTokenDTO) => (
                <Text style={{ fontSize: 12 }}>
                    {r.expiresAt
                        ? dayjs(r.expiresAt).format("DD/MM/YYYY")
                        : <Text type="secondary" style={{ fontSize: 12 }}>Vô thời hạn</Text>
                    }
                </Text>
            ),
        },
        {
            title: "Lượt xem",
            width: 85,
            align: "center" as const,
            render: (_: any, r: IResShareTokenDTO) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {r.accessCount}{r.maxAccessCount ? `/${r.maxAccessCount}` : ""}
                </Text>
            ),
        },
        {
            title: "PIN",
            width: 105,
            align: "center" as const,
            render: (_: any, r: IResShareTokenDTO) => {
                if (!r.pin) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
                return (
                    <Text
                        copyable={{ text: r.pin, tooltips: ["Sao chép", "Đã sao chép!"] }}
                        style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: "#d97706" }}
                    >
                        {r.pin}
                    </Text>
                );
            },
        },
        {
            title: "Trạng thái",
            width: 105,
            align: "center" as const,
            render: (_: any, r: IResShareTokenDTO) => (
                r.isRevoked
                    ? <Tag color="red" style={{ margin: 0 }}>Đã thu hồi</Tag>
                    : <Tag color="green" style={{ margin: 0 }}>Hoạt động</Tag>
            ),
        },
        {
            title: "Gửi email",
            width: 180,
            align: "center" as const,
            render: (_: any, r: IResShareTokenDTO) => {
                if (r.isRevoked) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
                return (
                    <Flex gap={6} justify="center">
                        <Tooltip title="Hệ thống tự gửi mail kèm PIN + QR">
                            <Button
                                size="small"
                                icon={<SendOutlined />}
                                onClick={() => {
                                    setSelectedToken(r);
                                    setEmailInput("");
                                    setEmailModalOpen(true);
                                }}
                                style={{ fontSize: 12 }}
                            >
                                Hệ thống
                            </Button>
                        </Tooltip>
                        <Tooltip title="Mở Gmail với nội dung điền sẵn">
                            <Button
                                size="small"
                                icon={<MailOutlined />}
                                onClick={() => handleSendPersonalEmail(r)}
                                style={{ fontSize: 12 }}
                            >
                                Gmail
                            </Button>
                        </Tooltip>
                    </Flex>
                );
            },
        },
        {
            title: "",
            width: 95,
            align: "center" as const,
            render: (_: any, r: IResShareTokenDTO) =>
                !r.isRevoked ? (
                    <Popconfirm
                        title="Thu hồi link này?"
                        description="Link sẽ không thể dùng được nữa."
                        onConfirm={() => revokeMutation.mutate(r.id)}
                        okText="Thu hồi"
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                        placement="topRight"
                    >
                        <Button size="small" danger icon={<StopOutlined />} style={{ fontSize: 12 }}>
                            Thu hồi
                        </Button>
                    </Popconfirm>
                ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
                ),
        },
    ];

    return (
        <>
            <Modal
                open={open}
                onCancel={handleClose}
                footer={null}
                title={
                    <Flex align="center" justify="space-between" style={{ paddingRight: 32 }}>
                        <Flex align="center" gap={8}>
                            <ShareAltOutlined style={{ color: "#e8256b" }} />
                            <span>Chia sẻ công khai — {procedure?.procedureCode}</span>
                            {activeTokenCount > 0 && (
                                <Badge
                                    count={activeTokenCount}
                                    size="small"
                                    style={{ backgroundColor: "#e8256b" }}
                                />
                            )}
                        </Flex>
                        <Button
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setShowForm(f => !f);
                                setNewTokenQr(null);
                                setExpandedKey(null);
                                setEmailModalOpen(false);
                                setSelectedToken(null);
                                setEmailInput("");
                                setAutoPin(true);
                            }}
                            style={showForm ? {} : {
                                background: "linear-gradient(135deg,#f0226e,#ff5fa0)",
                                border: "none",
                                color: "white",
                                boxShadow: "0 2px 8px rgba(240,34,110,0.25)",
                            }}
                        >
                            {showForm ? "Huỷ" : "Tạo link mới"}
                        </Button>
                    </Flex>
                }
                width={900}
                centered
                destroyOnClose
                styles={{ body: { paddingTop: 8 } }}
            >
                {showForm && (
                    <div style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        padding: "16px 16px 4px",
                        marginBottom: 16,
                    }}>
                        <Form form={form} layout="vertical">
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px" }}>
                                {/* PIN */}
                                <Form.Item
                                    name="pin"
                                    label={
                                        <Flex align="center" gap={8}>
                                            <span>Mã PIN (tuỳ chọn)</span>
                                            <Flex align="center" gap={6}>
                                                <Switch
                                                    size="small"
                                                    checked={autoPin}
                                                    onChange={(checked) => {
                                                        setAutoPin(checked);
                                                        if (checked) form.setFieldValue("pin", undefined);
                                                    }}
                                                />
                                                <span style={{ fontSize: 12, color: "#6b7280" }}>Tự sinh</span>
                                            </Flex>
                                        </Flex>
                                    }
                                    rules={!autoPin ? [{ pattern: /^\d{4,6}$/, message: "PIN phải là 4–6 chữ số" }] : []}
                                >
                                    <Input
                                        maxLength={6}
                                        disabled={autoPin}
                                        placeholder={autoPin ? "Hệ thống tự sinh PIN 6 số" : "4–6 số, để trống nếu không cần"}
                                        prefix={<SafetyOutlined style={{ color: autoPin ? "#d1d5db" : "#9ca3af" }} />}
                                    />
                                </Form.Item>

                                {/* Ngày hết hạn */}
                                <Form.Item name="expiresAt" label="Ngày hết hạn (tuỳ chọn)">
                                    <DatePicker
                                        style={{ width: "100%" }}
                                        format="DD/MM/YYYY"
                                        placeholder="Không giới hạn"
                                        suffixIcon={<CalendarOutlined />}
                                        disabledDate={(d) => d.isBefore(dayjs(), "day")}
                                    />
                                </Form.Item>

                                {/* Giới hạn lượt xem */}
                                <Form.Item name="maxAccessCount" label="Giới hạn lượt xem (tuỳ chọn)">
                                    <InputNumber
                                        min={1}
                                        style={{ width: "100%" }}
                                        placeholder="Để trống = không giới hạn"
                                    />
                                </Form.Item>
                            </div>

                            <Flex gap={8} style={{ marginBottom: 16 }}>
                                <Button
                                    icon={<QrcodeOutlined />}
                                    loading={createMutation.isPending}
                                    onClick={handleCreate}
                                    style={{
                                        background: "linear-gradient(135deg,#f0226e,#ff5fa0)",
                                        border: "none",
                                        color: "white",
                                        boxShadow: "0 2px 8px rgba(240,34,110,0.25)",
                                    }}
                                >
                                    Tạo link & QR
                                </Button>
                                <Button onClick={() => {
                                    setShowForm(false);
                                    setNewTokenQr(null);
                                    setAutoPin(true);
                                    form.resetFields();
                                }}>
                                    Huỷ
                                </Button>
                            </Flex>
                        </Form>
                        {newTokenQr && (
                            <>
                                <Divider style={{ margin: "0 0 14px" }} />
                                <Flex align="center" gap={16} style={{ marginBottom: 16 }}>
                                    <div style={{
                                        padding: 8, background: "#fff",
                                        borderRadius: 8, border: "1px solid #e5e7eb", flexShrink: 0,
                                    }}>
                                        <Image
                                            src={`data:image/png;base64,${newTokenQr}`}
                                            width={100} height={100}
                                            preview={{ mask: <EyeOutlined /> }}
                                            style={{ borderRadius: 4, display: "block" }}
                                        />
                                    </div>
                                    <div>
                                        <Text strong style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
                                            Mã QR vừa tạo
                                        </Text>
                                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 10 }}>
                                            Bấm vào ▶ ở dòng tương ứng trong bảng bên dưới để xem lại QR bất cứ lúc nào.
                                        </Text>
                                        <Button
                                            size="small"
                                            icon={<DownloadOutlined />}
                                            style={{ borderColor: "#fcc", color: "#e8256b" }}
                                            onClick={() => {
                                                const a = document.createElement("a");
                                                a.href = `data:image/png;base64,${newTokenQr}`;
                                                a.download = `qr-${procedure?.procedureCode}-${Date.now()}.png`;
                                                a.click();
                                            }}
                                        >
                                            Tải QR về máy
                                        </Button>
                                    </div>
                                </Flex>
                            </>
                        )}
                    </div>
                )}

                <Table
                    rowKey="id"
                    size="small"
                    loading={isLoading}
                    columns={columns}
                    dataSource={tokens}
                    pagination={tokens.length > 8 ? { pageSize: 8, size: "small" } : false}
                    locale={{ emptyText: "Chưa có link nào được tạo" }}
                    expandable={{
                        expandedRowKeys: expandedKey !== null ? [expandedKey] : [],
                        showExpandColumn: false,
                        expandedRowRender: (r: IResShareTokenDTO) => (
                            <ExpandedRow token={r} procedureCode={procedure?.procedureCode} />
                        ),
                    }}
                />
            </Modal>

            {/* ── Modal gửi email qua hệ thống ── */}
            <Modal
                open={emailModalOpen}
                onCancel={() => {
                    setEmailModalOpen(false);
                    setSelectedToken(null);
                    setEmailInput("");
                }}
                onOk={() => selectedToken && handleSendSystemEmail(selectedToken.id)}
                okText="Gửi email"
                cancelText="Huỷ"
                confirmLoading={sendEmailMutation.isPending}
                okButtonProps={{
                    style: {
                        background: "linear-gradient(135deg,#f0226e,#ff5fa0)",
                        border: "none",
                        boxShadow: "0 2px 8px rgba(240,34,110,0.25)",
                    },
                }}
                title={
                    <Flex align="center" gap={8}>
                        <SendOutlined style={{ color: "#e8256b" }} />
                        <span>Gửi email chia sẻ qua hệ thống</span>
                    </Flex>
                }
                width={440}
                centered
            >
                {selectedToken && (
                    <>
                        <div style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            padding: "12px 14px",
                            marginBottom: 16,
                        }}>
                            <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 8 }}>
                                Nội dung sẽ được gửi kèm trong mail
                            </Text>
                            <Flex gap={8} wrap="wrap">
                                {selectedToken.pin ? (
                                    <Tag color="orange" style={{ fontFamily: "monospace", fontWeight: 700 }}>
                                        PIN: {selectedToken.pin}
                                    </Tag>
                                ) : (
                                    <Tag color="default">Không có PIN</Tag>
                                )}
                                {selectedToken.expiresAt ? (
                                    <Tag color="blue">
                                        HH: {dayjs(selectedToken.expiresAt).format("DD/MM/YYYY")}
                                    </Tag>
                                ) : (
                                    <Tag color="default">Vô thời hạn</Tag>
                                )}
                            </Flex>
                        </div>

                        <Text style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
                            Email người nhận
                        </Text>
                        <Input
                            placeholder="Nhập email người nhận..."
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            onPressEnter={() => selectedToken && handleSendSystemEmail(selectedToken.id)}
                            prefix={<MailOutlined style={{ color: "#9ca3af" }} />}
                            size="large"
                            autoFocus
                        />
                        <Text type="secondary" style={{ fontSize: 11, marginTop: 6, display: "block" }}>
                            Hệ thống sẽ gửi link truy cập + mã PIN + mã QR đến email này
                        </Text>
                    </>
                )}
            </Modal>
        </>
    );
};

export default ModalShareToken;