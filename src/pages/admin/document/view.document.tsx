import {
    Modal, Button, Tag, Badge, Typography, Avatar, Image, Spin,
} from "antd";
import {
    FileTextOutlined, UserOutlined, ApartmentOutlined,
    CalendarOutlined, CloseOutlined,
    QrcodeOutlined, DownloadOutlined, EyeOutlined,
} from "@ant-design/icons";
import type { IDocument } from "@/types/backend";
import dayjs from "dayjs";
import { useState, useEffect } from "react";
import { useDocumentByIdQuery } from "@/hooks/useDocuments";
import FileSection from "../procedures/components/file-section.procedure";

const { Text, Title } = Typography;

const TAG_STYLE: React.CSSProperties = {
    borderRadius: 3, margin: 0, fontWeight: 600,
    fontSize: 11, lineHeight: "20px", padding: "0 8px",
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
    NEED_CREATE: { label: "Cần tạo", color: "orange" },
    IN_PROGRESS: { label: "Đang hiệu lực", color: "success" },
    NEED_UPDATE: { label: "Cần cập nhật", color: "gold" },
    TERMINATED: { label: "Đã huỷ", color: "error" },
};

const PROCEDURE_TYPE_LABEL: Record<string, string> = {
    COMPANY: "Công ty",
    DEPARTMENT: "Phòng ban",
    CONFIDENTIAL: "Bảo mật",
};

const SectionHeading = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 0 10px" }}>
        <span style={{ color: "#1677ff", fontSize: 11, display: "flex", lineHeight: 1 }}>{icon}</span>
        <Text style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", whiteSpace: "nowrap" }}>
            {label}
        </Text>
        <div style={{ flex: 1, height: "0.5px", background: "#e5e7eb" }} />
    </div>
);

const Field = ({ label, children, span }: { label: string; children: React.ReactNode; span?: number }) => (
    <div style={{ gridColumn: span ? `span ${span}` : undefined, minWidth: 0, overflow: "hidden" }}>
        <Text style={{ fontSize: 10, color: "#9ca3af", fontWeight: 500, display: "block", marginBottom: 3 }}>
            {label}
        </Text>
        <div style={{ fontSize: 13, color: "#111827", fontWeight: 500, display: "flex", alignItems: "center", gap: 5, minHeight: 22, overflow: "hidden" }}>
            {children}
        </div>
    </div>
);

const UserField = ({ label, name, avatarColor, textColor }: { label: string; name?: string; avatarColor: string; textColor: string }) => {
    const initials = name?.split(" ").slice(-2).map((w) => w[0]).join("").toUpperCase() ?? "?";
    return (
        <Field label={label}>
            {name ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, width: "100%" }}>
                    <Avatar size={20} style={{ background: avatarColor, color: textColor, fontSize: 9, flexShrink: 0 }}>
                        {initials}
                    </Avatar>
                    <Text ellipsis={{ tooltip: name }} style={{ fontSize: 13, fontWeight: 400, color: "#111827", flex: 1, minWidth: 0 }}>
                        {name}
                    </Text>
                </div>
            ) : (
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>--</Text>
            )}
        </Field>
    );
};

interface Props {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IDocument | null;
    setDataInit: (v: IDocument | null) => void;
}

