import { FileTextOutlined } from "@ant-design/icons";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { PDF_WORKER_URL } from "@/config/pdf-worker";

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

const InlinePdfViewer = ({ fileUrl, onOpen, onDownload }: { fileUrl: string; onOpen: () => void; onDownload: () => void }) => {
    const viewerSource = buildViewerSource(fileUrl);
    return (
        <div style={{ width: "100%", height: "100%", minHeight: 560, background: "#f3f4f6" }}>
            <Worker workerUrl={PDF_WORKER_URL}>
                <Viewer
                    fileUrl={viewerSource.fileUrl}
                    httpHeaders={viewerSource.httpHeaders}
                    transformGetDocumentParams={(params) => ({
                        ...params,
                        disableRange: false,
                        disableStream: false,
                        rangeChunkSize: 262144,
                    })}
                    renderError={(error) => {
                        console.error("Inline PDF load error:", error);
                        return (
                            <div style={{ height: "100%", minHeight: 420, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
                                <div>
                                    <FileTextOutlined style={{ fontSize: 42, color: "#f87171", marginBottom: 12 }} />
                                    <div style={{ fontSize: 14, fontWeight: 650, color: "#2f3746", marginBottom: 6 }}>Không thể tải file PDF</div>
                                    <div style={{ fontSize: 13, color: "#667085", maxWidth: 360, lineHeight: 1.5, marginBottom: 14 }}>
                                        File có thể chưa tồn tại trong kho lưu trữ hoặc đường dẫn đính kèm chưa đúng.
                                    </div>
                                    {error?.message && (
                                        <div style={{ fontSize: 12, color: "#8c1d18", fontFamily: "monospace", marginBottom: 14 }}>
                                            Chi tiết: {error.message}
                                        </div>
                                    )}
                                    <div style={{ display: "inline-flex", gap: 8 }}>
                                        <button onClick={onOpen} style={actionButtonStyle}>Mở file</button>
                                        <button onClick={onDownload} style={actionButtonStyle}>Tải xuống</button>
                                    </div>
                                </div>
                            </div>
                        );
                    }}
                />
            </Worker>
        </div>
    );
};

const actionButtonStyle: React.CSSProperties = {
    padding: "8px 14px",
    borderRadius: 7,
    border: "1px solid #ebebeb",
    background: "#ffffff",
    color: "#2f3746",
    fontWeight: 650,
    cursor: "pointer",
};

export default InlinePdfViewer;
