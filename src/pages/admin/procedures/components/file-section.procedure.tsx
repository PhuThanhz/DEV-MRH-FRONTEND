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
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import type { ToolbarProps, ToolbarSlot } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

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

// ─── PDF Viewer ───────────────────────────────────────────────────────────────
interface IPdfViewerProps {
    url: string;
}

const PdfViewer = ({ url }: IPdfViewerProps) => {
    const renderToolbar = (Toolbar: (props: ToolbarProps) => React.ReactElement) => (
        <Toolbar>
            {(slots: ToolbarSlot) => {
                const {
                    CurrentPageInput,
                    GoToNextPage,
                    GoToPreviousPage,
                    NumberOfPages,
                    ShowSearchPopover,
                    Zoom,
                    ZoomIn,
                    ZoomOut,
                } = slots;
                return (
                    <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 4, padding: "0 8px" }}>
                        <ShowSearchPopover />
                        <GoToPreviousPage />
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <CurrentPageInput /> / <NumberOfPages />
                        </div>
                        <GoToNextPage />
                        <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                            <ZoomOut />
                            <Zoom />
                            <ZoomIn />
                        </div>
                    </div>
                );
            }}
        </Toolbar>
    );

    const defaultLayoutPluginInstance = defaultLayoutPlugin({ renderToolbar });

    return (
        <div style={{ height: "95vh" }}>
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                <Viewer
                    fileUrl={url}
                    plugins={[defaultLayoutPluginInstance]}
                    defaultScale={1}
                    renderLoader={(percentages) => (
                        <div style={{ padding: "24px 32px", background: "#f5f5f5", height: "100%" }}>
                            <Skeleton active paragraph={{ rows: 8 }} />
                            <div style={{ marginTop: 12, color: "#999", fontSize: 13, textAlign: "center" }}>
                                Đang tải... {Math.round(percentages)}%
                            </div>
                        </div>
                    )}
                    renderError={() => (
                        <div style={{ color: "#ff4d4f", padding: 24, textAlign: "center" }}>
                            Không thể tải file PDF. Vui lòng thử lại.
                        </div>
                    )}
                />
            </Worker>
        </div>
    );
};

// ─── FileTile ─────────────────────────────────────────────────────────────────
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
        <Tooltip title={prettyName} placement="top">
            <div
                onClick={() => isPdf && onPreview(fileUrl, fileName)}
                style={{
                    background: "#fafafa",
                    borderRadius: 12,
                    border: "0.5px solid #e8e8e8",
                    padding: "14px 10px 10px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 7,
                    cursor: isPdf ? "pointer" : "default",
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
                        width: 54, height: 62, borderRadius: 10,
                        background: cfg.bg, border: `0.5px solid ${cfg.border}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        position: "relative", flexShrink: 0,
                    }}
                >
                    {cfg.icon}
                    <span
                        style={{
                            position: "absolute", bottom: -2, right: -2,
                            fontSize: 8, fontWeight: 700, padding: "1px 5px",
                            borderRadius: 4, background: cfg.extBg, color: "#fff",
                            letterSpacing: "0.05em", lineHeight: "14px",
                        }}
                    >
                        {cfg.extLabel}
                    </span>
                </div>

                <div
                    style={{
                        fontSize: 11, fontWeight: 500, color: "#333",
                        textAlign: "center", width: "100%",
                        overflow: "hidden", textOverflow: "ellipsis",
                        whiteSpace: "nowrap", lineHeight: 1.4,
                    }}
                >
                    {displayName}
                </div>

                {/* PDF: click tile để xem, không có nút */}
                {!isPdf && (
                    <div style={{ display: "flex", gap: 6 }}>
                        <Button
                            size="small"
                            icon={<FileTextOutlined />}
                            onClick={(e) => { e.stopPropagation(); onPreview(fileUrl, fileName); }}
                            style={{ fontSize: 11, borderRadius: 6, height: 24 }}
                        >
                            Xem
                        </Button>
                        <Button
                            size="small"
                            icon={<DownloadOutlined />}
                            onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                            style={{ fontSize: 11, borderRadius: 6, height: 24 }}
                        >
                            Tải
                        </Button>
                    </div>
                )}
            </div>
        </Tooltip>
    );
};

// ─── FileSection ──────────────────────────────────────────────────────────────
interface IPreviewState {
    url: string;
    ext: string;
}

interface IFileSectionProps {
    fileNames?: string[];
}

const FileSection = ({ fileNames = [] }: IFileSectionProps) => {
    const [preview, setPreview] = useState<IPreviewState | null>(null);
    const [iframeLoaded, setIframeLoaded] = useState(false);

    const fileEntries = fileNames
        .map((name) => ({ name, url: buildFileUrl(name)! }))
        .filter((f) => f.url);

    if (fileEntries.length === 0) return null;

    const handlePreview = (url: string, fileName: string) => {
        const ext = getExt(fileName);
        setIframeLoaded(false);
        setPreview({ url, ext });
    };

    const handleClose = () => {
        setPreview(null);
        setIframeLoaded(false);
    };

    const officeUrl = preview
        ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(preview.url)}`
        : "";

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
                open={!!preview}
                onCancel={handleClose}
                footer={null}
                width="95vw"
                title={null}
                closable={false}
                closeIcon={null}
                style={{ top: 16 }}
                styles={{
                    body: { padding: 0, margin: 0, overflow: "hidden" },
                    content: { padding: 0, borderRadius: 8, overflow: "hidden" },
                    header: { display: "none" },
                    wrapper: { alignItems: "flex-start" },
                }}
            >
                <div style={{ position: "relative" }}>
                    {/* Nút close */}
                    <button
                        onClick={handleClose}
                        style={{
                            position: "absolute", top: 10, right: 10, zIndex: 10,
                            width: 30, height: 30, borderRadius: "50%",
                            border: "0.5px solid rgba(255,255,255,0.3)",
                            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
                            color: "#fff", fontSize: 15, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            lineHeight: 1,
                        }}
                    >
                        ✕
                    </button>

                    {/* PDF → @react-pdf-viewer toolbar tùy chỉnh */}
                    {preview?.ext === "pdf" && (
                        <PdfViewer url={preview.url} />
                    )}

                    {/* Office files → Microsoft Office Online */}
                    {preview && preview.ext !== "pdf" && (
                        <>
                            {!iframeLoaded && (
                                <div
                                    style={{
                                        position: "absolute", inset: 0, zIndex: 5,
                                        background: "#f5f5f5", padding: "24px 32px",
                                        height: "95vh", boxSizing: "border-box",
                                    }}
                                >
                                    <Skeleton.Button active style={{ width: 220, marginBottom: 20 }} />
                                    <Skeleton active paragraph={{ rows: 6 }} style={{ marginBottom: 16 }} />
                                    <Skeleton active paragraph={{ rows: 5 }} style={{ marginBottom: 16 }} />
                                    <Skeleton active paragraph={{ rows: 4 }} />
                                </div>
                            )}
                            <iframe
                                src={officeUrl}
                                onLoad={() => setIframeLoaded(true)}
                                style={{ width: "100%", height: "95vh", border: "none", display: "block" }}
                            />
                        </>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default FileSection;