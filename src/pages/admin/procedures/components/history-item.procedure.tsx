import { Tag, Divider, Tooltip } from "antd";
import {
    FileTextOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    FilePptOutlined,
    DownloadOutlined,
    UserOutlined,
    ApartmentOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
} from "@ant-design/icons";
import type { IProcedureHistory } from "@/types/backend";
import dayjs from "dayjs";

// ── Status map ────────────────────────────────────────────────────────────────
const statusMap: Record<string, { label: string; color: string }> = {
    NEED_CREATE: { label: "Cần xây dựng mới", color: "orange" },
    IN_PROGRESS: { label: "Đang xây dựng", color: "blue" },
    NEED_UPDATE: { label: "Cần cập nhật", color: "purple" },
    TERMINATED: { label: "Chấm dứt", color: "red" },
};

// ── File helpers ──────────────────────────────────────────────────────────────
const getExt = (fileName: string) =>
    fileName.split(".").pop()?.toLowerCase() ?? "";

type FileStyle = { icon: React.ReactNode; bg: string; border: string };

const FILE_STYLES: Record<string, FileStyle> = {
    pdf: { icon: <FilePdfOutlined style={{ fontSize: 14, color: "#ff4d4f" }} />, bg: "#fff1f0", border: "#ffccc7" },
    doc: { icon: <FileWordOutlined style={{ fontSize: 14, color: "#1677ff" }} />, bg: "#e6f4ff", border: "#91caff" },
    docx: { icon: <FileWordOutlined style={{ fontSize: 14, color: "#1677ff" }} />, bg: "#e6f4ff", border: "#91caff" },
    xls: { icon: <FileExcelOutlined style={{ fontSize: 14, color: "#52c41a" }} />, bg: "#f6ffed", border: "#b7eb8f" },
    xlsx: { icon: <FileExcelOutlined style={{ fontSize: 14, color: "#52c41a" }} />, bg: "#f6ffed", border: "#b7eb8f" },
    ppt: { icon: <FilePptOutlined style={{ fontSize: 14, color: "#fa8c16" }} />, bg: "#fff7e6", border: "#ffd591" },
    pptx: { icon: <FilePptOutlined style={{ fontSize: 14, color: "#fa8c16" }} />, bg: "#fff7e6", border: "#ffd591" },
};

const getFileStyle = (ext: string): FileStyle =>
    FILE_STYLES[ext] ?? {
        icon: <FileTextOutlined style={{ fontSize: 14, color: "#8c8c8c" }} />,
        bg: "#fafafa", border: "#d9d9d9",
    };

// Bỏ timestamp prefix số: "1774111037431-filename.pdf" → "filename.pdf"
const getDisplayName = (raw: string): string => {
    const i = raw.indexOf("-");
    if (i > 0 && /^\d+$/.test(raw.slice(0, i))) return raw.slice(i + 1);
    return raw;
};

