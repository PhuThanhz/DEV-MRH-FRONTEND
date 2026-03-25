import { Modal } from "antd";
import type { IJdInbox } from "@/types/backend";

interface Props {
    open: boolean;
    record: IJdInbox | null;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ModalIssueJd = ({ open, record, loading, onConfirm, onCancel }: Props) => {
    const code = (record as any)?.code ?? "";

    return (
        <Modal
            open={open}
            onCancel={onCancel}
            footer={null}
            closable={false}
            width={460}
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
                <div
                    style={{
                        background: "linear-gradient(135deg, #0958d9 0%, #1677ff 100%)",
                        padding: "28px 32px 24px",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Decorative circles */}
                    <div
                        style={{
                            position: "absolute",
                            top: -20,
                            right: -20,
                            width: 120,
                            height: 120,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.08)",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            bottom: -30,
                            right: 40,
                            width: 80,
                            height: 80,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.06)",
                        }}
                    />

                    {/* Icon */}
                    <div
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: 14,
                            background: "rgba(255,255,255,0.18)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 14,
                            backdropFilter: "blur(4px)",
                        }}
                    >
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                            <path
                                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                stroke="#fff"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>

                    <div
                        style={{
                            color: "#fff",
                            fontSize: 18,
                            fontWeight: 700,
                            letterSpacing: "-0.3px",
                            lineHeight: 1.3,
                        }}
                    >
                        Xác nhận ban hành JD
                    </div>
                    <div
                        style={{
                            color: "rgba(255,255,255,0.75)",
                            fontSize: 13,
                            marginTop: 4,
                        }}
                    >
                        Hành động này không thể hoàn tác
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: "24px 32px" }}>
                    {/* JD info card */}
                    <div
                        style={{
                            background: "#f6f8ff",
                            border: "1px solid #d6e4ff",
                            borderRadius: 10,
                            padding: "14px 18px",
                            marginBottom: 18,
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                        }}
                    >
                        <div
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 10,
                                background: "#e6f0ff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                    stroke="#1677ff"
                                    strokeWidth="1.6"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: "#8c8c8c", marginBottom: 2 }}>
                                Mã bản mô tả công việc
                            </div>
                            <div
                                style={{ fontSize: 15, fontWeight: 700, color: "#0958d9" }}
                            >
                                {code || "—"}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: 14, color: "#434343", lineHeight: 1.65, margin: 0 }}>
                        Sau khi ban hành, tài liệu sẽ chuyển sang trạng thái{" "}
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "#f6ffed",
                                border: "1px solid #b7eb8f",
                                borderRadius: 4,
                                padding: "1px 8px",
                                color: "#389e0d",
                                fontWeight: 600,
                                fontSize: 12,
                            }}
                        >
                            ✓ Đã ban hành
                        </span>{" "}
                        và sẽ <strong>không thể chỉnh sửa</strong> thêm.
                    </p>
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: "16px 32px 24px",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 10,
                        borderTop: "1px solid #f0f0f0",
                    }}
                >
                    <button
                        onClick={onCancel}
                        style={{
                            padding: "8px 20px",
                            borderRadius: 8,
                            border: "1px solid #d9d9d9",
                            background: "#fff",
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#595959",
                            cursor: "pointer",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "#1677ff";
                            (e.currentTarget as HTMLButtonElement).style.color = "#1677ff";
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = "#d9d9d9";
                            (e.currentTarget as HTMLButtonElement).style.color = "#595959";
                        }}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            padding: "8px 24px",
                            borderRadius: 8,
                            border: "none",
                            background: loading
                                ? "#91caff"
                                : "linear-gradient(135deg, #0958d9 0%, #1677ff 100%)",
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#fff",
                            cursor: loading ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            boxShadow: loading ? "none" : "0 4px 12px rgba(22,119,255,0.35)",
                            transition: "all 0.2s",
                        }}
                    >
                        {loading && (
                            <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                style={{ animation: "spin 0.8s linear infinite" }}
                            >
                                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                                <path d="M12 2a10 10 0 0110 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                        )}
                        {loading ? "Đang xử lý..." : "Xác nhận ban hành"}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
        </Modal>
    );
};

export default ModalIssueJd;