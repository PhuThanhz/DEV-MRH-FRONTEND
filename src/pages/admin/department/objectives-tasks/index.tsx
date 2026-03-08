import { useEffect, useMemo, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Button, Input, Popconfirm, message, Skeleton, DatePicker } from "antd";
import {
    PlusOutlined, DeleteOutlined, EditOutlined,
    SaveOutlined, CloseOutlined,
} from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";

import PageContainer from "@/components/common/data-table/PageContainer";
import { useDepartmentObjectivesQuery } from "@/hooks/useDepartmentObjectives";
import { useSectionsQuery } from "@/hooks/useSections";
import { callCreateDepartmentObjective } from "@/config/api";
import type { IDepartmentMissionTree } from "@/types/backend";

interface ObjectiveItem { content: string; orderNo: number }
interface TaskItem { content: string; orderNo: number }
interface SectionTask { sectionId: number; sectionName: string; items: TaskItem[] }

const C = {
    page: "#F7F3F3",
    card: "#FFFFFF",
    r50: "#FEF0F2",
    r100: "#FCDDE3",
    r200: "#F8BEC8",
    r300: "#F0959F",
    r400: "#E06070",
    r500: "#C84E62",
    r600: "#A83A4E",
    ink: "#18080D",
    ink40: "#9A7080",
    ink20: "#C8B0B8",
    ink10: "#EDE0E3",
    ink05: "#F6F0F2",
    danger: "#E05050",
};

