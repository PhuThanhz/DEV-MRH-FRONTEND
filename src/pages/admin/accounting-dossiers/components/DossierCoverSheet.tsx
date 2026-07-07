import React from "react";
import { useDossierDocumentsQuery } from "@/hooks/useDossierDocuments";
import type { IAccountingDossier } from "@/types/backend";
import dayjs from "dayjs";

interface DossierCoverSheetProps {
    dossier: IAccountingDossier;
}

const DOSSIER_STATUS_TEXT: Record<string, string> = {
    DRAFT: "Nháp",
    SUBMITTED: "Chờ duyệt",
    IN_REVIEW: "Đang duyệt",
    RETURN_REQUESTED: "Yêu cầu hoàn trả",
    RETURNED: "Đã hoàn trả",
    APPROVED: "Đã duyệt",
    REJECTED: "Đã từ chối",
    TERMINATED: "Đã chấm dứt",
    ARCHIVED: "Đã lưu trữ",
};

const CHECK_STATUS_TEXT: Record<string, string> = {
    PENDING: "Chờ kiểm tra",
    VALID: "Hợp lệ",
    NEED_SUPPLEMENT: "Cần bổ sung",
    INVALID: "Không hợp lệ",
    NOT_REQUIRED: "Không yêu cầu",
};