// ── FilePill ──────────────────────────────────────────────────────────────────
const FilePill = ({ name }: { name: string }) => {
    const s = getFileStyle(getExt(name));
    const displayName = getDisplayName(name);
    const fileUrl = `/api/v1/files?fileName=${encodeURIComponent(name)}&folder=procedures`;

    const handleDownload = async () => {
        try {
            const axios = (await import("@/config/axios-customize")).default;
            const res = await axios.get(fileUrl, { responseType: "blob" }) as any;
            const blob = new Blob([res.data], {
                type: res.headers?.["content-type"] ?? "application/octet-stream",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = displayName; a.click();
            window.URL.revokeObjectURL(url);
        } catch { console.error("Download failed"); }
    };

    return (
        <Tooltip title={displayName} placement="top">
            <div
                onClick={handleDownload}
                style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "6px 9px", borderRadius: 7,
                    background: s.bg, border: `1px solid ${s.border}`,
                    cursor: "pointer", transition: "opacity .15s",
                    // Quan trọng: chiếm đúng 100% width container, không tràn
                    width: "100%", boxSizing: "border-box", minWidth: 0, overflow: "hidden",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
                <span style={{ flexShrink: 0, lineHeight: 1, display: "flex" }}>{s.icon}</span>
                <span style={{
                    fontSize: 12, fontWeight: 500, color: "#333",
                    flex: 1, minWidth: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                    {displayName}
                </span>
                <DownloadOutlined style={{ fontSize: 11, color: "#bbb", flexShrink: 0 }} />
            </div>
        </Tooltip>
    );
};

// ── InfoRow ───────────────────────────────────────────────────────────────────
const InfoRow = ({
    icon, label, children, noEllipsis,
}: {
    icon?: React.ReactNode;
    label: string;
    children: React.ReactNode;
    noEllipsis?: boolean;
}) => (
    <div style={{
        display: "flex", alignItems: "center", gap: 6,
        fontSize: 12, minWidth: 0, overflow: "hidden",
    }}>
        <span style={{
            color: "#ccc", flexShrink: 0, fontSize: 11,
            width: 13, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            {icon}
        </span>
        <span style={{ color: "#aaa", flexShrink: 0, width: 85, lineHeight: 1.4 }}>
            {label}
        </span>
        <span style={{
            color: "#222", fontWeight: 500, flex: 1, minWidth: 0, lineHeight: 1.4,
            ...(noEllipsis
                ? {}
                : { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }),
        }}>
            {children}
        </span>
    </div>
);

// ── Main ──────────────────────────────────────────────────────────────────────
interface IProps { h: IProcedureHistory }

const HistoryItemProcedure = ({ h }: IProps) => {
    const hStatus = statusMap[h.status ?? ""] ?? { label: h.status ?? "", color: "default" };

    return (
        <div style={{
            background: "#fff",
            border: "1px solid #e8e8e8",
            borderRadius: 10,
            overflow: "hidden",
            marginBottom: 4,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            // Đảm bảo card không tràn ra ngoài Timeline
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            minWidth: 0,
        }}>

            {/* ── Header ── */}
            <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                background: "#f8faff",
                borderBottom: "1px solid #ebebeb",
                gap: 8, minWidth: 0, overflow: "hidden",
            }}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
                    <Tag color="blue" style={{ fontWeight: 700, fontSize: 11, margin: 0, borderRadius: 5 }}>
                        v{h.version}
                    </Tag>
                    <Tag color="geekblue" style={{ fontSize: 11, margin: 0, borderRadius: 5 }}>
                        Cập nhật phiên bản
                    </Tag>
                </div>
                <span style={{
                    display: "flex", alignItems: "center", gap: 4,
                    fontSize: 11, color: "#bbb", flexShrink: 0, whiteSpace: "nowrap",
                }}>
                    <ClockCircleOutlined style={{ fontSize: 10 }} />
                    {h.changedAt ? dayjs(h.changedAt).format("DD/MM/YYYY HH:mm") : "--"}
                </span>
            </div>

            {/* ── Body ── */}
            <div style={{
                padding: "11px 12px",
                display: "flex", flexDirection: "column", gap: 7,
                minWidth: 0, overflow: "hidden",
                boxSizing: "border-box",
            }}>
                {/* Tên quy trình */}
                <div style={{
                    fontSize: 13, fontWeight: 600, color: "#1a1a1a",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                    {h.procedureName || "--"}
                </div>

                {/* Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {h.changedBy && (
                        <InfoRow icon={<UserOutlined />} label="Thực hiện bởi">
                            {h.changedBy}
                        </InfoRow>
                    )}
                    {h.departmentName && (
                        <InfoRow icon={<ApartmentOutlined />} label="Phòng ban">
                            {h.departmentName}
                        </InfoRow>
                    )}
                    {h.sectionName && (
                        <InfoRow icon={<ApartmentOutlined />} label="Bộ phận">
                            {h.sectionName}
                        </InfoRow>
                    )}
                    {h.status && (
                        <InfoRow icon={<span style={{ fontSize: 7 }}>●</span>} label="Trạng thái" noEllipsis>
                            <Tag color={hStatus.color} style={{ fontSize: 11, margin: 0, borderRadius: 5 }}>
                                {hStatus.label}
                            </Tag>
                        </InfoRow>
                    )}
                    {h.planYear && (
                        <InfoRow icon={<CalendarOutlined />} label="Năm kế hoạch">
                            {h.planYear}
                        </InfoRow>
                    )}
                    {h.note && (
                        <InfoRow label="Ghi chú" noEllipsis>
                            <span style={{ fontStyle: "italic", color: "#666" }}>{h.note}</span>
                        </InfoRow>
                    )}
                </div>

                {/* Files */}
                {h.fileUrls && h.fileUrls.length > 0 && (
                    <>
                        <Divider style={{ margin: "4px 0" }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                            {h.fileUrls.map((name, i) => (
                                <FilePill key={i} name={name} />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default HistoryItemProcedure;