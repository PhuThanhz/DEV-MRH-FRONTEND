import {
    CloseOutlined,
    DownloadOutlined,
    FilePdfOutlined,
    LeftOutlined,
    RightOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
} from "@ant-design/icons";
import { Skeleton } from "antd";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { PDF_WORKER_URL } from "@/config/pdf-worker";
import { downloadUrlAsBlob, getFileNameFromUrl } from "@/config/download-url";

interface IPdfPreviewerProps { url: string; onClose: () => void; isMobile: boolean }

const TBtn = ({
    onClick, disabled = false, danger = false, children, title,
}: {
    onClick?: () => void; disabled?: boolean; danger?: boolean; children: React.ReactNode; title?: string;
}) => (
    <button
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

const PdfPreviewer = ({ url, onClose, isMobile }: IPdfPreviewerProps) => {
    const pageNavPlugin = pageNavigationPlugin();
    const zoomPlg = zoomPlugin();

    const { GoToNextPage, GoToPreviousPage, CurrentPageLabel } = pageNavPlugin;
    const { ZoomIn, ZoomOut, CurrentScale } = zoomPlg;
    const defaultScale = isMobile ? 0.5 : 1.0;

    const handleDownload = async () => {
        try {
            await downloadUrlAsBlob(url, getFileNameFromUrl(url));
        } catch (error) {
            console.error("Download failed", error);
            window.open(url, "_blank", "noopener,noreferrer");
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#fff" }}>
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

                <TBtn onClick={handleDownload} title="Tải xuống">
                    <DownloadOutlined style={{ fontSize: 14 }} />
                </TBtn>

                <TBtn onClick={onClose} danger title="Đóng">
                    <CloseOutlined style={{ fontSize: 14 }} />
                </TBtn>
            </div>

            <div style={{
                flex: 1,
                overflow: "auto",
                background: "#e4e4e4",
                padding: isMobile ? "8px 0" : "16px",
                boxSizing: "border-box",
            }}>
                <div style={{
                    width: "100%",
                    maxWidth: isMobile ? "100%" : 900,
                    margin: "0 auto",
                    background: "#fff",
                    borderRadius: isMobile ? 0 : 6,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.13)",
                    overflow: "hidden",
                }}>
                    <Worker workerUrl={PDF_WORKER_URL}>
                        <Viewer
                            fileUrl={url}
                            plugins={[pageNavPlugin, zoomPlg]}
                            defaultScale={defaultScale}
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

export default PdfPreviewer;
