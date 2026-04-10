import {
    FilePdfOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    FilePptOutlined,
    FileImageOutlined,
    FileUnknownOutlined,
    FileTextOutlined,
    DownloadOutlined,
} from "@ant-design/icons";
import { Button, Modal, Skeleton, Tooltip } from "antd";
import { useState } from "react";

export const buildFileUrl = (fileName?: string) =>
    fileName
        ? `https://hrm.vlotustech.vn/uploads/procedures/${encodeURIComponent(fileName)}`
        : null;

export const getExt = (fileName?: string) =>
    fileName?.split(".").pop()?.toLowerCase() ?? "";

export const decodeFileName = (fileName?: string): string => {
    if (!fileName) return "";
    let name = fileName.replace(/^\d{10,}-/, "");
    const dotIdx = name.lastIndexOf(".");
    const ext = dotIdx !== -1 ? name.slice(dotIdx) : "";
    const base = dotIdx !== -1 ? name.slice(0, dotIdx) : name;
    let decoded = base;
    try { decoded = decodeURIComponent(base); } catch { decoded = base; }
    decoded = decoded.replace(/_/g, " ").replace(/\s+/g, " ").trim();
    return decoded + ext;
};

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

interface IFileTileProps {
    fileName: string;
    fileUrl: string;
    onPreview: (url: string, fileName: string) => void;
}

const FileTile = ({ fileName, fileUrl, onPreview }: IFileTileProps) => {
    const ext = getExt(fileName);
    const cfg = getFileConfig(ext);
    const prettyName = decodeFileName(fileName);
    const displayName = prettyName.length > 24 ? prettyName.slice(0, 21) + "…" : prettyName;
    const isPdf = ext === "pdf";

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
            a.download = prettyName;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch {
            console.error("Download failed");
        }
    };

    return (
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

            <div style={{ display: "flex", gap: 6 }}>
                <Button
                    size="small"
                    icon={<FileTextOutlined />}
                    onClick={() => onPreview(fileUrl, fileName)}
                    style={{ fontSize: 11, borderRadius: 6, height: 24 }}
                >
                    Xem
                </Button>

                {!isPdf && (
                    <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={handleDownload}
                        style={{ fontSize: 11, borderRadius: 6, height: 24 }}
                    >
                        Tải
                    </Button>
                )}
            </div>
        </div>
    );
};

interface IFileSectionProps {
    fileNames?: string[];
}

const FileSection = ({ fileNames = [] }: IFileSectionProps) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [iframeLoaded, setIframeLoaded] = useState(false); // ← track iframe load

    const fileEntries = fileNames
        .map((name) => ({ name, url: buildFileUrl(name)! }))
        .filter((f) => f.url);

    if (fileEntries.length === 0) return null;

    const handlePreview = (url: string, fileName: string) => {
        const ext = getExt(fileName);
        setIframeLoaded(false); // ← reset mỗi lần mở file mới
        if (ext === "pdf") {
            // PDF: trỏ thẳng tới file, browser tự render — nhanh hơn Google Viewer
            setPreviewUrl(url);
        } else {
            setPreviewUrl(
                `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
            );
        }
    };

    const handleClose = () => {
        setPreviewUrl(null);
        setIframeLoaded(false);
    };

    return (
        <>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                    gap: 8,
                }}
            >
                {fileEntries.map((f) => (
                    <FileTile
                        key={f.name}
                        fileName={f.name}
                        fileUrl={f.url}
                        onPreview={handlePreview}
                    />
                ))}
            </div>

            <Modal
                open={!!previewUrl}
                onCancel={handleClose}
                footer={null}
                width="95vw"
                title={null}
                closable={false}   // ← tắt close button mặc định của antd
                closeIcon={null}   // ← fix double close button
                style={{ top: 16 }}
                styles={{
                    body: { padding: 0, margin: 0, overflow: "hidden" },
                    content: { padding: 0, borderRadius: 8, overflow: "hidden" },
                    header: { display: "none" },
                    wrapper: { alignItems: "flex-start" },
                }}
            >
                <div style={{ position: "relative" }}>
                    {/* Nút close custom — chỉ 1 cái duy nhất */}
                    <button
                        onClick={handleClose}
                        style={{
                            position: "absolute",
                            top: 10,
                            right: 10,
                            zIndex: 10,
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            border: "0.5px solid rgba(255,255,255,0.3)",
                            background: "rgba(0,0,0,0.45)",
                            backdropFilter: "blur(4px)",
                            color: "#fff",
                            fontSize: 15,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            lineHeight: 1,
                        }}
                    >
                        ✕
                    </button>

                    {/* Skeleton hiện trong lúc iframe chưa load xong */}
                    {!iframeLoaded && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                zIndex: 5,
                                background: "#f5f5f5",
                                padding: "24px 32px",
                                height: "95vh",
                                boxSizing: "border-box",
                            }}
                        >
                            {/* Giả lập thanh toolbar */}
                            <Skeleton.Button active style={{ width: 200, marginBottom: 20 }} />
                            {/* Giả lập nội dung tài liệu */}
                            <Skeleton active paragraph={{ rows: 6 }} style={{ marginBottom: 16 }} />
                            <Skeleton active paragraph={{ rows: 5 }} style={{ marginBottom: 16 }} />
                            <Skeleton active paragraph={{ rows: 4 }} />
                        </div>
                    )}

                    <iframe
                        src={previewUrl || ""}
                        onLoad={() => setIframeLoaded(true)} // ← ẩn skeleton khi load xong
                        style={{
                            width: "100%",
                            height: "95vh",
                            border: "none",
                            display: "block",
                        }}
                    />
                </div>
            </Modal>
        </>
    );
};

export default FileSection;