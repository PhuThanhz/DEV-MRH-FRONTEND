import { Modal, Tag, Divider, Button } from "antd";
import { CheckCircleFilled, CloseCircleFilled, ArrowRightOutlined } from "@ant-design/icons";
import type { IDepartmentCompleteness } from "@/types/backend";
import { getModalWidth } from "@/utils/responsive";
import { useDepartmentProfileNavigation } from "./useDepartmentProfileNavigation";
import { getScoreStyle } from "./departmentProfileCriteria";

interface Props {
    open: boolean;
    onClose: () => void;
    record: IDepartmentCompleteness;
    criteria: { key: keyof IDepartmentCompleteness; label: string }[];
}

const ViewDepartmentCompleteness = ({ open, onClose, record, criteria }: Props) => {
    const pct = Math.round((record.score / 7) * 100);
    const scoreStyle = getScoreStyle(record.score);
    const { hasPermission, navigateToCriterion } = useDepartmentProfileNavigation();

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={getModalWidth(480)}
            title={
                <div>
                    <div style={{ fontWeight: 600, fontSize: 15, color: "#262626" }}>
                        {record.departmentName}
                    </div>
                    <div style={{ fontSize: 12, color: "#8c8c8c", fontWeight: 400, marginTop: 2 }}>
                        {record.companyName}
                    </div>
                </div>
            }
            destroyOnHidden
        >
            {/* Score summary */}
            <div
                style={{
                    background: "#fafafa",
                    border: "0.5px solid #f0f0f0",
                    borderRadius: 10,
                    padding: "16px 18px",
                    marginBottom: 20,
                    marginTop: 4,
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: "#595959" }}>Mức độ hoàn thiện hồ sơ</span>
                    <span
                        style={{
                            fontWeight: 700,
                            fontSize: 16,
                            color: scoreStyle.color,
                        }}
                    >
                        {record.score}/7
                    </span>
                </div>

                {/* Progress bar lớn */}
                <div
                    style={{
                        height: 8,
                        background: "#f0f0f0",
                        borderRadius: 99,
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: scoreStyle.barColor,
                            borderRadius: 99,
                            transition: "width .5s",
                        }}
                    />
                </div>

                <div style={{ marginTop: 8, fontSize: 11, color: "#8c8c8c" }}>
                    {record.score === 7
                        ? "Hồ sơ đầy đủ, không cần bổ sung thêm."
                        : `Còn ${7 - record.score} hạng mục chưa được thiết lập.`}
                </div>
            </div>

            <Divider style={{ margin: "0 0 16px" }} />

            {/* Chi tiết từng tiêu chí */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {criteria.map((c) => {
                    const done = !!record[c.key];
                    const permitted = hasPermission(c.key);
                    return (
                        <div
                            key={String(c.key)}
                            onClick={permitted ? () => {
                                onClose();
                                navigateToCriterion(c.key, record.departmentId, record.departmentName);
                            } : undefined}
                            className="group flex items-center justify-between p-3.5 rounded-lg border border-gray-100/80 transition-all duration-200"
                            style={{
                                cursor: permitted ? "pointer" : "default",
                                background: permitted ? "#ffffff" : "#fbfbfb",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.01)",
                            }}
                            onMouseEnter={(e) => {
                                if (!permitted) return;
                                e.currentTarget.style.borderColor = done ? "#b7eb8f" : "#ffc2d4";
                                e.currentTarget.style.background = done ? "#f6ffed" : "#fff0f4";
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.03)";
                                
                                const btn = e.currentTarget.querySelector(".action-btn") as HTMLElement;
                                if (btn) {
                                    if (done) {
                                        btn.style.borderColor = "#52c41a";
                                        btn.style.color = "#52c41a";
                                        btn.style.background = "#f6ffed";
                                    } else {
                                        btn.style.borderColor = "#f2547d";
                                        btn.style.color = "#ffffff";
                                        btn.style.background = "#f2547d";
                                    }
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!permitted) return;
                                e.currentTarget.style.borderColor = "#f0f0f0";
                                e.currentTarget.style.background = "#ffffff";
                                e.currentTarget.style.boxShadow = "0 1px 2px rgba(0,0,0,0.01)";
                                
                                const btn = e.currentTarget.querySelector(".action-btn") as HTMLElement;
                                if (btn) {
                                    if (done) {
                                        btn.style.borderColor = "#d9d9d9";
                                        btn.style.color = "#595959";
                                        btn.style.background = "#ffffff";
                                    } else {
                                        btn.style.borderColor = "#ffc2d4";
                                        btn.style.color = "#f2547d";
                                        btn.style.background = "#fff0f4";
                                    }
                                }
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                {done ? (
                                    <CheckCircleFilled style={{ color: "#52c41a", fontSize: 16 }} />
                                ) : (
                                    <CloseCircleFilled style={{ color: "#ff4d4f", fontSize: 16 }} />
                                )}
                                <span style={{ fontSize: 14, fontWeight: 500, color: "#262626" }}>
                                    {c.label}
                                </span>
                            </div>

                            {permitted ? (
                                <Button
                                    size="small"
                                    className="action-btn"
                                    style={{
                                        borderRadius: 20,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        height: 28,
                                        padding: "0 12px",
                                        pointerEvents: "none", // Prevent double click event issues
                                        transition: "all 0.2s ease",
                                        ...(done ? {
                                            border: "1px solid #d9d9d9",
                                            background: "#ffffff",
                                            color: "#595959",
                                        } : {
                                            border: "1px solid #ffc2d4",
                                            background: "#fff0f4",
                                            color: "#f2547d",
                                        })
                                    }}
                                >
                                    {done ? "Xem chi tiết" : "Thiết lập"}
                                </Button>
                            ) : (
                                <Tag
                                    style={{
                                        margin: 0,
                                        fontSize: 10,
                                        fontWeight: 600,
                                        borderRadius: 4,
                                        background: "#f5f5f5",
                                        color: "#bfbfbf",
                                        border: "1px solid #d9d9d9",
                                    }}
                                >
                                    Không có quyền
                                </Tag>
                            )}
                        </div>
                    );
                })}
            </div>
        </Modal>
    );
};

export default ViewDepartmentCompleteness;