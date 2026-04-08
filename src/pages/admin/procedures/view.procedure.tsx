import {
    Modal,
    Button,
    Tag,
    Drawer,
    Timeline,
    Space,
    Typography,
    Avatar,
    Tooltip,
} from "antd";
import {
    FileTextOutlined,
    HistoryOutlined,
    DownloadOutlined,
    CheckCircleFilled,
    CloseCircleFilled,
    ClockCircleOutlined,
    UserOutlined,
    ApartmentOutlined,
    CalendarOutlined,
    TagOutlined,
    CloseOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    FilePptOutlined,
    FileImageOutlined,
    FileUnknownOutlined,
} from "@ant-design/icons";
import type { IProcedure, IProcedureHistory, ProcedureType } from "@/types/backend";
import dayjs from "dayjs";
import { useState } from "react";
import { useProcedureHistoryQuery } from "@/hooks/useProcedure";
import HistoryItemProcedure from "./components/history-item.procedure";

const { Text, Title } = Typography;

// ── Status ────────────────────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string }> = {
    NEED_CREATE: { label: "Cần xây dựng mới", color: "orange" },
    IN_PROGRESS: { label: "Đang xây dựng", color: "blue" },
    NEED_UPDATE: { label: "Cần cập nhật", color: "purple" },
    TERMINATED: { label: "Chấm dứt", color: "red" },
};

// ── File helpers ──────────────────────────────────────────────────────────────
const buildFileUrl = (fileName?: string) =>
    fileName
        ? `/api/v1/files?fileName=${encodeURIComponent(fileName)}&folder=procedures`
        : null;

const getExt = (fileName?: string) =>
    fileName?.split(".").pop()?.toLowerCase() ?? "";

// ── File config ───────────────────────────────────────────────────────────────
type FileConfig = {
    icon: React.ReactNode;
    bg: string;
    border: string;
    extBg: string;
    extLabel: string;
};

const FILE_CONFIG: Record<string, FileConfig> = {
    pdf: {
        icon: <FilePdfOutlined style={{ fontSize: 24, color: "#ff4d4f" }} />,
        bg: "#fff1f0", border: "#ffccc7", extBg: "#ff4d4f", extLabel: "PDF",
    },
    doc: {
        icon: <FileWordOutlined style={{ fontSize: 24, color: "#1677ff" }} />,
        bg: "#e6f4ff", border: "#91caff", extBg: "#1677ff", extLabel: "DOC",
    },
    docx: {
        icon: <FileWordOutlined style={{ fontSize: 24, color: "#1677ff" }} />,
        bg: "#e6f4ff", border: "#91caff", extBg: "#1677ff", extLabel: "DOCX",
    },
    xls: {
        icon: <FileExcelOutlined style={{ fontSize: 24, color: "#52c41a" }} />,
        bg: "#f6ffed", border: "#b7eb8f", extBg: "#52c41a", extLabel: "XLS",
    },
    xlsx: {
        icon: <FileExcelOutlined style={{ fontSize: 24, color: "#52c41a" }} />,
        bg: "#f6ffed", border: "#b7eb8f", extBg: "#52c41a", extLabel: "XLSX",
    },
    ppt: {
        icon: <FilePptOutlined style={{ fontSize: 24, color: "#fa8c16" }} />,
        bg: "#fff7e6", border: "#ffd591", extBg: "#fa8c16", extLabel: "PPT",
    },
    pptx: {
        icon: <FilePptOutlined style={{ fontSize: 24, color: "#fa8c16" }} />,
        bg: "#fff7e6", border: "#ffd591", extBg: "#fa8c16", extLabel: "PPTX",
    },
    png: {
        icon: <FileImageOutlined style={{ fontSize: 24, color: "#722ed1" }} />,
        bg: "#f9f0ff", border: "#d3adf7", extBg: "#722ed1", extLabel: "PNG",
    },
    jpg: {
        icon: <FileImageOutlined style={{ fontSize: 24, color: "#722ed1" }} />,
        bg: "#f9f0ff", border: "#d3adf7", extBg: "#722ed1", extLabel: "JPG",
    },
    jpeg: {
        icon: <FileImageOutlined style={{ fontSize: 24, color: "#722ed1" }} />,
        bg: "#f9f0ff", border: "#d3adf7", extBg: "#722ed1", extLabel: "JPEG",
    },
};

const getFileConfig = (ext: string): FileConfig =>
    FILE_CONFIG[ext] ?? {
        icon: <FileUnknownOutlined style={{ fontSize: 24, color: "#8c8c8c" }} />,
        bg: "#fafafa", border: "#d9d9d9", extBg: "#8c8c8c",
        extLabel: ext.toUpperCase() || "FILE",
    };