const DossierCoverSheet: React.FC<DossierCoverSheetProps> = ({ dossier }) => {
    const { data: docs = [] } = useDossierDocumentsQuery(dossier.id);

    return (
        <>
            <style>{`
                .dossier-cover-sheet-print {
                    display: none;
                }

                @media print {
                    /* Ẩn toàn bộ ứng dụng chính */
                    body * {
                        visibility: hidden;
                    }
                    /* Chỉ hiển thị phiếu bìa */
                    .dossier-cover-sheet-print,
                    .dossier-cover-sheet-print * {
                        visibility: visible;
                    }
                    .dossier-cover-sheet-print {
                        display: block !important;
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 180mm; /* Đảm bảo vừa trang A4 đứng (210mm rộng trừ đi lề) */
                        margin: 0 auto;
                        padding: 10mm 15mm;
                        font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
                        color: #111827;
                        background: #fff;
                    }
                    @page {
                        size: A4;
                        margin: 15mm 10mm 15mm 15mm; /* Căn chỉnh lề trang in */
                    }
                    
                    /* Định dạng bảng khi in */
                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th, td {
                        border: 1px solid #d1d5db !important;
                        padding: 8px 6px;
                        font-size: 11px;
                        text-align: left;
                    }
                    th {
                        background-color: #f3f4f6 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        font-weight: bold;
                    }
                }
            `}</style>

            <div className="dossier-cover-sheet-print">
                {/* Header Row: Title & QR */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30 }}>
                    <div style={{ flex: 1, paddingRight: 20 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", color: "#374151", marginBottom: 4 }}>
                            {dossier.company?.name || "TẬP ĐOÀN LOTUS GROUP"}
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", marginBottom: 16 }}>
                            Bộ phận: {dossier.department?.name || "Phòng Kế toán"}
                        </div>
                        <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px 0", color: "#111827", letterSpacing: "-0.5px" }}>
                            PHIẾU BÌA BỘ CHỨNG TỪ KẾ TOÁN
                        </h1>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 12, color: "#4b5563" }}>Mã hồ sơ:</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: "#be185d" }}>
                                {dossier.dossierCode || `BCT-${dossier.id}`}
                            </span>
                        </div>
                    </div>

                    {dossier.qrCode && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                            <img
                                src={`data:image/png;base64,${dossier.qrCode}`}
                                alt="Dossier QR Code"
                                style={{ width: 100, height: 100, border: "1px solid #e5e7eb", borderRadius: 8 }}
                            />
                            <span style={{ fontSize: 9, color: "#9ca3af", marginTop: 4, fontWeight: 500 }}>
                                Quét tra cứu hồ sơ
                            </span>
                        </div>
                    )}
                </div>

                {/* Metadata sections */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", background: "#f9fafb", padding: 14, borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 24 }}>
                    <div>
                        <span style={{ fontSize: 11, color: "#6b7280", display: "block" }}>Nội dung hồ sơ</span>
                        <strong style={{ fontSize: 13, color: "#1f2937" }}>{dossier.content}</strong>
                    </div>
                    <div>
                        <span style={{ fontSize: 11, color: "#6b7280", display: "block" }}>Trạng thái hiện tại</span>
                        <strong style={{ fontSize: 13, color: "#be185d" }}>
                            {DOSSIER_STATUS_TEXT[dossier.status] || dossier.status}
                        </strong>
                    </div>
                    <div>
                        <span style={{ fontSize: 11, color: "#6b7280", display: "block" }}>Người lập hồ sơ</span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{dossier.createdBy || "Chưa xác định"}</span>
                    </div>
                    <div>
                        <span style={{ fontSize: 11, color: "#6b7280", display: "block" }}>Ngày lập hồ sơ</span>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>
                            {dossier.createdAt ? dayjs(dossier.createdAt).format("DD/MM/YYYY HH:mm") : "--"}
                        </span>
                    </div>
                </div>

                {/* Child Documents Table */}
                <div style={{ marginBottom: 40 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px 0", color: "#374151", borderBottom: "1.5px solid #be185d", paddingBottom: 6 }}>
                        DANH SÁCH CHỨNG TỪ CHI TIẾT ({docs.length} chứng từ)
                    </h3>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: "5%" }}>STT</th>
                                <th style={{ width: "35%" }}>Tên chứng từ</th>
                                <th style={{ width: "20%" }}>Loại chứng từ</th>
                                <th style={{ width: "15%" }}>Số hóa đơn</th>
                                <th style={{ width: "15%" }}>Nhà cung cấp</th>
                                <th style={{ width: "10%" }}>Số tiền</th>
                                <th style={{ width: "10%" }}>Kiểm tra</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: "center", color: "#9ca3af", fontStyle: "italic" }}>
                                        Chưa có chứng từ đính kèm
                                    </td>
                                </tr>
                            ) : (
                                docs.map((doc, idx) => (
                                    <tr key={doc.id || idx}>
                                        <td style={{ textAlign: "center" }}>{idx + 1}</td>
                                        <td style={{ fontWeight: 600 }}>{doc.documentName}</td>
                                        <td>{doc.accountingCategory?.categoryName || "Chưa chọn"}</td>
                                        <td>{doc.invoiceNumber || "--"}</td>
                                        <td>{doc.partnerName || "--"}</td>
                                        <td style={{ textAlign: "right" }}>
                                            {doc.amount ? `${new Intl.NumberFormat('vi-VN').format(doc.amount)} ${doc.currency || 'VND'}` : "--"}
                                        </td>
                                        <td style={{ textAlign: "center", fontWeight: 600 }}>
                                            {CHECK_STATUS_TEXT[doc.checkStatus || "PENDING"] || doc.checkStatus}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Signatures section */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, textAlign: "center", marginTop: 30 }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>NGƯỜI LẬP HỒ SƠ</div>
                        <div style={{ fontSize: 10, color: "#9ca3af", fontStyle: "italic", marginBottom: 50 }}>(Ký và ghi rõ họ tên)</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>{dossier.createdBy || ""}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>KẾ TOÁN KIỂM TRA</div>
                        <div style={{ fontSize: 10, color: "#9ca3af", fontStyle: "italic", marginBottom: 50 }}>(Ký và ghi rõ họ tên)</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", height: 18 }}></div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>KẾ TOÁN TRƯỞNG</div>
                        <div style={{ fontSize: 10, color: "#9ca3af", fontStyle: "italic", marginBottom: 50 }}>(Ký, đóng dấu hoặc duyệt điện tử)</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", height: 18 }}></div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DossierCoverSheet;