const STYLE_ID = "dop-v6";
const css = `
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=DM+Sans:opsz,wght@9..40,400;500;600&display=swap');

.dopv *, .dopv *::before, .dopv *::after { box-sizing: border-box; }
.dopv { font-family: 'DM Sans', -apple-system, sans-serif; color: ${C.ink}; -webkit-font-smoothing: antialiased; }

@keyframes dopv-up {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}
.dopv-up { animation: dopv-up .36s cubic-bezier(.22,.9,.36,1) both; }
.dopv-d1 { animation-delay:.04s } .dopv-d2 { animation-delay:.08s }
.dopv-d3 { animation-delay:.12s } .dopv-d4 { animation-delay:.16s }
.dopv-d5 { animation-delay:.20s }

@keyframes dopv-pulse {
  0%,100% { opacity:1; transform:scale(1); }
  50%      { opacity:.4; transform:scale(.7); }
}
.dopv-pulse { animation: dopv-pulse 1.7s ease-in-out infinite; }

/* ── HEADER ── */
.dopv-header {
  background: ${C.card};
  border-bottom: 1.5px solid ${C.ink10};
  padding: 22px 36px 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}
/* tablet */
@media (max-width: 768px) {
  .dopv-header {
    padding: 16px 20px 14px;
    flex-direction: column;
    gap: 14px;
  }
}
/* mobile */
@media (max-width: 480px) {
  .dopv-header { padding: 14px 16px 12px; }
}

/* dept name */
.dopv-title {
  margin: 0; font-size: 26px; font-weight: 700;
  font-family: 'Lora', Georgia, serif;
  color: ${C.ink}; letter-spacing: -.02em; line-height: 1.2;
}
@media (max-width: 768px) { .dopv-title { font-size: 20px; } }
@media (max-width: 480px) { .dopv-title { font-size: 18px; } }

/* header right buttons */
.dopv-actions {
  display: flex; gap: 9px; flex-shrink: 0; padding-top: 4px;
}
@media (max-width: 768px) {
  .dopv-actions {
    width: 100%;
    padding-top: 0;
  }
  .dopv-actions .ant-btn { flex: 1; justify-content: center; }
}

/* ── BANNER ── */
.dopv-banner {
  background: ${C.r50}; border-bottom: 1.5px solid ${C.r100};
  padding: 8px 36px; font-size: 12px; color: ${C.r500};
  font-weight: 600; letter-spacing: .04em;
  display: flex; align-items: center; gap: 7px;
}
@media (max-width: 768px) { .dopv-banner { padding: 8px 20px; } }
@media (max-width: 480px) { .dopv-banner { padding: 8px 16px; font-size: 11px; } }

/* ── BODY ── */
.dopv-body {
  padding: 28px 36px 56px;
}
@media (max-width: 768px) { .dopv-body { padding: 20px 20px 40px; } }
@media (max-width: 480px) { .dopv-body { padding: 16px 16px 32px; } }

/* ── GRID columns ── */
.dopv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  align-items: stretch;
}
@media (max-width: 600px) {
  .dopv-grid { grid-template-columns: 1fr; gap: 12px; }
}

/* objective row */
.dopv-obj {
  display: flex; align-items: flex-start; gap: 14px;
  background: ${C.card}; border: 1.5px solid ${C.ink10};
  border-radius: 14px; padding: 14px 18px; margin-bottom: 9px;
  transition: box-shadow .2s;
}
.dopv-obj:hover { box-shadow: 0 2px 10px rgba(0,0,0,.07); }
@media (max-width: 480px) {
  .dopv-obj { padding: 11px 13px; gap: 10px; border-radius: 11px; }
}

/* task row */
.dopv-task {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 9px 0; border-bottom: 1px solid ${C.ink10};
}
.dopv-task:last-of-type { border-bottom: none; }

/* column card */
.dopv-col {
  background: ${C.card}; border: 1.5px solid ${C.ink10};
  border-radius: 16px; overflow: hidden;
  display: flex; flex-direction: column;
  transition: box-shadow .22s;
}
.dopv-col:hover { box-shadow: 0 4px 18px rgba(0,0,0,.08); }

/* delete btn */
.dopv-del {
  background: transparent; border: none; cursor: pointer;
  color: ${C.ink20}; font-size: 13px; padding: 4px 5px;
  border-radius: 7px; flex-shrink: 0; line-height: 1;
  transition: color .14s, background .14s;
}
.dopv-del:hover { color: ${C.danger}; background: #FFF0F0; }

/* dashed add */
.dopv-add {
  width: 100% !important;
  border: 1.5px dashed ${C.r200} !important;
  border-radius: 11px !important; color: ${C.r500} !important;
  background: transparent !important; font-weight: 500 !important;
  font-size: 12.5px !important; height: 36px !important; margin-top: 12px;
  transition: background .16s, color .16s !important;
}
.dopv-add:hover { background: ${C.r50} !important; color: ${C.r600} !important; }

/* input — trắng, border xám */
.dopv-input .ant-input {
  background: #fff !important; font-size: 13.5px !important;
  font-family: 'DM Sans', sans-serif !important; color: ${C.ink} !important;
}
.dopv-input {
  background: #fff !important; border: 1.5px solid ${C.ink10} !important;
  border-radius: 9px !important; flex: 1; box-shadow: none !important;
}
.dopv-input:focus-within {
  border-color: ${C.ink20} !important;
  box-shadow: 0 0 0 3px rgba(0,0,0,.04) !important;
}
.dopv-input:hover:not(:focus-within) { border-color: ${C.ink20} !important; }

/* divider */
.dopv-hr { border: none; border-top: 1.5px solid ${C.ink10}; margin: 28px 0; }

/* datepicker — trắng, border xám */
.dopv-dp .ant-picker {
  background: #fff !important; border-color: ${C.ink10} !important; border-radius: 8px !important;
}
.dopv-dp .ant-picker:hover, .dopv-dp .ant-picker-focused {
  border-color: ${C.ink20} !important; box-shadow: 0 0 0 2px rgba(0,0,0,.04) !important;
}

/* meta row wrap on small screens */
.dopv-meta {
  display: flex; align-items: center; gap: 8px; margin-top: 2px; flex-wrap: wrap;
}
`;

if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
    const el = document.createElement("style");
    el.id = STYLE_ID;
    el.textContent = css;
    document.head.appendChild(el);
}

/* ── SUB-COMPONENTS ── */
function NumBadge({ n, size = 23, variant = "rose" }: {
    n: number; size?: number; variant?: "rose" | "neutral"
}) {
    return (
        <span style={{
            minWidth: size, height: size, borderRadius: size / 2,
            background: variant === "rose" ? C.r100 : C.ink05,
            color: variant === "rose" ? C.r500 : C.ink40,
            fontSize: size * .46, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, marginTop: 1, letterSpacing: "-.01em",
        }}>
            {n}
        </span>
    );
}

