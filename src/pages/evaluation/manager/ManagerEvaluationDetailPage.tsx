import React from "react";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, useBlocker } from "react-router-dom";
import { Button, Spin, Tag, Popconfirm, Input, Select, Alert, Empty, Breadcrumb, Switch, Tooltip, Dropdown } from "antd";
import {
    ArrowLeftOutlined, CheckCircleOutlined, ClockCircleOutlined,
    SendOutlined, LockOutlined, UserOutlined, TeamOutlined, BookOutlined,
    FileTextOutlined, TrophyOutlined, FileExcelOutlined, MoreOutlined,
    RightOutlined, DownOutlined
} from "@ant-design/icons";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import useAccess from "@/hooks/useAccess";
import { exportDetailedEvaluation } from "@/utils/ExportEvaluationDetailUtils";
import { printEvaluationDetail } from "@/utils/PrintEvaluationUtils";
import dayjs from "dayjs";
import { notify } from "@/components/common/notification/notify";
import EvaluationScorePicker from "../components/EvaluationScorePicker";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";
import { EvaluationUserInfo } from "../components/shared/EvaluationUserInfo";
import { EvaluationGuidelines } from "../components/shared/EvaluationGuidelines";
import { EvaluationCommentsSection } from "../components/shared/EvaluationCommentsSection";
import { SharedCriteriaRow, SharedSubCriteriaRow } from "../components/shared/EvaluationTableRows";
import { EvaluationProgressIndicator } from "../components/shared/EvaluationProgressIndicator";
import ConfirmModal from "@/components/common/modal/ConfirmModal";
import { getLeafCriteria, getSectionScore, getTotalScore, getWeightedScore, formatScoreResult, formatWeight } from "../components/evaluationScoring";
import "../components/shared/evaluation-shell.css";
import { useGrabToScroll } from "@/hooks/useGrabToScroll";
import {
    callFetchEvaluationRecordById,
    callManagerSaveScore,
    callManagerSubmitRecord,
    callManagerSaveFeedback,
    callFetchRecordHistory,
} from "@/config/api";

type RecordStatus = "NOT_STARTED" | "EMPLOYEE_DRAFTING" | "PENDING_MANAGER_REVIEW" | "MANAGER_REVIEWING" | "PENDING_APPROVAL" | "COMPLETED";

const STATUS_CONFIG: Record<RecordStatus, { text: string; tagColor: string }> = {
    NOT_STARTED: { text: "Chưa bắt đầu", tagColor: "default" },
    EMPLOYEE_DRAFTING: { text: "Đang tự đánh giá", tagColor: "processing" },
    PENDING_MANAGER_REVIEW: { text: "Chờ Quản lý đánh giá", tagColor: "warning" },
    MANAGER_REVIEWING: { text: "Quản lý đang đánh giá", tagColor: "purple" },
    PENDING_APPROVAL: { text: "Chờ phê duyệt kết quả", tagColor: "cyan" },
    COMPLETED: { text: "Hoàn tất đánh giá", tagColor: "success" },
};

