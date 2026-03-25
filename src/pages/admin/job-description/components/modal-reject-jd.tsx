import { useState } from "react";
import { Modal, Input } from "antd";
import type { IJdInbox } from "@/types/backend";

interface Props {
    open: boolean;
    record: IJdInbox | null;
    loading?: boolean;
    isResubmit?: boolean; // ✅ thêm prop này
    onConfirm: (reason: string) => void;
    onCancel: () => void;
}

const ModalRejectJd = ({ open, record, loading, isResubmit = false, onConfirm, onCancel }: Props) => {
    const [reason, setReason] = useState("");
    const code = (record as any)?.code ?? "";
    const maxLength = 500;

    const handleConfirm = () => {
        if (!reason.trim()) return;
        onConfirm(reason);
        setReason("");
    };

    const handleCancel = () => {
        setReason("");
        onCancel();
    };

    // ✅ Thay đổi text theo context
    const title = isResubmit ? "Trả lại JD" : "Từ chối JD";
    const subtitle = isResubmit
        ? "JD sẽ được trả về người gửi trước đó"
        : "Vui lòng cung cấp lý do để người gửi có thể chỉnh sửa";
    const note = isResubmit
        ? "JD sẽ được trả về người đã gửi cho bạn. Họ có thể chỉnh sửa hoặc từ chối tiếp."
        : "Lý do từ chối sẽ được gửi đến người tạo JD để họ có thể chỉnh sửa và gửi lại.";
    const confirmLabel = isResubmit ? "Xác nhận trả lại" : "Xác nhận từ chối";

    return (
        <Modal
            open={open}
            onCancel={handleCancel}
            footer={null}
            closable={false}
            width={480}
            centered
            styles={{
                content: {
                    padding: 0,
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
                },
            }}
        >
            <div style={{ display: "flex", flexDirection: "column" }}>
                {/* Header strip */}
                <div style={{
                    background: isResubmit
                        ? "linear-gradient(135deg, #d46b08 0%, #fa8c16 100%)"
                        : "linear-gradient(135deg, #cf1322 0%, #ff4d4f 100%)",
                    padding: "28px 32px 24px",
                    position: "relative",
                    overflow: "hidden",
                }}>
                    <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
                    <div style={{ position: "absolute", bottom: -30, right: 40, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

                    <div style={{
                        width: 52, height: 52, borderRadius: 14,
                        background: "rgba(255,255,255,0.18)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginBottom: 14, backdropFilter: "blur(4px)",
                    }}>
                        {isResubmit ? (
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                                <path d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                                    stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                                    stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>

                    <div style={{ color: "#fff", fontSize: 18, fontWeight: 700, letterSpacing: "-0.3px", lineHeight: 1.3 }}>
                        {title}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, marginTop: 4 }}>
                        {subtitle}
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: "24px 32px" }}>
                    {/* JD info card */}
                    <div style={{
                        background: isResubmit ? "#fff7e6" : "#fff2f0",
                        border: `1px solid ${isResubmit ? "#ffd591" : "#ffccc7"}`,
                        borderRadius: 10, padding: "14px 18px", marginBottom: 20,
                        display: "flex", alignItems: "center", gap: 12,
                    }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: 10,
                            background: isResubmit ? "#fff1cc" : "#ffebe8",
                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                    stroke={isResubmit ? "#fa8c16" : "#ff4d4f"}
                                    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: "#8c8c8c", marginBottom: 2 }}>Mã bản mô tả công việc</div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: isResubmit ? "#d46b08" : "#cf1322" }}>
                                {code || "—"}
                            </div>
                        </div>
                    </div>

                    {/* Textarea */}
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "#262626", display: "block", marginBottom: 8 }}>
                            Lý do {isResubmit ? "trả lại" : "từ chối"}{" "}
                            <span style={{ color: "#ff4d4f" }}>*</span>
                        </label>

                        <div style={{ position: "relative" }}>
                            <Input.TextArea
                                rows={4}
                                placeholder={isResubmit
                                    ? "Ví dụ: Cần xem xét lại, chưa đủ điều kiện trình duyệt tiếp..."
                                    : "Ví dụ: Mô tả chức danh chưa rõ ràng, cần bổ sung thêm yêu cầu kinh nghiệm..."}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                maxLength={maxLength}
                                showCount={false}
                                style={{ borderRadius: 10, fontSize: 14, resize: "none", paddingBottom: 28 }}
                            />
                            <div style={{
                                position: "absolute", bottom: 8, right: 12, fontSize: 11,
                                color: reason.length > maxLength * 0.9 ? "#ff4d4f" : "#bfbfbf",
                                pointerEvents: "none",
                            }}>
                                {reason.length}/{maxLength}
                            </div>
                        </div>

                        {!reason.trim() && reason.length > 0 && (
                            <div style={{ fontSize: 12, color: "#ff4d4f", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                                Vui lòng nhập lý do
                            </div>
                        )}

                        {/* Note */}
                        <div style={{
                            marginTop: 10, padding: "10px 14px",
                            background: isResubmit ? "#fff7e6" : "#fffbe6",
                            border: `1px solid ${isResubmit ? "#ffd591" : "#ffe58f"}`,
                            borderRadius: 8, fontSize: 12,
                            color: isResubmit ? "#7c5a00" : "#7c5a00",
                            display: "flex", alignItems: "flex-start", gap: 8,
                        }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                                <path d="M12 18h.01M12 6v6" stroke="#d48806" strokeWidth="2" strokeLinecap="round" />
                                <circle cx="12" cy="12" r="10" stroke="#d48806" strokeWidth="1.5" />
                            </svg>
                            {note}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: "16px 32px 24px",
                    display: "flex", justifyContent: "flex-end", gap: 10,
                    borderTop: "1px solid #f0f0f0",
                }}>
                    <button
                        onClick={handleCancel}
                        style={{
                            padding: "8px 20px", borderRadius: 8,
                            border: "1px solid #d9d9d9", background: "#fff",
                            fontSize: 14, fontWeight: 500, color: "#595959", cursor: "pointer",
                        }}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!reason.trim() || loading}
                        style={{
                            padding: "8px 24px", borderRadius: 8, border: "none",
                            background: !reason.trim() || loading
                                ? (isResubmit ? "#ffd591" : "#ffccc7")
                                : isResubmit
                                    ? "linear-gradient(135deg, #d46b08 0%, #fa8c16 100%)"
                                    : "linear-gradient(135deg, #cf1322 0%, #ff4d4f 100%)",
                            fontSize: 14, fontWeight: 600, color: "#fff",
                            cursor: !reason.trim() || loading ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", gap: 8,
                            boxShadow: !reason.trim() || loading ? "none"
                                : isResubmit ? "0 4px 12px rgba(250,140,22,0.35)"
                                    : "0 4px 12px rgba(255,77,79,0.35)",
                            transition: "all 0.2s",
                        }}
                    >
                        {loading ? "Đang xử lý..." : confirmLabel}
                    </button>
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </Modal>
    );
};

export default ModalRejectJd;