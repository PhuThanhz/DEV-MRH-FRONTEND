import React from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import { Button, Spin, Tag, Popconfirm, Input, Select, Alert, Empty, Breadcrumb, Modal, Switch, Tooltip, Dropdown } from "antd";
import {
    CheckCircleOutlined, ClockCircleOutlined,
    SendOutlined, LockOutlined, UserOutlined, TeamOutlined, BookOutlined,
    FileTextOutlined, TrophyOutlined, FileExcelOutlined, MoreOutlined, LoadingOutlined,
    RightOutlined, DownOutlined, RollbackOutlined, CheckCircleFilled, InfoCircleFilled, InfoCircleOutlined,
} from "@ant-design/icons";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";
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
import { useGrabToScroll } from "@/hooks/useGrabToScroll";
import { EvaluationUserInfo } from "../components/shared/EvaluationUserInfo";
import { EvaluationGuidelines } from "../components/shared/EvaluationGuidelines";
import { EvaluationCommentsSection } from "../components/shared/EvaluationCommentsSection";
import { SharedCriteriaRow, SharedSubCriteriaRow } from "../components/shared/EvaluationTableRows";
import { formatWeight } from "../components/evaluationScoring";
import { EvaluationProgressIndicator } from "../components/shared/EvaluationProgressIndicator";
import "../components/shared/evaluation-shell.css";

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

