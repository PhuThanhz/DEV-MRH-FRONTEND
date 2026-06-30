import {
    FilePdfOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    FilePptOutlined,
    FileImageOutlined,
    FileUnknownOutlined,
    FileTextOutlined,
    DownloadOutlined,
    CloseOutlined,
} from "@ant-design/icons";
import { Button, Modal, Skeleton, Tooltip } from "antd";
import { lazy, Suspense, useState } from "react";
import { downloadUrlAsBlob } from "@/config/download-url";
import { useIsMobile } from "@/hooks/useIsMobile";

const loadPdfPreviewer = () => import("./PdfPreviewer");
const PdfPreviewer = lazy(loadPdfPreviewer);
// ─── Helpers ──────────────────────────────────────────────────────────────────
export const buildFileUrl = (fileName?: string, folder = "procedures") => {
    if (!fileName) return null;
    if (/^https?:\/\//i.test(fileName)) return fileName;
    // Strip legacy /uploads/ or /storage/ prefix stored in DB
    const normalized = fileName.replace(/^\/+/, "").replace(/^(?:uploads|storage)\//, "");
    const resolvedFolder = normalized.includes("/") ? normalized.split("/").slice(0, -1).join("/") : folder;
    const resolvedName = normalized.includes("/") ? normalized.split("/").pop()! : normalized;
    return `${import.meta.env.VITE_BACKEND_URL}/api/v1/files/public?fileName=${encodeURIComponent(resolvedName)}&folder=${encodeURIComponent(resolvedFolder)}`;
};

export const getExt = (fileName?: string) =>
    fileName?.split(".").pop()?.toLowerCase() ?? "";

export const decodeFileName = (fileName?: string): string => {
    if (!fileName) return "";
    const name = fileName.replace(/^\d{10,}-/, "");
    const dotIdx = name.lastIndexOf(".");
    const ext = dotIdx !== -1 ? name.slice(dotIdx) : "";
    const base = dotIdx !== -1 ? name.slice(0, dotIdx) : name;
    let decoded = base;
    try { decoded = decodeURIComponent(base); } catch { decoded = base; }
    decoded = decoded.replace(/_/g, " ").replace(/\s+/g, " ").trim();
    return decoded + ext;
};

// ─── File config ──────────────────────────────────────────────────────────────
type FileConfig = { icon: React.ReactNode; bg: string; border: string; extBg: string; extLabel: string };

const FILE_CONFIG: Record<string, FileConfig> = {
    pdf: { icon: <FilePdfOutlined style={{ fontSize: 24, color: "#ff4d4f" }} />, bg: "#fff1f0", border: "#ffccc7", extBg: "#ff4d4f", extLabel: "PDF" },
    doc: { icon: <FileWordOutlined style={{ fontSize: 24, color: "#1677ff" }} />, bg: "#e6f4ff", border: "#91caff", extBg: "#1677ff", extLabel: "DOC" },
    docx: { icon: <FileWordOutlined style={{ fontSize: 24, color: "#1677ff" }} />, bg: "#e6f4ff", border: "#91caff", extBg: "#1677ff", extLabel: "DOCX" },
    xls: { icon: <FileExcelOutlined style={{ fontSize: 24, color: "#52c41a" }} />, bg: "#f6ffed", border: "#b7eb8f", extBg: "#52c41a", extLabel: "XLS" },
    xlsx: { icon: <FileExcelOutlined style={{ fontSize: 24, color: "#52c41a" }} />, bg: "#f6ffed", border: "#b7eb8f", extBg: "#52c41a", extLabel: "XLSX" },
    ppt: { icon: <FilePptOutlined style={{ fontSize: 24, color: "#fa8c16" }} />, bg: "#fff7e6", border: "#ffd591", extBg: "#fa8c16", extLabel: "PPT" },
    pptx: { icon: <FilePptOutlined style={{ fontSize: 24, color: "#fa8c16" }} />, bg: "#fff7e6", border: "#ffd591", extBg: "#fa8c16", extLabel: "PPTX" },
    png: { icon: <FileImageOutlined style={{ fontSize: 24, color: "#722ed1" }} />, bg: "#f9f0ff", border: "#d3adf7", extBg: "#722ed1", extLabel: "PNG" },
    jpg: { icon: <FileImageOutlined style={{ fontSize: 24, color: "#722ed1" }} />, bg: "#f9f0ff", border: "#d3adf7", extBg: "#722ed1", extLabel: "JPG" },
    jpeg: { icon: <FileImageOutlined style={{ fontSize: 24, color: "#722ed1" }} />, bg: "#f9f0ff", border: "#d3adf7", extBg: "#722ed1", extLabel: "JPEG" },
};

const getFileConfig = (ext: string): FileConfig =>
    FILE_CONFIG[ext] ?? {
        icon: <FileUnknownOutlined style={{ fontSize: 24, color: "#8c8c8c" }} />,
        bg: "#fafafa", border: "#d9d9d9", extBg: "#8c8c8c",
        extLabel: ext.toUpperCase() || "FILE",
    };

// ─── FileTile ─────────────────────────────────────────────────────────────────
interface IFileTileProps { fileName: string; fileUrl: string; onPreview: (url: string, fileName: string) => void }

const FileTile = ({ fileName, fileUrl, onPreview }: IFileTileProps) => {
    const ext = getExt(fileName);
    const cfg = getFileConfig(ext);
    const prettyName = decodeFileName(fileName);
    const displayName = prettyName.length > 24 ? prettyName.slice(0, 21) + "…" : prettyName;
    const isPdf = ext === "pdf";

    const handleDownload = async () => {
        try {
            await downloadUrlAsBlob(fileUrl, prettyName);
        } catch { console.error("Download failed"); }
    };

    return (
        <Tooltip title={prettyName} placement="top">
            <div
                onClick={() => isPdf && onPreview(fileUrl, fileName)}
                style={{
                    background: "#fafafa", borderRadius: 12, border: "0.5px solid #e8e8e8",
                    padding: "14px 10px 10px", display: "flex", flexDirection: "column",
                    alignItems: "center", gap: 7, cursor: isPdf ? "pointer" : "default",
                    transition: "border-color .15s, background .15s", minWidth: 0,
                }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "#91caff"; el.style.background = "#f5faff"; if (isPdf) void loadPdfPreviewer(); }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "#e8e8e8"; el.style.background = "#fafafa"; }}
            >
                <div style={{ width: 54, height: 62, borderRadius: 10, background: cfg.bg, border: `0.5px solid ${cfg.border}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 }}>
                    {cfg.icon}
                    <span style={{ position: "absolute", bottom: -2, right: -2, fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 4, background: cfg.extBg, color: "#fff", letterSpacing: "0.05em", lineHeight: "14px" }}>
                        {cfg.extLabel}
                    </span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 500, color: "#333", textAlign: "center", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.4 }}>
                    {displayName}
                </div>
                {!isPdf && (
                    <div style={{ display: "flex", gap: 6 }}>
                        <Button size="small" icon={<FileTextOutlined />} onClick={(e) => { e.stopPropagation(); onPreview(fileUrl, fileName); }} style={{ fontSize: 11, borderRadius: 6, height: 24 }}>Xem</Button>
                        <Button size="small" icon={<DownloadOutlined />} onClick={(e) => { e.stopPropagation(); handleDownload(); }} style={{ fontSize: 11, borderRadius: 6, height: 24 }}>Tải</Button>
                    </div>
                )}
            </div>
        </Tooltip>
    );
};
// ─── FileSection ──────────────────────────────────────────────────────────────
interface IPreviewState { url: string; ext: string; name: string }
interface IFileSectionProps { fileNames?: string[]; folder?: string }

const FileSection = ({ fileNames = [], folder = "procedures" }: IFileSectionProps) => {
    const [preview, setPreview] = useState<IPreviewState | null>(null);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const isMobile = useIsMobile();

    const fileEntries = fileNames.map((name) => ({ name, url: buildFileUrl(name, folder)! })).filter((f) => f.url);
    if (fileEntries.length === 0) return null;

    const handlePreview = (url: string, fileName: string) => {
        setIframeLoaded(false);
        setPreview({ url, ext: getExt(fileName), name: decodeFileName(fileName) });
    };
    const handleClose = () => { setPreview(null); setIframeLoaded(false); };

    const officeUrl = preview
        ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(preview.url)}`
        : "";

    return (
        <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
                {fileEntries.map((f) => (
                    <FileTile key={f.name} fileName={f.name} fileUrl={f.url} onPreview={handlePreview} />
                ))}
            </div>

            <Modal
                open={!!preview}
                onCancel={handleClose}
                footer={null}
                width="100vw"
                title={null}
                closable={false}
                closeIcon={null}
                style={{ top: 0, margin: 0, padding: 0, maxWidth: "100vw" }}
                styles={{
                    body: { padding: 0, margin: 0, overflow: "hidden" },
                    content: {
                        padding: 0, borderRadius: 0, overflow: "hidden",
                        position: "fixed", inset: 0,
                        width: "100vw", height: "100dvh",
                    },
                    header: { display: "none" },
                    wrapper: { alignItems: "flex-start" },
                    mask: { background: "rgba(0,0,0,0.6)" },
                }}
            >
                {preview?.ext === "pdf" && (
                    <Suspense fallback={
                        <div style={{ height: "100dvh", background: "#f5f5f5", padding: "24px 32px", boxSizing: "border-box" }}>
                            <Skeleton.Button active style={{ width: 220, marginBottom: 20 }} />
                            <Skeleton active paragraph={{ rows: 8 }} />
                        </div>
                    }>
                        <PdfPreviewer url={preview.url} onClose={handleClose} isMobile={isMobile} />
                    </Suspense>
                )}

                {preview && preview.ext !== "pdf" && (
                    <div style={{ position: "relative", width: "100vw", height: "100dvh" }}>
                        <button onClick={handleClose} style={{
                            position: "absolute", top: 12, right: 12, zIndex: 10,
                            width: 34, height: 34, borderRadius: "50%",
                            border: "1px solid rgba(0,0,0,0.12)",
                            background: "rgba(255,255,255,0.95)", color: "#333",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
                        }}>
                            <CloseOutlined style={{ fontSize: 13 }} />
                        </button>
                        {!iframeLoaded && (
                            <div style={{ position: "absolute", inset: 0, zIndex: 5, background: "#f5f5f5", padding: "24px 32px", boxSizing: "border-box" }}>
                                <Skeleton.Button active style={{ width: 220, marginBottom: 20 }} />
                                <Skeleton active paragraph={{ rows: 6 }} style={{ marginBottom: 16 }} />
                                <Skeleton active paragraph={{ rows: 5 }} style={{ marginBottom: 16 }} />
                                <Skeleton active paragraph={{ rows: 4 }} />
                            </div>
                        )}
                        <iframe src={officeUrl} onLoad={() => setIframeLoaded(true)}
                            style={{ width: "100%", height: "100dvh", border: "none", display: "block" }} />
                    </div>
                )}
            </Modal>
        </>
    );
};

export default FileSection;
