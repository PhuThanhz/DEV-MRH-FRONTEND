import { Modal, Tag } from "antd";
import dayjs from "dayjs";

interface Props {
    open: boolean;
    record: {
        status?: string;               // ← THÊM — phân biệt REJECTED vs RETURNED
        rejectorName?: string;
        rejectorPosition?: string;
        rejectorDepartment?: string;
        rejectorPositionCode?: string; // ← THÊM — cấp bậc (M1, M2, L3...)
        rejectComment?: string;
        updatedAt?: string;
    } | null;
    onClose: () => void;
}

const ModalRejectReasonJd = ({ open, record, onClose }: Props) => {
    if (!record) return null;

    const isReturned = record.status === "RETURNED";

    // Màu theo loại
    const accentColor = isReturned ? "#b45309" : "#A32D2D";
    const accentBg = isReturned ? "#fffbeb" : "#FCEBEB";
    const accentBorder = isReturned ? "#fcd34d" : "#F7C1C1";
    const titleBarColor = isReturned ? "#f59e0b" : "#E24B4A";
    const titleText = isReturned ? "Lý do hoàn trả" : "Lý do từ chối";
    const labelText = isReturned ? "Nội dung hoàn trả" : "Nội dung từ chối";
    const timeText = isReturned ? "Hoàn trả lúc" : "Từ chối lúc";

    const initials = record.rejectorName
        ?.split(" ")
        .slice(-2)
        .map((w) => w[0])
        .join("")
        .toUpperCase() ?? "?";

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={460}
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 3, height: 18,
                        borderRadius: 0,
                        background: titleBarColor,
                        flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 15, fontWeight: 500 }}>{titleText}</span>
                </div>
            }
        >
            <div style={{ padding: "4px 0 8px" }}>
                {/* Card người từ chối / hoàn trả */}
                {record.rejectorName && (
                    <div style={{
                        background: "#fafafa",
                        borderRadius: 10,
                        border: "0.5px solid #f0f0f0",
                        padding: "14px 16px",
                        marginBottom: 16,
                    }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            {/* Avatar initials */}
                            <div style={{
                                width: 40, height: 40, borderRadius: "50%",
                                background: accentBg,
                                border: `0.5px solid ${accentBorder}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 14, fontWeight: 500, color: accentColor,
                                flexShrink: 0,
                            }}>
                                {initials}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                {/* Tên + chức danh */}
                                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                    <span style={{ fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>
                                        {record.rejectorName}
                                    </span>
                                    {record.rejectorPosition && (
                                        <Tag color="purple" style={{ margin: 0, fontSize: 11 }}>
                                            {record.rejectorPosition}
                                        </Tag>
                                    )}
                                    {/* Cấp bậc — M1, M2, L3... */}
                                    {record.rejectorPositionCode && (
                                        <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                                            {record.rejectorPositionCode}
                                        </Tag>
                                    )}
                                </div>

                                {/* Phòng ban */}
                                {record.rejectorDepartment && (
                                    <div style={{ marginTop: 3 }}>
                                        <span style={{ fontSize: 12, color: "#888" }}>
                                            {record.rejectorDepartment}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Label */}
                <div style={{
                    fontSize: 11, fontWeight: 600, color: "#aaa",
                    textTransform: "uppercase", letterSpacing: "0.05em",
                    marginBottom: 6,
                }}>
                    {labelText}
                </div>

                {/* Nội dung */}
                <div style={{
                    fontSize: 13,
                    color: isReturned ? "#78350f" : "#791F1F",
                    background: accentBg,
                    border: `0.5px solid ${accentBorder}`,
                    borderRadius: 8,
                    padding: "14px 16px",
                    lineHeight: 1.8,
                    whiteSpace: "pre-wrap",
                }}>
                    {record.rejectComment ?? "—"}
                </div>

                {/* Timestamp */}
                {record.updatedAt && (
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#ddd" }} />
                        <span style={{ fontSize: 11, color: "#bbb" }}>
                            {timeText} {dayjs(record.updatedAt).format("HH:mm · DD/MM/YYYY")}
                        </span>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ModalRejectReasonJd;