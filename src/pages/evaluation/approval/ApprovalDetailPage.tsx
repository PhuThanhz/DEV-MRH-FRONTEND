import React from "react";
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import { Button, Spin, Tag, Popconfirm, Input, Select, Alert, Empty, Progress, Breadcrumb, Modal } from "antd";
import {
    ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined,
    SendOutlined, LockOutlined, UserOutlined, TeamOutlined, BookOutlined,
    FileTextOutlined, TrophyOutlined, FileExcelOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { notify } from "@/components/common/notification/notify";
import {
    callFetchEvaluationRecordById,
    callApproveRecord, callRejectRecord,
    callFetchRecordHistory,
    callApproverSaveScore
} from "@/config/api";
import { exportDetailedEvaluation } from "@/utils/ExportEvaluationDetailUtils";
import { printEvaluationDetail } from "@/utils/PrintEvaluationUtils";
import Access from "@/components/share/access";
import useAccess from "@/hooks/useAccess";
import { ALL_PERMISSIONS } from "@/config/permissions";

type RecordStatus = "NOT_STARTED" | "EMPLOYEE_DRAFTING" | "PENDING_MANAGER_REVIEW" | "MANAGER_REVIEWING" | "PENDING_APPROVAL" | "COMPLETED";

const STATUS_CONFIG: Record<RecordStatus, { text: string; tagColor: string }> = {
    NOT_STARTED: { text: "Chưa bắt đầu", tagColor: "default" },
    EMPLOYEE_DRAFTING: { text: "NV đang đánh giá", tagColor: "processing" },
    PENDING_MANAGER_REVIEW: { text: "Chờ quản lý chấm", tagColor: "warning" },
    MANAGER_REVIEWING: { text: "Quản lý đang chấm", tagColor: "purple" },
    PENDING_APPROVAL: { text: "Chờ phê duyệt", tagColor: "cyan" },
    COMPLETED: { text: "Hoàn tất", tagColor: "success" },
};

const GRADE_CONFIG: Record<string, { color: string; label: string }> = {
    A: { color: "#389e0d", label: "Xuất sắc" },
    B: { color: "#1677ff", label: "Tốt" },
    C: { color: "#d46b08", label: "Khá" },
    D: { color: "#cf1322", label: "Trung bình" },
    E: { color: "#8c8c8c", label: "Yếu" },
};

const SCORE_DESCRIPTIONS: Record<number, string> = {
    1: "Yếu",
    2: "Trung bình",
    3: "Khá",
    4: "Tốt",
    5: "Xuất sắc"
};

const SCORE_OPTIONS = [1, 2, 3, 4, 5].map(v => ({ label: `${v} điểm - ${SCORE_DESCRIPTIONS[v]}`, value: v }));

const getScore = (scores: any[], criteriaId: number, by: "EMPLOYEE" | "MANAGER" | "APPROVER") =>
    scores?.find(s => s.criteriaId === criteriaId && s.scoredBy === by)?.score ?? null;

const getComment = (comments: any[], type: string) =>
    comments?.find(c => c.commentType === type)?.content ?? "";

const getStickyStyle = (col: "empScore" | "empResult" | "mgrScore" | "mgrResult" | "apprScore" | "apprResult", isHeader = false): React.CSSProperties => {
    let right = 0;
    if (col === "apprResult") right = 0;
    else if (col === "apprScore") right = 120;
    else if (col === "mgrResult") right = 240;
    else if (col === "mgrScore") right = 360;
    else if (col === "empResult") right = 480;
    else if (col === "empScore") right = 600;
    
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

interface IApproverCriteriaRowProps {
    c: any;
    cIdx: number;
    hasSub: boolean;
    isEditable: boolean;
    empScore: number | null;
    realMgrScore: number | null;
    mgrScore: number | null;
    savingScore: number | null;
    handleSaveScore: (id: number, score: number) => void;
    tdB: any;
    tdLvl: any;
    tdSc: any;
}

const ApproverCriteriaRow = React.memo(({
    c, cIdx, hasSub, isEditable, empScore, realMgrScore, mgrScore, savingScore, handleSaveScore, tdB, tdLvl, tdSc
}: IApproverCriteriaRowProps) => {
    const getL = (lvl: number) => c.levels?.find((l: any) => l.level === lvl)?.description || "";
    return (
        <tr className="eval-row">
            <td style={{ ...tdB, textAlign: "center", color: "#475569", fontWeight: 800, fontSize: 13 }}>{cIdx + 1}</td>
            <td style={{ ...tdB, fontWeight: hasSub ? 700 : 500, color: "#111827" }}>{c.name}</td>
            <td style={{ ...tdB, color: "#6b7280", fontSize: 12 }}>{c.measurementMethod}</td>
            {[1,2,3,4,5].map(lvl => <td key={lvl} style={tdLvl}>{getL(lvl)}</td>)}
            <td style={{ ...tdB, textAlign: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#111827", background: "#f3f4f6", borderRadius: 5, padding: "2px 8px" }}>
                    {(c.weight * 100).toFixed(0)}%
                </span>
            </td>
            <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("empScore") }}>
                {hasSub ? <span style={{ color: "#e5e7eb" }}>—</span> : (
                    <span style={{ fontSize: 18, fontWeight: 800, color: empScore != null ? "#f43f5e" : "#e5e7eb" }}>{empScore ?? "—"}</span>
                )}
            </td>
            <td style={{ ...tdSc, ...getStickyStyle("empResult") }}>
                {!hasSub && empScore != null
                    ? <span style={{ fontSize: 14, fontWeight: 700, color: "#f43f5e" }}>{(empScore * c.weight).toFixed(2)}</span>
                    : <span style={{ color: "#e5e7eb" }}>—</span>}
            </td>
            <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("mgrScore") }}>
                {hasSub ? <span style={{ color: "#e5e7eb" }}>—</span> : (
                    <span style={{ fontSize: 18, fontWeight: 800, color: realMgrScore != null ? "#111827" : "#e5e7eb" }}>{realMgrScore ?? "—"}</span>
                )}
            </td>
            <td style={{ ...tdSc, ...getStickyStyle("mgrResult") }}>
                {!hasSub && realMgrScore != null
                    ? <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{(realMgrScore * c.weight).toFixed(2)}</span>
                    : <span style={{ color: "#e5e7eb" }}>—</span>}
            </td>
            <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("apprScore") }}>
                {hasSub ? <span style={{ color: "#e5e7eb" }}>—</span> : isEditable ? (
                    <Select size="middle" style={{ width: 120 }} placeholder="Chọn..."
                        popupMatchSelectWidth={false}
                        className={mgrScore == null ? "unfilled-select" : ""}
                        value={mgrScore ?? undefined} loading={savingScore === c.id}
                        onChange={(val) => handleSaveScore(c.id, val)} options={SCORE_OPTIONS} />
                ) : (
                    <span style={{ fontSize: 18, fontWeight: 800, color: mgrScore != null ? "#111827" : "#e5e7eb" }}>{mgrScore ?? "—"}</span>
                )}
            </td>
            <td style={{ ...tdSc, ...getStickyStyle("apprResult") }}>
                {!hasSub && mgrScore != null
                    ? <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{(mgrScore * c.weight).toFixed(2)}</span>
                    : <span style={{ color: "#e5e7eb" }}>—</span>}
            </td>
        </tr>
    );
});

