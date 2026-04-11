import { Modal, Tag, Divider } from "antd";
import { CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import type { IDepartmentCompleteness } from "@/types/backend";

interface Props {
    open: boolean;
    onClose: () => void;
    record: IDepartmentCompleteness;
    criteria: { key: keyof IDepartmentCompleteness; label: string }[];
}

const ViewDepartmentCompleteness = ({ open, onClose, record, criteria }: Props) => {
    const pct = Math.round((record.score / 7) * 100);
    const barColor =
        record.score === 7 ? "#52c41a"
            : record.score === 0 ? "#e8e8e8"
                : record.score < 4 ? "#faad14"
                    : "#1677ff";

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={480}
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
            destroyOnClose
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
                            color:
                                record.score === 7 ? "#389e0d"
                                    : record.score < 4 ? "#cf1322"
                                        : "#d48806",
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
                            background: barColor,
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
                    return (
                        <div
                            key={String(c.key)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "10px 14px",
                                borderRadius: 8,
                                border: `0.5px solid ${done ? "#b7eb8f" : "#ffccc7"}`,
                                background: done ? "#f6ffed" : "#fff1f0",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {done
                                    ? <CheckCircleFilled style={{ color: "#52c41a", fontSize: 15 }} />
                                    : <CloseCircleFilled style={{ color: "#ff4d4f", fontSize: 15 }} />
                                }
                                <span style={{ fontSize: 13, fontWeight: 500, color: "#262626" }}>
                                    {c.label}
                                </span>
                            </div>
                            <Tag
                                style={{
                                    margin: 0,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    borderRadius: 4,
                                    ...(done
                                        ? { background: "#d9f7be", color: "#237804", border: "1px solid #b7eb8f" }
                                        : { background: "#ffccc7", color: "#a8071a", border: "1px solid #ffa39e" }
                                    ),
                                }}
                            >
                                {done ? "Đã thiết lập" : "Chưa có"}
                            </Tag>
                        </div>
                    );
                })}
            </div>
        </Modal>
    );
};

export default ViewDepartmentCompleteness;