// ── FileTile ──────────────────────────────────────────────────────────────────
interface IFileTileProps {
    fileName: string;
    fileUrl: string;
}

const FileTile = ({ fileName, fileUrl }: IFileTileProps) => {
    const ext = getExt(fileName);
    const cfg = getFileConfig(ext);
    const displayName = fileName.length > 24 ? fileName.slice(0, 21) + "…" : fileName;

    const handleDownload = async () => {
        try {
            const axiosInstance = (await import("@/config/axios-customize")).default;
            const response = await axiosInstance.get(fileUrl, { responseType: "blob" }) as any;
            const blob = new Blob([response.data], {
                type: response.headers?.["content-type"] ?? "application/octet-stream",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            console.error("Download failed");
        }
    };

    return (
        <Tooltip title={fileName} placement="top">
            <div
                style={{
                    background: "#fafafa",
                    borderRadius: 12,
                    border: "0.5px solid #e8e8e8",
                    padding: "14px 10px 10px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 7,
                    cursor: "default",
                    transition: "border-color .15s, background .15s",
                    minWidth: 0,
                }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#91caff";
                    (e.currentTarget as HTMLDivElement).style.background = "#f5faff";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "#e8e8e8";
                    (e.currentTarget as HTMLDivElement).style.background = "#fafafa";
                }}
            >
                <div
                    style={{
                        width: 54,
                        height: 62,
                        borderRadius: 10,
                        background: cfg.bg,
                        border: `0.5px solid ${cfg.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        flexShrink: 0,
                    }}
                >
                    {cfg.icon}
                    <span
                        style={{
                            position: "absolute",
                            bottom: -2,
                            right: -2,
                            fontSize: 8,
                            fontWeight: 700,
                            padding: "1px 5px",
                            borderRadius: 4,
                            background: cfg.extBg,
                            color: "#fff",
                            letterSpacing: "0.05em",
                            lineHeight: "14px",
                        }}
                    >
                        {cfg.extLabel}
                    </span>
                </div>

                <div
                    style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: "#333",
                        textAlign: "center",
                        width: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: 1.4,
                    }}
                >
                    {displayName}
                </div>

                <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                    style={{
                        fontSize: 11,
                        borderRadius: 6,
                        height: 24,
                        padding: "0 10px",
                        marginTop: 1,
                    }}
                >
                    Tải xuống
                </Button>
            </div>
        </Tooltip>
    );
};

// ── SectionHeading ────────────────────────────────────────────────────────────
const SectionHeading = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 9px" }}>
        <span style={{ color: "#1677ff", display: "flex", fontSize: 13 }}>{icon}</span>
        <Text
            style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#666",          // ← đậm hơn trước (#aaa)
                textTransform: "uppercase",
                letterSpacing: "0.07em",
            }}
        >
            {label}
        </Text>
        <div style={{ flex: 1, height: 0.5, background: "#e8e8e8" }} />
    </div>
);

// ── Field card ────────────────────────────────────────────────────────────────
const Field = ({
    label,
    children,
    span = 1,
}: {
    label: string;
    children: React.ReactNode;
    span?: number;
}) => (
    <div
        style={{
            background: "#fafafa",
            borderRadius: 9,
            padding: "9px 13px",
            gridColumn: span === 2 ? "span 2" : undefined,
            minWidth: 0,
        }}
    >
        {/* label đậm hơn: #777 thay vì #bbb */}
        <div style={{ fontSize: 11, color: "#777", marginBottom: 5, fontWeight: 500 }}>
            {label}
        </div>
        <div
            style={{
                fontSize: 13,
                color: "#1a1a1a",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: 6,
                minWidth: 0,
            }}
        >
            {children}
        </div>
    </div>
);

// ── Avatar initials ───────────────────────────────────────────────────────────
const initials = (name?: string) =>
    name
        ?.split(" ")
        .slice(-2)
        .map((w) => w[0])
        .join("")
        .toUpperCase() ?? "?";

// ── Props ─────────────────────────────────────────────────────────────────────
interface IProps {
    type: ProcedureType;
    open: boolean;
    onClose: () => void;
    dataInit: IProcedure | null;
    refetch?: () => void;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const ViewProcedure = ({ type, open, onClose, dataInit }: IProps) => {
    const [openHistory, setOpenHistory] = useState(false);

    const { data: historyList = [], isFetching: historyLoading } =
        useProcedureHistoryQuery(type, openHistory ? dataInit?.id : undefined);

    if (!dataInit) return null;

    const status = STATUS_MAP[dataInit.status ?? ""] ?? {
        label: dataInit.status ?? "--",
        color: "default",
    };

    const fileEntries = (dataInit.fileUrls ?? [])
        .map((name) => ({ name, url: buildFileUrl(name)! }))
        .filter((f) => f.url);

    return (
        <>
            <Modal
                open={open}
                onCancel={onClose}
                width="66vw"
                centered
                closeIcon={<CloseOutlined style={{ fontSize: 12 }} />}
                styles={{
                    body: {
                        padding: "0 22px 22px",
                        maxHeight: "74vh",
                        overflowY: "auto",
                    },
                    header: {
                        padding: "16px 22px 13px",
                        borderBottom: "1px solid #f0f0f0",
                        marginBottom: 0,
                    },
                }}
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {/* Icon box */}
                        <div
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 10,
                                background: "#e6f4ff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <ApartmentOutlined style={{ fontSize: 17, color: "#1677ff" }} />
                        </div>

                        {/* Title + subtitle */}
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <Title level={5} style={{ margin: 0, fontSize: 14, lineHeight: 1.3 }}>
                                Chi tiết quy trình
                            </Title>
                            <Text
                                type="secondary"
                                ellipsis
                                style={{ fontSize: 11, display: "block", maxWidth: 360 }}
                            >
                                {dataInit.procedureName}
                            </Text>
                        </div>

                        {/* Badges */}
                        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                            <Tag
                                color={status.color}
                                style={{
                                    borderRadius: 20,
                                    fontWeight: 600,
                                    padding: "2px 11px",
                                    fontSize: 11,
                                    margin: 0,
                                }}
                            >
                                {status.label}
                            </Tag>
                            <Tag
                                color="blue"
                                icon={<TagOutlined />}
                                style={{
                                    borderRadius: 20,
                                    fontWeight: 600,
                                    padding: "2px 9px",
                                    fontSize: 11,
                                    margin: 0,
                                }}
                            >
                                v{dataInit.version ?? 1}
                            </Tag>
                        </div>
                    </div>
                }
                footer={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Button
                            icon={<HistoryOutlined />}
                            onClick={() => setOpenHistory(true)}
                            style={{
                                borderRadius: 8,
                                background: "#f0f7ff",
                                borderColor: "#91caff",
                                color: "#1677ff",
                                fontSize: 13,
                            }}
                        >
                            Lịch sử thay đổi
                            {historyList.length > 0 && (
                                <Tag
                                    color="blue"
                                    style={{
                                        marginLeft: 6,
                                        fontSize: 10,
                                        borderRadius: 10,
                                        padding: "0 6px",
                                    }}
                                >
                                    {historyList.length}
                                </Tag>
                            )}
                        </Button>
                        <Button onClick={onClose} style={{ borderRadius: 8 }}>
                            Đóng
                        </Button>
                    </div>
                }
            >
                {/* ── Tài liệu đính kèm ── */}
                {fileEntries.length > 0 && (
                    <>
                        <SectionHeading icon={<FileTextOutlined />} label="Tài liệu đính kèm" />
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                                gap: 8,
                            }}
                        >
                            {fileEntries.map((f) => (
                                <FileTile key={f.name} fileName={f.name} fileUrl={f.url} />
                            ))}
                        </div>
                    </>
                )}

                {/* ── Thông tin chung ── */}
                <SectionHeading icon={<ApartmentOutlined />} label="Thông tin chung" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                    <Field label="Tên quy trình" span={2}>
                        <Text
                            ellipsis
                            style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", maxWidth: "100%" }}
                        >
                            {dataInit.procedureName || "--"}
                        </Text>
                    </Field>
                    {/* ← THÊM MỚI: ngay sau đây */}
                    {dataInit.procedureCode && (
                        <Field label="Mã quy trình">
                            <Tag color="purple" style={{ borderRadius: 20, margin: 0, fontWeight: 600, fontSize: 11 }}>
                                {dataInit.procedureCode}
                            </Tag>
                        </Field>
                    )}
                    {dataInit.companyName && (
                        <Field label="Công ty">{dataInit.companyName}</Field>
                    )}
                    {dataInit.departmentName && (
                        <Field label="Phòng ban">{dataInit.departmentName}</Field>
                    )}
                    {dataInit.sectionName && (
                        <Field label="Bộ phận">{dataInit.sectionName}</Field>
                    )}

                    <Field label="Năm kế hoạch">
                        {dataInit.planYear ? (
                            <>
                                <CalendarOutlined style={{ color: "#1677ff", fontSize: 12 }} />
                                {dataInit.planYear}
                            </>
                        ) : (
                            <Text style={{ color: "#999", fontWeight: 400, fontSize: 13 }}>--</Text>
                        )}
                    </Field>
                    {/* ← THÊM */}
                    <Field label="Ngày ban hành">
                        {dataInit.issuedDate ? (
                            <>
                                <CalendarOutlined style={{ color: "#eb2f96", fontSize: 12 }} />
                                <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>
                                    {dayjs(dataInit.issuedDate).format("DD-MM-YYYY")}
                                </span>
                            </>
                        ) : (
                            <Text style={{ color: "#999", fontWeight: 400, fontSize: 13 }}>--</Text>
                        )}
                    </Field>

                    <Field label="Trạng thái">
                        <Tag
                            color={status.color}
                            style={{ borderRadius: 20, margin: 0, fontWeight: 500, fontSize: 11 }}
                        >
                            {status.label}
                        </Tag>
                    </Field>

                    {/* ── Bỏ field "Hoạt động" theo yêu cầu ── */}

                    <Field label="Ghi chú" span={2}>
                        <Text
                            style={{
                                fontWeight: 400,
                                fontSize: 13,
                                color: dataInit.note ? "#1a1a1a" : "#999",
                                fontStyle: dataInit.note ? "normal" : "italic",
                            }}
                        >
                            {dataInit.note || "Không có ghi chú"}
                        </Text>
                    </Field>
                </div>

                {/* ── Người thực hiện ── */}
                <SectionHeading icon={<UserOutlined />} label="Người thực hiện" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                    <Field label="Tạo bởi">
                        {dataInit.createdBy ? (
                            <>
                                <Avatar
                                    size={22}
                                    style={{
                                        background: "#e6f4ff",
                                        color: "#1677ff",
                                        fontSize: 9,
                                        flexShrink: 0,
                                    }}
                                >
                                    {initials(dataInit.createdBy)}
                                </Avatar>
                                <Text style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>
                                    {dataInit.createdBy}
                                </Text>
                            </>
                        ) : (
                            <Text style={{ color: "#999", fontWeight: 400, fontSize: 13 }}>--</Text>
                        )}
                    </Field>
                    <Field label="Cập nhật bởi">
                        {dataInit.updatedBy ? (
                            <>
                                <Avatar
                                    size={22}
                                    style={{
                                        background: "#f9f0ff",
                                        color: "#531dab",
                                        fontSize: 9,
                                        flexShrink: 0,
                                    }}
                                >
                                    {initials(dataInit.updatedBy)}
                                </Avatar>
                                <Text style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>
                                    {dataInit.updatedBy}
                                </Text>
                            </>
                        ) : (
                            <Text style={{ color: "#999", fontWeight: 400, fontSize: 13 }}>--</Text>
                        )}
                    </Field>
                </div>

                {/* ── Thời gian ── */}
                <SectionHeading icon={<ClockCircleOutlined />} label="Thời gian" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                    <Field label="Ngày tạo">
                        {dataInit.createdAt ? (
                            <>
                                <CalendarOutlined style={{ color: "#52c41a", fontSize: 12 }} />
                                <span style={{ fontSize: 12, fontWeight: 400, color: "#1a1a1a" }}>
                                    {dayjs(dataInit.createdAt).format("DD-MM-YYYY HH:mm")}
                                </span>
                            </>
                        ) : (
                            <Text style={{ color: "#999", fontWeight: 400, fontSize: 13 }}>--</Text>
                        )}
                    </Field>
                    <Field label="Ngày cập nhật">
                        {dataInit.updatedAt ? (
                            <>
                                <CalendarOutlined style={{ color: "#fa8c16", fontSize: 12 }} />
                                <span style={{ fontSize: 12, fontWeight: 400, color: "#1a1a1a" }}>
                                    {dayjs(dataInit.updatedAt).format("DD-MM-YYYY HH:mm")}
                                </span>
                            </>
                        ) : (
                            <Text style={{ color: "#999", fontWeight: 400, fontSize: 13 }}>--</Text>
                        )}
                    </Field>
                </div>
            </Modal>

            {/* ── Drawer lịch sử ── */}
            <Drawer
                title={
                    <Space>
                        <HistoryOutlined style={{ color: "#1677ff" }} />
                        <span style={{ fontWeight: 600 }}>Lịch sử thay đổi</span>
                        <Tag color="blue" style={{ borderRadius: 10, margin: 0 }}>
                            {historyList.length} phiên bản
                        </Tag>
                    </Space>
                }
                extra={
                    <Text
                        type="secondary"
                        ellipsis
                        style={{ fontSize: 11, maxWidth: 180 }}
                    >
                        {dataInit.procedureName}
                    </Text>
                }
                open={openHistory}
                onClose={() => setOpenHistory(false)}
                width={600}
                loading={historyLoading}
                styles={{ body: { paddingTop: 16, paddingLeft: 16, paddingRight: 16 } }}
            >
                {historyList.length === 0 ? (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            paddingTop: 64,
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                background: "#f5f5f5",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <HistoryOutlined style={{ fontSize: 24, color: "#ccc" }} />
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