function SecLabel({ label, count, style }: {
    label: string; count: string; style?: React.CSSProperties
}) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16, ...style }}>
            <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 10.5, fontWeight: 700, letterSpacing: ".1em",
                textTransform: "uppercase", color: C.r400,
            }}>
                <span style={{ width: 14, height: 2, borderRadius: 1, background: C.r300, display: "inline-block" }} />
                {label}
            </span>
            <span style={{ marginLeft: "auto", fontSize: 11.5, color: C.ink20, fontWeight: 400 }}>
                {count}
            </span>
        </div>
    );
}

function Empty({ text }: { text: string }) {
    return (
        <div style={{ textAlign: "center", padding: "20px 0 10px", color: C.ink20, fontSize: 12.5, fontStyle: "italic" }}>
            {text}
        </div>
    );
}

function ObjRow({ item, index, editMode, onUpdate, onDelete }: {
    item: ObjectiveItem; index: number; editMode: boolean;
    onUpdate: (v: string) => void; onDelete: () => void;
}) {
    const delay = `dopv-d${Math.min(index + 1, 5)}`;
    return (
        <div className={`dopv-obj dopv-up ${delay}`}>
            <NumBadge n={index + 1} />
            {editMode ? (
                <Input
                    className="dopv-input"
                    value={item.content}
                    onChange={(e) => onUpdate(e.target.value)}
                    placeholder="Nhập nội dung mục tiêu…"
                    variant="outlined"
                    style={{ flex: 1 }}
                />
            ) : (
                <span style={{ flex: 1, fontSize: 14, color: C.ink, lineHeight: 1.65, paddingTop: 1 }}>
                    {item.content}
                </span>
            )}
            {editMode && (
                <Popconfirm title="Xoá mục tiêu này?" onConfirm={onDelete} okText="Xoá" cancelText="Huỷ" okButtonProps={{ danger: true }}>
                    <button className="dopv-del"><DeleteOutlined /></button>
                </Popconfirm>
            )}
        </div>
    );
}