const ViewDetailDocument = ({ open, onClose, dataInit, setDataInit }: Props) => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    // ← GỌI API LẤY CHI TIẾT MỚI NHẤT QUA ENDPOINT VĂN BẢN GỐC
    const { data: detail, isLoading: detailLoading } = useDocumentByIdQuery(
        open && dataInit?.id ? dataInit.id : undefined
    );

    if (!dataInit) return null;

    // Dùng dữ liệu mới nhất từ API, nếu chưa có thì dùng dataInit truyền từ ngoài vào
    const data = detail ?? dataInit;

    const status = STATUS_MAP[data?.status ?? ""] ?? { label: data?.status ?? "--", color: "default" };

    const handleClose = () => {
        onClose(false);
        setDataInit(null);
    };

    const handleDownloadQr = () => {
        if (!data?.qrCode) return;
        const a = document.createElement("a");
        const qrSrc = data.qrCode.startsWith("data:image") 
            ? data.qrCode 
            : `data:image/png;base64,${data.qrCode}`;
        a.href = qrSrc;
        a.download = `qr-${data.documentCode ?? "document"}.png`;
        a.click();
    };

    const col3 = isMobile ? "1fr 1fr" : "1fr 1fr 1fr";
    const col2 = isMobile ? "1fr" : "1fr 1fr";
    const col4 = isMobile ? "1fr 1fr" : "1fr 1fr 1fr 1fr";

    const QrPanel = data?.qrCode ? (
        <div style={isMobile ? {
            display: "flex", flexDirection: "row", alignItems: "center", gap: 16,
            borderTop: "0.5px solid #e5e7eb", paddingTop: 14, marginTop: 14, width: "100%",
        } : {
            width: 156, flexShrink: 0, borderLeft: "0.5px solid #e5e7eb",
            padding: "0 0 0 18px", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 8, alignSelf: "flex-start",
        }}>
            <div style={{ padding: 5, background: "#fff", border: "0.5px solid #e5e7eb", borderRadius: 4, flexShrink: 0 }}>
                <Image
                    src={data.qrCode.startsWith("data:image") ? data.qrCode : `data:image/png;base64,${data.qrCode}`}
                    width={isMobile ? 80 : 120}
                    height={isMobile ? 80 : 120}
                    preview={{ mask: <EyeOutlined /> }}
                    style={{ borderRadius: 3, display: "block" }}
                />
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: isMobile ? "flex-start" : "center", gap: 6, flex: isMobile ? 1 : undefined, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <QrcodeOutlined style={{ color: "#1677ff", fontSize: 11 }} />
                    <Text style={{ fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        Mã QR
                    </Text>
                </div>
                {data.documentCode && (
                    <Tag color="purple" style={TAG_STYLE}>{data.documentCode}</Tag>
                )}
                <Text type="secondary" style={{ fontSize: 11, textAlign: isMobile ? "left" : "center", lineHeight: 1.4, color: "#9ca3af" }}>
                    Quét để truy cập nhanh văn bản
                </Text>
                <Button size="small" icon={<DownloadOutlined />} onClick={handleDownloadQr}
                    style={{ borderRadius: 3, fontSize: 11, width: isMobile ? "auto" : "100%" }}>
                    Tải QR về máy
                </Button>
            </div>
        </div>
    ) : null;

    const MainContent = (
        <div style={{ flex: 1, minWidth: 0 }}>

            {/* Tài liệu đính kèm */}
            {(data?.fileUrls ?? []).length > 0 && (
                <div style={{ marginBottom: 14 }}>
                    <SectionHeading icon={<FileTextOutlined />} label="Tài liệu đính kèm" />
                    <FileSection fileNames={data?.fileUrls} />
                </div>
            )}

            <SectionHeading icon={<ApartmentOutlined />} label="Thông tin chung" />

            {/* Tên văn bản */}
            <div style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 10, color: "#9ca3af", fontWeight: 500, display: "block", marginBottom: 3 }}>
                    Tên văn bản
                </Text>
                <Text style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>
                    {data.documentName || (data as any).procedureName || "--"}
                </Text>
            </div>

            {/* Row 1: Trạng thái, Mã, Kích hoạt */}
            <div style={{ display: "grid", gridTemplateColumns: col3, gap: "10px 16px", marginBottom: 12 }}>
                <Field label="Trạng thái">
                    <Tag color={status.color} style={TAG_STYLE}>{status.label}</Tag>
                </Field>
                <Field label="Mã văn bản">
                    {data.documentCode
                        ? <Tag color="blue" style={TAG_STYLE}>{data.documentCode}</Tag>
                        : <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>--</Text>}
                </Field>
                <Field label="Kích hoạt">
                    {data.active
                        ? <Badge status="success" text={<Text style={{ fontSize: 13 }}>Hoạt động</Text>} />
                        : <Badge status="error" text={<Text style={{ fontSize: 13 }}>Tắt</Text>} />}
                </Field>
            </div>

            {/* Row 2: Loại văn bản, Ký hiệu, Công ty, Phòng ban, Bộ phận, Ngày ban hành */}
            <div style={{ display: "grid", gridTemplateColumns: col2, gap: "10px 16px", marginBottom: 12 }}>
                <Field label="Loại văn bản">
                    {data.category?.categoryName
                        ? <Tag color="purple" style={TAG_STYLE}>{data.category.categoryName}</Tag>
                        : <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>--</Text>}
                </Field>
                <Field label="Ký hiệu">
                    {data.category?.symbol
                        ? <Tag style={TAG_STYLE}>{data.category.symbol}</Tag>
                        : <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>--</Text>}
                </Field>
                <Field label="Công ty">
                    <Text ellipsis={{ tooltip: data.department?.companyName }} style={{ fontSize: 13, fontWeight: 400 }}>
                        {data.department?.companyName || "--"}
                    </Text>
                </Field>
                <Field label="Phòng ban">
                    <Text ellipsis={{ tooltip: data.department?.name }} style={{ fontSize: 13, fontWeight: 400 }}>
                        {data.department?.name || "--"}
                    </Text>
                </Field>
                <Field label="Bộ phận">
                    <Text ellipsis={{ tooltip: data.section?.name }} style={{ fontSize: 13, fontWeight: 400 }}>
                        {data.section?.name || "--"}
                    </Text>
                </Field>
                <Field label="Ngày ban hành">
                    {data.issuedDate ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <CalendarOutlined style={{ color: "#eb2f96", fontSize: 11 }} />
                            <Text style={{ fontSize: 13, fontWeight: 500 }}>
                                {dayjs(data.issuedDate).format("DD/MM/YYYY")}
                            </Text>
                        </span>
                    ) : <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>--</Text>}
                </Field>
            </div>

            {/* Mapping Procedure */}
            {data.category?.mappingProcedure && (
                <div style={{ display: "grid", gridTemplateColumns: col2, gap: "10px 16px", marginBottom: 12 }}>
                    <Field label="Loại quy trình">
                        <Tag color="geekblue" style={TAG_STYLE}>
                            {PROCEDURE_TYPE_LABEL[data.procedureType || ""] || data.procedureType || "--"}
                        </Tag>
                    </Field>
                    <Field label="ID quy trình">
                        <Text style={{ fontSize: 13, fontWeight: 400 }}>{data.procedureId || "--"}</Text>
                    </Field>
                </div>
            )}

            {/* Ghi chú */}
            <div style={{ marginBottom: 14 }}>
                <Text style={{ fontSize: 10, color: "#9ca3af", fontWeight: 500, display: "block", marginBottom: 3 }}>
                    Ghi chú
                </Text>
                <Text style={{ fontSize: 13, fontWeight: 400, color: data.note ? "#111827" : "#9ca3af", fontStyle: data.note ? "normal" : "italic" }}>
                    {data.note || "Không có ghi chú"}
                </Text>
            </div>

            <div style={{ height: "0.5px", background: "#e5e7eb", margin: "0 0 12px" }} />

            <SectionHeading icon={<UserOutlined />} label="Người thực hiện & Thời gian" />

            <div style={{ display: "grid", gridTemplateColumns: col4, gap: "10px 16px" }}>
                <UserField label="Tạo bởi" name={data.createdBy} avatarColor="#e6f4ff" textColor="#1677ff" />
                <UserField label="Cập nhật bởi" name={data.updatedBy} avatarColor="#f9f0ff" textColor="#531dab" />
                <Field label="Ngày tạo">
                    {data.createdAt ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <CalendarOutlined style={{ color: "#52c41a", fontSize: 11 }} />
                            <Text style={{ fontSize: 12, fontWeight: 400 }}>
                                {dayjs(data.createdAt).format("DD-MM-YYYY HH:mm")}
                            </Text>
                        </span>
                    ) : <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>--</Text>}
                </Field>
                <Field label="Ngày cập nhật">
                    {data.updatedAt ? (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <CalendarOutlined style={{ color: "#fa8c16", fontSize: 11 }} />
                            <Text style={{ fontSize: 12, fontWeight: 400 }}>
                                {dayjs(data.updatedAt).format("DD-MM-YYYY HH:mm")}
                            </Text>
                        </span>
                    ) : <Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>--</Text>}
                </Field>
            </div>

            {isMobile && QrPanel}
        </div>
    );

    return (
        <Modal
            open={open}
            onCancel={handleClose}
            width={isMobile ? "92vw" : 940}
            centered
            closeIcon={<CloseOutlined style={{ fontSize: 12 }} />}
            styles={{
                body: { padding: 0 },
                header: { padding: "12px 20px 10px", marginBottom: 0, borderBottom: "0.5px solid #f0f0f0" },
                footer: { padding: "10px 20px", borderTop: "0.5px solid #f0f0f0", marginTop: 0 },
            }}
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 6, background: "#e6f4ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <FileTextOutlined style={{ fontSize: 15, color: "#1677ff" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Title level={5} style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Chi tiết văn bản</Title>
                        <Text type="secondary" ellipsis style={{ fontSize: 12, fontWeight: 400 }}>
                            {data.documentName}
                        </Text>
                    </div>
                </div>
            }
            footer={
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button onClick={handleClose} style={{ borderRadius: 3, fontSize: 13 }}>Đóng</Button>
                </div>
            }
        >
            <Spin spinning={detailLoading}>
                <div style={{
                    display: "flex", flexDirection: "row", alignItems: "flex-start",
                    padding: isMobile ? "14px 16px 16px" : "16px 20px 18px 24px",
                }}>
                    {MainContent}
                    {!isMobile && QrPanel}
                </div>
            </Spin>
        </Modal>
    );
};

export default ViewDetailDocument;