import React from "react";
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import { Button, Spin, Tag, Popconfirm, Input, Select, Alert, Empty, Progress, Breadcrumb, Switch } from "antd";
import {
    ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined,
    SendOutlined, LockOutlined, UserOutlined, TeamOutlined, BookOutlined,
    FileTextOutlined, TrophyOutlined, FileExcelOutlined,
} from "@ant-design/icons";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import useAccess from "@/hooks/useAccess";
import { exportDetailedEvaluation } from "@/utils/ExportEvaluationDetailUtils";
import { printEvaluationDetail } from "@/utils/PrintEvaluationUtils";
import dayjs from "dayjs";
import { notify } from "@/components/common/notification/notify";
import { Radar, Column } from "@/components/common/chart/LazyChart";
import {
    callFetchEvaluationRecordById,
    callManagerSaveScore,
    callManagerSubmitRecord,
    callManagerSaveFeedback,
    callSaveTrainingPlan,
    callFetchRecordHistory,
} from "@/config/api";

type RecordStatus = "NOT_STARTED" | "EMPLOYEE_DRAFTING" | "PENDING_MANAGER_REVIEW" | "MANAGER_REVIEWING" | "PENDING_APPROVAL" | "COMPLETED";

const STATUS_CONFIG: Record<RecordStatus, { text: string; tagColor: string }> = {
    NOT_STARTED: { text: "Chưa bắt đầu", tagColor: "default" },
    EMPLOYEE_DRAFTING: { text: "NV đang đánh giá", tagColor: "processing" },
    PENDING_MANAGER_REVIEW: { text: "Chờ quản lý chấm", tagColor: "warning" },
    MANAGER_REVIEWING: { text: "Quản lý đang chấm", tagColor: "purple" },
    PENDING_APPROVAL: { text: "Chờ phê duyệt", tagColor: "cyan" },
    COMPLETED: { text: "Hoàn tất", tagColor: "success" },
};

const GRADE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    A: { color: "#15803d", bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", label: "Xuất sắc" },
    B: { color: "#1d4ed8", bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", label: "Tốt" },
    C: { color: "#b45309", bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", label: "Khá" },
    D: { color: "#b91c1c", bg: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)", label: "Trung bình" },
    E: { color: "#be123c", bg: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)", label: "Yếu" },
};

const SCORE_DESCRIPTIONS: Record<number, string> = {
    1: "Yếu",
    2: "Trung bình",
    3: "Khá",
    4: "Tốt",
    5: "Xuất sắc"
};

const SCORE_OPTIONS = [1, 2, 3, 4, 5].map(v => ({ label: `${v} điểm - ${SCORE_DESCRIPTIONS[v]}`, value: v }));

const TRAINING_GROUP_OPTIONS = [
    { label: "Kiến thức sản phẩm", value: "PRODUCT_KNOWLEDGE" },
    { label: "Chuyên môn", value: "EXPERTISE" },
    { label: "Kỹ năng", value: "SKILLS" },
    { label: "Ngoại ngữ", value: "LANGUAGE" },
];

const getScore = (scores: any[], criteriaId: number, by: "EMPLOYEE" | "MANAGER") =>
    scores?.find(s => s.criteriaId === criteriaId && s.scoredBy === by)?.score ?? null;

const getComment = (comments: any[], type: string) =>
    comments?.find(c => c.commentType === type)?.content ?? "";

const getStickyStyle = (col: "empScore" | "empResult" | "mgrScore" | "mgrResult", isHeader = false): React.CSSProperties => {
    let right = 0;
    if (col === "mgrResult") right = 0;
    else if (col === "mgrScore") right = 120;
    else if (col === "empResult") right = 240;
    else if (col === "empScore") right = 360;
    
    const isLeftmost = col === "empScore";
    
    return {
        position: "sticky",
        right,
        width: 120,
        minWidth: 120,
        zIndex: isHeader ? 2 : 1,
        background: isHeader ? "#f8fafc" : "#fff",
        borderLeft: isLeftmost ? "1.5px solid #cbd5e1" : undefined,
        boxShadow: isLeftmost ? "-3px 0 6px -2px rgba(0,0,0,0.15)" : undefined,
        backgroundClip: "padding-box",
    };
};

interface IManagerCriteriaRowProps {
    c: any;
    cIdx: number;
    hasSub: boolean;
    isEditable: boolean;
    empScore: number | null;
    avgEmp: number | null;
    mgrScore: number | null;
    avgMgr: number | null;
    savingScore: number | null;
    handleSaveScore: (id: number, score: number) => void;
    tdB: any;
    tdLvl: any;
    tdSc: any;
    showCriteria: boolean;
}

const ManagerCriteriaRow = React.memo(({
    c, cIdx, hasSub, isEditable, empScore, avgEmp, mgrScore, avgMgr, savingScore, handleSaveScore, tdB, tdLvl, tdSc, showCriteria
}: IManagerCriteriaRowProps) => {
    const getL = (lvl: number) => c.levels?.find((l: any) => l.level === lvl)?.description || "";
    return (
        <tr className="eval-row">
            <td style={{ ...tdB, textAlign: "center", color: "#475569", fontWeight: 800, fontSize: 13 }}>{cIdx + 1}</td>
            <td style={{ ...tdB, color: "#111827" }}>
                <div style={{ fontWeight: hasSub ? 700 : 500 }}>{c.name}</div>
                {c.description && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontStyle: "italic", fontWeight: "normal" }}>{c.description}</div>}
            </td>
            <td style={{ ...tdB, color: "#6b7280", fontSize: 12 }}>{c.measurementMethod}</td>
            {showCriteria && [1, 2, 3, 4, 5].map(lvl => <td key={lvl} style={tdLvl}>{getL(lvl)}</td>)}
            <td style={{ ...tdB, textAlign: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#111827", background: "#f3f4f6", borderRadius: 5, padding: "2px 8px", whiteSpace: "nowrap", display: "inline-block" }}>
                    {(c.weight * 100).toFixed(0)}%
                </span>
            </td>
            <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("empScore") }}>
                {hasSub ? (
                    <span style={{ fontSize: 18, fontWeight: 800, color: avgEmp != null ? "#f43f5e" : "#e5e7eb" }}>{avgEmp != null ? avgEmp.toFixed(2) : "—"}</span>
                ) : (
                    <span style={{ fontSize: 18, fontWeight: 800, color: empScore != null ? "#f43f5e" : "#e5e7eb" }}>{empScore ?? "—"}</span>
                )}
            </td>
            <td style={{ ...tdSc, ...getStickyStyle("empResult") }}>
                {hasSub ? (
                    avgEmp != null ? <span style={{ fontSize: 14, fontWeight: 700, color: "#f43f5e" }}>{(avgEmp * c.weight).toFixed(2)}</span> : <span style={{ color: "#e5e7eb" }}>—</span>
                ) : (
                    empScore != null ? <span style={{ fontSize: 14, fontWeight: 700, color: "#f43f5e" }}>{(empScore * c.weight).toFixed(2)}</span> : <span style={{ color: "#e5e7eb" }}>—</span>
                )}
            </td>
            <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("mgrScore") }}>
                {hasSub ? (
                    <span style={{ fontSize: 18, fontWeight: 800, color: avgMgr != null ? "#111827" : "#e5e7eb" }}>{avgMgr != null ? avgMgr.toFixed(2) : "—"}</span>
                ) : isEditable ? (
                    <Select size="middle" style={{ width: 120 }} placeholder="Chọn..."
                        popupMatchSelectWidth={false}
                        className={mgrScore == null ? "unfilled-select" : ""}
                        value={mgrScore ?? undefined} loading={savingScore === c.id}
                        onChange={(val) => handleSaveScore(c.id, val)} options={SCORE_OPTIONS} />
                ) : (
                    <span style={{ fontSize: 18, fontWeight: 800, color: mgrScore != null ? "#111827" : "#e5e7eb" }}>{mgrScore ?? "—"}</span>
                )}
            </td>
            <td style={{ ...tdSc, ...getStickyStyle("mgrResult") }}>
                {hasSub ? (
                    avgMgr != null ? <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{(avgMgr * c.weight).toFixed(2)}</span> : <span style={{ color: "#e5e7eb" }}>—</span>
                ) : (
                    mgrScore != null ? <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{(mgrScore * c.weight).toFixed(2)}</span> : <span style={{ color: "#e5e7eb" }}>—</span>
                )}
            </td>
        </tr>
    );
});