const LEVEL_HEADER_CONFIG: Record<number, { title: string; subtitle: string; color: string; bg: string; border: string }> = {
    1: { title: "Mức 1", subtitle: "Yếu", color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
    2: { title: "Mức 2", subtitle: "Trung bình", color: "#ea580c", bg: "#fff7ed", border: "#ffddc1" },
    3: { title: "Mức 3", subtitle: "Khá", color: "#b45309", bg: "#fefbeb", border: "#fef08a" },
    4: { title: "Mức 4", subtitle: "Tốt", color: "#65a30d", bg: "#f7fee7", border: "#d9f99d" },
    5: { title: "Mức 5", subtitle: "Xuất sắc", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
};

const SCORE_OPTIONS = [1, 2, 3, 4, 5].map(v => ({ label: `${v} điểm - ${SCORE_DESCRIPTIONS[v]}`, value: v }));

const getScore = (scores: any[], criteriaId: number, by: "EMPLOYEE" | "MANAGER" | "APPROVER") =>
    scores?.find(s => s.criteriaId === criteriaId && s.scoredBy === by)?.score ?? null;

const getComment = (comments: any[], type: string) =>
    comments?.find(c => c.commentType === type)?.content ?? "";

const getStickyStyle = (col: "empScore" | "empResult" | "mgrScore" | "mgrResult" | "apprScore" | "apprResult", isHeader = false): React.CSSProperties => {
    let right = 0;
    let width = 150;

    if (col === "apprResult" || col === "apprScore") {
        right = 0;
        width = 220;
    } else if (col === "mgrResult" || col === "mgrScore") {
        right = 220;
        width = 150;
    } else if (col === "empResult" || col === "empScore") {
        right = 370;
        width = 150;
    }

    const isLeftmost = col === "empScore" || col === "empResult";

    return {
        position: "sticky",
        right,
        width,
        minWidth: width,
        boxSizing: "border-box",
        zIndex: isHeader ? 3 : 2,
        background: "#ffffff",
        borderLeft: isLeftmost ? "1.5px solid #cbd5e1" : undefined,
        boxShadow: isLeftmost ? "-4px 0 8px -2px rgba(15,23,42,0.08)" : undefined,
        backgroundClip: "padding-box",
    };
};



interface ApprovalDetailPageProps {
    recordId?: number;
    onClose?: () => void;
}

const ApprovalDetailPage = ({ recordId, onClose }: ApprovalDetailPageProps) => {
    const grabToScrollRef = useGrabToScroll();
    const topScrollRef = useRef<HTMLDivElement>(null);
    const [tableScrollWidth, setTableScrollWidth] = useState(0);
    const [hasScrollbar, setHasScrollbar] = useState(false);

    const { id: routeId } = useParams<{ id: string }>();
    const id = recordId ? String(recordId) : routeId;
    const navigate = useNavigate();

    const [hoveredGroupId, setHoveredGroupId] = useState<string | number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(true);
    const showCriteria = true;

    const [record, setRecord] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [selfReview, setSelfReview] = useState("");
    const [localScores, setLocalScores] = useState<Record<number, number>>({});
    const [collapsedSections, setCollapsedSections] = useState<Record<number, boolean>>({});
    const [savingScore, setSavingScore] = useState<number | null>(null);
    const [isError, setIsError] = useState(false);

    useEffect(() => {
        const top = topScrollRef.current;
        const bottom = grabToScrollRef.current;
        if (!top || !bottom) return;

        let activeScroll: 'top' | 'bottom' | null = null;

        const syncTop = () => {
            if (activeScroll === 'bottom') return;
            activeScroll = 'top';
            const topMax = top.scrollWidth - top.clientWidth;
            if (topMax <= 0) { activeScroll = null; return; }
            const ratio = top.scrollLeft / topMax;
            const bottomMax = bottom.scrollWidth - bottom.clientWidth;
            bottom.scrollLeft = ratio * bottomMax;
            activeScroll = null;
        };

        const syncBottom = () => {
            if (activeScroll === 'top') return;
            activeScroll = 'bottom';
            const bottomMax = bottom.scrollWidth - bottom.clientWidth;
            if (bottomMax <= 0) { activeScroll = null; return; }
            const ratio = bottom.scrollLeft / bottomMax;
            const topMax = top.scrollWidth - top.clientWidth;
            top.scrollLeft = ratio * topMax;
            activeScroll = null;
        };

        top.addEventListener('scroll', syncTop);
        bottom.addEventListener('scroll', syncBottom);

        return () => {
            top.removeEventListener('scroll', syncTop);
            bottom.removeEventListener('scroll', syncBottom);
        };
    }, [grabToScrollRef, loading, record]);

    useEffect(() => {
        const bottom = grabToScrollRef.current;
        if (!bottom) return;

        const checkScroll = () => {
            setTableScrollWidth(bottom.scrollWidth);
            setHasScrollbar(bottom.scrollWidth > bottom.clientWidth);
        };

        // Double rAF ensures layout is fully computed after render
        let rafId = requestAnimationFrame(() => {
            rafId = requestAnimationFrame(checkScroll);
        });
        window.addEventListener("resize", checkScroll);

        const observer = new ResizeObserver(checkScroll);
        observer.observe(bottom);

        const timer1 = setTimeout(checkScroll, 100);
        const timer2 = setTimeout(checkScroll, 400);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener("resize", checkScroll);
            observer.disconnect();
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [loading, record, grabToScrollRef]);

    // ── Quyền hạn (phải khai báo trước early return) ──────────────────
    const canApprove = useAccess(ALL_PERMISSIONS.EVALUATION.APPROVE_RECORD);
    const canReject = useAccess(ALL_PERMISSIONS.EVALUATION.REJECT_RECORD);
    const canScore = useAccess(ALL_PERMISSIONS.EVALUATION.APPROVER_SCORE);

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
            if (onClose) handleClose();
            else fetchRecord();
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
            if (onClose) handleClose();
            else fetchRecord();
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
            <Button type="primary" onClick={fetchRecord}>Đã hiểu</Button>
        </div>
    );
    if (!record) return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
            <Empty description="Không tìm thấy bản đánh giá" />
        </div>
    );

    const handleClose = () => {
        setDrawerOpen(false);
        setTimeout(() => {
            if (onClose) onClose();
            else navigate("/admin/evaluation/process");
        }, 300);
    };

    const renderInWorkspaceDrawer = (content: React.ReactNode) => {
        if (!onClose) return content;
        return (
            <>
                <div style={{ minHeight: "80vh", background: "#f8fafc" }} />
                <LotusDetailDrawer
                    open={drawerOpen}
                    onClose={handleClose}
                    destroyOnClose={false}
                    keyboard={false}
                    maskClosable={false}
                    closeAriaLabel="Đóng bản đánh giá"
                >
                    {content}
                </LotusDetailDrawer>
            </>
        );
    };

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
    const scoredCount = allLeafCriteria.filter(c => {
        const realMgr = getScore(record.scores, c.id, "MANAGER");
        const appr = localScores[c.id] ?? getScore(record.scores, c.id, "APPROVER");
        return (appr ?? realMgr) != null;
    }).length;
    const progressPct = allLeafCriteria.length ? Math.round((scoredCount / allLeafCriteria.length) * 100) : 0;
    const handleGoToNextUnscored = () => {
        const nextCriteria = allLeafCriteria.find(c => {
            const realMgr = getScore(record.scores, c.id, "MANAGER");
            const appr = localScores[c.id] ?? getScore(record.scores, c.id, "APPROVER");
            return (appr ?? realMgr) == null;
        });
        if (!nextCriteria) return;
        document.getElementById(`evaluation-criteria-${nextCriteria.id}`)?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    };

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
                            const w = (sub.weight && sub.weight > 0) ? sub.weight : (c.weight / c.subCriteria.length);
                            approverTotal += subMgr * w;
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
        padding: "12px 14px", fontWeight: 800, fontSize: 12, color: "#0f172a",
        background: "#ffffff", borderBottom: "2px solid #cbd5e1", borderRight: "1px solid #cbd5e1",
        textAlign: "center", whiteSpace: "nowrap", verticalAlign: "middle"
    };
    const thG: React.CSSProperties = {
        padding: "12px 14px", fontWeight: 800, fontSize: 12, color: "#0f172a",
        background: "#ffffff", borderBottom: "1px solid #cbd5e1", borderRight: "1px solid #cbd5e1", textAlign: "center", verticalAlign: "middle"
    };
    const thSub: React.CSSProperties = {
        padding: "10px 10px", fontWeight: 800, fontSize: 11, color: "#0f172a",
        background: "#ffffff", borderBottom: "1px solid #cbd5e1", borderRight: "1px solid #cbd5e1",
        textAlign: "center", whiteSpace: "nowrap", verticalAlign: "middle"
    };
    const tdB: React.CSSProperties = {
        padding: "14px 14px", borderBottom: "1px solid #cbd5e1", borderRight: "1px solid #cbd5e1",
        fontSize: 13, verticalAlign: "top", lineHeight: 1.55, color: "#1e293b",
        textAlign: "left", overflowWrap: "break-word", wordBreak: "normal"
    };
    const tdLvl: React.CSSProperties = {
        padding: "10px 8px", borderBottom: "1px solid #cbd5e1",
        borderRight: "1px solid #cbd5e1", fontSize: 12, color: "#334155",
        verticalAlign: "top", lineHeight: 1.5, minWidth: 140, width: 140,
        textAlign: "left", overflowWrap: "break-word", wordBreak: "normal"
    };
    const tdSc: React.CSSProperties = {
        padding: "14px 12px", borderBottom: "1px solid #cbd5e1", borderRight: "1px solid #cbd5e1",
        textAlign: "center", verticalAlign: "middle", background: "#ffffff"
    };

    return renderInWorkspaceDrawer(
        <div className="employee-evaluation-detail" style={{ width: "100%", height: "100%", minHeight: 0, boxSizing: "border-box", overflowX: "hidden", overflowY: "auto", fontFamily: "'Inter', -apple-system, sans-serif", background: "#f8fafc" }}>

            {/* ─── WORKSPACE HEADER ─── */}
            <div className="employee-evaluation-workspace-header">
                <div style={{ minWidth: 0, flex: "1 1 440px" }}>
                    <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0 }}>
                        Đánh giá của Quản lý
                    </div>
                    <h1 style={{ margin: "4px 0 0", color: "#0f172a", fontSize: 21, lineHeight: 1.35, fontWeight: 800, letterSpacing: 0 }}>
                        {record.template?.name}
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 9 }}>
                        <Tag color={statusCfg.tagColor} style={{ margin: 0, borderRadius: 5, fontWeight: 650 }}>
                            {statusCfg.text}
                        </Tag>
                        <span className="evaluation-meta-pill">
                            {record.period?.name || `Đợt ${record.periodId}`}
                        </span>
                        {record.period?.approverDeadline && (
                            <span style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>
                                Hạn phê duyệt {dayjs(record.period.approverDeadline).format("DD/MM/YYYY")}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: 12 }}>
                    {isEditable && (
                        <EvaluationProgressIndicator scoredCount={scoredCount} totalCount={allLeafCriteria.length} />
                    )}

                    {record.employeeTotalScore != null && (
                        <div className="evaluation-score-summary">
                            <span>Nhân viên đánh giá</span>
                            <strong>{record.employeeTotalScore.toFixed(2)}</strong>
                        </div>
                    )}

                    {record.managerTotalScore != null && (
                        <div className="evaluation-score-summary">
                            <span>Quản lý đánh giá</span>
                            <strong>{record.managerTotalScore.toFixed(2)}</strong>
                        </div>
                    )}

                    {record.approverTotalScore != null && (
                        <div className="evaluation-score-summary">
                            <span>Phê duyệt</span>
                            <strong>{record.approverTotalScore.toFixed(2)}</strong>
                        </div>
                    )}

                    {isCompleted && gradeCfg && (
                        <div className="evaluation-grade-summary" style={{ color: gradeCfg.color, borderColor: `${gradeCfg.color}35`, background: gradeCfg.bg }}>
                            <span>{gradeCfg.label}</span>
                            <strong>{record.finalGrade}</strong>
                        </div>
                    )}

                    <Access permission={ALL_PERMISSIONS.EVALUATION.GET_ALL_RECORDS} hideChildren>
                        <Tooltip title="Xuất dữ liệu">
                            <Dropdown
                                trigger={["click"]}
                                menu={{
                                    items: [
                                        { key: "excel", icon: <FileExcelOutlined />, label: "Xuất Excel", onClick: handleExportExcel },
                                        { key: "pdf", icon: <FileTextOutlined />, label: "Xuất PDF", onClick: handlePrintPDF },
                                    ],
                                }}
                            >
                                <Button aria-label="Xuất dữ liệu" icon={<MoreOutlined />} className="evaluation-header-menu-button" />
                            </Dropdown>
                        </Tooltip>
                    </Access>
                </div>
            </div>

            <div className="employee-evaluation-workspace-body">

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

                {/* ─── NHÂN SỰ ─── */}
                <EvaluationUserInfo record={record} />

                {/* ─── HƯỚNG DẪN THỰC HIỆN ─── */}
                <EvaluationGuidelines />

                {/* ─── BẢNG ĐÁNH GIÁ ─── */}
                <div className="employee-evaluation-table-shell" ref={grabToScrollRef} style={{ width: "100%", maxWidth: "100%", overflowX: "auto", overflowY: "hidden", marginBottom: 16, borderRadius: 14, border: "1px solid #e5e7eb", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                    <table
                        className="employee-evaluation-table"
                        style={{
                            width: "max-content",
                            minWidth: "100%",
                            borderCollapse: "separate",
                            borderSpacing: 0,
                            tableLayout: "fixed"
                        }}
                    >
                        <colgroup>
                            <col style={{ width: 55 }} />
                            <col style={{ width: 260 }} />
                            <col style={{ width: 170 }} />
                            {showCriteria && [1, 2, 3, 4, 5].map(n => <col key={n} style={{ width: 140 }} />)}
                            <col style={{ width: 85 }} />
                            <col style={{ width: 90 }} />
                            <col style={{ width: 150 }} />
                            <col style={{ width: 150 }} />
                            <col style={{ width: 220 }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th rowSpan={2} style={{ ...thS, width: 55 }}>STT</th>
                                <th rowSpan={2} style={{ ...thS, textAlign: "left", width: 260 }}>Nội dung đánh giá</th>
                                <th rowSpan={2} style={{ ...thS, textAlign: "left", width: 170 }}>Phương pháp đo lường</th>
                                {showCriteria && <th colSpan={5} style={{ ...thG, background: "#f8fafc" }}>Tiêu chí đánh giá theo thang điểm</th>}
                                <th colSpan={2} style={{ ...thG, background: "#ffffff" }}>Trọng số</th>
                                <th rowSpan={2} style={{ ...thG, ...getStickyStyle("empScore", true) }}>
                                    <div>CBNV đánh giá</div>
                                    <small className="evaluation-header-helper">Điểm & kết quả</small>
                                </th>
                                <th rowSpan={2} style={{ ...thG, ...getStickyStyle("mgrScore", true) }}>
                                    <div>Quản lý chấm</div>
                                    <small className="evaluation-header-helper">Điểm & kết quả</small>
                                </th>
                                <th rowSpan={2} style={{ ...thG, ...getStickyStyle("apprScore", true) }}>
                                    <div>Phê duyệt chấm</div>
                                    <small className="evaluation-header-helper">Điểm & quy đổi</small>
                                </th>
                            </tr>
                            <tr>
                                {showCriteria && [1, 2, 3, 4, 5].map(n => {
                                    const cfg = LEVEL_HEADER_CONFIG[n];
                                    return (
                                        <th key={n} style={{ ...thSub, width: 140, background: "#ffffff" }}>
                                            <div style={{ fontWeight: 800, fontSize: 12, color: "#0f172a" }}>{cfg.title}</div>
                                            <span style={{
                                                display: "inline-block",
                                                marginTop: 2,
                                                padding: "1px 6px",
                                                fontSize: 10,
                                                fontWeight: 700,
                                                color: cfg.color,
                                                background: cfg.bg,
                                                border: `1px solid ${cfg.border}`,
                                                borderRadius: 4
                                            }}>
                                                {cfg.subtitle}
                                            </span>
                                        </th>
                                    );
                                })}
                                <th style={{ ...thSub, width: 85, color: "#0f172a", background: "#ffffff" }}>TS Nhóm</th>
                                <th style={{ ...thSub, width: 90, color: "#475569", background: "#ffffff" }}>TS Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                let dynamicEmpTotal = 0;
                                let dynamicMgrTotal = 0;

                                const sectionElements = record.template?.sections?.map((section: any) => {
                                    let empTotal = 0, realMgrTotal = 0, mgrTotal = 0;
                                    const isCollapsed = !!collapsedSections[section.id];
                                    const rows: React.ReactNode[] = [];

                                    // Precompute totals for collapsed preview and grand totals
                                    section.criteria?.forEach((c: any) => {
                                        const hasSub = c.subCriteria?.length > 0;
                                        const empScore = getScore(record.scores, c.id, "EMPLOYEE");
                                        const realMgrScore = getScore(record.scores, c.id, "MANAGER");
                                        const mgrScore = localScores[c.id] ?? getScore(record.scores, c.id, "APPROVER") ?? realMgrScore;

                                        if (hasSub) {
                                            let sumEmp = 0, sumRealMgr = 0, sumMgr = 0;
                                            let cntEmp = 0, cntRealMgr = 0, cntMgr = 0;
                                            c.subCriteria.forEach((sub: any) => {
                                                const e = getScore(record.scores, sub.id, "EMPLOYEE");
                                                const rm = getScore(record.scores, sub.id, "MANAGER");
                                                const m = getScore(record.scores, sub.id, "APPROVER") ?? rm;
                                                const w = (sub.weight && sub.weight > 0) ? sub.weight : (c.weight / c.subCriteria.length);
                                                if (e != null) { sumEmp += e * w; cntEmp++; }
                                                if (rm != null) { sumRealMgr += rm * w; cntRealMgr++; }
                                                if (m != null) { sumMgr += m * w; cntMgr++; }
                                            });
                                            if (cntEmp > 0) empTotal += sumEmp;
                                            if (cntRealMgr > 0) realMgrTotal += sumRealMgr;
                                            if (cntMgr > 0) mgrTotal += sumMgr;
                                        } else {
                                            if (empScore != null) empTotal += empScore * c.weight;
                                            if (realMgrScore != null) realMgrTotal += realMgrScore * c.weight;
                                            if (mgrScore != null) mgrTotal += mgrScore * c.weight;
                                        }
                                    });

                                    const headerEmpTotal = empTotal;
                                    const headerRealMgrTotal = realMgrTotal;
                                    const headerMgrTotal = mgrTotal;

                                    empTotal = 0;
                                    realMgrTotal = 0;
                                    mgrTotal = 0;

                                    rows.push(
                                        <tr
                                            key={`sec-${section.id}`}
                                            onClick={() => setCollapsedSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                                            style={{ cursor: "pointer", transition: "background 0.2s" }}
                                            className="evaluation-section-header-row"
                                        >
                                            <td colSpan={showCriteria ? 13 : 8} style={{
                                                padding: "12px 18px",
                                                background: isCollapsed ? "#f1f5f9" : "#f8fafc",
                                                borderTop: "1px solid #d1d5db",
                                                borderBottom: "1px solid #d1d5db",
                                                borderLeft: "4px solid #f43f5e"
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "nowrap" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        <span style={{ color: "#4b5563", fontSize: 13, display: "inline-flex" }}>
                                                            {isCollapsed ? <RightOutlined style={{ fontSize: 11 }} /> : <DownOutlined style={{ fontSize: 11 }} />}
                                                        </span>
                                                        <span style={{ fontWeight: 800, fontSize: 13, color: "#111827", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                                                            {section.name}
                                                        </span>
                                                        <Tag style={{
                                                            margin: 0,
                                                            marginLeft: 8,
                                                            fontWeight: 700,
                                                            color: "#6d28d9",
                                                            background: "#f5f3ff",
                                                            border: "1px solid #ddd6fe",
                                                            borderRadius: "6px",
                                                            fontSize: "11px"
                                                        }}>
                                                            Trọng số: {formatWeight(section.weight)}
                                                        </Tag>
                                                    </div>
                                                    {isCollapsed && (
                                                        <div style={{ display: "flex", gap: 6, fontSize: 11, flexShrink: 0, flexWrap: "nowrap" }}>
                                                            {headerEmpTotal != null && headerEmpTotal > 0 && (
                                                                <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>
                                                                    Tự đánh giá: {headerEmpTotal.toFixed(2)}
                                                                </Tag>
                                                            )}
                                                            {headerRealMgrTotal != null && headerRealMgrTotal > 0 && (
                                                                <Tag color="pink" style={{ margin: 0, fontWeight: 600 }}>
                                                                    Quản lý: {headerRealMgrTotal.toFixed(2)}
                                                                </Tag>
                                                            )}
                                                            {headerMgrTotal != null && headerMgrTotal > 0 && (
                                                                <Tag color="green" style={{ margin: 0, fontWeight: 600 }}>
                                                                    Duyệt: {headerMgrTotal.toFixed(2)}
                                                                </Tag>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
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

                                        if (!isCollapsed) {
                                            rows.push(
                                                <SharedCriteriaRow
                                                    key={`c-${c.id}`}
                                                    role="APPROVER"
                                                    c={c}
                                                    cIdx={cIdx}
                                                    hasSub={hasSub}
                                                    isEditable={isEditable && canScore}
                                                    empScore={empScore}
                                                    realMgrScore={realMgrScore}
                                                    apprScore={mgrScore}
                                                    savingScore={savingScore}
                                                    handleSaveScore={handleSaveScore}
                                                    tdB={tdB}
                                                    tdLvl={tdLvl}
                                                    tdSc={tdSc}
                                                    getStickyStyle={(col, isHeader) => getStickyStyle(col as any, isHeader)}
                                                    hoveredGroupId={hoveredGroupId}
                                                    onGroupHover={setHoveredGroupId}
                                                />
                                            );
                                        }

                                        if (hasSub) {
                                            c.subCriteria?.forEach((sub: any, si: number) => {
                                                const subEmp = getScore(record.scores, sub.id, "EMPLOYEE");
                                                const subRealMgr = getScore(record.scores, sub.id, "MANAGER");
                                                const subMgr = localScores[sub.id] ?? getScore(record.scores, sub.id, "APPROVER") ?? subRealMgr;
                                                const w = (sub.weight && sub.weight > 0) ? sub.weight : (c.weight / c.subCriteria.length);
                                                if (subEmp != null) empTotal += subEmp * w;
                                                if (subRealMgr != null) realMgrTotal += subRealMgr * w;
                                                if (subMgr != null) mgrTotal += subMgr * w;

                                                if (!isCollapsed) {
                                                    rows.push(
                                                        <SharedSubCriteriaRow
                                                            key={`sub-${sub.id}`}
                                                            role="APPROVER"
                                                            sub={sub}
                                                            cIdx={cIdx}
                                                            si={si}
                                                            isEditable={isEditable && canScore}
                                                            subEmp={subEmp}
                                                            subRealMgr={subRealMgr}
                                                            subAppr={subMgr}
                                                            savingScore={savingScore}
                                                            handleSaveScore={handleSaveScore}
                                                            tdB={tdB}
                                                            tdLvl={tdLvl}
                                                            tdSc={tdSc}
                                                            getStickyStyle={(col, isHeader) => getStickyStyle(col as any, isHeader)}
                                                            parentWeight={c.weight}
                                                            criteriaCount={c.subCriteria.length}
                                                            parentCriteriaId={c.id}
                                                            hoveredGroupId={hoveredGroupId}
                                                            onGroupHover={setHoveredGroupId}
                                                        />
                                                    );
                                                }
                                            });
                                        }
                                    });

                                    // Section subtotal
                                    rows.push(
                                        <tr key={`stot-${section.id}`} style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                                            <td colSpan={3} style={{ padding: "12px 18px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.3px", position: "relative", zIndex: 0 }}>
                                                TỔNG KẾT PHẦN ({formatWeight(section.weight)})
                                            </td>
                                            <td colSpan={5} style={{ background: "#f9fafb" }} />
                                            <td colSpan={2} style={{ padding: "12px", textAlign: "center", fontWeight: 700, color: "#111827" }}>{formatWeight(section.weight)}</td>
                                            <td style={{ padding: "12px", textAlign: "center", ...getStickyStyle("empScore"), background: "#f9fafb" }}>
                                                <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{empTotal.toFixed(2)}</span>
                                            </td>
                                            <td style={{ padding: "12px", textAlign: "center", ...getStickyStyle("mgrScore"), background: "#f9fafb" }}>
                                                <span style={{ fontSize: 15, fontWeight: 800, color: "#111827" }}>{realMgrTotal.toFixed(2)}</span>
                                            </td>
                                            <td style={{ padding: "12px", textAlign: "center", ...getStickyStyle("apprScore"), background: "#f9fafb" }}>
                                                <span style={{ fontSize: 15, fontWeight: 800, color: "#e8637a" }}>{mgrTotal.toFixed(2)}</span>
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
                                            <td colSpan={3} style={{ padding: "18px 24px", textAlign: "left", fontWeight: 800, fontSize: 14, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                                TỔNG ĐIỂM CHUNG (100%)
                                            </td>
                                            <td colSpan={5} style={{ background: "#fff" }} />
                                            <td colSpan={2} style={{ padding: "18px 12px", textAlign: "center", fontWeight: 800, color: "#111827" }}>100%</td>
                                            <td style={{ padding: "18px 12px", textAlign: "center", ...getStickyStyle("empScore") }}>
                                                <span style={{ fontSize: 22, fontWeight: 900, color: "#111827" }}>
                                                    {dynamicEmpTotal > 0 ? dynamicEmpTotal.toFixed(2) : "—"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "18px 12px", textAlign: "center", ...getStickyStyle("mgrScore") }}>
                                                <span style={{ fontSize: 22, fontWeight: 900, color: "#111827" }}>
                                                    {record.managerTotalScore != null ? record.managerTotalScore.toFixed(2) : "—"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "18px 12px", textAlign: "center", ...getStickyStyle("apprScore") }}>
                                                <span style={{ fontSize: 22, fontWeight: 900, color: "#e8637a" }}>
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

                {/* Comments / Feedback Section */}
                <EvaluationCommentsSection
                    role="APPROVER"
                    comments={record.comments || []}
                    isEditable={isEditable}
                    selfReviewValue={selfReview}
                    managerFeedbackValue=""
                />

            </div> {/* closes workspace-body */}


            {/* ─── ACTION BAR ─── */}
            {(isApprovable || hasScrollbar) && (
                <div className="employee-evaluation-action-bar" style={{ display: "block", padding: 0 }}>
                    {/* Synchronized sticky scrollbar at the top edge of the footer */}
                    <div
                        className="sticky-horizontal-scrollbar"
                        ref={topScrollRef}
                        style={{
                            overflowX: "auto",
                            overflowY: "hidden",
                            width: "100%",
                            background: "transparent",
                            borderBottom: isApprovable ? "1px solid #e2e8f0" : "none",
                            display: hasScrollbar ? "block" : "none"
                        }}
                    >
                        <div style={{ width: tableScrollWidth, height: 1 }} />
                    </div>

                    {isApprovable && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 24px" }}>
                            {/* Left: Spacer to balance center alignment */}
                            <div style={{ flex: "1 1 0%", minWidth: 200 }} />

                            {/* Center: Centered Buttons */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flex: "0 0 auto" }}>
                                {allLeafCriteria.length - scoredCount > 0 && (
                                    <Button onClick={handleGoToNextUnscored} icon={<DownOutlined />} style={{ height: 42, borderRadius: 8, fontWeight: 600, color: "#475569", borderColor: "#cbd5e1", background: "#ffffff" }}>
                                        Tiêu chí chưa đánh giá ({allLeafCriteria.length - scoredCount})
                                    </Button>
                                )}
                                <Access permission={ALL_PERMISSIONS.EVALUATION.REJECT_RECORD} hideChildren>
                                    <Button
                                        danger
                                        icon={<RollbackOutlined />}
                                        style={{ borderRadius: 6, fontWeight: 700, height: 42, padding: "0 24px" }}
                                        onClick={() => setRejectModalOpen(true)}
                                    >
                                        Yêu cầu chỉnh sửa
                                    </Button>
                                </Access>
                                <Access permission={ALL_PERMISSIONS.EVALUATION.APPROVE_RECORD} hideChildren>
                                    <Button
                                        type="primary"
                                        icon={<CheckCircleOutlined />}
                                        loading={saving}
                                        onClick={handleApproveClick}
                                        disabled={progressPct < 100}
                                        className={progressPct === 100 ? "evaluation-submit-button" : undefined}
                                        style={{
                                            borderRadius: 6,
                                            fontWeight: 700,
                                            height: 42,
                                            padding: "0 24px"
                                        }}
                                    >
                                        Phê duyệt & Hoàn tất
                                    </Button>
                                </Access>
                            </div>

                            {/* Right: Empty spacer to balance center alignment */}
                            <div style={{ flex: "1 1 0%", display: "flex", justifyContent: "flex-end" }} />
                        </div>
                    )}
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
                open={approveModalOpen}
                onCancel={() => setApproveModalOpen(false)}
                footer={null}
                width={540}
                centered
                styles={{
                    body: {
                        padding: "32px 32px 24px 32px",
                        fontFamily: "'Inter', -apple-system, sans-serif"
                    }
                }}
                closeIcon={<span style={{ color: "#94a3b8", fontSize: 16 }}>×</span>}
            >
                {/* Header Section */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 24 }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 56,
                        height: 56,
                        borderRadius: "50%",
                        background: "#ecfdf5",
                        border: "4px solid #d1fae5",
                        color: "#10b981",
                        fontSize: 28,
                        marginBottom: 16,
                        boxShadow: "0 4px 10px rgba(16, 185, 129, 0.15)"
                    }}>
                        <CheckCircleFilled />
                    </div>
                    <h3 style={{ margin: 0, fontSize: 20, fontWeight: 850, color: "#0f172a" }}>
                        Xác nhận Phê duyệt
                    </h3>
                    <p style={{ margin: "6px 0 0", fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>
                        Bản đánh giá sẽ được hoàn tất và gửi kết quả chính thức cho nhân viên.
                    </p>
                </div>

                {/* Info Alert Box */}
                <div style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 16px",
                    background: "#f0f9ff",
                    border: "1px solid #e0f2fe",
                    borderRadius: 10,
                    marginBottom: 20
                }}>
                    <span style={{ color: "#0284c7", fontSize: 16, marginTop: 1 }}><InfoCircleFilled /></span>
                    <span style={{ fontSize: 12.5, color: "#0369a1", fontWeight: 550, lineHeight: 1.5 }}>
                        Lưu ý: Sau khi phê duyệt, kết quả và điểm số sẽ được chốt và nhân viên có thể xem trực tiếp phản hồi này.
                    </span>
                </div>

                {/* Metrics Bento Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                    {/* Score Card */}
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px 16px",
                        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
                        border: "1px solid #e2e8f0",
                        borderRadius: 12,
                        boxShadow: "0 2px 4px rgba(15, 23, 42, 0.02)"
                    }}>
                        <span style={{ fontSize: 11, fontWeight: 750, color: "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8 }}>
                            Tổng điểm
                        </span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                            <span style={{ fontSize: 32, fontWeight: 900, color: "#0f172a", letterSpacing: "-1px" }}>
                                {currentApproverResult.score.toFixed(2)}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>
                                / 5.00
                            </span>
                        </div>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: "#64748b", marginTop: 4 }}>
                            Tiến độ: {scoredCount}/{allLeafCriteria.length} tiêu chí
                        </span>
                    </div>

                    {/* Grade Card */}
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px 16px",
                        background: GRADE_CONFIG[currentApproverResult.grade]?.bg || "#f8fafc",
                        border: `1px solid ${GRADE_CONFIG[currentApproverResult.grade]?.color}25` || "1px solid #e2e8f0",
                        borderRadius: 12,
                        boxShadow: "0 2px 4px rgba(15, 23, 42, 0.02)"
                    }}>
                        <span style={{ fontSize: 11, fontWeight: 750, color: GRADE_CONFIG[currentApproverResult.grade]?.color || "#64748b", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8 }}>
                            Xếp loại dự kiến
                        </span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                            <span style={{ fontSize: 32, fontWeight: 900, color: GRADE_CONFIG[currentApproverResult.grade]?.color || "#0f172a", letterSpacing: "-1px" }}>
                                {currentApproverResult.grade}
                            </span>
                        </div>
                        <span style={{
                            fontSize: 12.5,
                            fontWeight: 800,
                            color: GRADE_CONFIG[currentApproverResult.grade]?.color || "#0f172a",
                            marginTop: 4,
                            padding: "2px 8px",
                            background: "rgba(255, 255, 255, 0.6)",
                            borderRadius: 6
                        }}>
                            {GRADE_CONFIG[currentApproverResult.grade]?.label || "—"}
                        </span>
                    </div>
                </div>

                {/* Score Override Reason (If applicable) */}
                {hasScoreOverride() && (
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 700, fontSize: 13, color: "#334155" }}>
                            <span>Lý do điều chỉnh điểm số</span>
                            <span style={{ color: "#ef4444" }}>*</span>
                            <Tooltip title="Vui lòng nhập lý do giải trình khi điều chỉnh điểm số so với quản lý trực tiếp.">
                                <InfoCircleOutlined style={{ color: "#94a3b8", cursor: "help" }} />
                            </Tooltip>
                        </div>
                        <Input.TextArea
                            rows={4}
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            placeholder="Nhập lý do điều chỉnh điểm số so với quản lý trực tiếp..."
                            style={{
                                borderRadius: 8,
                                borderColor: "#cbd5e1",
                                fontSize: 13,
                                padding: "10px 12px"
                            }}
                        />
                    </div>
                )}

                {/* Custom Action Footer */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
                    <Button
                        onClick={() => setApproveModalOpen(false)}
                        style={{
                            borderRadius: 8,
                            fontWeight: 700,
                            height: 40,
                            padding: "0 20px",
                            color: "#475569",
                            borderColor: "#cbd5e1",
                            background: "#fff"
                        }}
                    >
                        Hủy bỏ
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleApprove}
                        loading={saving}
                        style={{
                            borderRadius: 8,
                            fontWeight: 700,
                            height: 40,
                            padding: "0 24px",
                            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            border: "none",
                            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)"
                        }}
                    >
                        Xác nhận Phê duyệt
                    </Button>
                </div>
            </Modal>

            <style>{`
                .evaluation-header-menu-button {
                    width: 40px;
                    height: 40px;
                    padding: 0;
                    border-radius: 6px;
                    border: 1px solid #e2e8f0;
                    background: #fff;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    font-size: 18px;
                    transition: all 0.15s;
                }
                .evaluation-header-menu-button:hover {
                    color: #0f172a;
                    background: #f8fafc;
                    border-color: #cbd5e1;
                }
                .employee-evaluation-table-shell {
                    scrollbar-color: #cbd5e1 transparent !important;
                    scrollbar-width: thin !important;
                }
                .employee-evaluation-table-shell::-webkit-scrollbar {
                    height: 9px !important;
                    display: block !important;
                    width: auto !important;
                }
                .employee-evaluation-table-shell::-webkit-scrollbar-track {
                    background: #f8fafc !important;
                }
                .employee-evaluation-table-shell::-webkit-scrollbar-thumb {
                    background: #cbd5e1 !important;
                    border: 2px solid #f8fafc !important;
                    border-radius: 8px !important;
                }
                .sticky-horizontal-scrollbar {
                    height: 8px !important;
                    scrollbar-width: thin !important;
                    scrollbar-color: #cbd5e1 transparent !important;
                }
                .sticky-horizontal-scrollbar::-webkit-scrollbar {
                    height: 4px !important;
                    display: block !important;
                }
                .sticky-horizontal-scrollbar::-webkit-scrollbar-track {
                    background: transparent !important;
                }
                .sticky-horizontal-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1 !important;
                    border-radius: 99px !important;
                }
                .sticky-horizontal-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8 !important;
                }
            `}</style>
        </div>
    );

};


export default ApprovalDetailPage;