const GRADE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    A: { color: "#15803d", bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", label: "Xuất sắc" },
    B: { color: "#1d4ed8", bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", label: "Tốt" },
    C: { color: "#b45309", bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)", label: "Khá" },
    D: { color: "#b91c1c", bg: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)", label: "Trung bình" },
    E: { color: "#be123c", bg: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)", label: "Yếu" },
};

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

const getStickyStyle = (col: "empScore" | "mgrScore", isHeader = false): React.CSSProperties => {
    const width = col === "mgrScore" ? 220 : 150;
    const right = col === "mgrScore" ? 0 : 220;
    const isLeftmost = col === "empScore";

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
const SCORE_VALUES = [1, 2, 3, 4, 5] as const;

const thS: React.CSSProperties = {
    padding: "12px 14px", fontWeight: 800, fontSize: 12, color: "#0f172a",
    background: "#ffffff", borderBottom: "2px solid #cbd5e1", borderRight: "1px solid #cbd5e1",
    textAlign: "left", whiteSpace: "nowrap", verticalAlign: "middle"
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
    padding: "12px 10px", borderBottom: "1px solid #cbd5e1",
    borderRight: "1px solid #cbd5e1", fontSize: 12, color: "#334155",
    verticalAlign: "top", lineHeight: 1.5, minWidth: 140, width: 140,
    textAlign: "left", overflowWrap: "break-word", wordBreak: "break-word",
    whiteSpace: "normal"
};
const tdSc: React.CSSProperties = {
    padding: "14px 12px", borderBottom: "1px solid #cbd5e1", borderRight: "1px solid #cbd5e1",
    textAlign: "center", verticalAlign: "middle", background: "#ffffff"
};



interface ManagerEvaluationDetailPageProps {
    recordId?: number;
    onClose?: () => void;
}

const ManagerEvaluationDetailPage = ({ recordId, onClose }: ManagerEvaluationDetailPageProps) => {
    const grabToScrollRef = useGrabToScroll();
    const topScrollRef = useRef<HTMLDivElement>(null);
    const [tableScrollWidth, setTableScrollWidth] = useState(0);
    const [hasScrollbar, setHasScrollbar] = useState(false);

    const { id: routeId } = useParams<{ id: string }>();
    const id = recordId != null ? String(recordId) : routeId;
    const navigate = useNavigate();
    const showCriteria = true;
    const [drawerOpen, setDrawerOpen] = useState(true);

    const [record, setRecord] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [savingComment, setSavingComment] = useState(false);
    const [managerFeedback, setManagerFeedback] = useState("");
    const [localScores, setLocalScores] = useState<Record<number, number>>({});
    const [savingScore, setSavingScore] = useState<number | null>(null);
    const [collapsedSections, setCollapsedSections] = useState<Record<number, boolean>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [isError, setIsError] = useState(false);
    const [hoveredGroupId, setHoveredGroupId] = useState<string | number | null>(null);
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

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

    const allLeafCriteria = useMemo(() => getLeafCriteria(record?.template?.sections), [record?.template?.sections]);
    const scoredCount = useMemo(() => allLeafCriteria.filter(c => localScores[c.id] != null).length, [allLeafCriteria, localScores]);
    const progressPct = allLeafCriteria.length ? Math.round((scoredCount / allLeafCriteria.length) * 100) : 0;
    const handleGoToNextUnscored = () => {
        const nextCriteria = allLeafCriteria.find(criteria => localScores[criteria.id] == null);
        if (!nextCriteria) return;
        document.getElementById(`evaluation-criteria-${nextCriteria.id}`)?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    };

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
            notify.error("Không thể tải dữ liệu đánh giá");
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
            const response = await callManagerSaveScore(record.id, criteriaId, score);
            const update = response.data;
            if (update) {
                setRecord((current: any) => ({
                    ...current,
                    scores: update.scores,
                    scoringSummary: update.scoringSummary,
                }));
            }
            notify.success("Đã cập nhật điểm thành công");
        } catch (err: any) {
            notify.error(err?.message || err?.response?.data?.message || "Không thể lưu điểm");
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
            notify.error(err?.message || err?.response?.data?.message || "Không thể lưu nhận xét");
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
            notify.success("Đã nộp phê duyệt.");
            if (onClose) {
                handleClose();
            } else {
                fetchRecord();
            }
        } catch (err: any) {
            notify.error(err?.message || err?.response?.data?.message || "Không thể nộp bản đánh giá");
        } finally { setSubmitting(false); }
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

    const handleClose = () => {
        if (isDirty && !window.confirm("Bạn có nhận xét chưa lưu. Bạn có chắc muốn đóng bản đánh giá?")) {
            return;
        }
        setDrawerOpen(false);
        setTimeout(() => {
            if (onClose) {
                onClose();
            } else {
                navigate("/admin/evaluation/process?tab=PENDING_EVAL");
            }
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

    if (loading) return renderInWorkspaceDrawer(
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
            <Spin size="large" />
        </div>
    );
    if (isError) return renderInWorkspaceDrawer(
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: 400, gap: 16 }}>
            <Empty description="Lỗi tải dữ liệu bản đánh giá" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            <Button type="primary" onClick={fetchRecord}>Thử lại</Button>
        </div>
    );
    if (!record) return renderInWorkspaceDrawer(
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
            <Empty description="Không tìm thấy bản đánh giá" />
        </div>
    );

    const isEditable = record.status === "PENDING_MANAGER_REVIEW" || record.status === "MANAGER_REVIEWING";
    const isCompleted = record.status === "COMPLETED";
    const hasConfirmed = isCompleted && !!record.completedAt;
    const statusCfg = STATUS_CONFIG[record.status as RecordStatus] ?? STATUS_CONFIG.NOT_STARTED;
    const gradeCfg = record.finalGrade ? GRADE_CONFIG[record.finalGrade] : null;



    // Local style declarations removed, now using hoisted module-level styling objects

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
                        {record.period?.managerDeadline && (
                            <span style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>
                                Hạn đánh giá {dayjs(record.period.managerDeadline).format("DD/MM/YYYY")}
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

                    {isCompleted && gradeCfg && record.managerTotalScore != null && (
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
                        description="Điểm đánh giá của bạn đang chênh lệch lớn (> 1.0 điểm) so với tự đánh giá của nhân viên. Vui lòng cân nhắc xem xét kỹ hoặc ghi nhận xét giải thích."
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
                            {showCriteria && SCORE_VALUES.map(n => <col key={n} style={{ width: 140 }} />)}
                            <col style={{ width: 85 }} />
                            <col style={{ width: 90 }} />
                            <col style={{ width: 150 }} />
                            <col style={{ width: 220 }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th rowSpan={2} style={{ ...thS, width: 55 }}>STT</th>
                                <th rowSpan={2} style={{ ...thS, textAlign: "left", width: 260 }}>Nội dung đánh giá</th>
                                <th rowSpan={2} style={{ ...thS, textAlign: "left", width: 170 }}>Phương pháp đo lường</th>
                                {showCriteria && <th colSpan={5} style={{ ...thG, background: "#f9fafb" }}>Tiêu chí đánh giá theo thang điểm</th>}
                                <th colSpan={2} style={{ ...thG, background: "#ffffff" }}>Trọng số</th>
                                <th rowSpan={2} style={{ ...thG, ...getStickyStyle("empScore", true) }}>
                                    <div>Nhân viên đánh giá</div>
                                    <small className="evaluation-header-helper">Điểm & kết quả</small>
                                </th>
                                <th rowSpan={2} style={{ ...thG, ...getStickyStyle("mgrScore", true) }}>
                                    <div>Quản lý đánh giá</div>
                                    <small className="evaluation-header-helper">Điểm & quy đổi</small>
                                </th>
                            </tr>
                            <tr>
                                {showCriteria && SCORE_VALUES.map(n => {
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
                                const dynamicEmpTotal = getTotalScore(record.scoringSummary, "EMPLOYEE");
                                const dynamicMgrTotal = getTotalScore(record.scoringSummary, "MANAGER");

                                const sectionElements = record.template?.sections?.map((section: any) => {
                                    const empTotal = getSectionScore(record.scoringSummary, section.id, "EMPLOYEE");
                                    const mgrTotal = getSectionScore(record.scoringSummary, section.id, "MANAGER");
                                    const isCollapsed = !!collapsedSections[section.id];
                                    const rows: React.ReactNode[] = [];

                                    rows.push(
                                        <tr
                                            key={`sec-${section.id}`}
                                            onClick={() => setCollapsedSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                                            style={{ cursor: "pointer", transition: "background 0.2s" }}
                                            className="evaluation-section-header-row"
                                        >
                                            <td colSpan={showCriteria ? 12 : 7} style={{
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
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                                        {isCollapsed && (
                                                            <div style={{ display: "flex", gap: 6, marginRight: 4, flexWrap: "nowrap" }}>
                                                                {empTotal != null && (
                                                                    <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>
                                                                        Tự đánh giá: {empTotal.toFixed(2)}
                                                                    </Tag>
                                                                )}
                                                                {mgrTotal != null && (
                                                                    <Tag color="orange" style={{ margin: 0, fontWeight: 600 }}>
                                                                        Quản lý đánh giá: {mgrTotal.toFixed(2)}
                                                                    </Tag>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );



                                    section.criteria?.forEach((c: any, cIdx: number) => {
                                        const hasSub = c.subCriteria?.length > 0;
                                        const empScore = getScore(record.scores, c.id, "EMPLOYEE");
                                        const mgrScore = localScores[c.id] ?? getScore(record.scores, c.id, "MANAGER");
                                        const scoredMgrCount = hasSub
                                            ? c.subCriteria.filter((sub: any) => (localScores[sub.id] ?? getScore(record.scores, sub.id, "MANAGER")) != null).length
                                            : 0;
                                        const empResult = hasSub
                                            ? (c.subCriteria.filter((sub: any) => getScore(record.scores, sub.id, "EMPLOYEE") != null).length > 0
                                                ? c.subCriteria.reduce((sum: number, sub: any) => sum + (getWeightedScore(record.scores, sub.id, "EMPLOYEE") || 0), 0)
                                                : null)
                                            : getWeightedScore(record.scores, c.id, "EMPLOYEE");
                                        const mgrResult = hasSub
                                            ? (scoredMgrCount > 0 ? c.subCriteria.reduce((sum: number, sub: any) => sum + (getWeightedScore(record.scores, sub.id, "MANAGER") || 0), 0) : null)
                                            : getWeightedScore(record.scores, c.id, "MANAGER");


                                        if (!isCollapsed) {
                                            rows.push(
                                                <SharedCriteriaRow
                                                    key={`c-${c.id}`}
                                                    role="MANAGER"
                                                    c={c}
                                                    cIdx={cIdx}
                                                    hasSub={hasSub}
                                                    isEditable={isEditable && canScore}
                                                    empScore={empScore}
                                                    avgEmp={empResult != null ? empResult / c.weight : null}
                                                    mgrScore={mgrScore}
                                                    avgMgr={mgrResult != null ? mgrResult / c.weight : null}
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
                                                const subMgr = localScores[sub.id] ?? getScore(record.scores, sub.id, "MANAGER");
                                                const subEmpResult = getWeightedScore(record.scores, sub.id, "EMPLOYEE");
                                                const subMgrResult = getWeightedScore(record.scores, sub.id, "MANAGER");
                                                const subWeight = (sub.weight && sub.weight > 0) ? sub.weight : (c.weight / c.subCriteria.length);

                                                if (!isCollapsed) {
                                                    rows.push(
                                                        <SharedSubCriteriaRow
                                                            key={`sub-${sub.id}`}
                                                            role="MANAGER"
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
                                            <td colSpan={2} style={{ padding: "12px", textAlign: "center", fontWeight: 750, color: "#475569" }}>{formatWeight(section.weight)}</td>
                                            <td style={{ padding: "12px", textAlign: "center", ...getStickyStyle("empScore"), background: "#f9fafb" }}>
                                                <div className="evaluation-total-cell"><span>CBNV</span><strong>{empTotal?.toFixed(2) ?? "—"}</strong></div>
                                            </td>
                                            <td style={{ padding: "12px", textAlign: "center", ...getStickyStyle("mgrScore"), background: "#f9fafb" }}>
                                                <div className="evaluation-total-cell"><span>Quản lý</span><strong>{mgrTotal?.toFixed(2) ?? "—"}</strong></div>
                                            </td>
                                        </tr>
                                    );

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
                                            <td colSpan={2} style={{ padding: "18px 12px", textAlign: "center", fontWeight: 800, color: "#475569" }}>100%</td>
                                            <td style={{ padding: "18px 12px", textAlign: "center", ...getStickyStyle("empScore") }}>
                                                <span style={{ fontSize: 22, fontWeight: 900, color: "#111827" }}>
                                                    {dynamicEmpTotal != null ? dynamicEmpTotal.toFixed(2) : "—"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "18px 12px", textAlign: "center", ...getStickyStyle("mgrScore") }}>
                                                <span style={{ fontSize: 22, fontWeight: 900, color: "#f43f5e" }}>
                                                    {dynamicMgrTotal != null ? dynamicMgrTotal.toFixed(2) : "—"}
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
                    role="MANAGER"
                    comments={record.comments || []}
                    isEditable={isEditable}
                    canFeedback={canFeedback}
                    selfReviewValue=""
                    managerFeedbackValue={managerFeedback}
                    onChangeManagerFeedback={setManagerFeedback}
                    onSaveManagerFeedback={handleSaveFeedback}
                    savingManagerFeedback={savingComment}
                />

            </div> {/* closes workspace-body */}

            {/* ─── STICKY BOTTOM BAR ─── */}
            {(isEditable || hasScrollbar) && (
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
                            borderBottom: isEditable ? "1px solid #e2e8f0" : "none",
                            display: hasScrollbar ? "block" : "none"
                        }}
                    >
                        <div style={{ width: tableScrollWidth, height: 1 }} />
                    </div>

                    {/* Action buttons container */}
                    {isEditable && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 24px" }}>
                            {/* Left: spacer to balance center alignment */}
                            <div style={{ flex: "1 1 0%", minWidth: 200 }} />

                            {/* Center: Centered Buttons */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flex: "0 0 auto" }}>
                                {allLeafCriteria.length - scoredCount > 0 && (
                                    <Button onClick={handleGoToNextUnscored} icon={<DownOutlined />} style={{ height: 42, borderRadius: 8, fontWeight: 600, color: "#475569", borderColor: "#cbd5e1", background: "#ffffff" }}>
                                        Tiêu chí chưa đánh giá ({allLeafCriteria.length - scoredCount})
                                    </Button>
                                )}
                                <Access permission={ALL_PERMISSIONS.EVALUATION.MANAGER_SUBMIT} hideChildren>
                                    <Button type="primary" icon={<SendOutlined />} loading={submitting} disabled={progressPct < 100}
                                        onClick={() => setIsSubmitModalOpen(true)}
                                        className={progressPct === 100 ? "evaluation-submit-button" : undefined}
                                        style={{
                                            borderRadius: 6, fontWeight: 700, height: 42, padding: "0 24px",
                                            border: "none",
                                        }}>
                                        Nộp bản đánh giá
                                    </Button>
                                </Access>
                            </div>

                            {/* Right: Empty spacer to balance center alignment */}
                            <div style={{ flex: "1 1 0%", display: "flex", justifyContent: "flex-end" }} />
                        </div>
                    )}
                </div>
            )}

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

            <ConfirmModal
                open={isSubmitModalOpen}
                variant="success"
                title="Xác nhận nộp kết quả đánh giá?"
                description="Sau khi nộp bạn sẽ không thể chỉnh sửa điểm hay phản hồi cho nhân viên. Bạn có chắc chắn muốn nộp?"
                okText="Nộp ngay"
                cancelText="Hủy"
                onConfirm={async () => {
                    setIsSubmitModalOpen(false);
                    await handleSubmit();
                }}
                onCancel={() => setIsSubmitModalOpen(false)}
                loading={submitting}
            />
        </div>
    );
};


export default ManagerEvaluationDetailPage;