/* ── MAIN PAGE ── */
const DepartmentObjectivesPage = () => {
    const { departmentId } = useParams();
    const location = useLocation();
    const idNumber = departmentId ? Number(departmentId) : undefined;

    const { data, isLoading } = useDepartmentObjectivesQuery(idNumber);
    const { data: sectionData } = useSectionsQuery(`page=1&size=100&filter=department.id:${idNumber}`);
    const mission: IDepartmentMissionTree | undefined = data;

    const [objectives, setObjectives] = useState<ObjectiveItem[]>([]);
    const [sections, setSections] = useState<SectionTask[]>([]);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [issueDate, setIssueDate] = useState<Dayjs | null>(null);

    const departmentName = useMemo(() => {
        const p = new URLSearchParams(location.search);
        return p.get("departmentName") || mission?.department?.name || "";
    }, [location.search, mission]);

    useEffect(() => {
        if (!sectionData) return;
        const allSections = sectionData.result || [];
        const missionTasks = mission?.tasks || [];
        setSections(allSections.map((sec) => {
            const found = missionTasks.find((t) => t.sectionId === sec.id);
            return {
                sectionId: sec.id!,
                sectionName: sec.name,
                items: found?.tasks?.map((t, i) => ({ content: t.content, orderNo: i + 1 })) || [],
            };
        }));
        if (mission) {
            setObjectives(mission.objectives.map((o, i) => ({ content: o.content, orderNo: i + 1 })));
            if ((mission as any).issueDate) setIssueDate(dayjs((mission as any).issueDate));
        }
    }, [mission, sectionData]);

    /* CRUD */
    const updateObjective = (i: number, v: string) => { const list = [...objectives]; list[i].content = v; setObjectives(list); };
    const addObjective = () => setObjectives([...objectives, { content: "", orderNo: objectives.length + 1 }]);
    const deleteObjective = (i: number) => setObjectives(objectives.filter((_, idx) => idx !== i));

    const updateTask = (sid: number, i: number, v: string) =>
        setSections(sections.map((s) => {
            if (s.sectionId !== sid) return s;
            const items = [...s.items]; items[i].content = v; return { ...s, items };
        }));
    const addTask = (sid: number) =>
        setSections(sections.map((s) =>
            s.sectionId !== sid ? s : { ...s, items: [...s.items, { content: "", orderNo: s.items.length + 1 }] }
        ));
    const deleteTask = (sid: number, i: number) =>
        setSections(sections.map((s) =>
            s.sectionId !== sid ? s : { ...s, items: s.items.filter((_, idx) => idx !== i) }
        ));

    const handleSave = async () => {
        if (!idNumber) return;
        try {
            setSaving(true);
            const res = await callCreateDepartmentObjective({
                departmentId: idNumber,
                objectives,
                tasks: sections.map((s) => ({ sectionId: s.sectionId, items: s.items })),
                issueDate: issueDate ? issueDate.format("YYYY-MM-DD") : undefined,
            });
            const statusCode = res?.statusCode ?? res?.data?.statusCode;
            if (statusCode === 200) {
                message.success("Cập nhật thành công!");
                setEditMode(false);
            } else {
                message.error(res?.message || res?.data?.message || "Lưu thất bại");
            }
        } catch {
            message.error("Có lỗi xảy ra khi lưu dữ liệu");
        } finally {
            setSaving(false);
        }
    };

    return (
        <PageContainer title="Mục tiêu - Nhiệm vụ phòng ban">
            <div className="dopv" style={{ background: C.page, minHeight: "100vh" }}>

                {/* HEADER */}
                <div className="dopv-header">
                    {/* left */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, letterSpacing: ".07em", textTransform: "uppercase", color: C.r400 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.r300, display: "inline-block", flexShrink: 0 }} />
                            Phòng ban
                        </div>
                        <h1 className="dopv-title">{departmentName || "—"}</h1>
                        <div className="dopv-meta">
                            <span style={{ fontSize: 12, color: C.ink40, fontWeight: 500 }}>Ngày ban hành</span>
                            <span style={{ width: 3, height: 3, borderRadius: "50%", background: C.ink20, display: "inline-block", flexShrink: 0 }} />
                            {editMode ? (
                                <div className="dopv-dp">
                                    <DatePicker
                                        value={issueDate}
                                        onChange={(d) => setIssueDate(d)}
                                        format="DD/MM/YYYY"
                                        placeholder="Chọn ngày"
                                        size="small"
                                        style={{ borderRadius: 8 }}
                                    />
                                </div>
                            ) : (
                                <span style={{ fontSize: 13, fontWeight: issueDate ? 600 : 400, color: issueDate ? C.ink : C.ink20, fontStyle: issueDate ? "normal" : "italic" }}>
                                    {issueDate ? issueDate.format("DD/MM/YYYY") : "Chưa cập nhật"}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* right: buttons */}
                    <div className="dopv-actions">
                        {!editMode ? (
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => setEditMode(true)}
                                style={{ borderRadius: 10, fontWeight: 600, height: 38, paddingLeft: 18, paddingRight: 18, background: C.r50, border: `1.5px solid ${C.r200}`, color: C.r500, fontSize: 13.5, boxShadow: "none" }}
                            >
                                Chỉnh sửa
                            </Button>
                        ) : (
                            <>
                                <Button
                                    icon={<CloseOutlined />}
                                    onClick={() => setEditMode(false)}
                                    style={{ borderRadius: 10, fontWeight: 500, height: 38, paddingLeft: 16, paddingRight: 16, border: `1.5px solid ${C.ink10}`, color: C.ink40, fontSize: 13.5 }}
                                >
                                    Huỷ
                                </Button>
                                <Button
                                    icon={<SaveOutlined />}
                                    loading={saving}
                                    onClick={handleSave}
                                    style={{ borderRadius: 10, fontWeight: 700, height: 38, paddingLeft: 20, paddingRight: 20, background: C.r500, border: "none", color: "#fff", fontSize: 13.5, boxShadow: `0 3px 14px ${C.r200}` }}
                                >
                                    Lưu thay đổi
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* EDIT BANNER */}
                {editMode && (
                    <div className="dopv-banner">
                        <span className="dopv-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: C.r400, display: "inline-block", flexShrink: 0 }} />
                        Đang chỉnh sửa — nhớ lưu thay đổi trước khi rời trang
                    </div>
                )}

                {/* BODY */}
                <div className="dopv-body">
                    {isLoading ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {[1, 2, 3].map(i => <Skeleton key={i} active paragraph={{ rows: 2 }} />)}
                        </div>
                    ) : (
                        <>
                            {/* MỤC TIÊU */}
                            <SecLabel label="Mục tiêu phòng ban" count={`${objectives.length} mục tiêu`} />

                            {objectives.length === 0 && !editMode && <Empty text="Chưa có mục tiêu nào." />}

                            {objectives.map((item, i) => (
                                <ObjRow key={i} item={item} index={i} editMode={editMode}
                                    onUpdate={(v) => updateObjective(i, v)}
                                    onDelete={() => deleteObjective(i)}
                                />
                            ))}

                            {editMode && (
                                <Button className="dopv-add" icon={<PlusOutlined />} onClick={addObjective} style={{ marginTop: 4 }}>
                                    Thêm mục tiêu
                                </Button>
                            )}

                            <hr className="dopv-hr" />

                            {/* NHIỆM VỤ THEO BỘ PHẬN */}
                            <SecLabel label="Nhiệm vụ theo bộ phận" count={`${sections.length} bộ phận`} style={{ marginBottom: 20 }} />

                            <div className="dopv-grid">
                                {sections.map((sec, si) => {
                                    const delay = `dopv-d${Math.min(si + 1, 5)}`;
                                    const initial = sec.sectionName.trim().charAt(0).toUpperCase();
                                    return (
                                        <div key={sec.sectionId} className={`dopv-col dopv-up ${delay}`} style={{ height: "100%" }}>
                                            {/* col header */}
                                            <div style={{ background: C.r50, borderBottom: `1.5px solid ${C.r100}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                                                <span style={{ width: 32, height: 32, borderRadius: 10, background: C.r100, border: `1.5px solid ${C.r200}`, color: C.r500, fontWeight: 700, fontSize: 14, fontFamily: "'Lora', serif", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    {initial}
                                                </span>
                                                <span style={{ fontWeight: 600, fontSize: 13, color: C.ink, flex: 1, lineHeight: 1.3, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {sec.sectionName}
                                                </span>
                                                <span style={{ fontSize: 11, color: sec.items.length > 0 ? C.r500 : C.ink20, background: sec.items.length > 0 ? C.r100 : C.ink05, borderRadius: 20, padding: "2px 9px", fontWeight: 700, flexShrink: 0 }}>
                                                    {sec.items.length}
                                                </span>
                                            </div>

                                            {/* col body */}
                                            <div style={{ padding: "12px 16px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
                                                <div style={{ flex: 1 }}>
                                                    {sec.items.length === 0 && !editMode && <Empty text="Chưa có nhiệm vụ" />}
                                                    {sec.items.map((task, idx) => (
                                                        <div key={idx} className="dopv-task" style={idx === sec.items.length - 1 ? { borderBottom: "none" } : {}}>
                                                            <NumBadge n={idx + 1} size={19} variant="neutral" />
                                                            {editMode ? (
                                                                <Input
                                                                    className="dopv-input"
                                                                    value={task.content}
                                                                    onChange={(e) => updateTask(sec.sectionId, idx, e.target.value)}
                                                                    placeholder="Nhập nhiệm vụ…"
                                                                    variant="outlined"
                                                                    style={{ flex: 1, fontSize: 12.5 }}
                                                                />
                                                            ) : (
                                                                <span style={{ flex: 1, fontSize: 13, color: C.ink, lineHeight: 1.65 }}>
                                                                    {task.content}
                                                                </span>
                                                            )}
                                                            {editMode && (
                                                                <Popconfirm title="Xoá nhiệm vụ này?" onConfirm={() => deleteTask(sec.sectionId, idx)} okText="Xoá" cancelText="Huỷ" okButtonProps={{ danger: true }}>
                                                                    <button className="dopv-del"><DeleteOutlined /></button>
                                                                </Popconfirm>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                {editMode && (
                                                    <Button className="dopv-add" icon={<PlusOutlined />} onClick={() => addTask(sec.sectionId)}>
                                                        Thêm nhiệm vụ
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </PageContainer>
    );
};

export default DepartmentObjectivesPage;