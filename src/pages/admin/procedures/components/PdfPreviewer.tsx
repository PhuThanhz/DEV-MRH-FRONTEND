import { useState } from "react";
import {
    ColumnWidthOutlined,
    CloseOutlined,
    FileSearchOutlined,
    FilePdfOutlined,
    LeftOutlined,
    RotateLeftOutlined,
    RotateRightOutlined,
    RightOutlined,
    SearchOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
} from "@ant-design/icons";
import { Skeleton } from "antd";
import { RotateDirection, SpecialZoomLevel, Worker, Viewer } from "@react-pdf-viewer/core";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { rotatePlugin } from "@react-pdf-viewer/rotate";
import { searchPlugin } from "@react-pdf-viewer/search";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/search/lib/styles/index.css";
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

const PdfPreviewer = ({ url, onClose, isMobile }: IPdfPreviewerProps) => {
    const [pageInput, setPageInput] = useState("1");
    const [numberOfPages, setNumberOfPages] = useState(0);

    const pageNavPlugin = pageNavigationPlugin();
    const rotatePlg = rotatePlugin();
    const searchPlg = searchPlugin();
    const zoomPlg = zoomPlugin();

    const { GoToNextPage, GoToPreviousPage, CurrentPageLabel } = pageNavPlugin;
    const { Rotate } = rotatePlg;
    const { Search } = searchPlg;
    const { ZoomIn, ZoomOut, CurrentScale } = zoomPlg;
    const defaultScale = SpecialZoomLevel.PageWidth;

    const jumpToInputPage = () => {
        const page = Number.parseInt(pageInput, 10);
        if (!Number.isFinite(page) || page < 1 || (numberOfPages > 0 && page > numberOfPages)) {
            setPageInput("1");
            pageNavPlugin.jumpToPage(0);
            return;
        }
        pageNavPlugin.jumpToPage(page - 1);
    };

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
                <GoToPreviousPage>
                    {({ onClick, isDisabled }: any) => (
                        <TBtn onClick={onClick} disabled={isDisabled}>
                            <LeftOutlined style={{ fontSize: 13 }} />
                        </TBtn>
                    )}
                </GoToPreviousPage>

                <CurrentPageLabel>
                    {({ currentPage, numberOfPages }: any) => (
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                jumpToInputPage();
                            }}
                            style={{
                                display: "flex", alignItems: "center", gap: 5,
                                fontSize: 12, color: "#444", fontWeight: 500,
                                whiteSpace: "nowrap",
                            }}
                        >
                            <input
                                aria-label="Nhập số trang"
                                value={pageInput}
                                onChange={(event) => setPageInput(event.target.value.replace(/\D/g, "").slice(0, 4))}
                                onBlur={() => {
                                    if (!pageInput) setPageInput(String(currentPage + 1));
                                }}
                                style={{
                                    width: 42,
                                    height: 28,
                                    border: "1px solid #e0e0e0",
                                    borderRadius: 6,
                                    textAlign: "center",
                                    fontSize: 12,
                                    color: "#333",
                                    outline: "none",
                                }}
                            />
                            <span style={{
                                color: "#667085",
                                minWidth: 34,
                            }}>
                                / {numberOfPages}
                            </span>
                        </form>
                    )}
                </CurrentPageLabel>

                <GoToNextPage>
                    {({ onClick, isDisabled }: any) => (
                        <TBtn onClick={onClick} disabled={isDisabled}>
                            <RightOutlined style={{ fontSize: 13 }} />
                        </TBtn>
                    )}
                </GoToNextPage>

                <Search>
                    {({
                        clearKeyword,
                        currentMatch,
                        isDocumentLoaded,
                        jumpToNextMatch,
                        jumpToPreviousMatch,
                        numberOfMatches,
                        search,
                        setKeyword,
                    }: any) => (
                        <form
                            onSubmit={async (event) => {
                                event.preventDefault();
                                await search();
                            }}
                            style={{
                                display: "flex", alignItems: "center", gap: 4,
                                minWidth: isMobile ? 180 : 240,
                                maxWidth: isMobile ? "100%" : 320,
                                flex: isMobile ? "1 1 100%" : "0 1 320px",
                            }}
                        >
                            <div style={{
                                height: 34,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                flex: 1,
                                minWidth: 150,
                                padding: "0 9px",
                                border: "1px solid #e0e0e0",
                                borderRadius: 7,
                                background: "#fff",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            }}>
                                <FileSearchOutlined style={{ color: "#667085", fontSize: 14, flexShrink: 0 }} />
                                <input
                                    aria-label="Tìm trong PDF"
                                    disabled={!isDocumentLoaded}
                                    placeholder="Tìm trong PDF"
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setKeyword(value);
                                        if (!value) clearKeyword();
                                    }}
                                    style={{
                                        border: "none",
                                        outline: "none",
                                        width: "100%",
                                        minWidth: 0,
                                        fontSize: 12,
                                        color: "#333",
                                        background: "transparent",
                                    }}
                                />
                                <span style={{ fontSize: 11, color: "#98a2b3", whiteSpace: "nowrap" }}>
                                    {numberOfMatches > 0 ? `${currentMatch}/${numberOfMatches}` : "0"}
                                </span>
                            </div>
                            <TBtn type="submit" title="Tìm" disabled={!isDocumentLoaded}>
                                <SearchOutlined style={{ fontSize: 14 }} />
                            </TBtn>
                            <TBtn
                                onClick={jumpToPreviousMatch}
                                disabled={!numberOfMatches}
                                title="Kết quả trước"
                            >
                                <LeftOutlined style={{ fontSize: 12 }} />
                            </TBtn>
                            <TBtn
                                onClick={jumpToNextMatch}
                                disabled={!numberOfMatches}
                                title="Kết quả sau"
                            >
                                <RightOutlined style={{ fontSize: 12 }} />
                            </TBtn>
                        </form>
                    )}
                </Search>

                <div style={{ flex: 1 }} />

                <TBtn onClick={() => zoomPlg.zoomTo(SpecialZoomLevel.PageWidth)} title="Vừa chiều ngang">
                    <ColumnWidthOutlined style={{ fontSize: 15 }} />
                </TBtn>

                <TBtn onClick={() => zoomPlg.zoomTo(SpecialZoomLevel.PageFit)} title="Vừa trang">
                    <span style={{ fontSize: 11, fontWeight: 700 }}>1:1</span>
                </TBtn>

                <Rotate direction={RotateDirection.Backward}>
                    {({ onClick }: any) => (
                        <TBtn onClick={onClick} title="Xoay trái">
                            <RotateLeftOutlined style={{ fontSize: 15 }} />
                        </TBtn>
                    )}
                </Rotate>

                <Rotate direction={RotateDirection.Forward}>
                    {({ onClick }: any) => (
                        <TBtn onClick={onClick} title="Xoay phải">
                            <RotateRightOutlined style={{ fontSize: 15 }} />
                        </TBtn>
                    )}
                </Rotate>

                <div style={{ width: 1, height: 22, background: "#e8e8e8", margin: "0 2px" }} />

                <ZoomOut>
                    {({ onClick }: any) => (
                        <TBtn onClick={onClick}><ZoomOutOutlined style={{ fontSize: 15 }} /></TBtn>
                    )}
                </ZoomOut>

                <CurrentScale>
                    {({ scale }: any) => (
                        <span style={{
                            fontSize: 12, color: "#555", minWidth: 42, textAlign: "center", whiteSpace: "nowrap",
                            background: "#f5f5f5", borderRadius: 6,
                            padding: "4px 8px",
                            border: "1px solid #e8e8e8",
                        }}>
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
                            plugins={[pageNavPlugin, searchPlg, rotatePlg, zoomPlg]}
                            defaultScale={defaultScale}
                            onDocumentLoad={(event) => {
                                setNumberOfPages(event.doc.numPages);
                                setPageInput("1");
                            }}
                            onPageChange={(event) => setPageInput(String(event.currentPage + 1))}
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
