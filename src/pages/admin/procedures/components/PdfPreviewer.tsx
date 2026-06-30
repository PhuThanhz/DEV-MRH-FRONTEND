import {
    CloseOutlined,
    FilePdfOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
} from "@ant-design/icons";
import { useMemo } from "react";
import { Skeleton } from "antd";
import { SpecialZoomLevel, Worker, Viewer } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import { PDF_WORKER_URL } from "@/config/pdf-worker";

interface IPdfPreviewerProps { url: string; onClose: () => void; isMobile: boolean }

const TBtn = ({
    onClick, disabled = false, danger = false, children, title, type = "button",
}: {
    onClick?: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode; title?: string; type?: "button" | "submit";
}) => (
    <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        title={title}
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

const buildViewerSource = (url: string): { fileUrl: string; httpHeaders?: Record<string, string> } => {
    const token = localStorage.getItem("access_token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

    // URL đã là /api/v1/files/public?... → dùng thẳng, không cần auth
    if (url.includes("/api/v1/files/public")) {
        return { fileUrl: url };
    }

    // URL dạng /api/v1/files/view?... → đã là auth endpoint, chỉ attach token
    if (url.includes("/api/v1/files/view")) {
        return { fileUrl: url, httpHeaders: authHeaders };
    }

    // Legacy: /uploads/... hoặc /storage/... → chuyển sang /files/view với auth
    const match = url.match(/\/(?:uploads|storage)\/(.+)$/);
    if (match) {
        const parts = match[1].split("/");
        const fileName = parts.pop()!;
        const folder = parts.join("/");
        const viewUrl = `${import.meta.env.VITE_BACKEND_URL}/api/v1/files/view?fileName=${encodeURIComponent(fileName)}&folder=${encodeURIComponent(folder)}`;
        return { fileUrl: viewUrl, httpHeaders: authHeaders };
    }

    return { fileUrl: url };
};

const PdfPreviewer = ({ url, onClose, isMobile }: IPdfPreviewerProps) => {
    const defaultScale = isMobile ? SpecialZoomLevel.PageWidth : 0.92;
    const viewerSource = buildViewerSource(url);
    const zoomPluginInstance = useMemo(() => zoomPlugin(), []);
    const { ZoomIn, ZoomOut, CurrentScale } = zoomPluginInstance;

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#fff" }}>
            <div style={{
                minHeight: 50,
                display: "flex", alignItems: "center", gap: 6,
                flexWrap: "wrap",
                padding: "8px 12px",
                background: "#fff",
                borderBottom: "1px solid #e8e8e8",
                flexShrink: 0,
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                zIndex: 2,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <FilePdfOutlined style={{ color: "#ff4d4f", fontSize: 16 }} />
                    <span style={{ color: "#344054", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
                        Xem quy trình nội bộ
                    </span>
                </div>

                <div style={{ flex: 1 }} />

                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <ZoomOut>
                        {(props) => (
                            <TBtn onClick={props.onClick} title="Thu nhỏ">
                                <ZoomOutOutlined style={{ fontSize: 14 }} />
                            </TBtn>
                        )}
                    </ZoomOut>
                    <CurrentScale>
                        {(props) => (
                            <span style={{ fontSize: 12, color: "#555", minWidth: 40, textAlign: "center" }}>
                                {Math.round(props.scale * 100)}%
                            </span>
                        )}
                    </CurrentScale>
                    <ZoomIn>
                        {(props) => (
                            <TBtn onClick={props.onClick} title="Phóng to">
                                <ZoomInOutlined style={{ fontSize: 14 }} />
                            </TBtn>
                        )}
                    </ZoomIn>
                </div>

                <TBtn onClick={onClose} danger title="Đóng">
                    <CloseOutlined style={{ fontSize: 14 }} />
                </TBtn>
            </div>

            <div style={{
                flex: 1,
                overflow: "hidden",
                background: "#e4e4e4",
                padding: isMobile ? "8px 0" : "16px",
                boxSizing: "border-box",
            }}>
                <div style={{
                    width: "100%",
                    maxWidth: isMobile ? "100%" : 900,
                    height: "100%",
                    margin: "0 auto",
                    background: "#fff",
                    borderRadius: isMobile ? 0 : 6,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.13)",
                    overflow: "hidden",
                }}>
                    <Worker workerUrl={PDF_WORKER_URL}>
                        <Viewer
                            fileUrl={viewerSource.fileUrl}
                            httpHeaders={viewerSource.httpHeaders}
                            defaultScale={defaultScale}
                            plugins={[zoomPluginInstance]}
                            transformGetDocumentParams={(params) => ({
                                ...params,
                                disableRange: false,
                                disableStream: false,
                                rangeChunkSize: 262144,
                            })}
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
                            renderError={(error) => {
                                console.error("PDF load error:", error);
                                return (
                                    <div style={{ color: "#ff4d4f", padding: 32, textAlign: "center", background: "#fff1f0", borderRadius: 8, margin: 16 }}>
                                        <FilePdfOutlined style={{ fontSize: 32, marginBottom: 8, display: "block" }} />
                                        <span>Không thể tải file PDF. Vui lòng thử lại.</span>
                                        {error?.message && (
                                            <div style={{ fontSize: 11, color: "#8c1d18", marginTop: 8, fontFamily: "monospace" }}>
                                                Chi tiết: {error.message}
                                            </div>
                                        )}
                                    </div>
                                );
                            }}
                        />
                    </Worker>
                </div>
            </div>
        </div>
    );
};

export default PdfPreviewer;
