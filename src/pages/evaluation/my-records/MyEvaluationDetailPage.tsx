import React from "react";
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation, useBlocker } from "react-router-dom";
import { Button, Spin, Tag, Popconfirm, Input, Alert, Empty, Progress, Breadcrumb, Collapse, Switch, Dropdown, Tooltip } from "antd";
import {
    CheckCircleOutlined, ClockCircleOutlined,
    SendOutlined, LockOutlined, UserOutlined, TeamOutlined, BookOutlined,
    FileTextOutlined, TrophyOutlined, FileExcelOutlined, MoreOutlined, LoadingOutlined
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
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";

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

const getComment = (comments: any[], type: string) =>
    comments?.find(c => c.commentType === type)?.content ?? "";

const formatDateTime = (value?: string | null) =>
    value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "—";

const getStickyStyle = (col: "empScore" | "finalScore", isCompleted: boolean, isHeader = false): React.CSSProperties => {
    const width = col === "empScore" ? EMPLOYEE_SCORE_WIDTH : FINAL_SCORE_WIDTH;
    const right = col === "empScore" && isCompleted ? FINAL_SCORE_WIDTH : 0;
    const isLeftmost = col === "empScore";

    return {
        position: "sticky",
        right,
        width,
        minWidth: width,
        maxWidth: width,
        boxSizing: "border-box",
        overflow: "hidden",
        zIndex: isHeader ? 4 : 2,
        background: isHeader ? "#f8fafc" : "#fff",
        borderLeft: isLeftmost ? "1px solid #dbe3ef" : undefined,
        boxShadow: isLeftmost ? "-2px 0 4px -4px rgba(15,23,42,0.18)" : undefined,
        backgroundClip: "padding-box",
    };
};

interface ScorePickerProps {
    value: number | null;
    result?: number | null;
    loading: boolean;
    onChange: (score: number) => void;
}

const ScorePicker = React.memo(({ value, result, loading, onChange }: ScorePickerProps) => (
    <div
        className={`evaluation-score-picker${value == null ? " is-empty" : " has-value"}${loading ? " is-saving" : ""}`}
        aria-busy={loading}
    >
        <div className="evaluation-score-picker-options" role="group" aria-label="Chọn điểm đánh giá từ 1 đến 5">
            {SCORE_VALUES.map(score => (
                <button
                    key={score}
                    type="button"
                    className={`evaluation-score-option${value === score ? " is-selected" : ""}`}
                    aria-label={`${score} điểm - ${SCORE_DESCRIPTIONS[score]}`}
                    aria-pressed={value === score}
                    title={`${score} điểm - ${SCORE_DESCRIPTIONS[score]}`}
                    disabled={loading}
                    onClick={() => {
                        if (value !== score) onChange(score);
                    }}
                >
                    {loading && value === score ? <LoadingOutlined spin /> : score}
                </button>
            ))}
        </div>
        <div className={`evaluation-score-result${value == null || result == null ? " is-label-only" : ""}`}>
            {value == null
                ? "Chưa chấm"
                : result == null
                  ? "Điểm thành phần"
                  : <>Kết quả <strong>{result.toFixed(2)}</strong></>}
        </div>
    </div>
));

interface ICriteriaRowProps {
    c: any;
    cIdx: number;
    hasSub: boolean;
    isEditable: boolean;
    empScore: number | null;
    avgEmp: number | null;
    isCompleted: boolean;
    avgFinal: number | null;
    finalScore: number | null;
    savingScore: number | null;
    handleSaveScore: (id: number, score: number) => void;
    tdB: any;
    tdLvl: any;
    tdSc: any;
}

const CriteriaRow = React.memo(({
    c, cIdx, hasSub, isEditable, empScore, avgEmp, isCompleted, avgFinal, finalScore, savingScore, handleSaveScore, tdB, tdLvl, tdSc
}: ICriteriaRowProps) => {
    const getL = (lvl: number) => c.levels?.find((l: any) => l.level === lvl)?.description || "";
    return (
        <tr className="eval-row" id={!hasSub ? `evaluation-criteria-${c.id}` : undefined}>
            <td style={{ ...tdB, textAlign: "center", color: "#475569", fontWeight: 800, fontSize: 13 }}>{cIdx + 1}</td>
            <td style={{ ...tdB, color: "#111827" }}>
                <div style={{ fontWeight: hasSub ? 750 : 650 }}>{c.name}</div>
                {c.description && <div className="evaluation-criteria-description">{c.description}</div>}
            </td>
            <td style={{ ...tdB, color: "#64748b", fontSize: 12 }}>{c.measurementMethod || "—"}</td>
            {SCORE_VALUES.map(lvl => (
                <td
                    key={lvl}
                    style={tdLvl}
                >
                    {getL(lvl) || <span className="evaluation-level-empty">Chưa có mô tả</span>}
                </td>
            ))}
            <td style={{ ...tdB, textAlign: "center", verticalAlign: "middle" }}>
                <span className="evaluation-weight-badge">{(c.weight * 100).toFixed(0)}%</span>
            </td>
            <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("empScore", isCompleted), padding: "10px 8px" }}>
                {hasSub ? (
                    <div className="evaluation-score-readout">
                        <span>Điểm trung bình</span>
                        <strong>{avgEmp != null ? avgEmp.toFixed(2) : "—"}</strong>
                        <small>Kết quả {avgEmp != null ? (avgEmp * c.weight).toFixed(2) : "—"}</small>
                    </div>
                ) : isEditable ? (
                    <Access permission={ALL_PERMISSIONS.EVALUATION.EMPLOYEE_SCORE} hideChildren>
                        <ScorePicker
                            value={empScore}
                            result={empScore != null ? empScore * c.weight : null}
                            loading={savingScore === c.id}
                            onChange={(score) => handleSaveScore(c.id, score)}
                        />
                    </Access>
                ) : (
                    <div className="evaluation-score-readout">
                        <span>Điểm nhân viên</span>
                        <strong>{empScore ?? "—"}</strong>
                        <small>Kết quả {empScore != null ? (empScore * c.weight).toFixed(2) : "—"}</small>
                    </div>
                )}
            </td>
            {isCompleted && <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("finalScore", isCompleted) }}>
                <div className="evaluation-score-readout is-final">
                    <span>Điểm cuối</span>
                    <strong>{hasSub ? (avgFinal?.toFixed(2) ?? "—") : (finalScore ?? "—")}</strong>
                    <small>Kết quả {hasSub
                        ? (avgFinal != null ? (avgFinal * c.weight).toFixed(2) : "—")
                        : (finalScore != null ? (finalScore * c.weight).toFixed(2) : "—")}
                    </small>
                </div>
            </td>}
        </tr>
    );
});

interface ISubCriteriaRowProps {
    sub: any;
    cIdx: number;
    si: number;
    isEditable: boolean;
    subEmp: number | null;
    subFinalScore: number | null;
    isCompleted: boolean;
    savingScore: number | null;
    handleSaveScore: (id: number, score: number) => void;
    tdB: any;
    tdLvl: any;
    tdSc: any;
}

const SubCriteriaRow = React.memo(({
    sub, cIdx, si, isEditable, subEmp, subFinalScore, isCompleted, savingScore, handleSaveScore, tdB, tdLvl, tdSc
}: ISubCriteriaRowProps) => {
    const getSL = (lvl: number) => sub.levels?.find((l: any) => l.level === lvl)?.description || "";
    return (
        <tr className="eval-row" id={`evaluation-criteria-${sub.id}`}>
            <td style={{ ...tdB, textAlign: "center", color: "#475569", fontWeight: 800, fontSize: 12 }}>{cIdx + 1}.{si + 1}</td>
            <td style={{ ...tdB, color: "#111827" }}>
                <div style={{ fontWeight: 650 }}>{sub.name}</div>
                {sub.description && <div className="evaluation-criteria-description">{sub.description}</div>}
            </td>
            <td style={{ ...tdB, color: "#64748b", fontSize: 12 }}>{sub.measurementMethod || "—"}</td>
            {SCORE_VALUES.map(lvl => (
                <td
                    key={lvl}
                    style={tdLvl}
                >
                    {getSL(lvl) || <span className="evaluation-level-empty">Chưa có mô tả</span>}
                </td>
            ))}
            <td style={{ ...tdB, textAlign: "center", verticalAlign: "middle", color: "#cbd5e1" }}>—</td>
            <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("empScore", isCompleted), padding: "10px 8px" }}>
                {isEditable ? (
                    <Access permission={ALL_PERMISSIONS.EVALUATION.EMPLOYEE_SCORE} hideChildren>
                        <ScorePicker
                            value={subEmp}
                            loading={savingScore === sub.id}
                            onChange={(score) => handleSaveScore(sub.id, score)}
                        />
                    </Access>
                ) : (
                    <div className="evaluation-score-readout">
                        <span>Điểm thành phần</span>
                        <strong>{subEmp ?? "—"}</strong>
                    </div>
                )}
            </td>
            {isCompleted && <td style={{ ...tdSc, borderLeft: "none", ...getStickyStyle("finalScore", isCompleted) }}>
                <div className="evaluation-score-readout is-final">
                    <span>Điểm cuối</span>
                    <strong>{subFinalScore ?? "—"}</strong>
                </div>
            </td>}
        </tr>
    );
});