interface IManagerSubCriteriaRowProps {
    sub: any;
    cIdx: number;
    si: number;
    isEditable: boolean;
    subEmp: number | null;
    subMgr: number | null;
    savingScore: number | null;
    handleSaveScore: (id: number, score: number) => void;
    tdB: any;
    tdLvl: any;
    tdSc: any;
    showCriteria: boolean;
}

const ManagerSubCriteriaRow = React.memo(({
    sub, cIdx, si, isEditable, subEmp, subMgr, savingScore, handleSaveScore, tdB, tdLvl, tdSc, showCriteria
}: IManagerSubCriteriaRowProps) => {
    const getSL = (lvl: number) => sub.levels?.find((l: any) => l.level === lvl)?.description || "";
    return (
        <tr className="eval-row">
            <td style={{ ...tdB, textAlign: "center", color: "#475569", fontWeight: 800, fontSize: 12 }}>{cIdx + 1}.{si + 1}</td>
            <td style={{ ...tdB, paddingLeft: 14, color: "#111827", borderLeft: "none" }}>
                <div style={{ fontWeight: 500 }}>{sub.name}</div>
                {sub.description && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontStyle: "italic", fontWeight: "normal" }}>{sub.description}</div>}
            </td>
            <td style={{ ...tdB, color: "#6b7280", fontSize: 12 }}>{sub.measurementMethod}</td>
            {showCriteria && [1, 2, 3, 4, 5].map(lvl => <td key={lvl} style={tdLvl}>{getSL(lvl)}</td>)}
            <td style={{ ...tdB, textAlign: "center" }}>
                <span style={{ color: "#e5e7eb" }}>—</span>
            </td>
            <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("empScore") }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: subEmp != null ? "#f43f5e" : "#e5e7eb" }}>{subEmp ?? "—"}</span>
            </td>
            <td style={{ ...tdSc, ...getStickyStyle("empResult") }}>
                <span style={{ color: "#e5e7eb" }}>—</span>
            </td>
            <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("mgrScore") }}>
                {isEditable ? (
                    <Select size="middle" style={{ width: 120 }} placeholder="Chọn..."
                        popupMatchSelectWidth={false}
                        className={subMgr == null ? "unfilled-select" : ""}
                        value={subMgr ?? undefined} loading={savingScore === sub.id}
                        onChange={(val) => handleSaveScore(sub.id, val)} options={SCORE_OPTIONS} />
                ) : (
                    <span style={{ fontSize: 18, fontWeight: 800, color: subMgr != null ? "#111827" : "#e5e7eb" }}>{subMgr ?? "—"}</span>
                )}
            </td>
            <td style={{ ...tdSc, ...getStickyStyle("mgrResult") }}>
                <span style={{ color: "#e5e7eb" }}>—</span>
            </td>
        </tr>
    );
});

const ManagerEvaluationDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const showCriteria = true;

    const [record, setRecord] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [savingComment, setSavingComment] = useState(false);
    const [managerFeedback, setManagerFeedback] = useState("");
    const [localScores, setLocalScores] = useState<Record<number, number>>({});
    const [savingScore, setSavingScore] = useState<number | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isError, setIsError] = useState(false);
    const [savingPlan, setSavingPlan] = useState(false);
    const [planForm, setPlanForm] = useState<{ trainingGroup?: string; content: string; requirements: string; solution: string; completionTimeline: string }>({ content: "", requirements: "", solution: "", completionTimeline: "" });

    const canScore = useAccess(ALL_PERMISSIONS.EVALUATION.MANAGER_SCORE);
    const canFeedback = useAccess(ALL_PERMISSIONS.EVALUATION.MANAGER_FEEDBACK);
    const canSubmit = useAccess(ALL_PERMISSIONS.EVALUATION.MANAGER_SUBMIT);

    useBlocker(() => {
        if (isDirty) {
            const confirmed = window.confirm("Bạn có nhận xét chưa lưu. Bạn có chắc muốn rời khỏi trang?");
            return !confirmed;
        }
        return false;
    });

    const fetchRecord = useCallback(async () => {
        if (!id || isNaN(Number(id))) return;
        setLoading(true);
        setIsError(false);
        try {
            const [recRes, histRes] = await Promise.all([
                callFetchEvaluationRecordById(Number(id)),
                callFetchRecordHistory(Number(id)),
            ]);
            if (recRes?.data) {
                setRecord(recRes.data);
                const commentManager = recRes.data.comments?.find((c: any) => c.commentType === "MANAGER_FEEDBACK");
                if (commentManager) setManagerFeedback(commentManager.content);
                const initScores: Record<number, number> = {};
                recRes.data.scores?.forEach((s: any) => {
                    if (s.scoredBy === "MANAGER") initScores[s.criteriaId] = s.score;
                });
                setLocalScores(initScores);
            }
            if (histRes?.data) setHistory(histRes.data);
        } catch {
            setIsError(true);
            notify.error("Lỗi tải dữ liệu đánh giá");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchRecord(); }, [fetchRecord]);

    const handleSaveScore = async (criteriaId: number, score: number) => {
        if (!record?.id) return;
        setSavingScore(criteriaId);
        const originalScore = localScores[criteriaId];
        setLocalScores(prev => ({ ...prev, [criteriaId]: score }));
        try {
            await callManagerSaveScore(record.id, criteriaId, score);
            notify.success("Đã cập nhật điểm thành công");
        } catch (err: any) {
            notify.error(err?.message || err?.response?.data?.message || "Lỗi lưu điểm");
            setLocalScores(prev => ({ ...prev, [criteriaId]: originalScore }));
        } finally { setSavingScore(null); }
    };

    const handleSaveFeedback = async () => {
        if (!record?.id) return;
        setSavingComment(true);
        try {
            await callManagerSaveFeedback(record.id, managerFeedback);
            setIsDirty(false);
            notify.success("Đã lưu nhận xét");
        } catch (err: any) {
            notify.error(err?.message || err?.response?.data?.message || "Lỗi lưu nhận xét");
        } finally { setSavingComment(false); }
    };

    const handleSubmit = async () => {
        if (!record?.id) return;
        setSubmitting(true);
        try {
            // Flush nhận xét trước khi nộp (tránh mất dữ liệu âm thầm)
            await callManagerSaveFeedback(record.id, managerFeedback);
            setIsDirty(false);
            await callManagerSubmitRecord(record.id);
            notify.success("Đã nộp phê duyệt!");
            fetchRecord();
        } catch (err: any) {
            notify.error(err?.message || err?.response?.data?.message || "Lỗi nộp bản đánh giá");
        } finally { setSubmitting(false); }
    };

    const handleSavePlan = async () => {
        if (!record?.id) return;
        if (!planForm.trainingGroup) { notify.warning("Vui lòng chọn nhóm đào tạo"); return; }
        if (!planForm.content.trim()) { notify.warning("Vui lòng nhập nội dung đào tạo"); return; }
        setSavingPlan(true);
        try {
            await callSaveTrainingPlan(record.id, {
                trainingGroup: planForm.trainingGroup,
                content: planForm.content.trim(),
                requirements: planForm.requirements.trim() || undefined,
                solution: planForm.solution.trim() || undefined,
                completionTimeline: planForm.completionTimeline.trim() || undefined,
            });
            notify.success("Đã thêm kế hoạch đào tạo");
            setPlanForm({ content: "", requirements: "", solution: "", completionTimeline: "" });
            fetchRecord();
        } catch (err: any) {
            notify.error(err?.message || err?.response?.data?.message || "Lỗi lưu kế hoạch đào tạo");
        } finally { setSavingPlan(false); }
    };

    const handleExportExcel = () => {
        if (record) {
            exportDetailedEvaluation(record);
        }
    };

    const handlePrintPDF = () => {
        if (record) {
            printEvaluationDetail(record);
        }
    };

    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
            <Spin size="large" />
        </div>
    );
    if (isError) return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: 400, gap: 16 }}>
            <Empty description="Lỗi tải dữ liệu bản đánh giá" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            <Button type="primary" onClick={fetchRecord}>Thử lại</Button>
        </div>
    );
    if (!record) return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
            <Empty description="Không tìm thấy bản đánh giá" />
        </div>
    );

    const isEditable = record.status === "PENDING_MANAGER_REVIEW" || record.status === "MANAGER_REVIEWING";
    const isCompleted = record.status === "COMPLETED";
    const hasConfirmed = isCompleted && !!record.completedAt;
    const statusCfg = STATUS_CONFIG[record.status as RecordStatus] ?? STATUS_CONFIG.NOT_STARTED;
    const gradeCfg = record.finalGrade ? GRADE_CONFIG[record.finalGrade] : null;

    const allLeafCriteria: any[] = [];
    record.template?.sections?.forEach((sec: any) => {
        sec.criteria?.forEach((c: any) => {
            if (!c.subCriteria?.length) allLeafCriteria.push(c);
            else c.subCriteria?.forEach((sub: any) => allLeafCriteria.push(sub));
        });
    });
    const scoredCount = allLeafCriteria.filter(c => localScores[c.id] != null).length;
    const progressPct = allLeafCriteria.length ? Math.round((scoredCount / allLeafCriteria.length) * 100) : 0

    const thS: React.CSSProperties = {
        padding: "12px 14px", fontWeight: 800, fontSize: 12, color: "#111827",
        background: "#f8fafc", borderBottom: "1px solid #dbe3ef", borderRight: "1px solid #e2e8f0",
        textAlign: "center", whiteSpace: "nowrap", verticalAlign: "middle"
    };
    const thG: React.CSSProperties = {
        padding: "12px 14px", fontWeight: 800, fontSize: 12, color: "#111827",
        background: "#f8fafc", borderBottom: "1px solid #dbe3ef", borderRight: "1px solid #e2e8f0", textAlign: "center", verticalAlign: "middle"
    };
    const thSub: React.CSSProperties = {
        padding: "10px 10px", fontWeight: 800, fontSize: 11, color: "#334155",
        background: "#f8fafc", borderBottom: "1px solid #dbe3ef", borderRight: "1px solid #e2e8f0",
        textAlign: "center", whiteSpace: "nowrap", verticalAlign: "middle"
    };
    const tdB: React.CSSProperties = {
        padding: "14px 14px", borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0",
        fontSize: 13, verticalAlign: "top", lineHeight: 1.55, color: "#334155",
        textAlign: "left", overflowWrap: "break-word", wordBreak: "normal"
    };
    const tdLvl: React.CSSProperties = {
        padding: "10px 8px", borderBottom: "1px solid #e2e8f0",
        borderRight: "1px dashed #dbe3ef", fontSize: 11.5, color: "#4b5563",
        verticalAlign: "top", lineHeight: 1.5, minWidth: 155, width: 155,
        textAlign: "justify", overflowWrap: "break-word", wordBreak: "normal"
    };
    const tdSc: React.CSSProperties = {
        padding: "14px 12px", borderBottom: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0",
        textAlign: "center", verticalAlign: "middle", background: "#ffffff"
    };

    // ── Table style helpers ──
    const thStyle: React.CSSProperties = {
        padding: "14px 12px",
        fontWeight: 700,
        fontSize: 12,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        background: "#f8fafc",
        borderBottom: "1.5px solid #e2e8f0",
        textAlign: "center",
        whiteSpace: "nowrap"
    };
    const thGroupStyle: React.CSSProperties = {
        padding: "12px",
        fontWeight: 700,
        fontSize: 12,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        borderBottom: "1.5px solid #e2e8f0",
        textAlign: "center"
    };
    const thSubStyle: React.CSSProperties = {
        padding: "10px 8px",
        fontWeight: 600,
        fontSize: 11,
        color: "#94a3b8",
        background: "#fafafa",
        borderBottom: "1.5px solid #e2e8f0",
        textAlign: "center",
        whiteSpace: "nowrap"
    };
    const tdBase: React.CSSProperties = {
        padding: "14px 12px",
        borderBottom: "1px solid #fce7eb",
        fontSize: 13,
        verticalAlign: "top",
        lineHeight: 1.5
    };
    const tdLevel: React.CSSProperties = {
        padding: "14px 10px",
        borderBottom: "1px solid #fce7eb",
        borderRight: "1px dashed #fce7eb",
        fontSize: 12,
        color: "#64748b",
        verticalAlign: "top",
        lineHeight: 1.5,
        minWidth: 110
    };
    const tdScore: React.CSSProperties = {
        padding: "14px 12px",
        borderBottom: "1px solid #fce7eb",
        textAlign: "center",
        verticalAlign: "middle",
        background: "#fffbfc"
    };

    // ── Prepare Radar Chart Data ──
    const radarData: any[] = [];
    if (record.template?.sections && (record.status !== "NOT_STARTED" && record.status !== "EMPLOYEE_DRAFTING")) {
        record.template.sections.forEach((section: any) => {
            let empTotal = 0, mgrTotal = 0;
            section.criteria?.forEach((c: any) => {
                const hasSub = c.subCriteria?.length > 0;
                if (hasSub) {
                    let sumEmp = 0, sumMgr = 0, cntEmp = 0, cntMgr = 0;
                    c.subCriteria.forEach((sub: any) => {
                        const subEmp = getScore(record.scores, sub.id, "EMPLOYEE");
                        const subMgr = localScores[sub.id] ?? getScore(record.scores, sub.id, "MANAGER");
                        if (subEmp != null) { sumEmp += subEmp; cntEmp++; }
                        if (subMgr != null) { sumMgr += subMgr; cntMgr++; }
                    });
                    if (cntEmp > 0) empTotal += (sumEmp / c.subCriteria.length) * c.weight;
                    if (cntMgr > 0) mgrTotal += (sumMgr / c.subCriteria.length) * c.weight;
                } else {
                    const empScore = getScore(record.scores, c.id, "EMPLOYEE");
                    const mgrScore = localScores[c.id] ?? getScore(record.scores, c.id, "MANAGER");
                    if (empScore != null) empTotal += empScore * c.weight;
                    if (mgrScore != null) mgrTotal += mgrScore * c.weight;
                }
            });
            // Convert to 0-5 scale for the radar chart
            const empAvg = section.weight > 0 ? empTotal / section.weight : 0;
            const mgrAvg = section.weight > 0 ? mgrTotal / section.weight : 0;

            radarData.push({
                item: section.name,
                user: "Nhân viên",
                score: Number(empAvg.toFixed(2))
            });
            radarData.push({
                item: section.name,
                user: "Quản lý",
                score: Number(mgrAvg.toFixed(2))
            });
        });
    }

    const uniqueItems = new Set(radarData.map(d => d.item)).size;

    const chartConfig = {
        data: radarData,
        xField: 'item',
        yField: 'score',
        colorField: 'user',
        scale: {
            y: { domain: [0, 5] },
        },
    };

    return (
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 16px 100px", fontFamily: "'Inter', -apple-system, sans-serif", background: "#f9fafb", minHeight: "100vh" }}>

            {/* ─── HEADER ─── */}
            <div style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: "24px 28px",
                marginBottom: 16,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <button
                            onClick={() => navigate("/admin/evaluation/process?tab=PENDING_EVAL")}
                            style={{
                                width: 40, height: 40, borderRadius: 10,
                                border: "1px solid #e5e7eb", background: "#fff",
                                color: "#111827", display: "flex", alignItems: "center",
                                justifyContent: "center", cursor: "pointer", fontSize: 16,
                                flexShrink: 0, transition: "all 0.15s"
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#d1d5db"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; }}
                        >
                            <ArrowLeftOutlined />
                        </button>
                        <div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px" }}>{record.template?.name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                                <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>Kỳ đánh giá:</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#f43f5e", background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 6, padding: "2px 10px" }}>
                                    {record.period?.name || `Đợt ${record.periodId}`}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: 12, alignItems: "stretch", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <Button
                                icon={<FileExcelOutlined />}
                                onClick={handleExportExcel}
                                style={{ borderRadius: 6, color: "#047857", borderColor: "#34d399", background: "#ecfdf5" }}
                            >
                                Xuất Excel
                            </Button>
                            <Button
                                icon={<FileTextOutlined />}
                                onClick={handlePrintPDF}
                                style={{ borderRadius: 6, color: "#1d4ed8", borderColor: "#60a5fa", background: "#eff6ff" }}
                            >
                                Xuất PDF
                            </Button>
                        </div>
                        {/* Nhân viên đánh giá */}
                        {record.employeeTotalScore != null && (
                            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 16px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>NV đánh giá</div>
                                <div style={{ fontSize: 20, fontWeight: 900, color: "#475569", marginTop: 2 }}>{record.employeeTotalScore.toFixed(2)}</div>
                            </div>
                        )}

                        {/* Điểm Quản lý & Xếp loại */}
                        {isCompleted && gradeCfg && record.managerTotalScore != null && (
                            <>
                                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 16px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                                    <div style={{ fontSize: 11, color: "#1e293b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Quản lý chấm</div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 2 }}>{record.managerTotalScore.toFixed(2)}</div>
                                </div>
                                <div style={{ background: gradeCfg.bg, border: `1px solid ${gradeCfg.color}30`, borderRadius: 12, padding: "10px 24px", display: "flex", alignItems: "center", gap: 14, boxShadow: `0 4px 12px ${gradeCfg.color}20` }}>
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "center" }}>
                                        <div style={{ fontSize: 11, color: gradeCfg.color, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.8 }}>Xếp loại</div>
                                        <div style={{ fontSize: 16, fontWeight: 800, color: gradeCfg.color }}>{gradeCfg.label}</div>
                                    </div>
                                    <div style={{ width: 1.5, height: 36, background: `${gradeCfg.color}30`, borderRadius: 2 }}></div>
                                    <div style={{ fontSize: 36, fontWeight: 900, color: gradeCfg.color, lineHeight: 1 }}>{record.finalGrade}</div>
                                </div>
                            </>
                        )}

                        {/* Nếu chưa complete mà quản lý đang chấm thì vẫn hiện thẻ điểm quản lý đơn giản */}
                        {!isCompleted && record.managerTotalScore != null && (
                            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 20px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                                <div style={{ fontSize: 11, color: "#1e293b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Quản lý chấm</div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", marginTop: 2 }}>{record.managerTotalScore.toFixed(2)}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3.6: Cảnh báo chênh lệch điểm Nhân viên vs Quản lý > 1.0 */}
            {record.employeeTotalScore != null && record.managerTotalScore != null && Math.abs(record.employeeTotalScore - record.managerTotalScore) > 1.0 && (
                <Alert
                    message="Cảnh báo chênh lệch điểm số"
                    description="Điểm đánh giá của bạn đang chênh lệch lớn (> 1.0 điểm) so với tự đánh giá của nhân viên. Vui lòng cân nhắc xem xét kỹ hoặc ghi nhận xét giải thích."
                    type="warning"
                    showIcon
                    style={{ marginBottom: 16, borderRadius: 12 }}
                />
            )}

            {/* ─── PROGRESS ─── */}
            {isEditable && (
                <div style={{ background: "linear-gradient(to right, #fff, #fff8f9)", border: "1px solid #fce7eb", borderRadius: 14, padding: "20px 24px", marginBottom: 16, display: "flex", alignItems: "center", gap: 20, boxShadow: "0 4px 20px rgba(244,63,94,0.04)" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#fff1f2", color: "#f43f5e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0, border: "1px solid #fecdd3" }}>
                        <TrophyOutlined />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                                Tiến độ đánh giá của Quản lý
                                <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 500, color: "#6b7280" }}>(<span style={{ color: "#f43f5e", fontWeight: 700 }}>{scoredCount}</span> / {allLeafCriteria.length} tiêu chí)</span>
                            </div>
                            <span style={{ fontSize: 22, fontWeight: 900, color: progressPct === 100 ? "#f43f5e" : "#111827" }}>{progressPct}%</span>
                        </div>
                        <Progress percent={progressPct} showInfo={false} strokeWidth={8} strokeColor={{ '0%': '#f43f5e', '100%': '#be123c' }} trailColor="#f3f4f6" status={progressPct === 100 ? "success" : "active"} style={{ margin: 0 }} />
                    </div>
                </div>
            )}


            {/* ─── CHART ─── */}
            {radarData.length > 0 && (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16, textAlign: "center" }}>
                        Biểu đồ so sánh đánh giá năng lực
                    </div>
                    <div style={{ height: 350 }}>
                        {uniqueItems >= 3 ? (
                            <Radar
                                {...chartConfig}
                                shapeField="smooth"
                                area={{ style: { fillOpacity: 0.2 } }}
                                axis={{ x: { grid: true }, y: { zIndex: 1, title: false } }}
                            />
                        ) : (
                            <Column
                                {...chartConfig}
                                seriesField="user"
                                isGroup={true}
                                group={true}
                                maxColumnWidth={60}
                            />
                        )}
                    </div>
                </div>
            )}

            {/* ─── NHÂN SỰ ─── */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 22px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}><UserOutlined style={{ color: "#f43f5e", marginRight: 8 }} />Thông tin nhân sự</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                    {[
                        { label: "Nhân viên", info: record.employee },
                        { label: "Quản lý trực tiếp", info: record.directManager },
                        { label: "Quản lý gián tiếp", info: record.indirectManager },
                    ].map(({ label, info }) => info?.id ? (
                        <div key={label} style={{ background: "#f9fafb", borderRadius: 10, padding: "12px 14px", border: "1px solid #f3f4f6" }}>
                            <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 6 }}>{label}</div>
                            <div style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>{info.fullName || info.username}</div>
                            <div style={{ fontSize: 12, color: "#374151", fontWeight: 500, marginTop: 4 }}>
                                {info.jobTitle || "Chưa cập nhật chức danh"} {info.positionLevel ? `(${info.positionLevel})` : ""}
                            </div>
                        </div>
                    ) : null)}
                </div>
            </div>

            {/* ─── HƯỚNG DẪN THỰC HIỆN ─── */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.03)", display: "flex", flexWrap: "wrap", gap: 24 }}>
                <div style={{ flex: "2 1 400px" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12, borderBottom: "1px solid #f3f4f6", paddingBottom: 8 }}><BookOutlined style={{ color: "#f43f5e", marginRight: 8 }} />Hướng dẫn thực hiện</div>
                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
                        <div style={{ marginBottom: 4 }}><strong style={{ color: "#111827" }}>1. Cột Nội dung đánh giá:</strong> Phản ánh các nội dung đánh giá chính liên quan đến người lao động.</div>
                        <div style={{ marginBottom: 4 }}><strong style={{ color: "#111827" }}>2. Cột Phương pháp đo lường:</strong> Thể hiện phương pháp được sử dụng để đo lường nội dung đánh giá.</div>
                        <div style={{ marginBottom: 4 }}><strong style={{ color: "#111827" }}>3. Tiêu chí đánh giá theo thang điểm:</strong> Định nghĩa cụ thể, phù hợp với từng nội dung đánh giá.</div>
                        <div style={{ marginBottom: 4 }}><strong style={{ color: "#111827" }}>4. Cột trọng số:</strong> Tổng trọng số của mỗi phần là 100%, trọng số cao thể hiện mức độ quan trọng.</div>
                        <div style={{ marginBottom: 4 }}><strong style={{ color: "#111827" }}>5. Cột chấm điểm:</strong> Cá nhân, cán bộ ghi số điểm chi tiết cho từng nội dung đánh giá.</div>
                        <div style={{ marginBottom: 4 }}><strong style={{ color: "#111827" }}>6. Cột kết quả:</strong> Là điểm qui đổi = Điểm chấm × Trọng số.</div>
                    </div>
                </div>
                <div style={{ flex: "1 1 300px", background: "#f9fafb", borderRadius: 10, border: "1px solid #e5e7eb", padding: "16px 20px" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12, textAlign: "center" }}>Thang điểm đánh giá</div>
                    <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", border: "1px solid #e5e7eb" }}>
                        <tbody>
                            {[
                                { score: 5, desc: "Hoàn thành công việc ở mức độ xuất sắc" },
                                { score: 4, desc: "Hoàn thành công việc ở mức độ tốt" },
                                { score: 3, desc: "Hoàn thành công việc ở mức độ khá" },
                                { score: 2, desc: "Hoàn thành công việc ở mức độ trung bình" },
                                { score: 1, desc: "Chưa đáp ứng được một số yêu cầu" }
                            ].map(item => (
                                <tr key={item.score} style={{ borderBottom: item.score > 1 ? "1px solid #e5e7eb" : "none" }}>
                                    <td style={{ padding: "8px 12px", fontWeight: 800, color: "#f43f5e", textAlign: "center", borderRight: "1px solid #e5e7eb", width: 40 }}>{item.score}</td>
                                    <td style={{ padding: "8px 12px", color: "#374151", fontWeight: 500 }}>{item.desc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── BẢNG ĐÁNH GIÁ ─── */}
            <div style={{ overflowX: "auto", marginBottom: 16, borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1780, tableLayout: "fixed" }}>
                    <colgroup>
                        <col style={{ width: 64 }} />
                        <col />
                        <col style={{ width: 190 }} />
                        {showCriteria && [1, 2, 3, 4, 5].map(n => <col key={n} style={{ width: 155 }} />)}
                        <col style={{ width: 80 }} />
                        <col style={{ width: 120 }} />
                        <col style={{ width: 120 }} />
                        <col style={{ width: 120 }} />
                        <col style={{ width: 120 }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th rowSpan={2} style={{ ...thS, width: 64 }}>STT</th>
                            <th rowSpan={2} style={{ ...thS, textAlign: "left" }}>Nội dung đánh giá</th>
                            <th rowSpan={2} style={{ ...thS, textAlign: "left", width: 190 }}>Phương pháp đo lường</th>
                            {showCriteria && <th colSpan={5} style={{ ...thG, background: "#f9fafb" }}>Tiêu chí đánh giá theo thang điểm</th>}
                            <th rowSpan={2} style={{ ...thS, width: 80 }}>Trọng số</th>
                            <th colSpan={2} style={{
                                ...thG,
                                position: "sticky",
                                right: 240,
                                zIndex: 2,
                                background: "#f8fafc",
                                borderLeft: "1.5px solid #cbd5e1",
                                boxShadow: "-3px 0 6px -2px rgba(0,0,0,0.15)",
                                backgroundClip: "padding-box"
                            }}>
                                <span style={{ color: "#111827" }}>CBNV đánh giá</span>
                            </th>
                            <th colSpan={2} style={{
                                ...thG,
                                borderLeft: "none",
                                position: "sticky",
                                right: 0,
                                zIndex: 2,
                                background: "#f8fafc",
                                backgroundClip: "padding-box"
                            }}>Đánh giá của Quản lý</th>
                        </tr>
                        <tr>
                            {showCriteria && [1, 2, 3, 4, 5].map(n => <th key={n} style={{ ...thSub, width: 155, color: "#e11d48" }}>Mức {n}</th>)}
                            <th style={{ ...thSub, color: "#374151", ...getStickyStyle("empScore", true) }}>Điểm<span style={{ color: "#f43f5e", marginLeft: 4 }}>*</span></th>
                            <th style={{ ...thSub, color: "#374151", ...getStickyStyle("empResult", true) }}>Kết quả</th>
                            <th style={{ ...thSub, ...getStickyStyle("mgrScore", true) }}>Điểm</th>
                            <th style={{ ...thSub, ...getStickyStyle("mgrResult", true) }}>Kết quả</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            let dynamicEmpTotal = 0;
                            let dynamicMgrTotal = 0;

                            const sectionElements = record.template?.sections?.map((section: any) => {
                                let empTotal = 0, mgrTotal = 0;
                                const rows: React.ReactNode[] = [];

                                rows.push(
                                    <tr key={`sec-${section.id}`}>
                                        <td colSpan={showCriteria ? 13 : 8} style={{
                                            padding: "10px 18px",
                                            background: "#f3f4f6",
                                            borderTop: "1px solid #e5e7eb",
                                            borderBottom: "1px solid #e5e7eb",
                                            borderLeft: "4px solid #f43f5e"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <span style={{ fontWeight: 800, fontSize: 13, color: "#111827", textTransform: "uppercase", letterSpacing: "0.3px" }}>{section.name}</span>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Trọng số {(section.weight * 100).toFixed(0)}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                );

                                section.criteria?.forEach((c: any, cIdx: number) => {
                                    const hasSub = c.subCriteria?.length > 0;
                                    const empScore = getScore(record.scores, c.id, "EMPLOYEE");
                                    const mgrScore = localScores[c.id] ?? getScore(record.scores, c.id, "MANAGER");
                                    const getL = (lvl: number) => c.levels?.find((l: any) => l.level === lvl)?.description || "";

                                    let avgEmp: number | null = null;
                                    let avgMgr: number | null = null;

                                    if (hasSub) {
                                        let sumEmp = 0, sumMgr = 0, cntEmp = 0, cntMgr = 0;
                                        c.subCriteria.forEach((sub: any) => {
                                            const e = getScore(record.scores, sub.id, "EMPLOYEE");
                                            const m = localScores[sub.id] ?? getScore(record.scores, sub.id, "MANAGER");
                                            if (e != null) { sumEmp += e; cntEmp++; }
                                            if (m != null) { sumMgr += m; cntMgr++; }
                                        });
                                        if (cntEmp > 0) avgEmp = sumEmp / c.subCriteria.length;
                                        if (cntMgr > 0) avgMgr = sumMgr / c.subCriteria.length;

                                        if (avgEmp != null) empTotal += avgEmp * c.weight;
                                        if (avgMgr != null) mgrTotal += avgMgr * c.weight;
                                    } else {
                                        if (empScore != null) empTotal += empScore * c.weight;
                                        if (mgrScore != null) mgrTotal += mgrScore * c.weight;
                                    }

                                    rows.push(
                                        <ManagerCriteriaRow
                                            key={`c-${c.id}`}
                                            c={c}
                                            cIdx={cIdx}
                                            hasSub={hasSub}
                                            isEditable={isEditable && canScore}
                                            empScore={empScore}
                                            avgEmp={avgEmp}
                                            mgrScore={mgrScore}
                                            avgMgr={avgMgr}
                                            savingScore={savingScore}
                                            handleSaveScore={handleSaveScore}
                                            tdB={tdB}
                                            tdLvl={tdLvl}
                                            tdSc={tdSc}
                                            showCriteria={showCriteria}
                                        />
                                    );

                                    if (hasSub) {
                                        c.subCriteria?.forEach((sub: any, si: number) => {
                                            const subEmp = getScore(record.scores, sub.id, "EMPLOYEE");
                                            const subMgr = localScores[sub.id] ?? getScore(record.scores, sub.id, "MANAGER");

                                            rows.push(
                                                <ManagerSubCriteriaRow
                                                    key={`sub-${sub.id}`}
                                                    sub={sub}
                                                    cIdx={cIdx}
                                                    si={si}
                                                    isEditable={isEditable && canScore}
                                                    subEmp={subEmp}
                                                    subMgr={subMgr}
                                                    savingScore={savingScore}
                                                    handleSaveScore={handleSaveScore}
                                                    tdB={tdB}
                                                    tdLvl={tdLvl}
                                                    tdSc={tdSc}
                                                    showCriteria={showCriteria}
                                                />
                                            );
                                        });
                                    }
                                });

                                // Section subtotal
                                rows.push(
                                    <tr key={`stot-${section.id}`} style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                                        <td colSpan={showCriteria ? 8 : 3} style={{ padding: "12px 18px", textAlign: "right", fontSize: 12, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.3px", position: "relative", zIndex: 0 }}>
                                            Tổng kết {section.name}
                                        </td>
                                        <td style={{ padding: "12px", textAlign: "center", fontWeight: 700, color: "#111827" }}>{(section.weight * 100).toFixed(0)}%</td>
                                        <td style={{ padding: "12px", borderLeft: "none", ...getStickyStyle("empScore"), background: "#f9fafb" }} />
                                        <td style={{ padding: "12px", textAlign: "center", ...getStickyStyle("empResult"), background: "#f9fafb" }}>
                                            <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{empTotal.toFixed(2)}</span>
                                        </td>
                                        <td style={{ padding: "12px", borderLeft: "none", ...getStickyStyle("mgrScore"), background: "#f9fafb" }} />
                                        <td style={{ padding: "12px", textAlign: "center", ...getStickyStyle("mgrResult"), background: "#f9fafb" }}>
                                            <span style={{ fontSize: 16, fontWeight: 800, color: "#f43f5e" }}>{mgrTotal.toFixed(2)}</span>
                                        </td>
                                    </tr>
                                );

                                dynamicEmpTotal += empTotal;
                                dynamicMgrTotal += mgrTotal;
                                return rows;
                            });

                            return (
                                <>
                                    {sectionElements}
                                    {/* Grand Total */}
                                    <tr style={{ borderTop: "2px solid #e5e7eb", background: "#fff" }}>
                                        <td colSpan={showCriteria ? 8 : 3} style={{ padding: "18px 24px", textAlign: "right", fontWeight: 800, fontSize: 14, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                            Tổng điểm đánh giá chung
                                        </td>
                                        <td style={{ padding: "18px 12px", textAlign: "center", fontWeight: 800, color: "#111827" }}>100%</td>
                                        <td style={{ padding: "18px 12px", borderLeft: "none", ...getStickyStyle("empScore") }} />
                                        <td style={{ padding: "18px 12px", textAlign: "center", ...getStickyStyle("empResult") }}>
                                            <span style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>
                                                {dynamicEmpTotal > 0 ? dynamicEmpTotal.toFixed(2) : "—"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "18px 12px", borderLeft: "none", ...getStickyStyle("mgrScore") }} />
                                        <td style={{ padding: "18px 12px", textAlign: "center", ...getStickyStyle("mgrResult") }}>
                                            <span style={{ fontSize: 24, fontWeight: 900, color: "#f43f5e" }}>
                                                {dynamicMgrTotal > 0 ? dynamicMgrTotal.toFixed(2) : "—"}
                                            </span>
                                        </td>
                                    </tr>
                                </>
                            );
                        })()}
                    </tbody>
                </table>
            </div>

            {/* ─── NHẬN XÉT TỰ ĐÁNH GIÁ ─── */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 22px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>Nhận xét tự đánh giá của nhân viên</div>
                <div style={{ background: "#f9fafb", borderRadius: 8, padding: "14px 16px", fontSize: 14, color: getComment(record.comments, "SELF_REVIEW") ? "#111827" : "#9ca3af", fontStyle: getComment(record.comments, "SELF_REVIEW") ? "normal" : "italic", lineHeight: 1.7, border: "1px solid #f3f4f6" }}>
                    {getComment(record.comments, "SELF_REVIEW") || "Nhân viên chưa viết nhận xét tự đánh giá."}
                </div>
            </div>

            {/* ─── NHẬN XÉT CỦA QUẢN LÝ ─── */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 22px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>Nhận xét / Phản hồi của Quản lý</div>
                {isEditable && canFeedback ? (
                    <div>
                        <Input.TextArea rows={4} value={managerFeedback} onChange={e => { setManagerFeedback(e.target.value); setIsDirty(true); }}
                            placeholder="Nhập nhận xét, phản hồi về hiệu quả công việc của nhân viên..."
                            style={{ borderRadius: 8, fontSize: 14, resize: "none", borderColor: "#e5e7eb" }} />
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                            <Button onClick={handleSaveFeedback} loading={savingComment}
                                style={{ borderRadius: 8, fontWeight: 600, color: "#111827", borderColor: "#e5e7eb" }}>
                                Lưu nhận xét
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div style={{ background: "#f9fafb", borderRadius: 8, padding: "14px 16px", fontSize: 14, color: managerFeedback ? "#111827" : "#9ca3af", fontStyle: managerFeedback ? "normal" : "italic", lineHeight: 1.7, border: "1px solid #f3f4f6" }}>
                        {managerFeedback || "Quản lý chưa viết nhận xét."}
                    </div>
                )}
            </div>

            {/* ─── KẾ HOẠCH ĐÀO TẠO ─── */}
            {(record.trainingPlans?.length > 0 || (isEditable && canFeedback)) && (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 22px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>Kế hoạch đào tạo & Phát triển</div>
                    {record.trainingPlans?.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: (isEditable && canFeedback) ? 16 : 0 }}>
                            {record.trainingPlans.map((plan: any) => (
                                <div key={plan.id} style={{ background: "#f9fafb", borderRadius: 10, padding: "16px", border: "1px solid #f3f4f6", borderLeft: "3px solid #f43f5e" }}>
                                    <div style={{ fontWeight: 700, color: "#111827", fontSize: 14, marginBottom: 8 }}>{plan.content}</div>
                                    {plan.requirements && <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}><strong style={{ color: "#9ca3af" }}>Mục tiêu:</strong> {plan.requirements}</div>}
                                    {plan.solution && <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 4 }}><strong style={{ color: "#9ca3af" }}>Giải pháp:</strong> {plan.solution}</div>}
                                    {plan.completionTimeline && (
                                        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 8, background: "#f3f4f6", borderRadius: 5, padding: "3px 10px", fontSize: 12, fontWeight: 600, color: "#111827" }}>
                                            <ClockCircleOutlined /> {plan.completionTimeline}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {isEditable && canFeedback && (
                        <div style={{ background: "#fafafa", borderRadius: 10, padding: "16px", border: "1px dashed #d9d9d9" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 12 }}>Thêm kế hoạch đào tạo</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
                                <Select
                                    placeholder="Nhóm đào tạo"
                                    value={planForm.trainingGroup}
                                    onChange={(val) => setPlanForm(prev => ({ ...prev, trainingGroup: val }))}
                                    options={TRAINING_GROUP_OPTIONS}
                                    style={{ width: "100%" }}
                                />
                                <Input
                                    placeholder="Thời hạn hoàn thành (VD: Quý 3/2026)"
                                    value={planForm.completionTimeline}
                                    onChange={(e) => setPlanForm(prev => ({ ...prev, completionTimeline: e.target.value }))}
                                />
                            </div>
                            <Input
                                placeholder="Nội dung đào tạo *"
                                value={planForm.content}
                                onChange={(e) => setPlanForm(prev => ({ ...prev, content: e.target.value }))}
                                style={{ marginBottom: 12 }}
                            />
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 12 }}>
                                <Input.TextArea
                                    rows={2}
                                    placeholder="Mục tiêu / Yêu cầu"
                                    value={planForm.requirements}
                                    onChange={(e) => setPlanForm(prev => ({ ...prev, requirements: e.target.value }))}
                                    style={{ resize: "none" }}
                                />
                                <Input.TextArea
                                    rows={2}
                                    placeholder="Giải pháp"
                                    value={planForm.solution}
                                    onChange={(e) => setPlanForm(prev => ({ ...prev, solution: e.target.value }))}
                                    style={{ resize: "none" }}
                                />
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                <Button type="primary" onClick={handleSavePlan} loading={savingPlan}
                                    disabled={!planForm.trainingGroup || !planForm.content.trim()}
                                    style={{ borderRadius: 8, fontWeight: 600 }}>
                                    Thêm kế hoạch
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ─── STICKY BOTTOM BAR ─── */}
            {isEditable && (
                <div style={{
                    position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
                    background: "rgba(255,255,255,0.92)",
                    backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
                    borderTop: "1px solid #e5e7eb",
                    boxShadow: "0 -4px 16px rgba(0,0,0,0.06)",
                    padding: "12px 24px",
                    display: "flex", justifyContent: "center", alignItems: "center", gap: 20
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: progressPct === 100 ? "#f43f5e" : "#f3f4f6",
                            display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s"
                        }}>
                            {progressPct === 100
                                ? <CheckCircleOutlined style={{ color: "#fff", fontSize: 18 }} />
                                : <FileTextOutlined style={{ color: "#9ca3af", fontSize: 16 }} />}
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Tiến độ</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>
                                <span style={{ color: "#f43f5e" }}>{scoredCount}</span> / {allLeafCriteria.length} tiêu chí
                            </div>
                        </div>
                    </div>
                    <div style={{ width: 1, height: 28, background: "#e5e7eb" }} />
                    <Access permission={ALL_PERMISSIONS.EVALUATION.MANAGER_SUBMIT} hideChildren>
                        <Popconfirm
                            title="Xác nhận nộp đánh giá?"
                            description={progressPct < 100 ? `Còn ${allLeafCriteria.length - scoredCount} tiêu chí chưa chấm.` : "Sau khi nộp bạn sẽ không thể chỉnh sửa."}
                            onConfirm={progressPct === 100 ? handleSubmit : undefined}
                            okText={progressPct === 100 ? "Nộp ngay" : "Đã hiểu"}
                            cancelText="Hủy"
                            okButtonProps={{ disabled: progressPct < 100 }}
                        >
                            <Button type="primary" icon={<SendOutlined />} loading={submitting} disabled={progressPct < 100}
                                style={{
                                    borderRadius: 10, fontWeight: 700, height: 42, padding: "0 28px",
                                    background: progressPct === 100 ? "#f43f5e" : undefined,
                                    border: "none",
                                    boxShadow: progressPct === 100 ? "0 4px 14px rgba(244,63,94,0.3)" : undefined
                                }}>
                                Nộp bản đánh giá
                            </Button>
                        </Popconfirm>
                    </Access>
                </div>
            )}

            <style>{`
                .eval-row:hover td { background-color: #fafafa !important; }
                .unfilled-select .ant-select-selector {
                    border-color: #fecdd3 !important;
                    background-color: #fff1f2 !important;
                }
                .unfilled-select:hover .ant-select-selector {
                    border-color: #f43f5e !important;
                }
                .unfilled-select .ant-select-selection-placeholder {
                    color: #f43f5e !important;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );

};


export default ManagerEvaluationDetailPage;