interface IApproverSubCriteriaRowProps {
    sub: any;
    cIdx: number;
    si: number;
    isEditable: boolean;
    subEmp: number | null;
    subRealMgr: number | null;
    subMgr: number | null;
    savingScore: number | null;
    handleSaveScore: (id: number, score: number) => void;
    tdB: any;
    tdLvl: any;
    tdSc: any;
}

const ApproverSubCriteriaRow = React.memo(({
    sub, cIdx, si, isEditable, subEmp, subRealMgr, subMgr, savingScore, handleSaveScore, tdB, tdLvl, tdSc
}: IApproverSubCriteriaRowProps) => {
    const getSL = (lvl: number) => sub.levels?.find((l: any) => l.level === lvl)?.description || "";
    return (
        <tr className="eval-row">
            <td style={{ ...tdB, textAlign: "center", color: "#475569", fontWeight: 800, fontSize: 12 }}>{cIdx + 1}.{si + 1}</td>
            <td style={{ ...tdB, paddingLeft: 14, color: "#111827", borderLeft: "none" }}>{sub.name}</td>
            <td style={{ ...tdB, color: "#6b7280", fontSize: 12 }}>{sub.measurementMethod}</td>
            {[1,2,3,4,5].map(lvl => <td key={lvl} style={tdLvl}>{getSL(lvl)}</td>)}
            <td style={{ ...tdB, textAlign: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#111827", background: "#f3f4f6", borderRadius: 5, padding: "2px 8px" }}>
                    {(sub.weight * 100).toFixed(0)}%
                </span>
            </td>
            <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("empScore") }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: subEmp != null ? "#f43f5e" : "#e5e7eb" }}>{subEmp ?? "—"}</span>
            </td>
            <td style={{ ...tdSc, ...getStickyStyle("empResult") }}>
                {subEmp != null ? <span style={{ fontSize: 14, fontWeight: 700, color: "#f43f5e" }}>{(subEmp * sub.weight).toFixed(2)}</span> : <span style={{ color: "#e5e7eb" }}>—</span>}
            </td>
            <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("mgrScore") }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: subRealMgr != null ? "#111827" : "#e5e7eb" }}>{subRealMgr ?? "—"}</span>
            </td>
            <td style={{ ...tdSc, ...getStickyStyle("mgrResult") }}>
                {subRealMgr != null ? <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{(subRealMgr * sub.weight).toFixed(2)}</span> : <span style={{ color: "#e5e7eb" }}>—</span>}
            </td>
            <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("apprScore") }}>
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
            <td style={{ ...tdSc, ...getStickyStyle("apprResult") }}>
                {subMgr != null ? <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{(subMgr * sub.weight).toFixed(2)}</span> : <span style={{ color: "#e5e7eb" }}>—</span>}
            </td>
        </tr>
    );
});

const ApprovalDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const showCriteria = true;

    const [record, setRecord] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [selfReview, setSelfReview] = useState("");
    const [localScores, setLocalScores] = useState<Record<number, number>>({});
    const [savingScore, setSavingScore] = useState<number | null>(null);
    const [isError, setIsError] = useState(false);

    // ── Quyền hạn (phải khai báo trước early return) ──────────────────
    const canApprove = useAccess(ALL_PERMISSIONS.EVALUATION.APPROVE_RECORD);
    const canReject  = useAccess(ALL_PERMISSIONS.EVALUATION.REJECT_RECORD);
    const canScore   = useAccess(ALL_PERMISSIONS.EVALUATION.APPROVER_SCORE);

    useBlocker(() => {
        if (savingScore !== null) {
            const confirmed = window.confirm("Đang lưu điểm đánh giá. Bạn có chắc muốn rời khỏi trang?");
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
                const commentSelf = recRes.data.comments?.find((c: any) => c.commentType === "SELF_REVIEW");
                setSelfReview(commentSelf?.content ?? "");
                const initScores: Record<number, number> = {};
                let hasApproverScores = false;
                recRes.data.scores?.forEach((s: any) => {
                    if (s.scoredBy === "APPROVER") {
                        initScores[s.criteriaId] = s.score;
                        hasApproverScores = true;
                    }
                });
                if (!hasApproverScores) {
                    recRes.data.scores?.forEach((s: any) => {
                        if (s.scoredBy === "MANAGER") initScores[s.criteriaId] = s.score;
                    });
                }
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
        setLocalScores(prev => ({ ...prev, [criteriaId]: score }));
        try {
            await callApproverSaveScore(record.id, criteriaId, score);
        } catch (err: any) {
            notify.error(err?.response?.data?.message || "Lỗi lưu điểm");
        } finally { setSavingScore(null); }
    };

    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [overrideReason, setOverrideReason] = useState("");

    const hasScoreOverride = () => {
        if (!record || !record.scores) return false;
        const leafCriteriaList: any[] = [];
        record.template?.sections?.forEach((sec: any) => {
            sec.criteria?.forEach((c: any) => {
                if (!c.subCriteria?.length) leafCriteriaList.push(c);
                else c.subCriteria?.forEach((sub: any) => leafCriteriaList.push(sub));
            });
        });

        for (const c of leafCriteriaList) {
            const managerScoreObj = record.scores.find((s: any) => s.criteriaId === c.id && s.scoredBy === "MANAGER");
            const managerScore = managerScoreObj ? managerScoreObj.score : undefined;
            const currentScore = localScores[c.id];

            if (currentScore !== undefined && managerScore !== undefined && currentScore !== managerScore) {
                return true;
            }
        }
        return false;
    };

    const handleApproveClick = () => {
        setApproveModalOpen(true);
    };

    const handleApprove = async () => {
        if (hasScoreOverride() && !overrideReason.trim()) {
            notify.error("Vui lòng nhập lý do điều chỉnh điểm");
            return;
        }
        setSaving(true);
        try {
            await callApproveRecord(Number(id), hasScoreOverride() ? overrideReason : undefined);
            notify.success("Đã phê duyệt thành công!");
            setApproveModalOpen(false);
            setOverrideReason("");
            fetchRecord();
        } catch (error: any) {
            notify.error(error?.response?.data?.message || "Lỗi khi phê duyệt");
        } finally {
            setSaving(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            notify.error("Vui lòng nhập lý do trả lại");
            return;
        }
        setSaving(true);
        try {
            await callRejectRecord(Number(id), rejectReason);
            notify.success("Đã trả lại bản đánh giá!");
            setRejectModalOpen(false);
            fetchRecord();
        } catch {
            notify.error("Lỗi khi trả lại");
        } finally {
            setSaving(false);
        }
    };

    const handleExportExcel = () => {
        if (record) exportDetailedEvaluation(record);
    };

    const handlePrintPDF = () => {
        if (record) printEvaluationDetail(record);
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

    const isApprovable = record.status === "PENDING_APPROVAL";
    const isEditable = isApprovable && canApprove;
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

    const calculateDynamicApproverTotalAndGrade = () => {
        let approverTotal = 0;
        record?.template?.sections?.forEach((sec: any) => {
            sec.criteria?.forEach((c: any) => {
                const hasSub = c.subCriteria?.length > 0;
                if (!hasSub) {
                    const realMgrScore = getScore(record.scores, c.id, "MANAGER");
                    const mgrScore = localScores[c.id] ?? getScore(record.scores, c.id, "APPROVER") ?? realMgrScore;
                    if (mgrScore != null) {
                        approverTotal += mgrScore * c.weight;
                    }
                } else {
                    c.subCriteria?.forEach((sub: any) => {
                        const subRealMgr = getScore(record.scores, sub.id, "MANAGER");
                        const subMgr = localScores[sub.id] ?? getScore(record.scores, sub.id, "APPROVER") ?? subRealMgr;
                        if (subMgr != null) {
                            approverTotal += subMgr * sub.weight;
                        }
                    });
                }
            });
        });
        
        let grade = "E";
        if (approverTotal > 4.5) grade = "A";
        else if (approverTotal >= 4.0) grade = "B";
        else if (approverTotal >= 3.5) grade = "C";
        else if (approverTotal >= 3.0) grade = "D";
        
        return { score: approverTotal, grade };
    };

    const currentApproverResult = calculateDynamicApproverTotalAndGrade();

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
                            onClick={() => navigate("/admin/evaluation/process")}
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
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: 8 }}>
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
                        {gradeCfg && (
                            <div style={{ background: "#fff", border: `2px solid ${gradeCfg.color}`, borderRadius: 12, padding: "8px 16px", display: "flex", alignItems: "center", gap: 10, boxShadow: `0 4px 12px ${gradeCfg.color}20` }}>
                                <span style={{ fontSize: 11, color: gradeCfg.color, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Xếp loại</span>
                                <span style={{ fontSize: 28, fontWeight: 900, color: gradeCfg.color, lineHeight: 1 }}>{record.finalGrade}</span>
                                <span style={{ fontSize: 13, fontWeight: 700, color: gradeCfg.color, background: `${gradeCfg.color}15`, padding: "2px 8px", borderRadius: 6 }}>{gradeCfg.label}</span>
                            </div>
                        )}
                        {record.employeeTotalScore != null && (
                            <div style={{ background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)", border: "1px solid #fecdd3", borderRadius: 12, padding: "8px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(244,63,94,0.15)" }}>
                                <div style={{ fontSize: 11, color: "#e11d48", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>NV đánh giá</div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: "#be123c", lineHeight: 1, marginTop: 4 }}>{record.employeeTotalScore.toFixed(2)}</div>
                            </div>
                        )}
                        {record.managerTotalScore != null && (
                            <div style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", border: "1px solid #bfdbfe", borderRadius: 12, padding: "8px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(59,130,246,0.15)" }}>
                                <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Quản lý</div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: "#1d4ed8", lineHeight: 1, marginTop: 4 }}>{record.managerTotalScore.toFixed(2)}</div>
                            </div>
                        )}
                        {record.approverTotalScore != null && (
                            <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #bbf7d0", borderRadius: 12, padding: "8px 20px", textAlign: "center", boxShadow: "0 2px 8px rgba(34,197,94,0.15)" }}>
                                <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Phê duyệt</div>
                                <div style={{ fontSize: 24, fontWeight: 900, color: "#15803d", lineHeight: 1, marginTop: 4 }}>{record.approverTotalScore.toFixed(2)}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3.6: Cảnh báo chênh lệch điểm Nhân viên vs Quản lý > 1.0 */}
            {record.employeeTotalScore != null && record.managerTotalScore != null && Math.abs(record.employeeTotalScore - record.managerTotalScore) > 1.0 && (
                <Alert
                    message="Cảnh báo chênh lệch điểm số"
                    description="Điểm đánh giá của quản lý chênh lệch lớn (> 1.0 điểm) so với tự đánh giá của nhân viên. Vui lòng cân nhắc xem xét kỹ hoặc ghi nhận xét giải thích."
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
                                Tiến độ phê duyệt

                                <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 500, color: "#6b7280" }}>(<span style={{ color: "#f43f5e", fontWeight: 700 }}>{scoredCount}</span> / {allLeafCriteria.length} tiêu chí)</span>
                            </div>
                            <span style={{ fontSize: 22, fontWeight: 900, color: progressPct === 100 ? "#f43f5e" : "#111827" }}>{progressPct}%</span>
                        </div>
                        <Progress percent={progressPct} showInfo={false} strokeWidth={8} strokeColor={{ '0%': '#f43f5e', '100%': '#be123c' }} trailColor="#f3f4f6" status={progressPct === 100 ? "success" : "active"} style={{ margin: 0 }} />
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
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 2020, tableLayout: "fixed" }}>
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
                            <th colSpan={2} style={{ ...thG, ...getStickyStyle("empScore", true) }}>CBNV đánh giá</th>
                            <th colSpan={2} style={{ ...thG, ...getStickyStyle("mgrScore", true) }}>Quản lý chấm</th>
                            <th colSpan={2} style={{ ...thG, ...getStickyStyle("apprScore", true) }}>Phê duyệt chấm</th>
                        </tr>
                        <tr>
                            {showCriteria && [1,2,3,4,5].map(n => <th key={n} style={{ ...thSub, width: 155, color: "#e11d48" }}>Mức {n}</th>)}
                            <th style={{ ...thSub, color: "#374151", ...getStickyStyle("empScore", true) }}>Điểm<span style={{ color: "#f43f5e", marginLeft: 4 }}>*</span></th>
                            <th style={{ ...thSub, color: "#374151", ...getStickyStyle("empResult", true) }}>Kết quả</th>
                            <th style={{ ...thSub, color: "#374151", ...getStickyStyle("mgrScore", true) }}>Điểm</th>
                            <th style={{ ...thSub, color: "#374151", ...getStickyStyle("mgrResult", true) }}>Kết quả</th>
                            <th style={{ ...thSub, ...getStickyStyle("apprScore", true) }}>Điểm</th>
                            <th style={{ ...thSub, ...getStickyStyle("apprResult", true) }}>Kết quả</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            let dynamicEmpTotal = 0;
                            let dynamicMgrTotal = 0;
                            
                            const sectionElements = record.template?.sections?.map((section: any) => {
                                let empTotal = 0, realMgrTotal = 0, mgrTotal = 0;
                                const rows: React.ReactNode[] = [];

                                rows.push(
                                    <tr key={`sec-${section.id}`}>
                                        <td colSpan={9} style={{
                                            padding: "10px 18px",
                                            background: "#f3f4f6",
                                            borderTop: "1px solid #e5e7eb",
                                            borderBottom: "1px solid #e5e7eb",
                                            borderLeft: "4px solid #f43f5e"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                <span style={{ fontWeight: 800, fontSize: 13, color: "#111827", textTransform: "uppercase", letterSpacing: "0.3px" }}>{section.name}</span>
                                            </div>
                                        </td>
                                        <td colSpan={6} style={{
                                            position: "sticky",
                                            right: 0,
                                            zIndex: 1,
                                            padding: "10px 18px",
                                            background: "#f3f4f6",
                                            borderTop: "1px solid #e5e7eb",
                                            borderBottom: "1px solid #e5e7eb",
                                            textAlign: "right",
                                            borderLeft: "1.5px solid #cbd5e1",
                                            boxShadow: "-3px 0 6px -2px rgba(0,0,0,0.15)"
                                        }}>
                                            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151" }}>Trọng số {(section.weight * 100).toFixed(0)}%</span>
                                        </td>
                                </tr>
                            );

                            section.criteria?.forEach((c: any, cIdx: number) => {
                                const hasSub = c.subCriteria?.length > 0;
                                const empScore = getScore(record.scores, c.id, "EMPLOYEE");
                                const realMgrScore = getScore(record.scores, c.id, "MANAGER");
                                const mgrScore = localScores[c.id] ?? getScore(record.scores, c.id, "APPROVER") ?? realMgrScore;

                                if (!hasSub) {
                                    if (empScore != null) empTotal += empScore * c.weight;
                                    if (realMgrScore != null) realMgrTotal += realMgrScore * c.weight;
                                    if (mgrScore != null) mgrTotal += mgrScore * c.weight;
                                }

                                rows.push(
                                    <ApproverCriteriaRow
                                        key={`c-${c.id}`}
                                        c={c}
                                        cIdx={cIdx}
                                        hasSub={hasSub}
                                        isEditable={isEditable && canScore}
                                        empScore={empScore}
                                        realMgrScore={realMgrScore}
                                        mgrScore={mgrScore}
                                        savingScore={savingScore}
                                        handleSaveScore={handleSaveScore}
                                        tdB={tdB}
                                        tdLvl={tdLvl}
                                        tdSc={tdSc}
                                    />
                                );

                                if (hasSub) {
                                    c.subCriteria?.forEach((sub: any, si: number) => {
                                        const subEmp = getScore(record.scores, sub.id, "EMPLOYEE");
                                        const subRealMgr = getScore(record.scores, sub.id, "MANAGER");
                                        const subMgr = localScores[sub.id] ?? getScore(record.scores, sub.id, "APPROVER") ?? subRealMgr;
                                        if (subEmp != null) empTotal += subEmp * sub.weight;
                                        if (subRealMgr != null) realMgrTotal += subRealMgr * sub.weight;
                                        if (subMgr != null) mgrTotal += subMgr * sub.weight;

                                        rows.push(
                                            <ApproverSubCriteriaRow
                                                key={`sub-${sub.id}`}
                                                sub={sub}
                                                cIdx={cIdx}
                                                si={si}
                                                isEditable={isEditable && canScore}
                                                subEmp={subEmp}
                                                subRealMgr={subRealMgr}
                                                subMgr={subMgr}
                                                savingScore={savingScore}
                                                handleSaveScore={handleSaveScore}
                                                tdB={tdB}
                                                tdLvl={tdLvl}
                                                tdSc={tdSc}
                                            />
                                        );
                                    });
                                }
                            });

                            // Section subtotal
                            rows.push(
                                <tr key={`stot-${section.id}`} style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                                    <td colSpan={8} style={{ padding: "12px 18px", textAlign: "right", fontSize: 12, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.3px", position: "relative", zIndex: 0 }}>
                                        Tổng kết {section.name}
                                    </td>
                                    <td style={{ padding: "12px", textAlign: "center", fontWeight: 700, color: "#111827" }}>{(section.weight * 100).toFixed(0)}%</td>
                                    <td style={{ padding: "12px", borderLeft: "none", ...getStickyStyle("empScore"), background: "#f9fafb" }} />
                                    <td style={{ padding: "12px", textAlign: "center", ...getStickyStyle("empResult"), background: "#f9fafb" }}>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{empTotal.toFixed(2)}</span>
                                    </td>
                                    <td style={{ padding: "12px", borderLeft: "none", ...getStickyStyle("mgrScore"), background: "#f9fafb" }} />
                                    <td style={{ padding: "12px", textAlign: "center", ...getStickyStyle("mgrResult"), background: "#f9fafb" }}>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>{realMgrTotal.toFixed(2)}</span>
                                    </td>
                                    <td style={{ padding: "12px", borderLeft: "none", ...getStickyStyle("apprScore"), background: "#f9fafb" }} />
                                    <td style={{ padding: "12px", textAlign: "center", ...getStickyStyle("apprResult"), background: "#f9fafb" }}>
                                        <span style={{ fontSize: 16, fontWeight: 800, color: "#f43f5e" }}>{mgrTotal.toFixed(2)}</span>
                                    </td>
                                </tr>
                            );

                                dynamicEmpTotal += empTotal;
                                dynamicMgrTotal += mgrTotal; // Note: we can compute realMgrGrandTotal if needed, but the original code just uses dynamicMgrTotal for approver Total
                                return rows;
                            });

                            return (
                                <>
                                    {sectionElements}
                                    {/* Grand Total */}
                                    <tr style={{ borderTop: "2px solid #e5e7eb", background: "#fff" }}>
                                        <td colSpan={8} style={{ padding: "18px 24px", textAlign: "right", fontWeight: 800, fontSize: 14, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px" }}>
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
                                            <span style={{ fontSize: 24, fontWeight: 900, color: "#111827" }}>
                                                {record.managerTotalScore != null ? record.managerTotalScore.toFixed(2) : "—"}
                                            </span>
                                        </td>
                                        <td style={{ padding: "18px 12px", borderLeft: "none", ...getStickyStyle("apprScore") }} />
                                        <td style={{ padding: "18px 12px", textAlign: "center", ...getStickyStyle("apprResult") }}>
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
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>Nhận xét của nhân viên</div>
                <div style={{ background: "#f9fafb", borderRadius: 8, padding: "14px 16px", fontSize: 14, color: selfReview ? "#111827" : "#9ca3af", fontStyle: selfReview ? "normal" : "italic", lineHeight: 1.7, border: "1px solid #f3f4f6" }}>
                    {selfReview || "Chưa có nhận xét nào."}
                </div>
            </div>

            {/* ─── NHẬN XÉT QUẢN LÝ ─── */}
            {record.comments?.some((c: any) => c.commentType === "MANAGER_FEEDBACK") && (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 22px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>Phản hồi từ Quản lý</div>
                    <div style={{ background: "#f9fafb", borderRadius: 8, padding: "14px 16px", fontSize: 14, color: "#111827", lineHeight: 1.7, border: "1px solid #f3f4f6" }}>
                        {getComment(record.comments, "MANAGER_FEEDBACK")}
                    </div>
                </div>
            )}

            {/* ─── KẾ HOẠCH ĐÀO TẠO ─── */}
            {record.trainingPlans?.length > 0 && (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 22px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>Kế hoạch đào tạo & Phát triển</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
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
                </div>
            )}


            {/* ─── ACTION BAR ─── */}
            {isApprovable && (
                <div style={{
                    position: "fixed", bottom: 0, left: 0, right: 0,
                    background: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(12px)", borderTop: "1px solid #e5e7eb",
                    padding: "16px 40px", display: "flex", justifyContent: "flex-end", gap: 16,
                    boxShadow: "0 -4px 20px rgba(0,0,0,0.05)", zIndex: 100
                }}>
                    <Access permission={ALL_PERMISSIONS.EVALUATION.REJECT_RECORD} hideChildren>
                        <Button
                            size="large"
                            danger
                            style={{ borderRadius: 10, fontWeight: 700, minWidth: 140 }}
                            onClick={() => setRejectModalOpen(true)}
                        >
                            Trả lại (Yêu cầu làm lại)
                        </Button>
                    </Access>
                    <Access permission={ALL_PERMISSIONS.EVALUATION.APPROVE_RECORD} hideChildren>
                        <Button
                            type="primary"
                            size="large"
                            icon={<CheckCircleOutlined />}
                            loading={saving}
                            onClick={handleApproveClick}
                            disabled={progressPct < 100}
                            style={{
                                background: progressPct === 100 ? "#10b981" : undefined,
                                borderColor: progressPct === 100 ? "#10b981" : undefined,
                                borderRadius: 10,
                                fontWeight: 700,
                                minWidth: 160
                            }}
                        >
                            Phê duyệt & Hoàn tất
                        </Button>
                    </Access>
                </div>
            )}

            <Modal
                title="Trả lại bản đánh giá"
                open={rejectModalOpen}
                onOk={handleReject}
                onCancel={() => setRejectModalOpen(false)}
                confirmLoading={saving}
                okText="Xác nhận trả lại"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
            >
                <Alert message="Bản đánh giá sẽ được trả lại cho Quản lý trực tiếp để thực hiện lại." type="warning" showIcon style={{ marginBottom: 16 }} />
                <div style={{ marginBottom: 8, fontWeight: 600 }}>Lý do trả lại <span style={{ color: "red" }}>*</span></div>
                <Input.TextArea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Nhập lý do trả lại để Quản lý trực tiếp có thể khắc phục..."
                />
            </Modal>

            <Modal
                title="Xác nhận phê duyệt"
                open={approveModalOpen}
                onOk={handleApprove}
                onCancel={() => setApproveModalOpen(false)}
                confirmLoading={saving}
                okText="Phê duyệt"
                cancelText="Hủy"
            >
                <Alert message="Bạn có chắc chắn muốn phê duyệt bản đánh giá này? Kết quả sẽ được gửi cho nhân viên." type="info" showIcon style={{ marginBottom: 16 }} />
                <div style={{ padding: "12px 16px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 16 }}>
                    <div style={{ marginBottom: 6, fontSize: 14 }}>
                        Tổng điểm phê duyệt: <strong style={{ fontSize: 16, color: "#15803d" }}>{currentApproverResult.score.toFixed(2)}</strong> / 5.00
                    </div>
                    <div style={{ fontSize: 14 }}>
                        Xếp loại dự kiến: <strong style={{ fontSize: 16, color: GRADE_CONFIG[currentApproverResult.grade]?.color }}>{GRADE_CONFIG[currentApproverResult.grade]?.label} ({currentApproverResult.grade})</strong>
                    </div>
                </div>
                {hasScoreOverride() && (
                    <>
                        <div style={{ marginBottom: 8, fontWeight: 600 }}>Lý do điều chỉnh điểm <span style={{ color: "red" }}>*</span></div>
                        <Input.TextArea
                            rows={4}
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            placeholder="Vui lòng nhập lý do giải trình khi điều chỉnh điểm số so với quản lý trực tiếp..."
                            style={{ marginBottom: 8 }}
                        />
                    </>
                )}
            </Modal>

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


export default ApprovalDetailPage;
