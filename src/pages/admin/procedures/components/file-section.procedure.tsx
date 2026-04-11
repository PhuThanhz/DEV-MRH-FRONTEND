import {
    FilePdfOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    FilePptOutlined,
    FileImageOutlined,
    FileUnknownOutlined,
    FileTextOutlined,
    DownloadOutlined,
    LeftOutlined,
    RightOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
    CloseOutlined,
} from "@ant-design/icons";
import { Button, Modal, Skeleton, Tooltip } from "antd";
import { useState, useEffect } from "react";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import "@react-pdf-viewer/core/lib/styles/index.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Hook detect mobile ───────────────────────────────────────────────────────
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(
        typeof window !== "undefined" ? window.innerWidth < 768 : false
    );
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);
    return isMobile;
};

// ─── Toolbar button ───────────────────────────────────────────────────────────
const TBtn = ({
    onClick, disabled = false, danger = false, children,
}: {
    onClick?: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode;
}) => (
    <button
        onClick={onClick}
        disabled={disabled}
        style={{
            width: 34, height: 34, borderRadius: 7,
            border: "1px solid #e0e0e0",
            background: disabled ? "#f5f5f5" : "#fff",
            color: disabled ? "#bbb" : danger ? "#ff4d4f" : "#333",
            cursor: disabled ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: disabled ? "none" : "0 1px 3px rgba(0,0,0,0.07)",
        }}
    >
        {children}
    </button>
);

// ─── PDF Viewer ───────────────────────────────────────────────────────────────
interface IPdfViewerProps { url: string; onClose: () => void; isMobile: boolean }

const PdfViewer = ({ url, onClose, isMobile }: IPdfViewerProps) => {
    const pageNavPlugin = pageNavigationPlugin();
    const zoomPlg = zoomPlugin();

    const { GoToNextPage, GoToPreviousPage, CurrentPageLabel } = pageNavPlugin;
    const { ZoomIn, ZoomOut, CurrentScale } = zoomPlg;

    // ── Scale cố định, không dùng SpecialZoomLevel để tránh bug 200%+ ──
    // Desktop: 1.0 (100%) — PDF A4 hiển thị vừa vặn trong modal full màn hình
    // Mobile:  0.5 (50%)  — vừa với màn hình điện thoại, dễ scroll
    const defaultScale = isMobile ? 0.5 : 1.0;

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#fff" }}>

            {/* ── Toolbar ── */}
            <div style={{
                height: 50, minHeight: 50,
                display: "flex", alignItems: "center", gap: 6,
                padding: "0 12px",
                background: "#fff",
                borderBottom: "1px solid #e8e8e8",
                flexShrink: 0,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                zIndex: 2,
            }}>
                <GoToPreviousPage>
                    {({ onClick, isDisabled }: any) => (
                        <TBtn onClick={onClick} disabled={isDisabled}>
                            <LeftOutlined style={{ fontSize: 13 }} />
                        </TBtn>
                    )}
                </GoToPreviousPage>

                <CurrentPageLabel>
                    {({ currentPage, numberOfPages }: any) => (
                        <span style={{
                            fontSize: 12, color: "#444", fontWeight: 500,
                            minWidth: 60, textAlign: "center",
                            background: "#f5f5f5", borderRadius: 6,
                            padding: "4px 8px", whiteSpace: "nowrap",
                            border: "1px solid #e8e8e8",
                        }}>
                            {currentPage + 1} / {numberOfPages}
                        </span>
                    )}
                </CurrentPageLabel>

                <GoToNextPage>
                    {({ onClick, isDisabled }: any) => (
                        <TBtn onClick={onClick} disabled={isDisabled}>
                            <RightOutlined style={{ fontSize: 13 }} />
                        </TBtn>
                    )}
                </GoToNextPage>

                <div style={{ flex: 1 }} />

                <ZoomOut>
                    {({ onClick }: any) => (
                        <TBtn onClick={onClick}><ZoomOutOutlined style={{ fontSize: 15 }} /></TBtn>
                    )}
                </ZoomOut>

                <CurrentScale>
                    {({ scale }: any) => (
                        <span style={{ fontSize: 12, color: "#555", minWidth: 42, textAlign: "center", whiteSpace: "nowrap" }}>
                            {Math.round(scale * 100)}%
                        </span>
                    )}
                </CurrentScale>

                <ZoomIn>
                    {({ onClick }: any) => (
                        <TBtn onClick={onClick}><ZoomInOutlined style={{ fontSize: 15 }} /></TBtn>
                    )}
                </ZoomIn>

                <div style={{ width: 1, height: 22, background: "#e8e8e8", margin: "0 2px" }} />

                <TBtn onClick={onClose} danger>
                    <CloseOutlined style={{ fontSize: 14 }} />
                </TBtn>
            </div>

            {/* ── PDF content ── */}
            <div style={{
                flex: 1,
                overflow: "auto",
                background: "#e4e4e4",
                padding: isMobile ? "8px 0" : "16px",
                boxSizing: "border-box",
            }}>
                <div style={{
                    // Desktop: giới hạn width hợp lý để PDF A4 @ 100% không tràn
                    // Mobile: full width
                    width: "100%",
                    maxWidth: isMobile ? "100%" : 900,
                    margin: "0 auto",
                    background: "#fff",
                    borderRadius: isMobile ? 0 : 6,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.13)",
                    overflow: "hidden",
                }}>
                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                        <Viewer
                            fileUrl={url}
                            plugins={[pageNavPlugin, zoomPlg]}
                            defaultScale={defaultScale}
                            renderLoader={(percentages) => (
                                <div style={{ padding: "32px 24px", background: "#fff", minHeight: 300, display: "flex", flexDirection: "column", gap: 16 }}>
                                    <Skeleton active paragraph={{ rows: 7 }} />
                                    <div style={{ width: "100%", background: "#e8e8e8", borderRadius: 4, height: 5, overflow: "hidden" }}>
                                        <div style={{ width: `${Math.round(percentages)}%`, background: "#1677ff", height: "100%", transition: "width 0.3s", borderRadius: 4 }} />
                                    </div>
                                    <span style={{ color: "#aaa", fontSize: 12, textAlign: "center" }}>
                                        Đang tải... {Math.round(percentages)}%
                                    </span>
                                </div>
                            )}
                            renderError={() => (
                                <div style={{ color: "#ff4d4f", padding: 32, textAlign: "center", background: "#fff1f0", borderRadius: 8, margin: 16 }}>
                                    <FilePdfOutlined style={{ fontSize: 32, marginBottom: 8, display: "block" }} />
                                    Không thể tải file PDF. Vui lòng thử lại.
                                </div>
                            )}
                        />
                    </Worker>
                </div>
            </div>
        </div>
    );
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
            const axiosInstance = (await import("@/config/axios-customize")).default;
            const response = await axiosInstance.get(fileUrl, { responseType: "blob" }) as any;
            const blob = new Blob([response.data], { type: response.headers?.["content-type"] ?? "application/octet-stream" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = prettyName; a.click();
            window.URL.revokeObjectURL(url);
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
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = "#91caff"; el.style.background = "#f5faff"; }}
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
interface IFileSectionProps { fileNames?: string[] }

const FileSection = ({ fileNames = [] }: IFileSectionProps) => {
    const [preview, setPreview] = useState<IPreviewState | null>(null);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const isMobile = useIsMobile();

    const fileEntries = fileNames.map((name) => ({ name, url: buildFileUrl(name)! })).filter((f) => f.url);
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
                    <PdfViewer url={preview.url} onClose={handleClose} isMobile={isMobile} />
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