import { Button, Input, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import type { LocalSectionTask, LocalTaskItem } from "../index";

const ACCENT = "#e8637a";
const COLORS = ["#e8637a", "#4a9eff", "#52c41a", "#fa8c16", "#722ed1", "#13c2c2"];

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
    hasSections: boolean;
    sections: LocalSectionTask[];
    generalTasks: LocalTaskItem[];
    editMode: boolean;
    onSectionsChange: (s: LocalSectionTask[]) => void;
    onGeneralTasksChange: (t: LocalTaskItem[]) => void;
}

const TasksSection = ({
    hasSections, sections, generalTasks,
    editMode, onSectionsChange, onGeneralTasksChange,
}: Props) => {

    const updateTask = (sid: number, i: number, v: string) =>
        onSectionsChange(sections.map((s: LocalSectionTask) => {
            if (s.sectionId !== sid) return s;
            const items = [...s.items];
            items[i] = { ...items[i], content: v };
            return { ...s, items };
        }));

    const addTask = (sid: number) =>
        onSectionsChange(sections.map((s: LocalSectionTask) =>
            s.sectionId !== sid ? s
                : { ...s, items: [...s.items, { content: "", orderNo: s.items.length + 1 }] }
        ));

    const deleteTask = (sid: number, i: number) =>
        onSectionsChange(sections.map((s: LocalSectionTask) =>
            s.sectionId !== sid ? s
                : { ...s, items: s.items.filter((_: LocalTaskItem, idx: number) => idx !== i) }
        ));

    const updateGeneral = (i: number, v: string) => {
        const list = [...generalTasks];
        list[i] = { ...list[i], content: v };
        onGeneralTasksChange(list);
    };

    const addGeneral = () =>
        onGeneralTasksChange([...generalTasks, { content: "", orderNo: generalTasks.length + 1 }]);

    const deleteGeneral = (i: number) =>
        onGeneralTasksChange(generalTasks.filter((_: LocalTaskItem, idx: number) => idx !== i));

    if (hasSections) {
        return (
            <div>
                <SectionHeader
                    label="Nhiệm vụ theo bộ phận"
                    count={`${sections.length} bộ phận`}
                />

                {/* GRID 4 CỘT */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 14,
                    alignItems: "start",
                }}>
                    {sections.map((sec: LocalSectionTask, si: number) => {
                        const initial = sec.sectionName.trim().charAt(0).toUpperCase();
                        const color = COLORS[si % COLORS.length];
                        return (
                            <div key={sec.sectionId} style={{
                                background: "#fff",
                                border: "1px solid #f0f0f0",
                                borderRadius: 12,
                                overflow: "hidden",
                            }}>
                                {/* card header */}
                                <div style={{
                                    display: "flex", alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "12px 14px",
                                    borderBottom: "1px solid #f5f5f5",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                                        <span style={{
                                            width: 26, height: 26, borderRadius: 7,
                                            background: `${color}18`,
                                            color: color,
                                            fontWeight: 800, fontSize: 12,
                                            display: "flex", alignItems: "center",
                                            justifyContent: "center", flexShrink: 0,
                                        }}>
                                            {initial}
                                        </span>
                                        <span style={{
                                            fontWeight: 600, fontSize: 13, color: "#111",
                                            overflow: "hidden", textOverflow: "ellipsis",
                                            whiteSpace: "nowrap", minWidth: 0,
                                        }}>
                                            {sec.sectionName}
                                        </span>
                                    </div>
                                    <span style={{
                                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                                        color: sec.items.length > 0 ? color : "#bbb",
                                        background: sec.items.length > 0 ? `${color}15` : "#f5f5f5",
                                        borderRadius: 20, padding: "2px 8px", marginLeft: 6,
                                    }}>
                                        {sec.items.length}
                                    </span>
                                </div>

                                {/* card body — task list */}
                                <div style={{ padding: "8px 14px 12px" }}>
                                    {sec.items.length === 0 && !editMode && (
                                        <div style={{
                                            padding: "16px 0",
                                            color: "#bbb", fontSize: 12.5, fontStyle: "italic",
                                            textAlign: "center",
                                        }}>
                                            Chưa có nhiệm vụ
                                        </div>
                                    )}
                                    {sec.items.map((task: LocalTaskItem, idx: number) => (
                                        <div key={idx} style={{
                                            display: "flex", alignItems: "flex-start", gap: 8,
                                            padding: "8px 0",
                                            borderBottom: idx < sec.items.length - 1
                                                ? "1px solid #f5f5f5" : "none",
                                        }}>
                                            <span style={{
                                                fontSize: 11, color: "#ccc",
                                                fontWeight: 600, minWidth: 16,
                                                flexShrink: 0, paddingTop: 2,
                                            }}>
                                                {idx + 1}
                                            </span>
                                            {editMode ? (
                                                <Input
                                                    value={task.content}
                                                    onChange={(e) => updateTask(sec.sectionId, idx, e.target.value)}
                                                    placeholder="Nhập nhiệm vụ…"
                                                    size="small"
                                                    style={{ flex: 1, fontSize: 12.5 }}
                                                />
                                            ) : (
                                                <span style={{
                                                    flex: 1, fontSize: 13,
                                                    color: "#222", lineHeight: 1.6,
                                                }}>
                                                    {task.content}
                                                </span>
                                            )}
                                            {editMode && (
                                                <Popconfirm
                                                    title="Xoá nhiệm vụ này?"
                                                    onConfirm={() => deleteTask(sec.sectionId, idx)}
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
                                            type="dashed" size="small"
                                            icon={<PlusOutlined />}
                                            onClick={() => addTask(sec.sectionId)}
                                            block
                                            style={{ marginTop: 8, color: "#aaa", borderColor: "#e0e0e0" }}
                                        >
                                            Thêm nhiệm vụ
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // không có bộ phận — list thẳng
    return (
        <div>
            <SectionHeader
                label="Nhiệm vụ"
                count={`${generalTasks.length} nhiệm vụ`}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {generalTasks.length === 0 && !editMode && (
                    <div style={{
                        textAlign: "center", padding: "20px 0",
                        color: "#bbb", fontSize: 13, fontStyle: "italic",
                    }}>
                        Chưa có nhiệm vụ nào.
                    </div>
                )}
                {generalTasks.map((task: LocalTaskItem, i: number) => (
                    <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 16,
                        background: "#fff", border: "1px solid #f0f0f0",
                        borderRadius: 10, padding: "12px 20px",
                    }}>
                        <span style={{
                            fontSize: 12, color: "#ccc", fontWeight: 600,
                            minWidth: 20, flexShrink: 0, textAlign: "right",
                        }}>
                            {i + 1}
                        </span>
                        {editMode ? (
                            <Input
                                value={task.content}
                                onChange={(e) => updateGeneral(i, e.target.value)}
                                placeholder="Nhập nội dung nhiệm vụ…"
                                style={{ flex: 1 }}
                            />
                        ) : (
                            <span style={{ flex: 1, fontSize: 14, color: "#111", lineHeight: 1.65 }}>
                                {task.content}
                            </span>
                        )}
                        {editMode && (
                            <Popconfirm
                                title="Xoá nhiệm vụ này?"
                                onConfirm={() => deleteGeneral(i)}
                                okText="Xoá" cancelText="Huỷ"
                                okButtonProps={{ danger: true }}
                            >
                                <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>
                        )}
                    </div>
                ))}
                {editMode && (
                    <Button
                        type="dashed" icon={<PlusOutlined />}
                        onClick={addGeneral} block
                        style={{ marginTop: 4, color: "#aaa", borderColor: "#e0e0e0" }}
                    >
                        Thêm nhiệm vụ
                    </Button>
                )}
            </div>
        </div>
    );
};

export default TasksSection;