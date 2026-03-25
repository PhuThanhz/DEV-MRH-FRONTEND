import { Button, Input, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { LocalObjectiveItem } from "../index";

const ACCENT = "#e8637a";

function SectionHeader({ label, count }: { label: string; count: string }) {
    return (
        <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 16,
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                    width: 3, height: 16, borderRadius: 2,
                    background: ACCENT, display: "inline-block",
                }} />
                <span style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: ".08em",
                    textTransform: "uppercase", color: "#555",
                }}>
                    {label}
                </span>
            </div>
            <span style={{ fontSize: 12, color: "#aaa" }}>{count}</span>
        </div>
    );
}

interface Props {
    objectives: LocalObjectiveItem[];
    editMode: boolean;
    onChange: (items: LocalObjectiveItem[]) => void;
}

const ObjectivesSection = ({ objectives, editMode, onChange }: Props) => {
    const update = (i: number, v: string) => {
        const list = [...objectives];
        list[i] = { ...list[i], content: v };
        onChange(list);
    };

    const add = () =>
        onChange([...objectives, { content: "", orderNo: objectives.length + 1 }]);

    const remove = (i: number) =>
        onChange(objectives.filter((_, idx) => idx !== i));

    return (
        <div>
            <SectionHeader
                label="Mục tiêu phòng ban"
                count={`${objectives.length} mục tiêu`}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {objectives.length === 0 && !editMode && (
                    <div style={{
                        textAlign: "center", padding: "20px 0",
                        color: "#bbb", fontSize: 13, fontStyle: "italic",
                    }}>
                        Chưa có mục tiêu nào.
                    </div>
                )}

                {objectives.map((item, i) => (
                    <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 12,
                        background: "#fff", border: "1px solid #f0f0f0",
                        borderRadius: 10, padding: "12px 16px",
                    }}>
                        <span style={{
                            minWidth: 24, height: 24, borderRadius: 12,
                            background: "#f5f5f5", color: "#888",
                            fontSize: 12, fontWeight: 700,
                            display: "flex", alignItems: "center",
                            justifyContent: "center", flexShrink: 0,
                        }}>
                            {i + 1}
                        </span>
                        {editMode ? (
                            <Input
                                value={item.content}
                                onChange={(e) => update(i, e.target.value)}
                                placeholder="Nhập nội dung mục tiêu…"
                                variant="outlined"
                                style={{ flex: 1 }}
                            />
                        ) : (
                            <span style={{ flex: 1, fontSize: 14, color: "#111", lineHeight: 1.65 }}>
                                {item.content}
                            </span>
                        )}
                        {editMode && (
                            <Popconfirm
                                title="Xoá mục tiêu này?"
                                onConfirm={() => remove(i)}
                                okText="Xoá" cancelText="Huỷ"
                                okButtonProps={{ danger: true }}
                            >
                                <Button
                                    type="text" danger size="small"
                                    icon={<DeleteOutlined />}
                                />
                            </Popconfirm>
                        )}
                    </div>
                ))}

                {editMode && (
                    <Button
                        type="dashed" icon={<PlusOutlined />}
                        onClick={add} block
                        style={{ marginTop: 4, color: "#aaa", borderColor: "#e0e0e0" }}
                    >
                        Thêm mục tiêu
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ObjectivesSection;