import React from "react";
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation, useBlocker } from "react-router-dom";
import { Button, Spin, Tag, Popconfirm, Input, Alert, Empty, Breadcrumb, Collapse, Switch, Dropdown, Tooltip } from "antd";
import {
    CheckCircleOutlined, ClockCircleOutlined,
    SendOutlined, LockOutlined, UserOutlined, TeamOutlined, BookOutlined,
    FileTextOutlined, TrophyOutlined, FileExcelOutlined, MoreOutlined, LoadingOutlined,
    RightOutlined, DownOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import { notify } from "@/components/common/notification/notify";
import { Radar, Column } from "@/components/common/chart/LazyChart";
import {
    callFetchEvaluationRecordById,
    callEmployeeSaveScore,
    callEmployeeSubmitRecord,
    callEmployeeSaveSelfReview,
    callEmployeeConfirmRecord,
    callFetchRecordHistory,
} from "@/config/api";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { exportDetailedEvaluation } from "@/utils/ExportEvaluationDetailUtils";
import { printEvaluationDetail } from "@/utils/PrintEvaluationUtils";
import { useGrabToScroll } from "@/hooks/useGrabToScroll";
import { useRef, useMemo } from "react";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";
import { EvaluationUserInfo } from "../components/shared/EvaluationUserInfo";
import { EvaluationGuidelines } from "../components/shared/EvaluationGuidelines";
import { EvaluationCommentsSection } from "../components/shared/EvaluationCommentsSection";
import { SharedCriteriaRow, SharedSubCriteriaRow } from "../components/shared/EvaluationTableRows";
import { formatWeight } from "../components/evaluationScoring";
import { EvaluationProgressIndicator } from "../components/shared/EvaluationProgressIndicator";
import ConfirmModal from "@/components/common/modal/ConfirmModal";
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

const SCORE_VALUES = [1, 2, 3, 4, 5] as const;

const EMPLOYEE_SCORE_WIDTH = 184;
const FINAL_SCORE_WIDTH = 152;
const CONTENT_WIDTH = 280;
const METHOD_WIDTH = 190;
const LEVEL_WIDTH = 155;
const WEIGHT_EPSILON = 0.001;

type TemplateStructureIssue = {
    sectionId?: number;
    message: string;
};

const getTemplateStructureIssues = (sections?: any[]): TemplateStructureIssue[] => {
    if (!sections?.length) {
        return [{ message: "Mẫu đánh giá chưa có phần đánh giá nào." }];
    }

    const issues: TemplateStructureIssue[] = [];
    let totalSectionWeight = 0;

    sections.forEach(section => {
        const sectionWeight = Number(section.weight);
        if (!Number.isFinite(sectionWeight) || sectionWeight <= 0 || sectionWeight > 1) {
            issues.push({ sectionId: section.id, message: `Phần "${section.name}" có trọng số không hợp lệ.` });
            return;
        }
        totalSectionWeight += sectionWeight;

        const criteria = section.criteria ?? [];
        if (!criteria.length) {
            issues.push({
                sectionId: section.id,
                message: `Phần "${section.name}" có trọng số ${(sectionWeight * 100).toFixed(0)}% nhưng chưa được cấu hình tiêu chí.`,
            });
            return;
        }

        const criteriaWeight = criteria.reduce((sum: number, item: any) => sum + Number(item.weight ?? 0), 0);
        if (!Number.isFinite(criteriaWeight) || Math.abs(criteriaWeight - sectionWeight) > WEIGHT_EPSILON) {
            issues.push({
                sectionId: section.id,
                message: `Trọng số tiêu chí trong phần "${section.name}" phải cộng đúng ${(sectionWeight * 100).toFixed(0)}%.`,
            });
        }

        criteria.forEach((criterion: any) => {
            const scorableCriteria = criterion.subCriteria?.length ? criterion.subCriteria : [criterion];
            scorableCriteria.forEach((scorable: any) => {
                const levels = scorable.levels ?? [];
                const validLevels = new Set(
                    levels
                        .filter((level: any) => level.description?.trim() && SCORE_VALUES.includes(level.level))
                        .map((level: any) => level.level),
                );
                if (levels.length !== 5 || validLevels.size !== 5) {
                    issues.push({
                        sectionId: section.id,
                        message: `Tiêu chí "${scorable.name}" chưa có đầy đủ mô tả cho 5 mức điểm.`,
                    });
                }
            });
        });
    });

    if (Math.abs(totalSectionWeight - 1) > WEIGHT_EPSILON) {
        issues.push({ message: `Tổng trọng số các phần phải bằng 100% (hiện tại ${(totalSectionWeight * 100).toFixed(1)}%).` });
    }
    return issues;
};

const getScore = (scores: any[], criteriaId: number, by: "EMPLOYEE" | "MANAGER" | "APPROVER") =>
    scores?.find(s => s.criteriaId === criteriaId && s.scoredBy === by)?.score ?? null;

const LEVEL_HEADER_CONFIG: Record<number, { title: string; subtitle: string; color: string; bg: string; border: string }> = {
    1: { title: "Mức 1", subtitle: "Yếu", color: "#dc2626", bg: "#fef2f2", border: "#fca5a5" },
    2: { title: "Mức 2", subtitle: "Trung bình", color: "#ea580c", bg: "#fff7ed", border: "#ffddc1" },
    3: { title: "Mức 3", subtitle: "Khá", color: "#b45309", bg: "#fefbeb", border: "#fef08a" },
    4: { title: "Mức 4", subtitle: "Tốt", color: "#65a30d", bg: "#f7fee7", border: "#d9f99d" },
    5: { title: "Mức 5", subtitle: "Xuất sắc", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
};

const formatDateTime = (value?: string | null) =>
    value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "—";

const getStickyStyle = (col: "empScore" | "finalScore", isCompleted: boolean, isHeader = false): React.CSSProperties => {
    const width = col === "empScore" ? 220 : 150;
    const right = col === "empScore" && isCompleted ? 150 : 0;
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



interface MyEvaluationDetailPageProps {
    recordId?: number;
    onClose?: () => void;
}

const MyEvaluationDetailPage = ({ recordId, onClose }: MyEvaluationDetailPageProps) => {
    const grabToScrollRef = useGrabToScroll();
    const topScrollRef = useRef<HTMLDivElement>(null);
    const [tableScrollWidth, setTableScrollWidth] = useState(0);
    const [hasScrollbar, setHasScrollbar] = useState(false);

    const { id: routeId } = useParams<{ id: string }>();
    const id = recordId != null ? String(recordId) : routeId;
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const isReadonlyView = searchParams.get("readonly") === "true";

    const [record, setRecord] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [savingComment, setSavingComment] = useState(false);
    const [selfReview, setSelfReview] = useState("");
    const [localScores, setLocalScores] = useState<Record<number, number>>({});
    const [collapsedSections, setCollapsedSections] = useState<Record<number, boolean>>({});
    const [savingScore, setSavingScore] = useState<number | null>(null);
    const [isError, setIsError] = useState(false);
    const [hoveredGroupId, setHoveredGroupId] = useState<string | number | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [isDirty, setIsDirty] = useState(false);
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

        checkScroll();
        window.addEventListener("resize", checkScroll);

        const observer = new ResizeObserver(checkScroll);
        observer.observe(bottom);

        const timer1 = setTimeout(checkScroll, 100);
        const timer2 = setTimeout(checkScroll, 400);

        return () => {
            window.removeEventListener("resize", checkScroll);
            observer.disconnect();
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [loading, record, grabToScrollRef]);

    const backPath = searchParams.get("from") === "summary"
        ? "/admin/evaluation/summary"
        : searchParams.get("from") === "process"
            ? "/admin/evaluation/process?tab=MY_EVAL"
            : searchParams.get("from") === "progress"
                ? `/admin/evaluation/periods/${record?.period?.id || record?.periodId || ""}/progress`
                : "/admin/evaluation/my-records";

    const handleClose = () => {
        if (isDirty && !window.confirm("Bạn có nhận xét chưa lưu. Bạn có chắc muốn đóng bản đánh giá?")) {
            return;
        }
        setDrawerOpen(false);
        setTimeout(() => {
            if (onClose) {
                onClose();
            } else {
                navigate(backPath);
            }
        }, 300);
    };

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
        try {
            const [recRes, histRes] = await Promise.all([
                callFetchEvaluationRecordById(Number(id)),
                callFetchRecordHistory(Number(id)),
            ]);
            if (recRes?.data) {
                setRecord(recRes.data);
                const commentSelf = recRes.data.comments?.find((c: any) => c.commentType === "SELF_REVIEW");
                if (commentSelf) setSelfReview(commentSelf.content);
                const initScores: Record<number, number> = {};
                recRes.data.scores?.forEach((s: any) => {
                    if (s.scoredBy === "EMPLOYEE") initScores[s.criteriaId] = s.score;
                });
                setLocalScores(initScores);
            }
            if (histRes?.data) setHistory(histRes.data);
            setIsError(false);
        } catch {
            notify.error("Lỗi tải dữ liệu đánh giá");
            setIsError(true);
        }
        finally { setLoading(false); }
    }, [id]);

    useEffect(() => { fetchRecord(); }, [fetchRecord]);

    const handleSaveScore = async (criteriaId: number, score: number) => {
        if (!record?.id) return;
        const previousScore = localScores[criteriaId];
        setSavingScore(criteriaId);
        setLocalScores(prev => ({ ...prev, [criteriaId]: score }));
        try {
            const response = await callEmployeeSaveScore(record.id, criteriaId, score);
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
            setLocalScores(prev => {
                const next = { ...prev };
                if (previousScore == null) delete next[criteriaId];
                else next[criteriaId] = previousScore;
                return next;
            });
            notify.error(err?.message || err?.response?.data?.message || "Lỗi lưu điểm");
        } finally { setSavingScore(null); }
    };

    const handleSaveSelfReview = async () => {
        if (!record?.id) return;
        setSavingComment(true);
        try {
            await callEmployeeSaveSelfReview(record.id, selfReview);
            setIsDirty(false);
            notify.success("Đã lưu nhận xét");
        } catch (err: any) {
            notify.error(err?.message || err?.response?.data?.message || "Lỗi lưu nhận xét");
        } finally { setSavingComment(false); }
    };

    const handleSubmit = async () => {
        if (!record?.id) return;
        const structureIssues = getTemplateStructureIssues(record.template?.sections);
        if (structureIssues.length) {
            notify.error("Mẫu đánh giá chưa được cấu hình hợp lệ. Vui lòng liên hệ quản trị viên.");
            return;
        }
        setSubmitting(true);
        try {
            // Tự động lưu nhận xét tự đánh giá trước khi nộp
            await callEmployeeSaveSelfReview(record.id, selfReview);
            setIsDirty(false);
            await callEmployeeSubmitRecord(record.id);
            notify.success("Đã nộp bản đánh giá!");
            if (onClose || backPath) {
                handleClose();
            } else {
                fetchRecord();
            }
        } catch (err: any) {
            notify.error(err?.message || err?.response?.data?.message || "Lỗi nộp bản đánh giá");
        } finally { setSubmitting(false); }
    };

    const handleConfirm = async () => {
        if (!record?.id) return;
        setConfirming(true);
        try {
            await callEmployeeConfirmRecord(record.id);
            notify.success("Đã xác nhận kết quả!");
            fetchRecord();
        } catch (err: any) {
            notify.error(err?.message || err?.response?.data?.message || "Lỗi xác nhận");
        } finally { setConfirming(false); }
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

    const renderInWorkspaceDrawer = (content: React.ReactNode) => (
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

    if (loading) return renderInWorkspaceDrawer(
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", background: "#f8fafc" }}>
            <Spin size="large" />
        </div>
    );
    if (isError) return renderInWorkspaceDrawer(
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%", gap: 16, background: "#f8fafc" }}>
            <Empty description="Lỗi tải dữ liệu bản đánh giá" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            <Button type="primary" onClick={fetchRecord}>Thử lại</Button>
        </div>
    );
    if (!record) return renderInWorkspaceDrawer(
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", background: "#f8fafc" }}>
            <Empty description="Không tìm thấy bản đánh giá" />
        </div>
    );

    const employeeStartDate = record.period?.employeeStartDate;
    const employeeDeadline = record.effectiveEmployeeDeadline ?? record.employeeDeadlineOverride ?? record.period?.employeeDeadline;
    const isEmployeePhaseOpen = (!employeeStartDate || !dayjs().isBefore(dayjs(employeeStartDate)))
        && (!employeeDeadline || !dayjs().isAfter(dayjs(employeeDeadline)));
    const isEditable = !isReadonlyView && (record.status === "NOT_STARTED" || record.status === "EMPLOYEE_DRAFTING") && isEmployeePhaseOpen;
    const isCompleted = record.status === "COMPLETED";
    const hasConfirmed = isCompleted && !!record.completedAt;
    const statusCfg = STATUS_CONFIG[record.status as RecordStatus] ?? STATUS_CONFIG.NOT_STARTED;
    const gradeCfg = record.finalGrade ? GRADE_CONFIG[record.finalGrade] : null;
    const adminTimelineSteps = [
        {
            key: "employee",
            label: "Nhân viên nộp",
            description: record.employee?.fullName || record.employee?.username || "Nhân viên",
            value: record.employeeSubmittedAt,
            color: "#2563eb",
            icon: <UserOutlined />,
        },
        {
            key: "manager",
            label: "Quản lý trực tiếp",
            description: record.directManager?.fullName || record.directManager?.username || "Quản lý trực tiếp",
            value: record.managerSubmittedAt,
            color: "#7c3aed",
            icon: <TeamOutlined />,
        },
        {
            key: "approval",
            label: "Quản lý gián tiếp",
            description: record.indirectManager?.fullName || record.indirectManager?.username || "Quản lý gián tiếp phê duyệt",
            value: record.approvedAt,
            color: "#059669",
            icon: <CheckCircleOutlined />,
        },
        {
            key: "confirm",
            label: "Xác nhận kết quả",
            description: record.employee?.fullName || record.employee?.username || "Nhân viên",
            value: record.completedAt,
            color: "#d97706",
            icon: <TrophyOutlined />,
        },
    ];
    const completedTimelineSteps = adminTimelineSteps.filter(step => step.value).length;

    const allLeafCriteria: any[] = [];
    record.template?.sections?.forEach((sec: any) => {
        sec.criteria?.forEach((c: any) => {
            if (!c.subCriteria?.length) allLeafCriteria.push(c);
            else c.subCriteria?.forEach((sub: any) => allLeafCriteria.push(sub));
        });
    });
    const scoredCount = allLeafCriteria.filter(c => localScores[c.id] != null).length;
    const progressPct = allLeafCriteria.length ? Math.round((scoredCount / allLeafCriteria.length) * 100) : 0;
    const remainingCount = allLeafCriteria.length - scoredCount;
    const templateStructureIssues = getTemplateStructureIssues(record.template?.sections);
    const hasTemplateStructureError = templateStructureIssues.length > 0;
    const canSubmit = progressPct === 100 && !hasTemplateStructureError;
    const handleGoToNextUnscored = () => {
        const nextCriteria = allLeafCriteria.find(criteria => localScores[criteria.id] == null);
        if (!nextCriteria) return;
        document.getElementById(`evaluation-criteria-${nextCriteria.id}`)?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    };

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
        padding: "12px 10px", borderBottom: "1px solid #cbd5e1",
        borderRight: "1px solid #cbd5e1", fontSize: 12, color: "#334155",
        verticalAlign: "top", lineHeight: 1.5, minWidth: 140, width: 140,
        textAlign: "left", overflowWrap: "break-word", wordBreak: "normal",
        whiteSpace: "normal"
    };
    const tdSc: React.CSSProperties = {
        padding: "14px 12px", borderBottom: "1px solid #cbd5e1", borderRight: "1px solid #cbd5e1",
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

    ;
    // ── Prepare Radar Chart Data ──
    const radarData: any[] = [];
    if (isCompleted && record.template?.sections) {
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
    const shouldShowComparisonChart = uniqueItems >= 2;

    const chartConfig = {
        data: radarData,
        xField: 'item',
        yField: 'score',
        colorField: 'user',
        scale: {
            y: { domain: [0, 5] },
        },
    };



    return renderInWorkspaceDrawer(
        <div className="employee-evaluation-detail" style={{ width: "100%", height: "100%", minHeight: 0, boxSizing: "border-box", overflowX: "hidden", overflowY: "auto", fontFamily: "'Inter', -apple-system, sans-serif", background: "#f8fafc" }}>

            {/* ─── WORKSPACE HEADER ─── */}
            <div className="employee-evaluation-workspace-header">
                <div style={{ minWidth: 0, flex: "1 1 440px" }}>
                    <div style={{ color: "#64748b", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0 }}>
                        Tự đánh giá
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
                        {employeeDeadline && (
                            <span style={{ color: "#64748b", fontSize: 12, fontWeight: 600 }}>
                                Hạn chấm {dayjs(employeeDeadline).format("DD/MM/YYYY")}
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
                            <span>NV đánh giá</span>
                            <strong>{record.employeeTotalScore.toFixed(2)}</strong>
                        </div>
                    )}

                    {isCompleted && gradeCfg && record.managerTotalScore != null && (
                        <div className="evaluation-score-summary">
                            <span>Kết quả</span>
                            <strong>{(record.approverTotalScore ?? record.managerTotalScore).toFixed(2)}</strong>
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
                {isReadonlyView && <EvaluationUserInfo record={record} />}

                {!isReadonlyView && isCompleted && !hasConfirmed && (() => {
                    // T12: Tính số ngày còn lại trước khi auto-acknowledge (7 ngày từ approvedAt)
                    const approvedAt = record.approvedAt ? dayjs(record.approvedAt) : null;
                    const daysElapsed = approvedAt ? dayjs().diff(approvedAt, "day") : 0;
                    const daysRemaining = Math.max(0, 7 - daysElapsed);
                    const isUrgent = daysRemaining <= 2;
                    return (
                        <div style={{
                            background: isUrgent
                                ? "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)"
                                : "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
                            border: `1px solid ${isUrgent ? "#fb923c" : "#fecdd3"}`,
                            borderRadius: 12, padding: "16px 20px", marginBottom: 16,
                            boxShadow: isUrgent ? "0 2px 12px rgba(251,146,60,0.15)" : "0 1px 4px rgba(0,0,0,0.03)"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                                <TrophyOutlined style={{ fontSize: 26, color: isUrgent ? "#ea580c" : "#f43f5e", flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 700, color: "#111827", fontSize: 15, marginBottom: 3 }}>
                                        Kết quả đã được phê duyệt — cần xác nhận đã xem!
                                    </div>
                                    <div style={{ fontSize: 13, color: isUrgent ? "#c2410c" : "#6b7280", lineHeight: 1.5 }}>
                                        {daysRemaining > 0 ? (
                                            <>Vui lòng xem kết quả và nhấn "Xác nhận đã xem". Hệ thống sẽ tự xác nhận sau{" "}
                                                <strong style={{ color: isUrgent ? "#ea580c" : "#f43f5e" }}>
                                                    {daysRemaining} ngày nữa
                                                </strong> nếu bạn không phản hồi.</>
                                        ) : (
                                            <>Hệ thống sẽ tự động xác nhận trong hôm nay.</>
                                        )}
                                    </div>
                                </div>
                                <Access permission={ALL_PERMISSIONS.EVALUATION.EMPLOYEE_CONFIRM} hideChildren>
                                    <Popconfirm title="Xác nhận đã xem kết quả?" onConfirm={handleConfirm} okText="Xác nhận" cancelText="Hủy">
                                        <Button loading={confirming} icon={<CheckCircleOutlined />}
                                            style={{
                                                borderRadius: 8, fontWeight: 600, height: 38, flexShrink: 0,
                                                background: isUrgent ? "#ea580c" : "#f43f5e",
                                                border: "none", color: "#fff"
                                            }}>
                                            Xác nhận đã xem
                                        </Button>
                                    </Popconfirm>
                                </Access>

                            </div>
                        </div>
                    );
                })()}

                {isCompleted && hasConfirmed && (
                    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "12px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                        <CheckCircleOutlined style={{ color: "#f43f5e" }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Đã xác nhận kết quả vào {dayjs(record.completedAt).format("DD/MM/YYYY HH:mm")}</span>
                    </div>
                )}

                {isReadonlyView && (
                    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
                            <div>
                                <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px" }}>Timeline xử lý</div>
                                <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>Theo dõi các mốc nhân viên, quản lý và phê duyệt đã thực hiện</div>
                            </div>
                            <Tag color={completedTimelineSteps === 4 ? "success" : "processing"} style={{ borderRadius: 999, padding: "4px 12px", fontWeight: 700 }}>
                                {completedTimelineSteps}/4 mốc hoàn tất
                            </Tag>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                            {adminTimelineSteps.map((step) => {
                                const done = !!step.value;
                                return (
                                    <div key={step.key} style={{ border: `1px solid ${done ? `${step.color}33` : "#e5e7eb"}`, background: done ? `${step.color}0f` : "#f8fafc", borderRadius: 12, padding: "14px 16px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                            <div style={{ width: 34, height: 34, borderRadius: 999, background: done ? step.color : "#e2e8f0", color: done ? "#fff" : "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                                                {step.icon}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>{step.label}</div>
                                                <div style={{ fontSize: 13, color: done ? step.color : "#94a3b8", fontWeight: 800, marginTop: 2 }}>{formatDateTime(step.value)}</div>
                                            </div>
                                        </div>
                                        <div style={{ marginTop: 10, fontSize: 12, color: "#475569", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {step.description}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {history.length > 0 && (
                            <Collapse
                                ghost
                                style={{ marginTop: 16, borderTop: "1px solid #f1f5f9", paddingTop: 6 }}
                                items={[
                                    {
                                        key: "history",
                                        label: (
                                            <span style={{ fontSize: 13, fontWeight: 800, color: "#334155" }}>
                                                Lịch sử trạng thái ({history.length})
                                            </span>
                                        ),
                                        children: (
                                            <div style={{ display: "grid", gap: 8, paddingTop: 2 }}>
                                                {history.map((item) => (
                                                    <div key={item.id} style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 12, alignItems: "start", fontSize: 12 }}>
                                                        <div style={{ color: "#64748b", fontWeight: 700 }}>{formatDateTime(item.performedAt)}</div>
                                                        <div style={{ color: "#334155" }}>
                                                            <span style={{ fontWeight: 800 }}>{item.performedBy?.fullName || item.performedBy?.username || "Hệ thống"}</span>
                                                            <span style={{ color: "#94a3b8" }}> chuyển trạng thái </span>
                                                            <Tag style={{ marginInlineEnd: 4 }}>{STATUS_CONFIG[item.fromStatus as RecordStatus]?.text || item.fromStatus || "—"}</Tag>
                                                            <span style={{ color: "#94a3b8" }}>→</span>
                                                            <Tag color={STATUS_CONFIG[item.toStatus as RecordStatus]?.tagColor} style={{ marginInlineStart: 4 }}>
                                                                {STATUS_CONFIG[item.toStatus as RecordStatus]?.text || item.toStatus || "—"}
                                                            </Tag>
                                                            {item.note && <span style={{ color: "#64748b" }}> {item.note}</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ),
                                    },
                                ]}
                            />
                        )}
                    </div>
                )}




                {/* ─── HƯỚNG DẪN THỰC HIỆN ─── */}
                <EvaluationGuidelines />

                {/* ─── BẢNG ĐÁNH GIÁ ─── */}
                {hasTemplateStructureError && (
                    <Alert
                        type="error"
                        showIcon
                        style={{ marginBottom: 12, borderRadius: 8 }}
                        message="Mẫu đánh giá chưa hoàn chỉnh"
                        description={(
                            <div>
                                {templateStructureIssues.slice(0, 3).map((issue, index) => (
                                    <div key={`${issue.sectionId ?? "template"}-${index}`}>{issue.message}</div>
                                ))}
                                <div>Không thể nộp đánh giá cho đến khi quản trị viên xử lý cấu hình này.</div>
                            </div>
                        )}
                    />
                )}
                <div className="employee-evaluation-table-shell" ref={grabToScrollRef} style={{ position: "relative", isolation: "isolate", width: "100%", maxWidth: "100%", overflowX: "auto", overflowY: "hidden", overscrollBehaviorX: "contain", WebkitOverflowScrolling: "touch", marginBottom: 16, borderRadius: 12, border: "1px solid #dfe5ec", background: "#fff", boxShadow: "0 4px 16px rgba(15,23,42,0.05)" }}>
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
                            {SCORE_VALUES.map(n => <col key={n} style={{ width: 140 }} />)}
                            <col style={{ width: 85 }} />
                            <col style={{ width: 90 }} />
                            <col style={{ width: 220 }} />
                            {isCompleted && <col style={{ width: 150 }} />}
                        </colgroup>
                        <thead>
                            <tr>
                                <th rowSpan={2} style={{ ...thS, width: 55 }}>STT</th>
                                <th rowSpan={2} style={{ ...thS, width: 260, textAlign: "left" }}>Nội dung đánh giá</th>
                                <th rowSpan={2} style={{ ...thS, width: 170, textAlign: "left" }}>Phương pháp đo lường</th>
                                <th colSpan={5} style={{ ...thG, background: "#f8fafc" }}>Tiêu chí đánh giá theo thang điểm</th>
                                <th colSpan={2} style={{ ...thG, background: "#ffffff" }}>Trọng số</th>
                                <th rowSpan={2} style={{ ...thG, color: "#111827", ...getStickyStyle("empScore", isCompleted, true) }}>
                                    <div>CBNV đánh giá<span style={{ color: "#e8637a", marginLeft: 4 }}>*</span></div>
                                    <small className="evaluation-header-helper">Điểm & kết quả</small>
                                </th>
                                {isCompleted && <th rowSpan={2} style={{ ...thG, ...getStickyStyle("finalScore", isCompleted, true) }}>
                                    <div>Kết quả cuối</div>
                                    <small className="evaluation-header-helper">Điểm & quy đổi</small>
                                </th>}
                            </tr>
                            <tr>
                                {SCORE_VALUES.map(n => {
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
                                    let empTotal = 0, finalTotal = 0;
                                    const rows: React.ReactNode[] = [];
                                    const sectionIssues = templateStructureIssues.filter(issue => issue.sectionId === section.id);
                                    const isCollapsed = !!collapsedSections[section.id];

                                    // Precompute totals for collapsed preview
                                    section.criteria?.forEach((c: any) => {
                                        const hasSub = c.subCriteria?.length > 0;
                                        const empScore = localScores[c.id] ?? getScore(record.scores, c.id, "EMPLOYEE");
                                        const mgrScore = getScore(record.scores, c.id, "MANAGER");
                                        const apprScore = getScore(record.scores, c.id, "APPROVER");
                                        const finalScore = apprScore ?? mgrScore;

                                        if (hasSub) {
                                            let weightedSumEmp = 0, weightedSumFinal = 0;
                                            let cntEmp = 0, cntFinal = 0;
                                            c.subCriteria.forEach((sub: any) => {
                                                const e = localScores[sub.id] ?? getScore(record.scores, sub.id, "EMPLOYEE");
                                                const m = getScore(record.scores, sub.id, "MANAGER");
                                                const a = getScore(record.scores, sub.id, "APPROVER");
                                                const f = a ?? m;
                                                const w = (sub.weight && sub.weight > 0) ? sub.weight : (c.weight / c.subCriteria.length);
                                                if (e != null) { weightedSumEmp += e * w; cntEmp++; }
                                                if (f != null) { weightedSumFinal += f * w; cntFinal++; }
                                            });
                                            if (cntEmp > 0) empTotal += weightedSumEmp;
                                            if (cntFinal > 0) finalTotal += weightedSumFinal;
                                        } else {
                                            if (empScore != null) empTotal += empScore * c.weight;
                                            if (finalScore != null) finalTotal += finalScore * c.weight;
                                        }
                                    });

                                    const headerEmpTotal = empTotal;
                                    const headerFinalTotal = finalTotal;

                                    empTotal = 0;
                                    finalTotal = 0;

                                    rows.push(
                                        <tr key={`sec-${section.id}`}>
                                            <td colSpan={isCompleted ? 12 : 11} style={{
                                                padding: "10px 18px",
                                                background: "#f3f4f6",
                                                borderTop: "1px solid #e5e7eb",
                                                borderBottom: "1px solid #e5e7eb",
                                                borderLeft: "4px solid #f43f5e"
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 13, color: "#111827", textTransform: "uppercase", letterSpacing: "0.3px" }}>
                                                        <span
                                                            style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 4, background: "#fff", border: "1px solid #cbd5e1" }}
                                                            onClick={() => setCollapsedSections(prev => ({ ...prev, [section.id]: !prev[section.id] }))}
                                                        >
                                                            {isCollapsed ? <RightOutlined style={{ fontSize: 11 }} /> : <DownOutlined style={{ fontSize: 11 }} />}
                                                        </span>
                                                        {section.name}
                                                        <Tag style={{
                                                            margin: 0,
                                                            marginLeft: 8,
                                                            fontWeight: 700,
                                                            color: "#6d28d9",
                                                            background: "#f5f3ff",
                                                            border: "1px solid #ddd6fe",
                                                            borderRadius: "6px",
                                                            fontSize: "11px",
                                                            textTransform: "none",
                                                            letterSpacing: "normal"
                                                        }}>
                                                            Trọng số: {formatWeight(section.weight)}
                                                        </Tag>
                                                    </span>
                                                    {isCollapsed && (
                                                        <div style={{ display: "flex", gap: 6, fontSize: 11 }}>
                                                            {headerEmpTotal > 0 && (
                                                                <Tag color="blue" style={{ margin: 0, fontWeight: 600 }}>
                                                                    Tự đánh giá: {headerEmpTotal.toFixed(2)}
                                                                </Tag>
                                                            )}
                                                            {isCompleted && headerFinalTotal > 0 && (
                                                                <Tag color="green" style={{ margin: 0, fontWeight: 600 }}>
                                                                    Điểm cuối: {headerFinalTotal.toFixed(2)}
                                                                </Tag>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );

                                    if (!section.criteria?.length) {
                                        rows.push(
                                            <tr key={`invalid-${section.id}`}>
                                                <td colSpan={isCompleted ? 11 : 10} style={{ padding: "18px 22px", background: "#fff7f8", color: "#be123c", borderBottom: "1px solid #fecdd3", fontWeight: 650, fontSize: 13 }}>
                                                    Phần này chưa được cấu hình tiêu chí nên chưa thể chấm điểm hoặc tính kết quả. Vui lòng liên hệ quản trị viên.
                                                </td>
                                            </tr>
                                        );
                                        return rows;
                                    }

                                    if (sectionIssues.length > 0) {
                                        rows.push(
                                            <tr key={`warning-${section.id}`}>
                                                <td colSpan={isCompleted ? 11 : 10} style={{ padding: "12px 18px", background: "#fff7f8", color: "#be123c", borderBottom: "1px solid #fecdd3", fontWeight: 650, fontSize: 12 }}>
                                                    {sectionIssues[0].message}
                                                </td>
                                            </tr>
                                        );
                                    }

                                    section.criteria?.forEach((c: any, cIdx: number) => {
                                        const hasSub = c.subCriteria?.length > 0;
                                        const empScore = localScores[c.id] ?? getScore(record.scores, c.id, "EMPLOYEE");
                                        const mgrScore = getScore(record.scores, c.id, "MANAGER");
                                        const apprScore = getScore(record.scores, c.id, "APPROVER");
                                        const finalScore = apprScore ?? mgrScore;

                                        let avgEmp: number | null = null;
                                        let avgFinal: number | null = null;

                                        if (hasSub) {
                                            let weightedSumEmp = 0, weightedSumFinal = 0;
                                            let cntEmp = 0, cntFinal = 0;
                                            c.subCriteria.forEach((sub: any) => {
                                                const e = localScores[sub.id] ?? getScore(record.scores, sub.id, "EMPLOYEE");
                                                const m = getScore(record.scores, sub.id, "MANAGER");
                                                const a = getScore(record.scores, sub.id, "APPROVER");
                                                const f = a ?? m;
                                                if (e != null) {
                                                    weightedSumEmp += e * ((sub.weight && sub.weight > 0) ? sub.weight : (c.weight / c.subCriteria.length));
                                                    cntEmp++;
                                                }
                                                if (f != null) {
                                                    weightedSumFinal += f * ((sub.weight && sub.weight > 0) ? sub.weight : (c.weight / c.subCriteria.length));
                                                    cntFinal++;
                                                }
                                            });
                                            if (cntEmp > 0) {
                                                empTotal += weightedSumEmp;
                                                avgEmp = weightedSumEmp / c.weight;
                                            }
                                            if (cntFinal > 0) {
                                                finalTotal += weightedSumFinal;
                                                avgFinal = weightedSumFinal / c.weight;
                                            }
                                        } else {
                                            if (empScore != null) empTotal += empScore * c.weight;
                                            if (finalScore != null) finalTotal += finalScore * c.weight;
                                        }

                                        if (!isCollapsed) {
                                            rows.push(
                                                <SharedCriteriaRow
                                                    key={`c-${c.id}`}
                                                    role="EMPLOYEE"
                                                    c={c}
                                                    cIdx={cIdx}
                                                    hasSub={hasSub}
                                                    isEditable={isEditable}
                                                    isCompleted={isCompleted}
                                                    empScore={empScore}
                                                    avgEmp={avgEmp}
                                                    finalScore={finalScore}
                                                    avgFinal={avgFinal}
                                                    savingScore={savingScore}
                                                    handleSaveScore={handleSaveScore}
                                                    tdB={tdB}
                                                    tdLvl={tdLvl}
                                                    tdSc={tdSc}
                                                    getStickyStyle={(col, isHeader) => getStickyStyle(col as any, isCompleted, isHeader)}
                                                    hoveredGroupId={hoveredGroupId}
                                                    onGroupHover={setHoveredGroupId}
                                                />
                                            );
                                        }

                                        if (hasSub) {
                                            c.subCriteria?.forEach((sub: any, si: number) => {
                                                const subEmp = localScores[sub.id] ?? getScore(record.scores, sub.id, "EMPLOYEE");
                                                const subMgr = getScore(record.scores, sub.id, "MANAGER");
                                                const subAppr = getScore(record.scores, sub.id, "APPROVER");
                                                const subFinalScore = subAppr ?? subMgr;

                                                if (!isCollapsed) {
                                                    rows.push(
                                                        <SharedSubCriteriaRow
                                                            key={`sub-${sub.id}`}
                                                            role="EMPLOYEE"
                                                            sub={sub}
                                                            cIdx={cIdx}
                                                            si={si}
                                                            isEditable={isEditable}
                                                            isCompleted={isCompleted}
                                                            subEmp={subEmp}
                                                            subFinalScore={subFinalScore}
                                                            savingScore={savingScore}
                                                            handleSaveScore={handleSaveScore}
                                                            tdB={tdB}
                                                            tdLvl={tdLvl}
                                                            tdSc={tdSc}
                                                            getStickyStyle={(col, isHeader) => getStickyStyle(col as any, isCompleted, isHeader)}
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

                                    rows.push(
                                        <tr key={`stot-${section.id}`} style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                                            <td colSpan={3} style={{ padding: "12px 18px", textAlign: "left", fontSize: 12, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.3px", position: "relative", zIndex: 0 }}>
                                                TỔNG KẾT PHẦN ({formatWeight(section.weight)})
                                            </td>
                                            <td colSpan={5} style={{ background: "#f9fafb" }} />
                                            <td colSpan={2} style={{ padding: "12px", textAlign: "center", fontWeight: 750, color: "#475569" }}>{formatWeight(section.weight)}</td>
                                            <td style={{ padding: "12px", textAlign: "center", ...getStickyStyle("empScore", isCompleted), background: "#f9fafb" }}>
                                                <div className="evaluation-total-cell"><span>CBNV</span><strong>{empTotal.toFixed(2)}</strong></div>
                                            </td>
                                            {isCompleted && <td style={{ padding: "12px", textAlign: "center", ...getStickyStyle("finalScore", isCompleted), background: "#f9fafb" }}>
                                                <div className="evaluation-total-cell is-final"><span>Điểm cuối</span><strong>{finalTotal.toFixed(2)}</strong></div>
                                            </td>}
                                        </tr>
                                    );
                                    dynamicEmpTotal += empTotal;
                                    dynamicMgrTotal += finalTotal;
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
                                            <td colSpan={2} style={{ padding: "18px 12px", textAlign: "center", fontWeight: 800, color: "#475569" }}>{hasTemplateStructureError ? "—" : "100%"}</td>
                                            <td style={{ padding: "18px 12px", textAlign: "center", ...getStickyStyle("empScore", isCompleted) }}>
                                                <span style={{ fontSize: 22, fontWeight: 900, color: "#e8637a" }}>
                                                    {!hasTemplateStructureError && dynamicEmpTotal > 0 ? dynamicEmpTotal.toFixed(2) : "—"}
                                                </span>
                                            </td>
                                            {isCompleted && <td style={{ padding: "18px 12px", textAlign: "center", ...getStickyStyle("finalScore", isCompleted) }}>
                                                <span style={{ fontSize: 22, fontWeight: 900, color: "#111827" }}>
                                                    {!hasTemplateStructureError && dynamicMgrTotal > 0 ? dynamicMgrTotal.toFixed(2) : "—"}
                                                </span>
                                            </td>}
                                        </tr>
                                    </>
                                );
                            })()}
                        </tbody>
                    </table>
                </div>

                {/* Comments / Feedback Section */}
                <EvaluationCommentsSection
                    role="EMPLOYEE"
                    comments={record.comments || []}
                    isEditable={isEditable}
                    selfReviewValue={selfReview}
                    onChangeSelfReview={setSelfReview}
                    onSaveSelfReview={handleSaveSelfReview}
                    managerFeedbackValue=""
                    savingSelfReview={savingComment}
                />
            </div>

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

                    {isEditable && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 24px" }}>
                            {/* Left: spacer to balance centered buttons */}
                            <div style={{ flex: "1 1 0%", minWidth: 200 }} />

                            {/* Center: Centered Buttons */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flex: "0 0 auto" }}>
                                {remainingCount > 0 && (
                                    <Button onClick={handleGoToNextUnscored} icon={<DownOutlined />} style={{ height: 42, borderRadius: 8, fontWeight: 600, color: "#475569", borderColor: "#cbd5e1", background: "#ffffff" }}>
                                        Tiêu chí chưa đánh giá ({remainingCount})
                                    </Button>
                                )}
                                <Access permission={ALL_PERMISSIONS.EVALUATION.EMPLOYEE_SUBMIT} hideChildren>
                                    <Button
                                        type="primary"
                                        icon={<SendOutlined />}
                                        loading={submitting}
                                        disabled={!canSubmit}
                                        onClick={() => setIsSubmitModalOpen(true)}
                                        className={canSubmit ? "evaluation-submit-button" : undefined}
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
                    color: #334155;
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
                title="Xác nhận nộp bản tự đánh giá?"
                description="Sau khi nộp bạn sẽ không thể chỉnh sửa điểm hay nhận xét. Bạn có chắc chắn muốn nộp?"
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


export default MyEvaluationDetailPage;
