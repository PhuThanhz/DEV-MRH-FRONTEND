import { useRef, useState } from "react";
import { Button, Input, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined, HolderOutlined } from "@ant-design/icons";
import type { LocalSectionTask, LocalTaskItem } from "./DepartmentMissionDetail";

const ACCENT = "#e8637a";
const COLORS = ["#e8637a", "#4a9eff", "#52c41a", "#fa8c16", "#722ed1", "#13c2c2"];

function SectionHeader({ label, count }: { label: string; count: string }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <span className="w-1 h-4 rounded-sm bg-[#e8637a] inline-block" />
                <span className="text-[11px] font-bold tracking-[.08em] uppercase text-gray-500">
                    {label}
                </span>
            </div>
            <span className="text-xs text-gray-400">{count}</span>
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

    // ─── drag state ───────────────────────────────────────────────
    // For sectioned tasks: track { sectionId, itemIndex }
    const dragSrc = useRef<{ sid: number; idx: number } | null>(null);
    const [dragOverKey, setDragOverKey] = useState<string | null>(null);

    // For general tasks
    const dragSrcGeneral = useRef<number | null>(null);
    const [dragOverGeneral, setDragOverGeneral] = useState<number | null>(null);

    // ─── sectioned task handlers ──────────────────────────────────
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

    const handleSectionDrop = (sid: number, dropIdx: number) => {
        if (!dragSrc.current || dragSrc.current.sid !== sid) return;
        const fromIdx = dragSrc.current.idx;
        if (fromIdx === dropIdx) return;
        onSectionsChange(sections.map((s: LocalSectionTask) => {
            if (s.sectionId !== sid) return s;
            const items = [...s.items];
            const [moved] = items.splice(fromIdx, 1);
            items.splice(dropIdx, 0, moved);
            return { ...s, items: items.map((it, i) => ({ ...it, orderNo: i + 1 })) };
        }));
        dragSrc.current = null;
        setDragOverKey(null);
    };

    // ─── general task handlers ────────────────────────────────────
    const updateGeneral = (i: number, v: string) => {
        const list = [...generalTasks];
        list[i] = { ...list[i], content: v };
        onGeneralTasksChange(list);
    };

    const addGeneral = () =>
        onGeneralTasksChange([...generalTasks, { content: "", orderNo: generalTasks.length + 1 }]);

    const deleteGeneral = (i: number) =>
        onGeneralTasksChange(generalTasks.filter((_: LocalTaskItem, idx: number) => idx !== i));

    const handleGeneralDrop = (dropIdx: number) => {
        const fromIdx = dragSrcGeneral.current;
        if (fromIdx === null || fromIdx === dropIdx) return;
        const list = [...generalTasks];
        const [moved] = list.splice(fromIdx, 1);
        list.splice(dropIdx, 0, moved);
        onGeneralTasksChange(list.map((it, i) => ({ ...it, orderNo: i + 1 })));
        dragSrcGeneral.current = null;
        setDragOverGeneral(null);
    };

    // ─── SECTIONED VIEW ──────────────────────────────────────────
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {/* ─── SECTIONED VIEW (Tasks by Section) ─── */}
            {hasSections && (
                <div>
                    <SectionHeader
                        label="Nhiệm vụ theo bộ phận"
                        count={`${sections.length} bộ phận`}
                    />

                    <style>{`
                        .sections-grid {
                            display: grid;
                            grid-template-columns: repeat(${Math.min(sections.length, 4)}, 1fr);
                            gap: 14px;
                            align-items: stretch;
                        }
                        @media (max-width: 1024px) {
                            .sections-grid {
                                grid-template-columns: repeat(${Math.min(sections.length, 2)}, 1fr) !important;
                            }
                        }
                        @media (max-width: 640px) {
                            .sections-grid {
                                grid-template-columns: 1fr !important;
                            }
                        }
                    `}</style>

                    <div className="sections-grid">
                        {sections.map((sec: LocalSectionTask, si: number) => {
                            const initial = sec.sectionName.trim().charAt(0).toUpperCase();
                            const color = COLORS[si % COLORS.length];

                            return (
                                <div key={sec.sectionId} className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col h-full shadow-sm hover:shadow transition-shadow">
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
                                    <div style={{
                                        padding: "8px 14px 12px",
                                        flex: 1,
                                        display: "flex",
                                        flexDirection: "column",
                                    }}>
                                        {sec.items.length === 0 && !editMode && (
                                            <div style={{
                                                padding: "16px 0",
                                                color: "#bbb", fontSize: 12.5, fontStyle: "italic",
                                                textAlign: "center",
                                            }}>
                                                Chưa có nhiệm vụ
                                            </div>
                                        )}

                                        {sec.items.map((task: LocalTaskItem, idx: number) => {
                                            const key = `${sec.sectionId}-${idx}`;
                                            const isDragOver = dragOverKey === key;
                                            return (
                                                <div
                                                    key={idx}
                                                    draggable={editMode}
                                                    onDragStart={() => { dragSrc.current = { sid: sec.sectionId, idx }; }}
                                                    onDragOver={(e) => { e.preventDefault(); setDragOverKey(key); }}
                                                    onDragLeave={() => setDragOverKey(null)}
                                                    onDrop={() => handleSectionDrop(sec.sectionId, idx)}
                                                    onDragEnd={() => { dragSrc.current = null; setDragOverKey(null); }}
                                                    style={{
                                                        display: "flex", alignItems: "flex-start", gap: 8,
                                                        padding: "8px 0",
                                                        borderBottom: idx < sec.items.length - 1
                                                            ? "1px solid #f5f5f5" : "none",
                                                        borderRadius: 6,
                                                        background: isDragOver ? `${color}08` : "transparent",
                                                        outline: isDragOver ? `1.5px dashed ${color}` : "none",
                                                        transition: "background .15s",
                                                        cursor: editMode ? "grab" : "default",
                                                    }}
                                                >
                                                    {editMode && (
                                                        <HolderOutlined className="text-gray-300 text-xs shrink-0 mt-1.5 cursor-grab" />
                                                    )}

                                                    <span className="text-[11px] text-gray-400 font-bold min-w-[16px] shrink-0 mt-[5px]">
                                                        {idx + 1}
                                                    </span>

                                                    {editMode ? (
                                                        <Input.TextArea
                                                            value={task.content}
                                                            onChange={(e) => updateTask(sec.sectionId, idx, e.target.value)}
                                                            placeholder={"Nhập nhiệm vụ…"}
                                                            size="small"
                                                            autoSize={{ minRows: 2, maxRows: 8 }}
                                                            variant="borderless"
                                                            className="flex-1 !px-2 !py-0.5 text-[12.5px] bg-gray-50 focus:bg-white border border-transparent focus:border-blue-400 focus:shadow-[0_0_0_2px_rgba(24,144,255,0.2)] rounded transition-all resize-none"
                                                        />
                                                    ) : (
                                                        <div className="flex-1 text-[13px] text-gray-800 leading-relaxed mt-1">
                                                            {task.content.split("\n").map((line, li) => {
                                                                const isBullet = /^[\*\-]\s/.test(line.trimStart());
                                                                const text = isBullet ? line.trimStart().replace(/^[\*\-]\s/, "") : line;
                                                                return (
                                                                    <div key={li} className={`flex items-start gap-1.5 ${li > 0 ? 'mt-1' : ''}`}>
                                                                        {isBullet && (
                                                                            <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                                                                        )}
                                                                        <span>{text}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
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
                                            );
                                        })}

                                        {editMode && (
                                            <Button
                                                type="dashed"
                                                size="small"
                                                icon={<PlusOutlined />}
                                                onClick={() => addTask(sec.sectionId)}
                                                block
                                                className="mt-auto h-8 text-gray-500 border-gray-300 hover:text-blue-500 hover:border-blue-500"
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
            )}

            {/* ─── GENERAL TASKS VIEW (Nhiệm vụ chung) ─── */}
            {(generalTasks.length > 0 || editMode || !hasSections) && (
                <div>
                    <SectionHeader
                        label={hasSections ? "Nhiệm vụ chung của phòng ban" : "Nhiệm vụ"}
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

                        {generalTasks.map((task: LocalTaskItem, i: number) => {
                            const isDragOver = dragOverGeneral === i;
                            return (
                                <div
                                    key={i}
                                    draggable={editMode}
                                    onDragStart={() => { dragSrcGeneral.current = i; }}
                                    onDragOver={(e) => { e.preventDefault(); setDragOverGeneral(i); }}
                                    onDragLeave={() => setDragOverGeneral(null)}
                                    onDrop={() => handleGeneralDrop(i)}
                                    onDragEnd={() => { dragSrcGeneral.current = null; setDragOverGeneral(null); }}
                                    className={`flex items-start gap-3 p-3 sm:px-4 rounded-lg border ${isDragOver ? 'bg-gray-50 border-dashed border-gray-300' : 'bg-white border-gray-100'} ${editMode ? 'cursor-grab' : 'cursor-default'} shadow-sm hover:shadow-md transition-all`}
                                    style={{ outline: isDragOver ? `1.5px dashed ${COLORS[0]}55` : "none" }}
                                >
                                        {editMode && (
                                            <HolderOutlined className="text-gray-300 text-[13px] shrink-0 mt-2" />
                                        )}

                                        <span className="min-w-6 h-6 rounded-full bg-gray-50 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                            {i + 1}
                                        </span>

                                        {editMode ? (
                                            <Input.TextArea
                                                value={task.content}
                                                onChange={(e) => updateGeneral(i, e.target.value)}
                                                placeholder={"Nhập nội dung nhiệm vụ…"}
                                                autoSize={{ minRows: 2, maxRows: 8 }}
                                                variant="borderless"
                                                className="flex-1 !px-2 !py-1 text-sm bg-gray-50 focus:bg-white border border-transparent focus:border-blue-400 focus:shadow-[0_0_0_2px_rgba(24,144,255,0.2)] rounded transition-all resize-none"
                                            />
                                        ) : (
                                            <div className="flex-1 text-sm text-gray-900 leading-relaxed mt-0.5">
                                                {task.content.split("\n").map((line, li) => {
                                                    const isBullet = /^[\*\-]\s/.test(line.trimStart());
                                                    const text = isBullet ? line.trimStart().replace(/^[\*\-]\s/, "") : line;
                                                    return (
                                                        <div key={li} className={`flex items-start gap-1.5 ${li > 0 ? 'mt-1.5' : ''}`}>
                                                            {isBullet && (
                                                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                                                            )}
                                                            <span>{text}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                    {editMode && (
                                        <Popconfirm
                                            title="Xoá nhiệm vụ này?"
                                            onConfirm={() => deleteGeneral(i)}
                                            okText="Xoá" cancelText="Huỷ"
                                            okButtonProps={{ danger: true }}
                                        >
                                            <Button type="text" danger size="small" icon={<DeleteOutlined />} className="mt-0.5" />
                                        </Popconfirm>
                                    )}
                                </div>
                            );
                        })}

                        {editMode && (
                            <Button
                                type="dashed" icon={<PlusOutlined />}
                                onClick={addGeneral} block
                                className="mt-1 h-10 text-gray-500 border-gray-300 hover:text-blue-500 hover:border-blue-500"
                            >
                                Thêm nhiệm vụ
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TasksSection;