interface MyEvaluationDetailPageProps {
    recordId?: number;
    onClose?: () => void;
}

const MyEvaluationDetailPage = ({ recordId, onClose }: MyEvaluationDetailPageProps) => {
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
    const [savingScore, setSavingScore] = useState<number | null>(null);
    const [isError, setIsError] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const backPath = searchParams.get("from") === "summary"
        ? "/admin/evaluation/summary"
        : searchParams.get("from") === "process"
        ? "/admin/evaluation/process?tab=MY_EVAL"
        : searchParams.get("from") === "progress"
        ? `/admin/evaluation/periods/${record?.period?.id || record?.periodId || ""}/progress`
        : "/admin/evaluation/my-records";

    const handleClose = () => {
        if (!onClose) {
            navigate(backPath);
            return;
        }
        if (isDirty && !window.confirm("Bạn có nhận xét chưa lưu. Bạn có chắc muốn đóng bản đánh giá?")) {
            return;
        }
        onClose();
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
            await callEmployeeSaveScore(record.id, criteriaId, score);
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
            fetchRecord();
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
                open
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
        padding: "13px 12px", borderBottom: "1px solid #e2e8f0",
        borderRight: "1px solid #edf1f5", fontSize: 12, color: "#475569",
        verticalAlign: "top", lineHeight: 1.55, minWidth: LEVEL_WIDTH, width: LEVEL_WIDTH,
        textAlign: "left", overflowWrap: "break-word", wordBreak: "normal",
        whiteSpace: "normal"
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

    const renderInfoField = (label: string, value?: React.ReactNode) => (
        <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 5 }}>{label}</div>
            <div style={{ fontSize: 13, color: value ? "#111827" : "#cbd5e1", fontWeight: 700, lineHeight: 1.45, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {value || "Chưa cập nhật"}
            </div>
        </div>
    );

    const renderManagerCard = (label: string, info: any) => (
        <div style={{ background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 999, background: "#eef2ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
                    <TeamOutlined />
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
                    <div style={{ fontSize: 14, color: info?.id ? "#111827" : "#cbd5e1", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {info?.fullName || info?.username || "Chưa cập nhật"}
                    </div>
                </div>
            </div>
            <div style={{ color: "#64748b", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {info?.jobTitle || "Chưa cập nhật chức danh"}{info?.positionLevel ? ` (${info.positionLevel})` : ""}
            </div>
        </div>
    );

    const renderAdminEmployeeInfo = () => !isReadonlyView ? null : (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <UserOutlined style={{ color: "#f43f5e", fontSize: 16 }} />
                <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px" }}>Thông tin nhân sự</div>
                    <div style={{ marginTop: 3, fontSize: 12, color: "#64748b" }}>Bối cảnh đơn vị và luồng quản lý của hồ sơ đánh giá</div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                <div style={{ background: "#f9fafb", border: "1px solid #eef2f7", borderRadius: 12, padding: "16px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 999, background: "#fff1f2", color: "#f43f5e", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, flexShrink: 0 }}>
                            {(record.employee?.fullName || record.employee?.username || "?").trim().charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 16, color: "#111827", fontWeight: 900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {record.employee?.fullName || record.employee?.username || "Chưa cập nhật nhân viên"}
                            </div>
                            <div style={{ marginTop: 3, fontSize: 12, color: "#64748b", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {record.employee?.email || "Chưa cập nhật email"}
                            </div>
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
                        {renderInfoField("Công ty", record.employee?.companyName)}
                        {renderInfoField("Phòng ban", record.employee?.departmentName)}
                        {renderInfoField("Bộ phận", record.employee?.sectionName)}
                        {renderInfoField("Chức danh", record.employee?.jobTitle)}
                        {renderInfoField("Cấp bậc", record.employee?.positionLevel)}
                    </div>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                    {renderManagerCard("Quản lý trực tiếp", record.directManager)}
                    {renderManagerCard("Quản lý gián tiếp phê duyệt", record.indirectManager)}
                </div>
            </div>
        </div>
    );

    return renderInWorkspaceDrawer(
        <div className="employee-evaluation-detail" style={{ width: "100%", height: "100%", minHeight: 0, boxSizing: "border-box", overflow: "auto", fontFamily: "'Inter', -apple-system, sans-serif", background: "#f8fafc" }}>

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
                        <div className="evaluation-header-progress">
                            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 18 }}>
                                <span style={{ color: "#64748b", fontSize: 11, fontWeight: 700 }}>Tiến độ</span>
                                <span style={{ color: "#0f172a", fontSize: 13, fontWeight: 800 }}>{scoredCount}/{allLeafCriteria.length}</span>
                            </div>
                            <Progress
                                percent={progressPct}
                                showInfo={false}
                                strokeWidth={5}
                                strokeColor={progressPct === 100 ? "#16a34a" : "#475569"}
                                trailColor="#e2e8f0"
                                style={{ width: 140, margin: 0 }}
                            />
                        </div>
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
                </div>
            </div>

            <div className="employee-evaluation-workspace-body">
                {renderAdminEmployeeInfo()}

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

            {/* ─── CHART ─── */}
            {shouldShowComparisonChart && (
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "24px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 16, textAlign: "center" }}>
                        So sánh nhân viên và quản lý
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

            {/* ─── HƯỚNG DẪN THỰC HIỆN ─── */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "20px 24px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.03)", display: "flex", flexWrap: "wrap", gap: 24 }}>
                <div style={{ flex: "2 1 400px" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12, borderBottom: "1px solid #f3f4f6", paddingBottom: 8 }}><BookOutlined style={{ color: "#f43f5e", marginRight: 8 }} />Hướng dẫn thực hiện</div>
                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.7 }}>
                        <div style={{ marginBottom: 4 }}><strong style={{ color: "#111827" }}>1. Nội dung đánh giá:</strong> Phản ánh tiêu chí chính cần được xem xét trong kỳ đánh giá.</div>
                        <div style={{ marginBottom: 4 }}><strong style={{ color: "#111827" }}>2. Phương pháp đo lường:</strong> Cho biết căn cứ hoặc cách thức dùng để đánh giá tiêu chí.</div>
                        <div style={{ marginBottom: 4 }}><strong style={{ color: "#111827" }}>3. Mức 1 đến Mức 5:</strong> Đọc mô tả của từng mức trước khi lựa chọn điểm phù hợp.</div>
                        <div style={{ marginBottom: 4 }}><strong style={{ color: "#111827" }}>4. CBNV đánh giá:</strong> Nhấn số tương ứng để lưu điểm; kết quả quy đổi được hiển thị lớn ngay bên dưới.</div>
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
            <div className="employee-evaluation-table-shell" style={{ position: "relative", isolation: "isolate", overflowX: "auto", overflowY: "hidden", overscrollBehaviorX: "contain", WebkitOverflowScrolling: "touch", marginBottom: 16, borderRadius: 12, border: "1px solid #dfe5ec", background: "#fff", boxShadow: "0 4px 16px rgba(15,23,42,0.05)" }}>
                <table className="employee-evaluation-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: isCompleted ? 1725 : 1573, tableLayout: "fixed" }}>
                    <colgroup>
                        <col style={{ width: 64 }} />
                        <col style={{ width: CONTENT_WIDTH }} />
                        <col style={{ width: METHOD_WIDTH }} />
                        {SCORE_VALUES.map(n => <col key={n} style={{ width: LEVEL_WIDTH }} />)}
                        <col style={{ width: 80 }} />
                        <col style={{ width: EMPLOYEE_SCORE_WIDTH }} />
                        {isCompleted && <col style={{ width: FINAL_SCORE_WIDTH }} />}
                    </colgroup>
                    <thead>
                        <tr>
                            <th rowSpan={2} style={{ ...thS, width: 64 }}>STT</th>
                            <th rowSpan={2} style={{ ...thS, width: CONTENT_WIDTH, textAlign: "left" }}>Nội dung đánh giá</th>
                            <th rowSpan={2} style={{ ...thS, width: METHOD_WIDTH, textAlign: "left" }}>Phương pháp đo lường</th>
                            <th colSpan={5} style={{ ...thG, background: "#f8fafc" }}>Tiêu chí đánh giá theo thang điểm</th>
                            <th rowSpan={2} style={{ ...thS, width: 80 }}>Trọng số</th>
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
                            {SCORE_VALUES.map(n => (
                                <th key={n} style={{ ...thSub, width: LEVEL_WIDTH, color: "#d94c66" }}>
                                    <div>Mức {n}</div>
                                    <small className="evaluation-level-name">{SCORE_DESCRIPTIONS[n]}</small>
                                </th>
                            ))}
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

                                rows.push(
                                    <tr key={`sec-${section.id}`}>
                                        <td colSpan={isCompleted ? 11 : 10} style={{
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
                                        let sumEmp = 0, sumFinal = 0, cntEmp = 0, cntFinal = 0;
                                        c.subCriteria.forEach((sub: any) => {
                                            const e = localScores[sub.id] ?? getScore(record.scores, sub.id, "EMPLOYEE");
                                            const m = getScore(record.scores, sub.id, "MANAGER");
                                            const a = getScore(record.scores, sub.id, "APPROVER");
                                            const f = a ?? m;
                                            if (e != null) { sumEmp += e; cntEmp++; }
                                            if (f != null) { sumFinal += f; cntFinal++; }
                                        });
                                        if (cntEmp > 0) avgEmp = sumEmp / c.subCriteria.length;
                                        if (cntFinal > 0) avgFinal = sumFinal / c.subCriteria.length;

                                        if (avgEmp != null) empTotal += avgEmp * c.weight;
                                        if (avgFinal != null) finalTotal += avgFinal * c.weight;
                                    } else {
                                        if (empScore != null) empTotal += empScore * c.weight;
                                        if (finalScore != null) finalTotal += finalScore * c.weight;
                                    }

                                    rows.push(
                                        <CriteriaRow
                                            key={`c-${c.id}`}
                                            c={c}
                                            cIdx={cIdx}
                                            hasSub={hasSub}
                                            isEditable={isEditable}
                                            empScore={empScore}
                                            avgEmp={avgEmp}
                                            isCompleted={isCompleted}
                                            avgFinal={avgFinal}
                                            finalScore={finalScore}
                                            savingScore={savingScore}
                                            handleSaveScore={handleSaveScore}
                                            tdB={tdB}
                                            tdLvl={tdLvl}
                                            tdSc={tdSc}
                                        />
                                    );

                                    if (hasSub) {
                                        c.subCriteria?.forEach((sub: any, si: number) => {
                                            const subEmp = localScores[sub.id] ?? getScore(record.scores, sub.id, "EMPLOYEE");
                                            const subMgr = getScore(record.scores, sub.id, "MANAGER");
                                            const subAppr = getScore(record.scores, sub.id, "APPROVER");
                                            const subFinalScore = subAppr ?? subMgr;

                                            rows.push(
                                                <SubCriteriaRow
                                                    key={`sub-${sub.id}`}
                                                    sub={sub}
                                                    cIdx={cIdx}
                                                    si={si}
                                                    isEditable={isEditable}
                                                    subEmp={subEmp}
                                                    subFinalScore={subFinalScore}
                                                    isCompleted={isCompleted}
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

                                rows.push(
                                    <tr key={`stot-${section.id}`} style={{ background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                                        <td colSpan={8} style={{ padding: "12px 18px", textAlign: "right", fontSize: 12, fontWeight: 800, color: "#111827", textTransform: "uppercase", letterSpacing: "0.3px", position: "relative", zIndex: 0 }}>
                                            Tổng kết {section.name}
                                        </td>
                                        <td style={{ padding: "12px", textAlign: "center", fontWeight: 750, color: "#475569" }}>{(section.weight * 100).toFixed(0)}%</td>
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
                                        <td colSpan={8} style={{ padding: "18px 24px", textAlign: "right", fontWeight: 800, fontSize: 14, color: "#111827", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                            Tổng điểm đánh giá chung
                                        </td>
                                        <td style={{ padding: "18px 12px", textAlign: "center", fontWeight: 800, color: "#475569" }}>{hasTemplateStructureError ? "—" : "100%"}</td>
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

            {/* ─── NHẬN XÉT TỰ ĐÁNH GIÁ ─── */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: "18px 22px", marginBottom: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>Nhận xét của nhân viên</div>
                {isEditable ? (
                    <div>
                        <Input.TextArea rows={4} value={selfReview} onChange={e => { setSelfReview(e.target.value); setIsDirty(true); }}
                            placeholder="Chia sẻ thành tựu, khó khăn hoặc mong muốn của bạn trong kỳ làm việc vừa qua..."
                            style={{ borderRadius: 8, fontSize: 14, resize: "none", borderColor: "#e5e7eb" }} />
                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                            <Access permission={ALL_PERMISSIONS.EVALUATION.EMPLOYEE_SCORE} hideChildren>
                                <Button onClick={handleSaveSelfReview} loading={savingComment}
                                    style={{ borderRadius: 8, fontWeight: 600, color: "#111827", borderColor: "#e5e7eb" }}>
                                    Lưu nhận xét
                                </Button>
                            </Access>
                        </div>
                    </div>
                ) : (
                    <div style={{ background: "#f9fafb", borderRadius: 8, padding: "14px 16px", fontSize: 14, color: selfReview ? "#111827" : "#9ca3af", fontStyle: selfReview ? "normal" : "italic", lineHeight: 1.7, border: "1px solid #f3f4f6" }}>
                        {selfReview || "Chưa có nhận xét nào."}
                    </div>
                )}
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
            </div>

            {/* ─── STICKY BOTTOM BAR ─── */}
            {isEditable && (
                <div className="employee-evaluation-action-bar">
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: canSubmit ? "#166534" : "#f1f5f9",
                            display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s"
                        }}>
                            {canSubmit
                                ? <CheckCircleOutlined style={{ color: "#fff", fontSize: 18 }} />
                                : <FileTextOutlined style={{ color: "#64748b", fontSize: 16 }} />}
                        </div>
                        <div>
                            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: 0 }}>Tiến độ đánh giá</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>
                                {scoredCount} / {allLeafCriteria.length} tiêu chí
                            </div>
                        </div>
                    </div>
                    <div className="evaluation-action-bar-spacer" />
                    {remainingCount > 0 && (
                        <Button onClick={handleGoToNextUnscored} style={{ height: 40, borderRadius: 6, fontWeight: 650 }}>
                            Đi tới mục chưa chấm ({remainingCount})
                        </Button>
                    )}
                    <Access permission={ALL_PERMISSIONS.EVALUATION.EMPLOYEE_SUBMIT} hideChildren>
                        <Popconfirm
                            title="Xác nhận nộp đánh giá?"
                            description={hasTemplateStructureError ? "Mẫu đánh giá chưa được cấu hình hợp lệ." : progressPct < 100 ? `Còn ${allLeafCriteria.length - scoredCount} tiêu chí chưa chấm.` : "Sau khi nộp bạn sẽ không thể chỉnh sửa."}
                            onConfirm={canSubmit ? handleSubmit : undefined}
                            okText={canSubmit ? "Nộp ngay" : "Đã hiểu"}
                            cancelText="Hủy"
                            okButtonProps={{ disabled: !canSubmit }}
                        >
                            <Button
                                type="primary"
                                icon={<SendOutlined />}
                                loading={submitting}
                                disabled={!canSubmit}
                                className={canSubmit ? "evaluation-submit-button" : undefined}
                                style={{
                                    borderRadius: 6, fontWeight: 700, height: 42, padding: "0 24px",
                                    border: "none",
                                }}>
                                Nộp bản đánh giá
                            </Button>
                        </Popconfirm>
                    </Access>
                </div>
            )}

            <style>{`
                .employee-evaluation-workspace-header {
                    position: sticky;
                    top: 0;
                    z-index: 20;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    padding: 16px 24px;
                    background: rgba(255, 255, 255, 0.97);
                    border-bottom: 1px solid #e2e8f0;
                    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.04);
                    backdrop-filter: blur(10px);
                }
                .employee-evaluation-workspace-body {
                    width: 100%;
                    max-width: 1680px;
                    margin: 0 auto;
                    padding: 20px 24px 28px;
                    box-sizing: border-box;
                }
                .evaluation-meta-pill {
                    display: inline-flex;
                    align-items: center;
                    min-height: 24px;
                    padding: 2px 9px;
                    color: #475569;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 5px;
                    font-size: 12px;
                    font-weight: 700;
                }
                .evaluation-header-progress {
                    padding: 8px 12px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                }
                .evaluation-score-summary {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    min-height: 50px;
                    padding: 7px 13px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    text-align: center;
                }
                .evaluation-score-summary span {
                    color: #64748b;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                .evaluation-score-summary strong {
                    margin-top: 1px;
                    color: #0f172a;
                    font-size: 18px;
                    line-height: 1.2;
                }
                .evaluation-grade-summary {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    min-height: 50px;
                    padding: 7px 13px;
                    border: 1px solid;
                    border-radius: 6px;
                }
                .evaluation-grade-summary span { font-size: 12px; font-weight: 750; }
                .evaluation-grade-summary strong { font-size: 24px; line-height: 1; }
                .evaluation-header-menu-button {
                    width: 40px;
                    height: 40px;
                    padding: 0;
                    border-radius: 6px;
                    color: #334155;
                }
                .employee-evaluation-action-bar {
                    position: sticky;
                    bottom: 0;
                    z-index: 30;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 11px 24px;
                    background: rgba(255, 255, 255, 0.96);
                    border-top: 1px solid #e2e8f0;
                    box-shadow: 0 -4px 14px rgba(15, 23, 42, 0.07);
                    backdrop-filter: blur(12px);
                }
                .evaluation-action-bar-spacer { flex: 1; }
                .evaluation-submit-button {
                    background: #e8637a !important;
                    border-color: #e8637a !important;
                    box-shadow: 0 4px 12px rgba(232, 99, 122, 0.24) !important;
                }
                .evaluation-submit-button:hover,
                .evaluation-submit-button:focus-visible {
                    background: #d94c66 !important;
                    border-color: #d94c66 !important;
                }
                .evaluation-submit-button:active {
                    background: #c94760 !important;
                    border-color: #c94760 !important;
                    box-shadow: 0 2px 7px rgba(232, 99, 122, 0.2) !important;
                }
                .employee-evaluation-table-shell {
                    scrollbar-color: #cbd5e1 transparent;
                    scrollbar-width: thin;
                }
                .employee-evaluation-table-shell::-webkit-scrollbar { height: 9px; }
                .employee-evaluation-table-shell::-webkit-scrollbar-track { background: #f8fafc; }
                .employee-evaluation-table-shell::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border: 2px solid #f8fafc;
                    border-radius: 8px;
                }
                .employee-evaluation-table th,
                .employee-evaluation-table td { box-sizing: border-box; }
                .evaluation-header-helper {
                    display: block;
                    margin-top: 4px;
                    color: #94a3b8;
                    font-size: 10px;
                    font-weight: 650;
                }
                .evaluation-level-name {
                    display: block;
                    margin-top: 2px;
                    color: #94a3b8;
                    font-size: 10px;
                    font-weight: 650;
                }
                .evaluation-criteria-description {
                    margin-top: 4px;
                    color: #64748b;
                    font-size: 11px;
                    font-style: italic;
                    font-weight: 400;
                }
                .evaluation-weight-badge {
                    flex: 0 0 auto;
                    padding: 2px 7px;
                    color: #475569;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: 750;
                }
                .evaluation-level-empty {
                    color: #cbd5e1;
                    font-style: italic;
                }
                .evaluation-score-picker {
                    width: 160px;
                    max-width: 100%;
                    min-width: 0;
                    margin-left: auto;
                    padding: 4px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    overflow: hidden;
                    transition: border-color 0.16s ease, background-color 0.16s ease, box-shadow 0.16s ease;
                }
                .evaluation-score-picker.is-empty {
                    background: #fff8fa;
                    border-color: #f1b5c0;
                }
                .evaluation-score-picker.has-value {
                    background: #ffffff;
                    border-color: #ead4d9;
                }
                .evaluation-score-picker-options {
                    display: grid;
                    grid-template-columns: repeat(5, minmax(0, 1fr));
                    gap: 3px;
                }
                .evaluation-score-option {
                    width: 100%;
                    min-width: 0;
                    height: 30px;
                    padding: 0;
                    color: #475569;
                    background: transparent;
                    border: 0;
                    border-radius: 4px;
                    font: inherit;
                    font-size: 13px;
                    font-weight: 750;
                    line-height: 30px;
                    cursor: pointer;
                    transition: color 0.14s ease, background-color 0.14s ease, border-color 0.14s ease, transform 0.14s ease;
                }
                .evaluation-score-option:hover:not(:disabled):not(.is-selected) {
                    color: #c94760;
                    background: #fff0f3;
                }
                .evaluation-score-option:active:not(:disabled) { transform: scale(0.96); }
                .evaluation-score-option:focus-visible {
                    outline: 2px solid #e8637a;
                    outline-offset: 1px;
                }
                .evaluation-score-option.is-selected {
                    color: #ffffff;
                    background: #e8637a;
                    box-shadow: 0 2px 5px rgba(232, 99, 122, 0.24);
                }
                .evaluation-score-option:disabled { cursor: wait; }
                .evaluation-score-picker.is-saving .evaluation-score-picker-options { opacity: 0.62; }
                .evaluation-score-result {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    min-height: 34px;
                    margin: 6px -4px -4px;
                    padding: 5px 10px 6px;
                    color: #8491a5;
                    background: #fff7f9;
                    border-top: 1px solid #f5d4da;
                    font-size: 10px;
                    font-weight: 750;
                    line-height: 1;
                    text-align: left;
                    white-space: nowrap;
                }
                .evaluation-score-result strong {
                    color: #d94c66;
                    font-size: 21px;
                    font-weight: 900;
                    line-height: 1;
                    font-variant-numeric: tabular-nums;
                }
                .evaluation-score-result.is-label-only { justify-content: center; }
                .evaluation-score-picker:focus-within {
                    border-color: #e8637a;
                    box-shadow: 0 0 0 2px rgba(232, 99, 122, 0.12);
                }
                .evaluation-score-readout {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 2px;
                    min-height: 58px;
                }
                .evaluation-score-readout > span,
                .evaluation-score-readout > small {
                    color: #94a3b8;
                    font-size: 10px;
                    font-weight: 650;
                }
                .evaluation-score-readout > strong {
                    color: #e8637a;
                    font-size: 20px;
                    line-height: 1.15;
                }
                .evaluation-score-readout.is-final > strong { color: #0f172a; }
                .evaluation-total-cell {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                }
                .evaluation-total-cell span { color: #94a3b8; font-size: 10px; font-weight: 700; }
                .evaluation-total-cell strong { color: #e8637a; font-size: 16px; }
                .evaluation-total-cell.is-final strong { color: #0f172a; }
                @media (max-width: 768px) {
                    .employee-evaluation-workspace-header {
                        align-items: flex-start;
                        padding: 14px 14px;
                    }
                    .employee-evaluation-workspace-body { padding: 14px 10px 24px; }
                    .evaluation-header-progress { display: none; }
                    .employee-evaluation-action-bar {
                        flex-wrap: wrap;
                        padding: 10px 12px;
                    }
                    .evaluation-action-bar-spacer { display: none; }
                    .employee-evaluation-action-bar > button,
                    .employee-evaluation-action-bar .ant-popconfirm-open + button { flex: 1; }
                    .employee-evaluation-table-shell { border-radius: 8px !important; }
                }
            `}</style>
        </div>
    );

};


export default MyEvaluationDetailPage;
