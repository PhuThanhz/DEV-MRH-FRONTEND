import {
    Modal,
    Button,
    Tag,
    Drawer,
    Timeline,
    Space,
    Typography,
    Avatar,
    Image,
} from "antd";
import {
    FileTextOutlined,
    HistoryOutlined,
    UserOutlined,
    ApartmentOutlined,
    CalendarOutlined,
    TagOutlined,
    CloseOutlined,
    QrcodeOutlined,
    DownloadOutlined,
    EyeOutlined,
} from "@ant-design/icons";
import type { IProcedure, IProcedureHistory, ProcedureType } from "@/types/backend";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { useProcedureHistoryQuery } from "@/hooks/useProcedure";
import HistoryItemProcedure from "./components/history-item.procedure";
import FileSection from "./components/file-section.procedure";

const { Text, Title } = Typography;

// ── Tất cả tag vuông góc ──────────────────────────────────────────────────────
const TAG_STYLE: React.CSSProperties = {
    borderRadius: 3,
    margin: 0,
    fontWeight: 600,
    fontSize: 11,
    lineHeight: "20px",
    padding: "0 8px",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    NEED_CREATE: { label: "Cần xây dựng mới", color: "orange" },
    IN_PROGRESS: { label: "Đang hiệu lực", color: "success" },
    NEED_UPDATE: { label: "Đang cập nhật", color: "gold" },
    TERMINATED: { label: "Hết hiệu lực", color: "error" },
};

// ── Section heading ───────────────────────────────────────────────────────────
const SectionHeading = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 0 10px" }}>
        <span style={{ color: "#1677ff", fontSize: 11, display: "flex", lineHeight: 1 }}>
            {icon}
        </span>
        <Text style={{
            fontSize: 10, fontWeight: 700, color: "#6b7280",
            textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap",
        }}>
            {label}
        </Text>
        <div style={{ flex: 1, height: "0.5px", background: "#e5e7eb" }} />
    </div>
);

// ── Field ─────────────────────────────────────────────────────────────────────
const Field = ({
    label, children, span,
}: {
    label: string; children: React.ReactNode; span?: number;
}) => (
    <div style={{ gridColumn: span ? `span ${span}` : undefined, minWidth: 0, overflow: "hidden" }}>
        <Text style={{
            fontSize: 10, color: "#9ca3af", fontWeight: 500,
            display: "block", marginBottom: 3,
        }}>
            {label}
        </Text>
        <div style={{
            fontSize: 13, color: "#111827", fontWeight: 500,
            display: "flex", alignItems: "center", gap: 5,
            minHeight: 22, overflow: "hidden",
        }}>
            {children}
        </div>
    </div>
);

