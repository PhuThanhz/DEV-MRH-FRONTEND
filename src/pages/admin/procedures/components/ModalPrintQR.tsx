import { useRef } from "react";
import { Modal, Button, Flex, Typography, Tag, Tooltip } from "antd";
import { PrinterOutlined, QrcodeOutlined, WarningOutlined } from "@ant-design/icons";
import type { IProcedure } from "@/types/backend";
import { getModalWidth, MODAL_BODY_SCROLL } from "@/utils/responsive";

const { Text } = Typography;

interface IProps {
    open: boolean;
    onClose: () => void;
    procedures: IProcedure[];
}

const ModalPrintQR = ({ open, onClose, procedures }: IProps) => {
    const printRef = useRef<HTMLDivElement>(null);

    const withQr = procedures.filter(p => p.qrCode);
    const withoutQr = procedures.filter(p => !p.qrCode);

    const handlePrint = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        const cells = withQr.map(p => `
            <div class="cell">
                <img src="data:image/png;base64,${p.qrCode}" alt="${p.procedureCode ?? ""}" />
                <div class="code">${p.procedureCode ?? ""}</div>
                <div class="name">${p.procedureName ?? ""}</div>
            </div>
        `).join("");

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8" />
                <title>In mã QR quy trình</title>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    @page { size: A4 portrait; margin: 12mm 10mm; }
                    body { font-family: Arial, sans-serif; background: white; }

                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 6mm;
                        padding-bottom: 3mm;
                        border-bottom: 0.5px solid #ddd;
                    }
                    .header-title { font-size: 13pt; font-weight: bold; color: #111; }
                    .header-sub { font-size: 8pt; color: #666; margin-top: 1mm; }
                    .header-date { font-size: 8pt; color: #888; text-align: right; }

                    .grid {
                        display: grid;
                        grid-template-columns: repeat(6, 1fr);
                        gap: 3mm;
                    }

                    .cell {
                        border: 0.5px solid #d1d5db;
                        border-radius: 2mm;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: flex-start;
                        padding: 2.5mm 2mm 2mm;
                        page-break-inside: avoid;
                        background: #fff;
                    }
                    .cell img { width: 26mm; height: 26mm; display: block; }
                    .cell .code {
                        font-size: 6pt; font-family: monospace; font-weight: bold;
                        margin-top: 1.5mm; text-align: center; color: #e8256b;
                        max-width: 34mm; overflow: hidden;
                        white-space: nowrap; text-overflow: ellipsis;
                    }
                    .cell .name {
                        font-size: 5pt; color: #374151; text-align: center;
                        max-width: 34mm; margin-top: 1mm; line-height: 1.45;
                        display: -webkit-box; -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical; overflow: hidden;
                    }

                    .footer {
                        margin-top: 5mm; padding-top: 2mm;
                        border-top: 0.5px solid #eee;
                        font-size: 7pt; color: #9ca3af; text-align: center;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="header-title">Danh sách mã QR quy trình</div>
                        <div class="header-sub">${withQr.length} quy trình · Kích thước mỗi ô ~40×45mm</div>
                    </div>
                    <div class="header-date">
                        In ngày: ${new Date().toLocaleDateString("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric",
        })}
                    </div>
                </div>
                <div class="grid">${cells}</div>
                <div class="footer">Tài liệu nội bộ — Vui lòng không phân phát ra ngoài</div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 400);
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            title={
                <Flex align="center" gap={10}>
                    <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: "linear-gradient(135deg,#fff0f6,#ffd6e7)",
                        border: "1.5px solid #ff85c0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <QrcodeOutlined style={{ fontSize: 19, color: "#e8256b" }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
                            In mã QR quy trình
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 400 }}>
                            {withQr.length} quy trình có mã QR
                            {withoutQr.length > 0 && (
                                <span style={{ color: "#d97706", marginLeft: 6 }}>
                                    · {withoutQr.length} không có QR
                                </span>
                            )}
                        </div>
                    </div>
                </Flex>
            }
            width={getModalWidth(920)}
            centered
            styles={{
                header: { paddingBottom: 16, borderBottom: "1px solid #f3f4f6" },
                body: { ...MODAL_BODY_SCROLL, paddingTop: 20 },
            }}
        >
            {/* Cảnh báo nếu có quy trình không có QR */}
            {withoutQr.length > 0 && (
                <div style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                    background: "#fffbeb", border: "1px solid #fde68a",
                    borderRadius: 10, padding: "10px 14px",
                    marginBottom: 16, fontSize: 12, color: "#92400e",
                }}>
                    <WarningOutlined style={{ color: "#d97706", fontSize: 14, marginTop: 1, flexShrink: 0 }} />
                    <div>
                        <span style={{ fontWeight: 600 }}>Các mã sau không có QR và sẽ bị bỏ qua: </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                            {withoutQr.map(p => (
                                <Tag key={p.id} color="orange" style={{ fontSize: 11, margin: 0 }}>
                                    {p.procedureCode}
                                </Tag>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Preview grid */}
            <div style={{
                border: "1px solid #e5e7eb", borderRadius: 12,
                background: "#f9fafb", marginBottom: 20,
                maxHeight: 500, overflowY: "auto",
                padding: withQr.length === 0 ? 0 : 16,
            }}>
                {withQr.length === 0 ? (
                    <Flex justify="center" align="center" style={{ height: 140 }}>
                        <div style={{ textAlign: "center" }}>
                            <QrcodeOutlined style={{ fontSize: 36, color: "#d1d5db", display: "block", marginBottom: 10 }} />
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                Không có quy trình nào có mã QR
                            </Text>
                        </div>
                    </Flex>
                ) : (
                    <div ref={printRef}>
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                            gap: 14,
                        }}>
                            {withQr.map(p => (
                                <Tooltip
                                    key={p.id}
                                    title={
                                        <div style={{ fontSize: 12 }}>
                                            <div style={{ fontWeight: 600, marginBottom: 3 }}>{p.procedureCode}</div>
                                            <div style={{ color: "#fecdd3", lineHeight: 1.5 }}>{p.procedureName}</div>
                                        </div>
                                    }
                                    placement="top"
                                    color="#1f2937"
                                >
                                    <div
                                        style={{
                                            background: "#fff",
                                            border: "1.5px solid #f3f4f6",
                                            borderRadius: 12,
                                            display: "flex", flexDirection: "column", alignItems: "center",
                                            padding: "14px 10px 12px",
                                            boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                                            cursor: "default",
                                            transition: "box-shadow 0.18s, border-color 0.18s",
                                        }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 18px rgba(240,34,110,0.14)";
                                            (e.currentTarget as HTMLDivElement).style.borderColor = "#ffb3cf";
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 6px rgba(0,0,0,0.06)";
                                            (e.currentTarget as HTMLDivElement).style.borderColor = "#f3f4f6";
                                        }}
                                    >
                                        <div style={{
                                            width: 110, height: 110, borderRadius: 8,
                                            overflow: "hidden", border: "1px solid #f0f0f0",
                                            flexShrink: 0, display: "flex",
                                            alignItems: "center", justifyContent: "center",
                                            background: "#fafafa",
                                        }}>
                                            <img
                                                src={`data:image/png;base64,${p.qrCode}`}
                                                style={{ width: 104, height: 104, display: "block" }}
                                                alt={p.procedureCode}
                                            />
                                        </div>

                                        <div style={{
                                            width: "100%", height: 1,
                                            background: "linear-gradient(90deg,transparent,#f0226e33,transparent)",
                                            margin: "10px 0 8px",
                                        }} />

                                        <div style={{
                                            display: "inline-flex", alignItems: "center",
                                            background: "linear-gradient(135deg,#fff0f6,#ffe4ef)",
                                            border: "1px solid #ffb3cf", borderRadius: 20,
                                            padding: "2px 10px", fontSize: 11,
                                            fontFamily: "monospace", fontWeight: 700,
                                            color: "#e8256b", maxWidth: "100%",
                                            overflow: "hidden", whiteSpace: "nowrap",
                                            textOverflow: "ellipsis",
                                        }}>
                                            {p.procedureCode}
                                        </div>

                                        <div style={{
                                            fontSize: 11, color: "#374151", textAlign: "center",
                                            marginTop: 6, width: "100%", lineHeight: 1.5,
                                            display: "-webkit-box",
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: "vertical",
                                            overflow: "hidden", minHeight: 33,
                                        } as React.CSSProperties}>
                                            {p.procedureName}
                                        </div>
                                    </div>
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <Flex justify="space-between" align="center">
                <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "8px 14px", background: "#f3f4f6",
                    borderRadius: 8, fontSize: 12, color: "#6b7280",
                }}>
                    <PrinterOutlined style={{ fontSize: 13 }} />
                    <span>
                        Kích thước in <b style={{ color: "#374151" }}>~40×45mm</b>
                        {" · "}
                        <b style={{ color: "#374151" }}>{withQr.length} ô</b>
                        {" · "}
                        <b style={{ color: "#374151" }}>{Math.ceil(withQr.length / 24)} trang A4</b>
                    </span>
                </div>
                <Flex gap={8}>
                    <Button
                        onClick={onClose}
                        style={{ borderRadius: 8, height: 38, paddingInline: 20 }}
                    >
                        Đóng
                    </Button>
                    <Button
                        icon={<PrinterOutlined />}
                        disabled={withQr.length === 0}
                        onClick={handlePrint}
                        onMouseDown={e => e.currentTarget.blur()}
                        style={{
                            height: 38, borderRadius: 8, paddingInline: 22, fontWeight: 600,
                            background: withQr.length === 0 ? undefined : "linear-gradient(135deg,#f0226e,#ff5fa0)",
                            border: "none",
                            color: withQr.length === 0 ? undefined : "white",
                            boxShadow: withQr.length === 0 ? undefined : "0 2px 10px rgba(240,34,110,0.3)",
                        }}
                    >
                        In ({withQr.length})
                    </Button>
                </Flex>
            </Flex>
        </Modal>
    );
};

export default ModalPrintQR;