// ── Avatar + name, truncate email dài ─────────────────────────────────────────
const UserField = ({
    label, name, avatarColor, textColor,
}: {
    label: string; name?: string; avatarColor: string; textColor: string;
}) => {
    const initials = name?.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase() ?? "?";
    return (
        <Field label={label}>
            {name ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, width: "100%" }}>
                    <Avatar size={20} style={{
                        background: avatarColor, color: textColor,
                        fontSize: 9, flexShrink: 0,
                    }}>
                        {initials}
                    </Avatar>
                    <Text
                        ellipsis={{ tooltip: name }}
                        style={{ fontSize: 13, fontWeight: 400, color: "#111827", flex: 1, minWidth: 0 }}
                    >
                        {name}
                    </Text>
                </div>
            ) : (
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>--</Text>
            )}
        </Field>
    );
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface IProps {
    type: ProcedureType;
    open: boolean;
    onClose: () => void;
    dataInit: IProcedure | null;
    refetch?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
const ViewProcedure = ({ type, open, onClose, dataInit }: IProps) => {
    const [openHistory, setOpenHistory] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const { data: historyList = [], isFetching: historyLoading } =
        useProcedureHistoryQuery(type, openHistory ? dataInit?.id : undefined);

    if (!dataInit) return null;

    const status = STATUS_MAP[dataInit.status ?? ""] ?? {
        label: dataInit.status ?? "--", color: "default",
    };

    const handleDownloadQr = () => {
        if (!dataInit.qrCode) return;
        const a = document.createElement("a");
        a.href = `data:image/png;base64,${dataInit.qrCode}`;
        a.download = `qr-${dataInit.procedureCode ?? "procedure"}.png`;
        a.click();
    };

    // ── QR Panel ──────────────────────────────────────────────────────────────
    const QrPanel = dataInit.qrCode ? (
        <div style={isMobile ? {
            // Mobile: nằm ngang dưới main content
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 16,
            borderTop: "0.5px solid #e5e7eb",
            paddingTop: 14,
            marginTop: 14,
            width: "100%",
        } : {
            // Desktop: cột phải
            width: 156,
            flexShrink: 0,
            borderLeft: "0.5px solid #e5e7eb",
            padding: "0 0 0 18px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            alignSelf: "flex-start",
        }}>

            {/* QR image */}
            <div style={{
                padding: 5, background: "#fff",
                border: "0.5px solid #e5e7eb", borderRadius: 4,
                flexShrink: 0,
            }}>
                <Image
                    src={`data:image/png;base64,${dataInit.qrCode}`}
                    width={isMobile ? 80 : 120}
                    height={isMobile ? 80 : 120}
                    preview={{ mask: <EyeOutlined /> }}
                    style={{ borderRadius: 3, display: "block" }}
                />
            </div>

            {/* Info + actions */}
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: isMobile ? "flex-start" : "center",
                gap: 6,
                flex: isMobile ? 1 : undefined,
                minWidth: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <QrcodeOutlined style={{ color: "#1677ff", fontSize: 11 }} />
                    <Text style={{
                        fontSize: 10, fontWeight: 700, color: "#6b7280",
                        textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>
                        Mã QR
                    </Text>
                </div>

                {dataInit.procedureCode && (
                    <Tag color="purple" style={TAG_STYLE}>{dataInit.procedureCode}</Tag>
                )}

                <Text type="secondary" style={{
                    fontSize: 11,
                    textAlign: isMobile ? "left" : "center",
                    lineHeight: 1.4, color: "#9ca3af",
                }}>
                    Quét để truy cập nhanh quy trình
                </Text>

                <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadQr}
                    style={{ borderRadius: 3, fontSize: 11, width: isMobile ? "auto" : "100%" }}
                >
                    Tải QR về máy
                </Button>
            </div>
        </div>
    ) : null;

    // ── cols helpers ─────────────────────────────────────────────────────────
    // Desktop: 3 cột | Mobile: 2 cột
    const col3 = isMobile ? "1fr 1fr" : "1fr 1fr 1fr";
    // Desktop: 2 cột | Mobile: 1 cột
    const col2 = isMobile ? "1fr" : "1fr 1fr";
    // Desktop: 4 cột | Mobile: 2 cột
    const col4 = isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr";

    const span3 = isMobile ? 2 : 3;   // full width trong grid 3/2 cột
    const span2 = 2;                   // full width trong grid 2/1→span 2 ok vì isMobile dùng 1fr 1fr
    const span4 = isMobile ? 2 : 4;   // full width trong grid 4/2 cột

    // ── Main content ─────────────────────────────────────────────────────────
    const MainContent = (
        <div style={{ flex: 1, minWidth: 0 }}>

            {/* Tài liệu đính kèm */}
            {(dataInit.fileUrls ?? []).length > 0 && (
                <div style={{ marginBottom: 14 }}>
                    <SectionHeading icon={<FileTextOutlined />} label="Tài liệu đính kèm" />
                    <FileSection fileNames={dataInit.fileUrls} />
                </div>
            )}

            {/* ── Thông tin chung ───────────────────────────────────────── */}
            <SectionHeading icon={<ApartmentOutlined />} label="Thông tin chung" />

            {/* Tên quy trình */}
            <div style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 10, color: "#9ca3af", fontWeight: 500, display: "block", marginBottom: 3 }}>
                    Tên quy trình
                </Text>
                <Text style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                    {dataInit.procedureName || "--"}
                </Text>
            </div>

            {/* Trạng thái · Phiên bản · Mã quy trình */}
            <div style={{ display: "grid", gridTemplateColumns: col3, gap: "10px 16px", marginBottom: 12 }}>
                <Field label="Trạng thái">
                    <Tag color={status.color} style={TAG_STYLE}>{status.label}</Tag>
                </Field>
                <Field label="Phiên bản">
                    <Tag color="blue" icon={<TagOutlined />} style={TAG_STYLE}>
                        v{dataInit.version ?? 1}
                    </Tag>
                </Field>
                <Field label="Mã quy trình">
                    {dataInit.procedureCode
                        ? <Tag color="purple" style={TAG_STYLE}>{dataInit.procedureCode}</Tag>
                        : <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>--</Text>
                    }
                </Field>
            </div>

            {/* Công ty · Phòng ban */}
            <div style={{ display: "grid", gridTemplateColumns: col2, gap: "10px 16px", marginBottom: 12 }}>
                <Field label="Công ty">
                    <Text ellipsis={{ tooltip: dataInit.companyName }} style={{ fontSize: 13, fontWeight: 400 }}>
                        {dataInit.companyName || "--"}
                    </Text>
                </Field>
                <Field label="Phòng ban">
                    <Text ellipsis={{ tooltip: dataInit.departmentName }} style={{ fontSize: 13, fontWeight: 400 }}>
                        {dataInit.departmentName || "--"}
                    </Text>
                </Field>

                {/* Bộ phận (nếu có) · Năm kế hoạch */}
                {dataInit.sectionName && (
                    <Field label="Bộ phận">
                        <Text ellipsis={{ tooltip: dataInit.sectionName }} style={{ fontSize: 13, fontWeight: 400 }}>
                            {dataInit.sectionName}
                        </Text>
                    </Field>
                )}
                <Field label="Năm kế hoạch">
                    {dataInit.planYear ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <CalendarOutlined style={{ color: "#1677ff", fontSize: 11 }} />
                            <Text style={{ fontSize: 13, fontWeight: 500 }}>{dataInit.planYear}</Text>
                        </span>
                    ) : <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>--</Text>}
                </Field>
                <Field label="Ngày ban hành">
                    {dataInit.issuedDate ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <CalendarOutlined style={{ color: "#eb2f96", fontSize: 11 }} />
                            <Text style={{ fontSize: 13, fontWeight: 500 }}>
                                {dayjs(dataInit.issuedDate).format("DD-MM-YYYY")}
                            </Text>
                        </span>
                    ) : <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>--</Text>}
                </Field>
            </div>

            {/* Ghi chú */}
            <div style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 10, color: "#9ca3af", fontWeight: 500, display: "block", marginBottom: 3 }}>
                    Ghi chú
                </Text>
                <Text style={{
                    fontSize: 13, fontWeight: 400,
                    color: dataInit.note ? "#111827" : "#9ca3af",
                    fontStyle: dataInit.note ? "normal" : "italic",
                }}>
                    {dataInit.note || "Không có ghi chú"}
                </Text>
            </div>

            {/* Divider */}
            <div style={{ height: "0.5px", background: "#e5e7eb", margin: "0 0 12px" }} />

            {/* ── Người thực hiện & Thời gian ───────────────────────────── */}
            <SectionHeading icon={<UserOutlined />} label="Người thực hiện & Thời gian" />

            <div style={{ display: "grid", gridTemplateColumns: col4, gap: "10px 16px" }}>
                <UserField
                    label="Tạo bởi"
                    name={dataInit.createdBy}
                    avatarColor="#e6f4ff"
                    textColor="#1677ff"
                />
                <UserField
                    label="Cập nhật bởi"
                    name={dataInit.updatedBy}
                    avatarColor="#f9f0ff"
                    textColor="#531dab"
                />
                <Field label="Ngày tạo">
                    {dataInit.createdAt ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <CalendarOutlined style={{ color: "#52c41a", fontSize: 11 }} />
                            <Text style={{ fontSize: 12, fontWeight: 400 }}>
                                {dayjs(dataInit.createdAt).format("DD-MM-YYYY HH:mm")}
                            </Text>
                        </span>
                    ) : <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>--</Text>}
                </Field>
                <Field label="Ngày cập nhật">
                    {dataInit.updatedAt ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <CalendarOutlined style={{ color: "#fa8c16", fontSize: 11 }} />
                            <Text style={{ fontSize: 12, fontWeight: 400 }}>
                                {dayjs(dataInit.updatedAt).format("DD-MM-YYYY HH:mm")}
                            </Text>
                        </span>
                    ) : <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>--</Text>}
                </Field>

                {dataInit.assignedByList?.length ? (
                    <Field label="Người gửi" span={span4}>
                        <Space wrap size={4}>
                            {dataInit.assignedByList.map((name) => (
                                <Tag key={name} color="blue" style={TAG_STYLE}>{name}</Tag>
                            ))}
                        </Space>
                    </Field>
                ) : null}
            </div>

            {/* QR mobile: xuống dưới cùng */}
            {isMobile && QrPanel}
        </div>
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <Modal
                open={open}
                onCancel={onClose}
                width={isMobile ? "92vw" : 940}
                centered
                closeIcon={<CloseOutlined style={{ fontSize: 12 }} />}
                styles={{
                    body: { padding: 0 },
                    header: {
                        padding: "12px 20px 10px",
                        marginBottom: 0,
                        borderBottom: "0.5px solid #f0f0f0",
                    },
                    footer: {
                        padding: "10px 20px",
                        borderTop: "0.5px solid #f0f0f0",
                        marginTop: 0,
                    },
                }}
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 34, height: 34, borderRadius: 6,
                            background: "#e6f4ff",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                        }}>
                            <ApartmentOutlined style={{ fontSize: 15, color: "#1677ff" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Title level={5} style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                                Chi tiết quy trình
                            </Title>
                            <Text type="secondary" ellipsis style={{ fontSize: 12, fontWeight: 400 }}>
                                {dataInit.procedureName}
                            </Text>
                        </div>
                    </div>
                }
                footer={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Button
                            icon={<HistoryOutlined />}
                            onClick={() => setOpenHistory(true)}
                            style={{
                                borderRadius: 3, color: "#1677ff",
                                borderColor: "#91caff", background: "#e6f4ff", fontSize: 13,
                            }}
                        >
                            {!isMobile && "Lịch sử thay đổi"}
                            {isMobile && "Lịch sử"}
                            {historyList.length > 0 && (
                                <Tag color="blue" style={{ ...TAG_STYLE, marginLeft: 6, padding: "0 5px" }}>
                                    {historyList.length}
                                </Tag>
                            )}
                        </Button>
                        <Button onClick={onClose} style={{ borderRadius: 3, fontSize: 13 }}>
                            Đóng
                        </Button>
                    </div>
                }
            >
                {/* Body */}
                <div style={{
                    display: "flex",
                    flexDirection: "row",        // luôn row; QR mobile nằm trong MainContent
                    alignItems: "flex-start",
                    padding: isMobile ? "14px 16px 16px" : "16px 20px 18px 24px",
                }}>
                    {MainContent}
                    {/* QR desktop: cột phải */}
                    {!isMobile && QrPanel}
                </div>
            </Modal>

            {/* ── Drawer lịch sử ─────────────────────────────────────────── */}
            <Drawer
                title={
                    <Space>
                        <HistoryOutlined style={{ color: "#1677ff" }} />
                        <span style={{ fontWeight: 600, fontSize: 14 }}>Lịch sử thay đổi</span>
                        <Tag color="blue" style={TAG_STYLE}>
                            {historyList.length} phiên bản
                        </Tag>
                    </Space>
                }
                extra={
                    <Text type="secondary" ellipsis style={{ fontSize: 11, maxWidth: 180 }}>
                        {dataInit.procedureName}
                    </Text>
                }
                open={openHistory}
                onClose={() => setOpenHistory(false)}
                width={isMobile ? "90vw" : 600}
                loading={historyLoading}
                styles={{ body: { paddingTop: 16, paddingLeft: 16, paddingRight: 16 } }}
            >
                {historyList.length === 0 ? (
                    <div style={{
                        display: "flex", flexDirection: "column",
                        alignItems: "center", paddingTop: 64, gap: 12,
                    }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: "50%",
                            background: "#f5f5f5",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <HistoryOutlined style={{ fontSize: 22, color: "#ccc" }} />
                        </div>
                        <Text style={{ color: "#999", fontSize: 13 }}>
                            Chưa có lịch sử thay đổi
                        </Text>
                    </div>
                ) : (
                    <Timeline
                        items={historyList.map((h: IProcedureHistory) => ({
                            color: "#1677ff",
                            children: <HistoryItemProcedure h={h} />,
                        }))}
                    />
                )}
            </Drawer>
        </>
    );
};

export default ViewProcedure;