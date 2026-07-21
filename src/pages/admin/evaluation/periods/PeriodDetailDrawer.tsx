import { Modal, Table, Form, Select, Button, Popconfirm, Tag, Empty, Tooltip, DatePicker, Input, InputNumber, Popover } from "antd";
import { useState, useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import useAccess from "@/hooks/useAccess";
import { useAppSelector } from "@/redux/hooks";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { notify } from "@/components/common/notification/notify";
import {
    PlusOutlined,
    DeleteOutlined,
    BookOutlined,
    TeamOutlined,
    UserAddOutlined,
    CalendarOutlined,
    InfoCircleOutlined,
    UserOutlined,
    EditOutlined,
    CheckOutlined,
    CheckCircleOutlined,
    PartitionOutlined,
    SearchOutlined,
    RightOutlined,
} from "@ant-design/icons";
import {
    callFetchTemplatesInPeriod,
    callAddTemplateToPeriod,
    callRemoveTemplateFromPeriod,
    callFetchEmployeesInPeriod,
    callAddEmployeeToPeriod,
    callCancelPeriodEmployee,
    callFetchEvaluationTemplates,
    callFetchUsersCrossCompany,
    callFetchCompany,
    callFetchDepartmentsByCompany,
    callExtendEvaluationRecordDeadline,
    callReassignEvaluators,
} from "@/config/api";
import type { IEvaluationPeriod, IEvaluationTemplate } from "@/types/backend";
import Access from '@/components/share/access';
import { ALL_PERMISSIONS } from '@/config/permissions';
import ManagerPickerModal from "@/pages/admin/user/components/ManagerPickerModal";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";
import UserPickerModal from "@/pages/admin/procedures/components/UserPickerModal";
import type { UserOption } from "@/pages/admin/procedures/components/UserPickerModal";
import SystemAlert from "@/components/common/feedback/SystemAlert";
import ActionButton from "@/components/common/ui/ActionButton";

type DeadlinePhase = "EMPLOYEE" | "MANAGER" | "APPROVAL";

const DEADLINE_PHASE_LABELS: Record<DeadlinePhase, string> = {
    EMPLOYEE: "Nhân viên tự đánh giá",
    MANAGER: "Quản lý trực tiếp chấm",
    APPROVAL: "Quản lý gián tiếp duyệt",
};

const DEADLINE_PHASE_ORDER: DeadlinePhase[] = ["EMPLOYEE", "MANAGER", "APPROVAL"];

const getEditableDeadlinePhases = (phase?: DeadlinePhase) => {
    if (!phase) return [];
    return DEADLINE_PHASE_ORDER.slice(DEADLINE_PHASE_ORDER.indexOf(phase));
};

const getRecordDeadlinePhase = (status?: string): DeadlinePhase => {
    if (["PENDING_MANAGER_REVIEW", "MANAGER_REVIEWING", "REVISION_NEEDED"].includes(status || "")) return "MANAGER";
    if (status === "PENDING_APPROVAL") return "APPROVAL";
    return "EMPLOYEE";
};

const getRecordPhaseDeadline = (record: any, period: IEvaluationPeriod | null, phase = getRecordDeadlinePhase(record?.recordStatus)) => {
    if (phase === "MANAGER") return record?.managerDeadlineOverride ?? period?.managerDeadline;
    if (phase === "APPROVAL") return record?.approvalDeadlineOverride ?? period?.approvalDeadline;
    return record?.employeeDeadlineOverride ?? period?.employeeDeadline;
};

const formatDeadline = (value?: string | null) => value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "—";

const formatDeadlineShift = (current?: string | null, next?: string | null) => {
    if (!current || !next) return "—";
    const currentTime = dayjs(current);
    const nextTime = dayjs(next);
    const diffMinutes = nextTime.diff(currentTime, "minute");
    if (diffMinutes === 0) return "Không đổi";

    const absMinutes = Math.abs(diffMinutes);
    const days = Math.floor(absMinutes / (24 * 60));
    const hours = Math.floor((absMinutes % (24 * 60)) / 60);
    const minutes = absMinutes % 60;
    const parts = [
        days ? `${days} ngày` : null,
        hours ? `${hours} giờ` : null,
        minutes ? `${minutes} phút` : null,
    ].filter(Boolean);
    return `${diffMinutes > 0 ? "+" : "-"}${parts.length ? parts.join(" ") : "1 phút"}`;
};

const getDefaultExtendDeadline = (currentDeadline?: string | null) => {
    const tomorrow = dayjs().add(1, "day").second(0).millisecond(0);
    if (!currentDeadline) return tomorrow;
    const nextByCurrent = dayjs(currentDeadline).add(1, "day").second(0).millisecond(0);
    return nextByCurrent.isAfter(tomorrow) ? nextByCurrent : tomorrow;
};

const getOffsetExtendDeadline = (currentDeadline: string | null | undefined, days = 1, hours = 0) => {
    const base = currentDeadline && dayjs(currentDeadline).isAfter(dayjs())
        ? dayjs(currentDeadline)
        : dayjs();
    return base.add(Math.max(0, days), "day").add(Math.max(0, hours), "hour").second(0).millisecond(0);
};

const isRecordDeadlineOverdue = (record: any, period: IEvaluationPeriod | null) => {
    const deadline = getRecordPhaseDeadline(record, period);
    return !!deadline && dayjs().isAfter(dayjs(deadline));
};

const isRecordExtendable = (record: any, period: IEvaluationPeriod | null) => {
    if (!record?.recordId || !period || period.status === "CLOSED") return false;
    return !["COMPLETED", "CANCELLED"].includes(record?.recordStatus || "");
};

// axios-customize unwraps failed responses to the backend error body.
const getApiErrorMessage = (error: any, fallback: string) => {
    if (typeof error === "string") return error;
    const message = error?.message || error?.response?.data?.message;
    if (message) return Array.isArray(message) ? message.join(", ") : message;
    const detail = error?.error || error?.response?.data?.error;
    if (detail) return Array.isArray(detail) ? detail.join(", ") : detail;
    return fallback;
};
const compactReason = (detail: string) => {
    if (detail.includes("Quản lý gián tiếp không thuộc công ty")) return "Quản lý gián tiếp không thuộc công ty của kỳ";
    if (detail.includes("Quản lý trực tiếp không thuộc công ty")) return "Quản lý trực tiếp không thuộc công ty của kỳ";
    if (detail.includes("Thiếu QL trực tiếp")) return "Thiếu quản lý trực tiếp";
    if (detail.includes("Thiếu QL gián tiếp")) return "Thiếu quản lý gián tiếp";
    return "Tuyến quản lý chưa hợp lệ";
};
const summarizeAssignmentIssues = (count: number, details: string[]) => {
    const reasons = Array.from(new Set(details.map(compactReason)));
    const suffix = reasons.length > 0 ? `: ${reasons.slice(0, 2).join("; ")}` : "";
    return `${count} nhân sự chưa thêm được${suffix}.`;
};
const FULL_WIDTH: CSSProperties = { width: "100%" };
const NO_MARGIN: CSSProperties = { marginBottom: 0 };
interface EmployeeTriggerProps {
    value?: string[];
    onChange?: (value: string[]) => void;
    onClick: () => void;
    loading?: boolean;
}

const EmployeeTrigger: React.FC<EmployeeTriggerProps> = ({ value = [], onClick, loading = false }) => {
    return (
        <div
            onClick={() => {
                if (!loading) onClick();
            }}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                border: "1px solid #f9a8c6",
                borderRadius: "10px",
                background: "#fff7fb",
                cursor: loading ? "wait" : "pointer",
                minHeight: "44px",
                transition: "all 0.2s ease-in-out",
                opacity: loading ? 0.72 : 1,
                boxShadow: "0 8px 18px -14px rgba(232, 53, 109, 0.45)",
            }}
            onMouseEnter={(e) => {
                if (loading) return;
                e.currentTarget.style.borderColor = "#f43f5e";
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(244, 63, 94, 0.08)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#f9a8c6";
                e.currentTarget.style.background = "#fff7fb";
                e.currentTarget.style.boxShadow = "0 8px 18px -14px rgba(232, 53, 109, 0.45)";
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <UserAddOutlined style={{ color: "#e8356d", fontSize: "15px" }} />
                <span style={{ color: "#0f172a", fontSize: "13.5px", fontWeight: 700 }}>
                    {loading
                        ? "Đang thêm nhân sự..."
                        : value.length
                            ? `Đã chọn ${value.length} nhân sự`
                            : "Chọn nhân sự áp dụng mẫu"}
                </span>
            </div>
            <span style={{ color: "#e8356d", fontSize: "13px", fontWeight: 700 }}>Chọn & thêm</span>
        </div>
    );
};

interface IProps {
    open: boolean;
    onClose: () => void;
    period: IEvaluationPeriod | null;
    readOnly?: boolean;
    onActivate?: (periodId: number) => Promise<IEvaluationPeriod | void>;
    onEditPeriod?: (period: IEvaluationPeriod) => void;
}

interface DepartmentPickerProps {
    departments: any[];
    value: number[];
    onChange: (value: number[]) => void;
    disabled?: boolean;
    emptyLabel?: string;
    onTriggerClick?: () => void;
}

const DepartmentPicker: React.FC<DepartmentPickerProps> = ({ departments, value = [], onChange, disabled = false, emptyLabel = "Tất cả phòng ban", onTriggerClick }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [visible, setVisible] = useState(false);

    const handleOpenChange = (openVal: boolean) => {
        setVisible(openVal);
        if (openVal && onTriggerClick) {
            onTriggerClick();
        }
    };

    // Filter departments based on search query
    const filteredDepts = useMemo(() => {
        if (!searchQuery.trim()) return departments;
        const q = searchQuery.toLowerCase();
        return departments.filter(d => d.name?.toLowerCase().includes(q));
    }, [departments, searchQuery]);

    const handleToggle = (id: number) => {
        const index = value.indexOf(id);
        if (index > -1) {
            onChange(value.filter(v => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    const handleSelectAll = () => {
        onChange(departments.map(d => d.id));
    };

    const handleClearAll = () => {
        onChange([]);
    };

    // Trigger text representation
    const triggerLabel = useMemo(() => {
        if (value.length === 0) return emptyLabel;
        if (value.length === departments.length) return "Tất cả phòng ban";
        if (value.length === 1) {
            const found = departments.find(d => d.id === value[0]);
            return found ? found.name : `Đã chọn 1 phòng ban`;
        }
        return `Đã chọn ${value.length} phòng ban`;
    }, [value, departments, emptyLabel]);

    const popoverContent = (
        <div style={{ width: 280, display: "flex", flexDirection: "column", gap: 8 }}>
            <Input
                placeholder="Tìm kiếm phòng ban..."
                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                size="small"
                allowClear
                style={{ borderRadius: 6 }}
            />
            
            <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 4px", borderBottom: "1px solid #f1f5f9", paddingBottom: 6 }}>
                <span 
                    onClick={handleSelectAll} 
                    style={{ fontSize: 11, color: "#e8356d", cursor: "pointer", fontWeight: 500 }}
                >
                    Chọn tất cả
                </span>
                <span 
                    onClick={handleClearAll} 
                    style={{ fontSize: 11, color: "#64748b", cursor: "pointer", fontWeight: 500 }}
                >
                    Bỏ chọn tất cả
                </span>
            </div>

            <div className="custom-scrollbar" style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 1 }}>
                {filteredDepts.length === 0 ? (
                    <div style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontSize: 12 }}>
                        Không tìm thấy phòng ban
                    </div>
                ) : (
                    filteredDepts.map(d => {
                        const isSelected = value.includes(d.id);
                        return (
                            <div
                                key={d.id}
                                onClick={() => handleToggle(d.id)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "6px 8px",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                    background: isSelected ? "#f8fafc" : "transparent",
                                    transition: "all 0.15s ease"
                                }}
                                onMouseEnter={e => {
                                    if (!isSelected) e.currentTarget.style.background = "#f1f5f9";
                                }}
                                onMouseLeave={e => {
                                    if (!isSelected) e.currentTarget.style.background = "transparent";
                                }}
                            >
                                <span style={{ 
                                    fontSize: 12.5, 
                                    color: isSelected ? "#0f172a" : "#334155",
                                    fontWeight: isSelected ? 600 : 400,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: "85%"
                                }}>
                                    {d.name}
                                </span>
                                {isSelected && <CheckOutlined style={{ color: "#e8356d", fontSize: 11 }} />}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    const triggerNode = (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 14px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                background: disabled ? "#f1f5f9" : "#ffffff",
                cursor: disabled ? "not-allowed" : "pointer",
                minHeight: "40px",
                transition: "all 0.2s ease-in-out",
                opacity: disabled ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
                if (!disabled) {
                    e.currentTarget.style.borderColor = "#e8356d";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(232, 53, 109, 0.06)";
                }
            }}
            onMouseLeave={(e) => {
                if (!disabled) {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.boxShadow = "none";
                }
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                <PartitionOutlined style={{ color: value.length ? "#e8356d" : "#94a3b8", fontSize: "14px" }} />
                <span style={{ 
                    color: value.length ? "#0f172a" : "#64748b", 
                    fontSize: "13px", 
                    fontWeight: value.length ? 600 : 400,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                }}>
                    {triggerLabel}
                </span>
            </div>
            {!disabled && <span style={{ color: "#e8356d", fontSize: "12px", fontWeight: 600, marginLeft: 8 }}>Chọn</span>}
        </div>
    );

    if (disabled) return triggerNode;

    return (
        <Popover
            content={popoverContent}
            trigger="click"
            open={visible}
            onOpenChange={handleOpenChange}
            placement="bottomLeft"
            overlayStyle={{ padding: 0 }}
            overlayInnerStyle={{ borderRadius: 10, padding: 10, boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)" }}
        >
            {triggerNode}
        </Popover>
    );
};

const PeriodDetailDrawer = (props: IProps) => {
    const { open, onClose, period, readOnly = false, onActivate, onEditPeriod } = props;
    const roleName = useAppSelector(state => state.account.user.role?.name?.toUpperCase() || "");
    const isSuperAdmin = roleName === "SUPER_ADMIN";
    const canUpdatePeriod = useAccess(ALL_PERMISSIONS.EVALUATION.UPDATE_PERIOD);
    const canActivatePeriod = useAccess(ALL_PERMISSIONS.EVALUATION.ACTIVATE_PERIOD);
    const canExtendDeadline = useAccess(ALL_PERMISSIONS.EVALUATION.EXTEND_RECORD_DEADLINE);
    const canReassignEvaluator = useAccess(ALL_PERMISSIONS.EVALUATION.REASSIGN_EVALUATOR);
    const canCancelEmployee = useAccess(ALL_PERMISSIONS.EVALUATION.CANCEL_PERIOD_EMPLOYEE);

    const customTagRender = (tagProps: any) => {
        const { label, closable, onClose } = tagProps;
        const onPreventMouseDown = (event: React.MouseEvent<HTMLSpanElement>) => {
            event.preventDefault();
            event.stopPropagation();
        };
        return (
            <Tag
                onMouseDown={onPreventMouseDown}
                closable={closable}
                onClose={onClose}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    marginRight: 4,
                    marginTop: 2,
                    marginBottom: 2,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    fontWeight: 500,
                }}
            >
                {label}
            </Tag>
        );
    };

    // Form instances
    const [templateForm] = Form.useForm();
    const [employeeForm] = Form.useForm();
    const [extendForm] = Form.useForm();
    const selectedEmployeeIds = Form.useWatch("employeeId", employeeForm);
    const extendDeadlineValue = Form.useWatch("deadline", extendForm);
    const extendCascadeEnabled = Form.useWatch("cascade", extendForm);
    const extendOffsetDays = Form.useWatch("offsetDays", extendForm);
    const extendOffsetHours = Form.useWatch("offsetHours", extendForm);

    // Data states
    const [extendModalOpen, setExtendModalOpen] = useState(false);
    const [selectedEmployeeForExtend, setSelectedEmployeeForExtend] = useState<any>(null);
    const [extending, setExtending] = useState(false);
    const [extendDeadlineMode, setExtendDeadlineMode] = useState<"SHARED" | "CUSTOM">("SHARED");
    const [extendInputMode, setExtendInputMode] = useState<"DATE" | "OFFSET">("DATE");
    const [extendStrategy, setExtendStrategy] = useState<"CASCADE" | "PHASE_CUSTOM">("CASCADE");
    const [customExtendDeadlines, setCustomExtendDeadlines] = useState<Record<string, Dayjs | null>>({});
    const [phaseCustomDeadlines, setPhaseCustomDeadlines] = useState<Partial<Record<DeadlinePhase, Dayjs | null>>>({});

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const [reassignForm] = Form.useForm();
    const [reassignModalOpen, setReassignModalOpen] = useState(false);
    const [selectedEmployeeForReassign, setSelectedEmployeeForReassign] = useState<any>(null);
    const [selectedReassignEvaluator, setSelectedReassignEvaluator] = useState<any>(null);
    const [managerPickerOpen, setManagerPickerOpen] = useState(false);
    const [employeePickerOpen, setEmployeePickerOpen] = useState(false);
    const [reassigning, setReassigning] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [linkedTemplates, setLinkedTemplates] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [linkedEmployees, setLinkedEmployees] = useState<any[]>([]);
    const [activeTemplates, setActiveTemplates] = useState<IEvaluationTemplate[]>([]);
    // Pool nhân viên cho ô "Nhân viên tham gia": lọc theo công ty + phòng ban ở phía server.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [employeePool, setEmployeePool] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const referenceDataPeriodIdRef = useRef<number | null>(null);

    const extendRecordRows = useMemo(() => {
        if (!selectedEmployeeForExtend) return [];
        if (Array.isArray(selectedEmployeeForExtend.records) && selectedEmployeeForExtend.records.length > 0) {
            return selectedEmployeeForExtend.records;
        }
        return [selectedEmployeeForExtend];
    }, [selectedEmployeeForExtend]);

    const extendPreview = useMemo(() => {
        if (!selectedEmployeeForExtend?.phase || !period) return null;

        const selectedPhase = selectedEmployeeForExtend.phase as DeadlinePhase;
        const currentDeadline = getRecordPhaseDeadline(selectedEmployeeForExtend, period, selectedPhase);
        const offsetDays = Number(extendOffsetDays ?? 1);
        const offsetHours = Number(extendOffsetHours ?? 0);
        const chosenDeadline = extendInputMode === "OFFSET"
            ? getOffsetExtendDeadline(currentDeadline, offsetDays, offsetHours)
            : extendDeadlineValue
                ? dayjs(extendDeadlineValue)
                : null;
        const shouldCascade = Boolean(extendStrategy === "CASCADE" && extendCascadeEnabled && chosenDeadline && currentDeadline && chosenDeadline.isAfter(dayjs(currentDeadline)));
        const cascadeShiftMs = shouldCascade && currentDeadline && chosenDeadline
            ? chosenDeadline.diff(dayjs(currentDeadline))
            : 0;

        const phaseRows = DEADLINE_PHASE_ORDER.map((phaseKey) => {
            const phaseCurrent = getRecordPhaseDeadline(selectedEmployeeForExtend, period, phaseKey);
            let projected = phaseCurrent;
            let cascadeState: "selected" | "cascade" | "custom" | "none" = "none";

            if (extendStrategy === "PHASE_CUSTOM" && phaseCustomDeadlines[phaseKey]) {
                projected = phaseCustomDeadlines[phaseKey]?.toISOString();
                cascadeState = phaseKey === selectedPhase ? "selected" : "custom";
            } else if (phaseKey === selectedPhase) {
                projected = chosenDeadline ? chosenDeadline.toISOString() : phaseCurrent;
                cascadeState = "selected";
            } else if (chosenDeadline && shouldCascade) {
                if (selectedPhase === "EMPLOYEE" && (phaseKey === "MANAGER" || phaseKey === "APPROVAL")) {
                    projected = phaseCurrent ? dayjs(phaseCurrent).add(cascadeShiftMs, "millisecond").toISOString() : phaseCurrent;
                    cascadeState = "cascade";
                }
                if (selectedPhase === "MANAGER" && phaseKey === "APPROVAL") {
                    projected = phaseCurrent ? dayjs(phaseCurrent).add(cascadeShiftMs, "millisecond").toISOString() : phaseCurrent;
                    cascadeState = "cascade";
                }
            }

            return {
                phase: phaseKey,
                label: DEADLINE_PHASE_LABELS[phaseKey],
                current: phaseCurrent,
                projected,
                cascadeState,
            };
        });

        const bulkRows = extendRecordRows.map((record: any) => {
            const recordId = record.recordId ?? record.id ?? record.employee?.id ?? record.employee?.username ?? record.name;
            const recordCurrent = getRecordPhaseDeadline(record, period, selectedPhase);
            const customDeadline = customExtendDeadlines[String(recordId)] ?? null;
            const chosen = extendDeadlineMode === "CUSTOM"
                ? customDeadline
                : extendInputMode === "OFFSET"
                    ? getOffsetExtendDeadline(recordCurrent, offsetDays, offsetHours)
                    : chosenDeadline;
            const recordChosen = chosen ? chosen.toISOString() : recordCurrent;
            const recordShouldCascade = Boolean(extendCascadeEnabled && chosen && recordCurrent && chosen.isAfter(dayjs(recordCurrent)));
            return {
                id: recordId,
                name: record.employee?.name || record.employee?.username || `Hồ sơ ${record.recordId ?? record.id}`,
                current: recordCurrent,
                next: recordChosen,
                shift: formatDeadlineShift(recordCurrent, recordChosen),
                cascade: recordShouldCascade && selectedPhase !== "APPROVAL",
            };
        });

        return {
            currentDeadline,
            chosenDeadline: extendDeadlineValue ? dayjs(extendDeadlineValue).toISOString() : null,
            shouldCascade,
            phaseRows,
            bulkRows,
            recordCount: extendRecordRows.length,
        };
    }, [customExtendDeadlines, extendCascadeEnabled, extendDeadlineMode, extendDeadlineValue, extendInputMode, extendOffsetDays, extendOffsetHours, extendRecordRows, extendStrategy, period, phaseCustomDeadlines, selectedEmployeeForExtend]);

    // Loading states
    const [, setLoadingTemplates] = useState(false);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [submittingTemplate, setSubmittingTemplate] = useState(false);
    const [removingTemplateId, setRemovingTemplateId] = useState<number | null>(null);
    const [submittingEmployee, setSubmittingEmployee] = useState(false);
    const [activatingPeriod, setActivatingPeriod] = useState(false);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [loadingAssignmentReferenceData, setLoadingAssignmentReferenceData] = useState(false);

    // Fetch initial templates & users on open
    useEffect(() => {
        if (open && period?.id) {
            fetchLinkedTemplates();
            fetchLinkedEmployees();
            referenceDataPeriodIdRef.current = null;
            const companyId = period.company?.id ?? null;
            setSelectedCompanyId(companyId);
            setSelectedDepartmentIds([]);
            setDepartments([]);
            if (companyId) {
                void loadDepartments(companyId);
                void loadEmployeePool(companyId, []);
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, period]);

    const loadCompanies = async () => {
        try {
            const res = await callFetchCompany("page=1&size=100&sort=name,asc");
            if (res?.data?.result) {
                setCompanies(res.data.result);
            }
        } catch {
            // ignore
        }
    };

    // Pool nhân viên: lọc theo công ty + danh sách phòng ban ở phía server (subquery UserPosition).
    const loadEmployeePool = async (companyId: number | null, departmentIds: number[]) => {
        if (!companyId) return;
        try {
            const parts = ["page=1", "size=500"];
            parts.push(`companyId=${companyId}`);
            if (departmentIds && departmentIds.length > 0) {
                departmentIds.forEach(id => parts.push(`departmentIds=${id}`));
            }
            const res = await callFetchUsersCrossCompany(parts.join("&"));
            if (res?.data?.result) setEmployeePool(res.data.result);
        } catch {
            // ignore
        }
    };

    // res.data đã được interceptor unwrap về mảng ở runtime; typing khai báo là wrapper nên dùng any.
    const loadDepartments = async (companyId: number) => {
        try {
            const res: any = await callFetchDepartmentsByCompany(companyId); // eslint-disable-line @typescript-eslint/no-explicit-any
            if (res?.data) setDepartments(res.data);
        } catch {
            // ignore
        }
    };

    const handleCompanyFilterChange = async (value: number | null) => {
        setSelectedCompanyId(value);
        setSelectedDepartmentIds([]);
        setDepartments([]);
        await Promise.all([
            loadEmployeePool(value, []),
            value ? loadDepartments(value) : Promise.resolve(),
        ]);
    };

    const handleDepartmentFilterChange = async (values: number[]) => {
        setSelectedDepartmentIds(values);
        await loadEmployeePool(period?.company?.id ?? selectedCompanyId, values);
    };

    const assignedEmployeeIdsInPeriod = useMemo(() => {
        return new Set(
            linkedEmployees
                .filter(emp => emp.status === "ACTIVE" && emp.employee?.id)
                .map(emp => String(emp.employee.id))
        );
    }, [linkedEmployees]);

    const pickerSourceUsers = useMemo(() => {
        return employeePool
            .filter(user => user.active !== false && !assignedEmployeeIdsInPeriod.has(String(user.id)))
            .map((user): UserOption => ({
                value: String(user.id),
                name: user.name ?? "",
                email: user.email ?? "",
                department: user.departmentName || user.department?.name,
                departmentId: user.departmentId || user.department?.id,
                jobTitle: user.jobTitle,
                positionLevel: user.positionLevel,
                company: user.companyName || user.company?.name,
                directManagerId: user.directManagerId || user.directManager?.id,
                directManagerName: user.directManagerName || user.directManager?.name,
                directManagerCompanyIds: user.directManagerCompanyIds || user.directManager?.companyIds,
                indirectManagerId: user.indirectManagerId || user.indirectManager?.id,
                indirectManagerName: user.indirectManagerName || user.indirectManager?.name,
                indirectManagerCompanyIds: user.indirectManagerCompanyIds || user.indirectManager?.companyIds,
            }));
    }, [assignedEmployeeIdsInPeriod, employeePool]);

    const handlePickerChange = async (ids: string[]) => {
        employeeForm.setFieldsValue({ employeeId: ids });
        await assignEmployees(ids);
    };

    // Khi kỳ đã gắn sẵn công ty, danh sách `companies` không được nạp (Select bị disabled),
    // nên bổ sung option của công ty kỳ để hiển thị đúng tên thay vì trơ id.
    const companyFilterOptions = useMemo(() => {
        if (companies.length > 0) return companies.map(c => ({ label: c.name, value: c.id }));
        if (period?.company?.id) return [{ label: period.company.name, value: period.company.id }];
        return [];
    }, [companies, period?.company?.id, period?.company?.name]);

    const fetchLinkedTemplates = async () => {
        if (!period?.id) return;
        setLoadingTemplates(true);
        try {
            const res = await callFetchTemplatesInPeriod(period.id);
            const data = res?.data;
            if (data) {
                setLinkedTemplates(data);
                if (data.length > 0) {
                    setSelectedTemplateId(prev => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const exists = data.some((t: any) => t.template?.id === prev);
                        return exists ? prev : data[0].template?.id;
                    });
                } else {
                    setSelectedTemplateId(null);
                }
            }
        } catch {
            notify.error("Không thể tải danh sách biểu mẫu trong kỳ");
        } finally {
            setLoadingTemplates(false);
        }
    };

    const fetchLinkedEmployees = async () => {
        if (!period?.id) return;
        setLoadingEmployees(true);
        setSelectedRowKeys([]); // Reset selected rows on reload
        try {
            const res = await callFetchEmployeesInPeriod(period.id);
            if (res?.data) {
                setLinkedEmployees(res.data);
            }
        } catch {
            notify.error("Không thể tải danh sách nhân sự tham gia");
        } finally {
            setLoadingEmployees(false);
        }
    };

    const loadActiveTemplates = async () => {
        try {
            const res = await callFetchEvaluationTemplates("page=1&size=100&filter=status='ACTIVE'");
            if (res?.data?.result) {
                const periodCompanyId = period?.company?.id;
                const filtered = periodCompanyId
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ? res.data.result.filter((t: any) => t.company?.id === periodCompanyId)
                    : res.data.result;
                setActiveTemplates(filtered);
            }
        } catch {
            // ignore
        }
    };

    const loadAssignmentReferenceData = async () => {
        if (!period?.id || period.status !== "DRAFT" || referenceDataPeriodIdRef.current === period.id) return;

        referenceDataPeriodIdRef.current = period.id;
        const companyId = period.company?.id ?? null;
        setLoadingAssignmentReferenceData(true);
        try {
            await Promise.all([
                loadActiveTemplates(),
                loadEmployeePool(companyId, selectedDepartmentIds),
                companyId ? loadDepartments(companyId) : loadCompanies(),
            ]);
        } finally {
            setLoadingAssignmentReferenceData(false);
        }
    };

    const handleActivatePeriodInDrawer = async () => {
        if (!period?.id || !onActivate) return;
        setActivatingPeriod(true);
        try {
            await onActivate(period.id);
            onClose();
        } finally {
            setActivatingPeriod(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAddTemplate = async (values: any) => {
        if (!period?.id) return;
        setSubmittingTemplate(true);
        try {
            const res = await callAddTemplateToPeriod(period.id, values.templateId);
            if (res?.data) {
                notify.success("Liên kết biểu mẫu thành công");
                templateForm.resetFields();
                setSelectedTemplateId(values.templateId);
                fetchLinkedTemplates();
            }
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            const msg = getApiErrorMessage(error, "Lỗi liên kết biểu mẫu");
            notify.error(msg);
        } finally {
            setSubmittingTemplate(false);
        }
    };

    const handleRemoveTemplate = async (templateId: number) => {
        if (!period?.id || removingTemplateId !== null) return;

        setRemovingTemplateId(templateId);
        try {
            await callRemoveTemplateFromPeriod(period.id, templateId);
            notify.success("Đã gỡ mẫu khỏi kỳ đánh giá", { id: "remove-period-template" });
            await fetchLinkedTemplates();
        } catch (error: any) {
            notify.error(getApiErrorMessage(error, "Không thể gỡ mẫu khỏi kỳ đánh giá"), { id: "remove-period-template" });
        } finally {
            setRemovingTemplateId(null);
        }
    };

    const assignEmployees = async (employeeIds: string[]) => {
        if (submittingEmployee) return;
        if (!period?.id || !selectedTemplateId) return;
        if (employeeIds.length === 0) return;

        // Mỗi nhân viên dùng quản lý trực tiếp riêng đã gắn sẵn trong hồ sơ.
        // Ai chưa cấu hình đầy đủ quản lý trực tiếp và gián tiếp thì không gán được.
        const toAssign: { id: string; managerId: string }[] = [];
        const skipped: string[] = [];
        const periodCompanyId = period.company?.id;
        for (const empId of employeeIds) {
            const emp = employeePool.find(u => u.id === empId);
            const directManagerId = emp?.directManagerId || emp?.directManager?.id;
            const indirectManagerId = emp?.indirectManagerId || emp?.indirectManager?.id;
            const directManagerCompanyIds = emp?.directManagerCompanyIds || emp?.directManager?.companyIds;
            const indirectManagerCompanyIds = emp?.indirectManagerCompanyIds || emp?.indirectManager?.companyIds;
            const directManagerWrongCompany = periodCompanyId && directManagerCompanyIds?.length && !directManagerCompanyIds.includes(periodCompanyId);
            const indirectManagerWrongCompany = periodCompanyId && indirectManagerCompanyIds?.length && !indirectManagerCompanyIds.includes(periodCompanyId);
            if (directManagerId && indirectManagerId && !directManagerWrongCompany && !indirectManagerWrongCompany) {
                toAssign.push({ id: empId, managerId: directManagerId });
            } else {
                const name = emp?.name || empId;
                const reason = !directManagerId
                    ? "Thiếu QL trực tiếp"
                    : !indirectManagerId
                        ? "Thiếu QL gián tiếp"
                        : directManagerWrongCompany
                            ? "Quản lý trực tiếp không thuộc công ty"
                            : "Quản lý gián tiếp không thuộc công ty";
                skipped.push(`${name} (${reason})`);
            }
        }

        if (toAssign.length === 0) {
            console.warn("[evaluation-period] skipped employees", skipped);
            notify.warning("Không có nhân sự nào đủ điều kiện thêm. Vui lòng kiểm tra tuyến quản lý trong hồ sơ.", { id: "add-employee-warn" });
            return;
        }

        setSubmittingEmployee(true);
        try {
            let successCount = 0;
            const failed: string[] = [];
            for (const { id: empId, managerId } of toAssign) {
                try {
                    await callAddEmployeeToPeriod(period.id, {
                        employeeId: empId,
                        directManagerId: managerId,
                        templateId: selectedTemplateId,
                    });
                    successCount++;
                } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                    const empName = employeePool.find(u => u.id === empId)?.name || empId;
                    failed.push(`${empName}: ${getApiErrorMessage(error, "lỗi")}`);
                }
            }
            if (successCount > 0) {
                notify.success(`Đã thêm ${successCount} nhân viên vào kỳ`, { id: "add-employee-success" });
                employeeForm.resetFields(["employeeId"]);
                setEmployeePickerOpen(false);
                fetchLinkedEmployees();
            }
            if (skipped.length > 0) {
                console.warn("[evaluation-period] skipped employees", skipped);
                notify.warning(summarizeAssignmentIssues(skipped.length, skipped), { id: "add-employee-skipped" });
            }
            if (failed.length > 0) {
                console.warn("[evaluation-period] failed employees", failed);
                notify.warning(summarizeAssignmentIssues(failed.length, failed), { id: "add-employee-failed" });
            }
        } finally {
            setSubmittingEmployee(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAddEmployee = async (values: any) => {
        const employeeIds: string[] = Array.isArray(values.employeeId) ? values.employeeId : [values.employeeId];
        await assignEmployees(employeeIds.filter(Boolean));
    };

    const handleCancelEmployee = async (id: number) => {
        try {
            const res = await callCancelPeriodEmployee(id);
            if (res?.data) {
                notify.success("Đã gỡ nhân viên khỏi kỳ đánh giá", { id: "cancel-employee" });
                fetchLinkedEmployees();
            }
        } catch {
            notify.error("Không thể gỡ nhân viên khỏi kỳ", { id: "cancel-employee" });
        }
    };

    const handleOpenExtendModal = (record: any) => {
        if (!isRecordExtendable(record, period)) {
            notify.warning("Chỉ có thể gia hạn hồ sơ đang trong kỳ hoạt động và chưa hoàn tất");
            return;
        }
        const phase = getRecordDeadlinePhase(record.recordStatus);
        const currentDeadline = getRecordPhaseDeadline(record, period, phase);
        const defaultDeadline = getDefaultExtendDeadline(currentDeadline);
        const recordKey = String(record.recordId ?? record.id ?? record.employee?.id ?? record.employee?.username ?? record.name);
        setSelectedEmployeeForExtend({
            ...record,
            phase,
            currentDeadline,
            records: [record],
        });
        extendForm.resetFields();
        extendForm.setFieldsValue({
            cascade: true,
            deadline: defaultDeadline,
            offsetDays: 1,
            offsetHours: 0,
        });
        setExtendDeadlineMode("SHARED");
        setExtendInputMode("DATE");
        setExtendStrategy("CASCADE");
        setCustomExtendDeadlines({
            [recordKey]: defaultDeadline,
        });
        const initialPhaseDeadlines: Partial<Record<DeadlinePhase, Dayjs | null>> = {};
        getEditableDeadlinePhases(phase).forEach(phaseKey => {
            const phaseDeadline = phaseKey === phase ? defaultDeadline : getRecordPhaseDeadline(record, period, phaseKey);
            initialPhaseDeadlines[phaseKey] = phaseDeadline ? dayjs(phaseDeadline) : null;
        });
        setPhaseCustomDeadlines(initialPhaseDeadlines);
        setExtendModalOpen(true);
    };

    const handleExtendDeadlineSubmit = async (values: any) => {
        if (!selectedEmployeeForExtend) return;
        const recordIds = selectedEmployeeForExtend.isBulk
            ? selectedEmployeeForExtend.recordId
            : [selectedEmployeeForExtend.recordId];

        if (!recordIds || recordIds.length === 0) return;

        const offsetDays = Number(values.offsetDays ?? 1);
        const offsetHours = Number(values.offsetHours ?? 0);
        const firstCustomDeadline = extendRecordRows
            .map((record: any) => customExtendDeadlines[String(record.recordId)] ?? null)
            .find(Boolean);
        const selectedPhase = selectedEmployeeForExtend.phase as DeadlinePhase;
        const selectedPhaseCustomDeadline = phaseCustomDeadlines[selectedPhase] ?? null;
        const usePhaseCustom = extendStrategy === "PHASE_CUSTOM" && !selectedEmployeeForExtend.isBulk;
        const baseTargetDeadline = usePhaseCustom && selectedPhaseCustomDeadline
            ? selectedPhaseCustomDeadline
            : extendDeadlineMode === "CUSTOM" && firstCustomDeadline
            ? firstCustomDeadline
            : extendInputMode === "OFFSET"
            ? getOffsetExtendDeadline(selectedEmployeeForExtend.currentDeadline, offsetDays, offsetHours)
            : values.deadline;
        if (!baseTargetDeadline) {
            notify.warning("Vui lòng chọn hạn chót mới");
            return;
        }

        const customDeadlinePayload = extendDeadlineMode === "CUSTOM"
            ? extendRecordRows
                .map((record: any) => {
                    const recordId = record.recordId;
                    const picked = customExtendDeadlines[String(recordId)] ?? null;
                    return recordId && picked ? { recordId: Number(recordId), deadline: picked.toISOString() } : null;
                })
                .filter(Boolean)
            : extendInputMode === "OFFSET" && extendRecordRows.length > 1
                ? extendRecordRows
                    .map((record: any) => {
                        const recordId = record.recordId;
                        const current = getRecordPhaseDeadline(record, period, selectedEmployeeForExtend.phase as DeadlinePhase);
                        const picked = getOffsetExtendDeadline(current, offsetDays, offsetHours);
                        return recordId ? { recordId: Number(recordId), deadline: picked.toISOString() } : null;
                    })
                    .filter(Boolean)
            : undefined;

        const phaseDeadlinePayload = usePhaseCustom
            ? getEditableDeadlinePhases(selectedPhase)
                .filter(phaseKey => phaseKey !== selectedPhase)
                .map(phaseKey => {
                    const picked = phaseCustomDeadlines[phaseKey] ?? null;
                    return picked ? { phase: phaseKey, deadline: picked.toISOString() } : null;
                })
                .filter(Boolean)
            : undefined;

        setExtending(true);
        try {
            const res = await callExtendEvaluationRecordDeadline({
                recordIds,
                phase: selectedEmployeeForExtend.phase,
                deadline: baseTargetDeadline.toISOString(),
                recordDeadlines: customDeadlinePayload as any,
                phaseDeadlines: phaseDeadlinePayload as any,
                reason: values.reason,
                cascade: usePhaseCustom ? false : values.cascade,
            });
            if (res?.data) {
                notify.success("Gia hạn thành công.");
                setExtendModalOpen(false);
                setSelectedEmployeeForExtend(null);
                setExtendDeadlineMode("SHARED");
                setExtendInputMode("DATE");
                setExtendStrategy("CASCADE");
                setCustomExtendDeadlines({});
                setPhaseCustomDeadlines({});
                setSelectedRowKeys([]);
                fetchLinkedEmployees();
            }
        } catch (error: any) {
            const msg = getApiErrorMessage(error, "Lỗi gia hạn bản đánh giá");
            notify.error(msg);
        } finally {
            setExtending(false);
        }
    };

    const handleBulkExtend = () => {
        const selectedRecords = employeesForSelectedTemplate.filter(e => selectedRowKeys.includes(e.id));
        const eligibleRecords = selectedRecords.filter(record => isRecordExtendable(record, period));
        const recordIds = eligibleRecords.map(e => e.recordId).filter(Boolean);
        
        if (eligibleRecords.length !== selectedRecords.length || recordIds.length === 0) {
            notify.warning("Chỉ chọn các hồ sơ đang xử lý và chưa hoàn tất để gia hạn hàng loạt");
            return;
        }

        const phases = Array.from(new Set(eligibleRecords.map(record => getRecordDeadlinePhase(record.recordStatus))));
        if (phases.length !== 1) {
            notify.warning("Gia hạn hàng loạt chỉ áp dụng cho các hồ sơ cùng một bước xử lý");
            return;
        }

        const phase = phases[0];
        const currentDeadlines = eligibleRecords
            .map(record => getRecordPhaseDeadline(record, period, phase))
            .filter(Boolean)
            .map(value => dayjs(value));
        const latestDeadline = currentDeadlines.reduce((latest, value) => value.isAfter(latest) ? value : latest);
        const defaultDeadline = getDefaultExtendDeadline(latestDeadline.toISOString());

        setSelectedEmployeeForExtend({
            employee: { name: `${recordIds.length} nhân sự đã chọn` },
            recordId: recordIds,
            isBulk: true,
            phase,
            currentDeadline: latestDeadline.toISOString(),
            records: eligibleRecords,
        });
        extendForm.resetFields();
        extendForm.setFieldsValue({
            cascade: true,
            deadline: defaultDeadline,
            offsetDays: 1,
            offsetHours: 0,
        });
        const initialCustomDeadlines: Record<string, Dayjs | null> = {};
        eligibleRecords.forEach(record => {
            const key = String(record.recordId ?? record.id ?? record.employee?.id ?? record.employee?.username ?? record.name);
            initialCustomDeadlines[key] = defaultDeadline;
        });
        setExtendDeadlineMode("SHARED");
        setExtendInputMode("DATE");
        setExtendStrategy("CASCADE");
        setCustomExtendDeadlines(initialCustomDeadlines);
        setPhaseCustomDeadlines({});
        setExtendModalOpen(true);
    };

    const handleBulkCancel = async () => {
        try {
            const results = await Promise.allSettled(
                selectedRowKeys.map(id => callCancelPeriodEmployee(Number(id)))
            );
            
            const rejected = results.filter((r) => r.status === 'rejected');
            if (rejected.length > 0) {
                const errorMessages = rejected.map((r: any) => 
                    r.reason?.response?.data?.message || r.reason?.message || "Không xác định được nguyên nhân"
                );
                const uniqueErrors = Array.from(new Set(errorMessages));
                notify.error(`Không thể gỡ ${rejected.length}/${selectedRowKeys.length} nhân viên. Nguyên nhân: ${uniqueErrors.join(", ")}`, { id: "bulk-cancel" });
            } else {
                notify.success("Đã gỡ các nhân viên đã chọn khỏi kỳ", { id: "bulk-cancel" });
            }

            setSelectedRowKeys([]);
            fetchLinkedEmployees();
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            notify.error("Không thể gỡ các nhân sự đã chọn. Vui lòng thử lại.", { id: "bulk-cancel" });
        }
    };

    const handleOpenReassignModal = (record: any) => {
        setSelectedEmployeeForReassign(record);
        setSelectedReassignEvaluator(null);
        setManagerPickerOpen(false);
        reassignForm.resetFields();
        setReassignModalOpen(true);
    };

    const handleBulkReassign = () => {
        const selectedRecords = employeesForSelectedTemplate.filter(e => selectedRowKeys.includes(e.id));
        const recordIds = selectedRecords.map(e => e.recordId).filter(Boolean);
        
        if (recordIds.length === 0) {
            notify.warning("Không tìm thấy mã bản ghi hợp lệ.");
            return;
        }

        setSelectedEmployeeForReassign({
            employee: { name: `${recordIds.length} nhân sự đã chọn` },
            recordId: recordIds,
            isBulk: true
        });
        setSelectedReassignEvaluator(null);
        setManagerPickerOpen(false);
        reassignForm.resetFields();
        setReassignModalOpen(true);
    };

    const handleSelectReassignEvaluator = (user: any) => {
        setSelectedReassignEvaluator(user);
        reassignForm.setFieldValue("newEvaluatorUserId", String(user.id));
        setManagerPickerOpen(false);
    };

    const handleReassignSubmit = async (values: any) => {
        if (!selectedEmployeeForReassign) return;
        const recordIds = selectedEmployeeForReassign.isBulk
            ? selectedEmployeeForReassign.recordId
            : [selectedEmployeeForReassign.recordId];

        if (!recordIds || recordIds.length === 0) return;
        setReassigning(true);
        try {
            const res = await callReassignEvaluators({
                recordIds,
                evaluatorRole: values.evaluatorRole,
                newEvaluatorUserId: values.newEvaluatorUserId,
                reason: values.reason,
            });
            if (res?.data) {
                notify.success("Điều chuyển thành công.");
                setReassignModalOpen(false);
                setSelectedEmployeeForReassign(null);
                setSelectedRowKeys([]);
                fetchLinkedEmployees();
            }
        } catch (error: any) {
            const msg = getApiErrorMessage(error, "Lỗi điều chuyển người chấm/duyệt");
            notify.error(msg);
        } finally {
            setReassigning(false);
        }
    };

    const renderUserAvatar = (name: string, email: string, jobTitle?: string, positionLevel?: string) => {
        const initial = name ? name.trim().charAt(0).toUpperCase() : "?";
        const colors = ["#3b82f6", "#06b6d4", "#f97316", "#ef4444", "#8b5cf6", "#ec4899"];
        const index = (email || name || "").charCodeAt(0) % colors.length;
        const color = colors[index];
        const subText = jobTitle ? `${jobTitle}${positionLevel ? ` (${positionLevel})` : ""}` : email;
        const tooltipContent = (
            <div style={{ fontSize: "12px", padding: "2px 4px" }}>
                <div style={{ fontWeight: 700 }}>{name}</div>
                {jobTitle && <div>Chức danh: {jobTitle}</div>}
                {positionLevel && <div>Cấp bậc: {positionLevel}</div>}
                <div style={{ color: "rgba(255,255,255,0.85)", marginTop: "2px" }}>Email: {email}</div>
            </div>
        );
        return (
            <Tooltip title={tooltipContent} placement="top" mouseEnterDelay={0.3}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, cursor: "default" }}>
                    <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${color}dd 0%, ${color} 100%)`,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 12,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        border: "1px solid #fff",
                        flexShrink: 0
                    }}>
                        {initial}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                        <div style={{ fontSize: "10.5px", color: jobTitle ? "#4f46e5" : "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "1px", fontWeight: jobTitle ? 550 : 400 }}>
                            {subText}
                        </div>
                    </div>
                </div>
            </Tooltip>
        );
    };

    // Columns for Employees linked Table
    const employeeColumns = [
        {
            title: "STT",
            key: "stt",
            width: 45,
            align: "center" as const,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: any, __: any, index: number) => (
                <span style={{ fontWeight: 600, color: "#64748b", fontSize: "12px" }}>{index + 1}</span>
            ),
        },
        {
            title: "Nhân viên",
            dataIndex: ["employee", "name"],
            key: "employeeName",
            width: 200,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (val: string, record: any) =>
                renderUserAvatar(
                    val || record.employee?.username,
                    record.employee?.email,
                    record.employee?.jobTitle,
                    record.employee?.positionLevel
                ),
        },
        {
            title: "Quản lý trực tiếp",
            dataIndex: ["directManager", "name"],
            key: "directManagerName",
            width: 200,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (val: string, record: any) => {
                if (!record.directManager?.id) {
                    return <Tag color="warning" style={{ margin: 0, borderRadius: 4, fontWeight: 600 }}>Chưa gán</Tag>;
                }
                return renderUserAvatar(
                    val || record.directManager?.username,
                    record.directManager?.email,
                    record.directManager?.jobTitle,
                    record.directManager?.positionLevel
                );
            },
        },
        {
            title: (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                    Quản lý gián tiếp
                    <Tooltip title="Cấp quản lý tiếp theo trong luồng phê duyệt của nhân sự.">
                        <InfoCircleOutlined style={{ color: "#94a3b8" }} />
                    </Tooltip>
                </span>
            ),
            dataIndex: ["indirectManager", "name"],
            key: "indirectManagerName",
            width: 210,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (val: string, record: any) => {
                if (!record.indirectManager?.id) {
                    return (
                        <Tag style={{
                            borderRadius: "4px",
                            background: "#f8fafc",
                            color: "#64748b",
                            border: "1px solid #e2e8f0",
                            fontSize: "10.5px",
                            fontWeight: 500,
                            padding: "1px 6px",
                            margin: 0
                        }}>
                            Chưa xác định
                        </Tag>
                    );
                }
                return renderUserAvatar(
                    val || record.indirectManager?.username,
                    record.indirectManager?.email,
                    record.indirectManager?.jobTitle,
                    record.indirectManager?.positionLevel
                );
            },
        },
        {
            title: "Trạng thái thực tế",
            key: "recordStatus",
            align: "center" as const,
            width: 180,
            render: (_: any, record: any) => {
                if (record.status !== "ACTIVE") {
                    return (
                        <Tag color="default" style={{ fontWeight: 600, borderRadius: 12, padding: "2px 8px", border: "1px solid #e2e8f0" }}>
                            Đã hủy tham gia
                        </Tag>
                    );
                }
                if (!record.recordId) {
                    return (
                        <Tag color="default" style={{ fontWeight: 600, borderRadius: 12, padding: "2px 8px", border: "1px solid #e2e8f0" }}>
                            Chưa khởi tạo
                        </Tag>
                    );
                }

                // Tính toán deadline thực tế và trạng thái trễ hạn
                const empDeadline = record.employeeDeadlineOverride ?? period?.employeeDeadline;
                const isEmpPending = record.recordStatus === "NOT_STARTED" || record.recordStatus === "EMPLOYEE_DRAFTING";
                const isEmpOverdue = isEmpPending && empDeadline && dayjs().isAfter(dayjs(empDeadline));

                const mgrDeadline = record.managerDeadlineOverride ?? period?.managerDeadline;
                const isMgrPending = ["PENDING_MANAGER_REVIEW", "MANAGER_REVIEWING", "REVISION_NEEDED"].includes(record.recordStatus);
                const isMgrOverdue = isMgrPending && mgrDeadline && dayjs().isAfter(dayjs(mgrDeadline));

                const appDeadline = record.approvalDeadlineOverride ?? period?.approvalDeadline;
                const isAppPending = record.recordStatus === "PENDING_APPROVAL";
                const isAppOverdue = isAppPending && appDeadline && dayjs().isAfter(dayjs(appDeadline));
                const phase = getRecordDeadlinePhase(record.recordStatus);
                const currentDeadline = getRecordPhaseDeadline(record, period, phase);
                const hasDeadlineOverride =
                    (phase === "EMPLOYEE" && !!record.employeeDeadlineOverride) ||
                    (phase === "MANAGER" && !!record.managerDeadlineOverride) ||
                    (phase === "APPROVAL" && !!record.approvalDeadlineOverride);
                const renderStatusWithDeadline = (tag: React.ReactNode) => (
                    <div style={{ display: "grid", justifyItems: "center", gap: 4 }}>
                        {tag}
                        {currentDeadline && (
                            <Tooltip title={`${DEADLINE_PHASE_LABELS[phase]}${hasDeadlineOverride ? " - hạn riêng sau gia hạn" : " - hạn theo kỳ"}`}>
                                <span style={{ fontSize: 10.5, color: hasDeadlineOverride ? "#2563eb" : "#64748b", fontWeight: 650, whiteSpace: "nowrap" }}>
                                    Hạn: {dayjs(currentDeadline).format("DD/MM HH:mm")}
                                </span>
                            </Tooltip>
                        )}
                    </div>
                );

                if (isEmpOverdue) {
                    return renderStatusWithDeadline(
                        <Tag color="error" style={{ fontWeight: 600, borderRadius: 12, padding: "2px 8px" }}>
                            Trễ hạn tự đánh giá
                        </Tag>
                    );
                }

                if (isMgrOverdue) {
                    return renderStatusWithDeadline(
                        <Tag color="error" style={{ fontWeight: 600, borderRadius: 12, padding: "2px 8px" }}>
                            Trễ hạn chấm điểm
                        </Tag>
                    );
                }

                if (isAppOverdue) {
                    return renderStatusWithDeadline(
                        <Tag color="error" style={{ fontWeight: 600, borderRadius: 12, padding: "2px 8px" }}>
                            Trễ hạn phê duyệt
                        </Tag>
                    );
                }

                const STATUS_TEXT: Record<string, { text: string; tagColor: string }> = {
                    NOT_STARTED: { text: "Chưa bắt đầu", tagColor: "default" },
                    EMPLOYEE_DRAFTING: { text: "NV đang đánh giá", tagColor: "processing" },
                    PENDING_MANAGER_REVIEW: { text: "Chờ QL chấm", tagColor: "warning" },
                    MANAGER_REVIEWING: { text: "QL đang chấm", tagColor: "purple" },
                    PENDING_APPROVAL: { text: "Chờ phê duyệt", tagColor: "cyan" },
                    REVISION_NEEDED: { text: "Yêu cầu sửa đổi", tagColor: "error" },
                    COMPLETED: { text: "Hoàn tất", tagColor: "success" },
                };

                const cfg = STATUS_TEXT[record.recordStatus] ?? { text: "Chưa rõ", tagColor: "default" };
                return renderStatusWithDeadline(
                    <Tag color={cfg.tagColor} style={{ fontWeight: 600, borderRadius: 12, padding: "2px 8px" }}>
                        {cfg.text}
                    </Tag>
                );
            },
        },
        {
            title: "Hành động",
            key: "action",
            align: "center" as const,
            width: 100,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: any, record: any) => {
                const isRecordActive = record?.status?.toUpperCase() === "ACTIVE";
                const isPeriodClosed = period?.status?.toUpperCase() === "CLOSED";
                if (!isRecordActive || isPeriodClosed) return null;
                return (
                    <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
                        {isRecordExtendable(record, period) && (
                            <Access permission={ALL_PERMISSIONS.EVALUATION.EXTEND_RECORD_DEADLINE} hideChildren>
                                <ActionButton
                                    variant="edit"
                                    icon={<CalendarOutlined />}
                                    tooltip={isRecordDeadlineOverdue(record, period) ? "Gia hạn hồ sơ đang trễ" : "Chỉnh hạn xử lý"}
                                    aria-label={isRecordDeadlineOverdue(record, period) ? "Gia hạn hồ sơ đang trễ" : "Chỉnh hạn xử lý"}
                                    onClick={() => handleOpenExtendModal(record)}
                                />
                            </Access>
                        )}

                        {record.recordId && (
                            <Access permission={ALL_PERMISSIONS.EVALUATION.REASSIGN_EVALUATOR} hideChildren>
                                <ActionButton
                                    variant="settings"
                                    icon={<TeamOutlined />}
                                    tooltip="Điều chuyển người chấm/duyệt"
                                    aria-label="Điều chuyển người chấm/duyệt"
                                    onClick={() => handleOpenReassignModal(record)}
                                />
                            </Access>
                        )}

                        <Access permission={ALL_PERMISSIONS.EVALUATION.CANCEL_PERIOD_EMPLOYEE} hideChildren>
                            <Popconfirm
                                title="Gỡ nhân viên khỏi kỳ đánh giá?"
                                description="Nhân viên sẽ không còn trong danh sách này."
                                onConfirm={() => handleCancelEmployee(record.id)}
                                okText="Gỡ"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                                placement="topRight"
                            >
                                <ActionButton
                                    variant="danger"
                                    icon={<DeleteOutlined />}
                                    tooltip="Gỡ nhân viên khỏi kỳ"
                                    aria-label="Gỡ nhân viên khỏi kỳ"
                                />
                            </Popconfirm>
                        </Access>
                    </div>
                );
            },
        },
    ];

    const activeT = useMemo(() => linkedTemplates.find(t => t.template?.id === selectedTemplateId), [linkedTemplates, selectedTemplateId]);
    const employeesForSelectedTemplate = useMemo(() => linkedEmployees.filter(
        emp => emp.template?.id === selectedTemplateId
    ), [linkedEmployees, selectedTemplateId]);
    const activeEmployeesForTemplate = useMemo(() => employeesForSelectedTemplate.filter(emp => emp.status === "ACTIVE"), [employeesForSelectedTemplate]);
    const missingDirectManagerCount = useMemo(() => activeEmployeesForTemplate.filter(emp => !emp.directManager?.id).length, [activeEmployeesForTemplate]);
    const missingIndirectManagerCount = useMemo(() => activeEmployeesForTemplate.filter(emp => !emp.indirectManager?.id).length, [activeEmployeesForTemplate]);
    const totalActiveEmployeeCount = useMemo(() => linkedEmployees.filter(emp => emp.status === "ACTIVE").length, [linkedEmployees]);
    const canManageEmployeeActions = !readOnly && (isSuperAdmin || canExtendDeadline || canReassignEvaluator || canCancelEmployee);
    const visibleEmployeeColumns = useMemo(() => readOnly
        ? employeeColumns.filter(column => column.key !== "action")
        : employeeColumns, [readOnly, employeeColumns]);

    const templateEmployeeCounts = useMemo(() => {
        const counts: Record<number, number> = {};
        linkedEmployees.forEach(emp => {
            if (emp.template?.id && emp.status === "ACTIVE") {
                counts[emp.template.id] = (counts[emp.template.id] || 0) + 1;
            }
        });
        return counts;
    }, [linkedEmployees]);

    const availableTemplateOptions = useMemo(() => {
        const linkedTemplateIds = new Set(linkedTemplates.map(item => item.template?.id));
        return activeTemplates
            .filter(template => !linkedTemplateIds.has(template.id))
            .map(template => ({ label: template.name, value: template.id }));
    }, [activeTemplates, linkedTemplates]);

    const scheduleItems = useMemo(() => ([
        {
            key: "employeeStartDate",
            index: "1",
            label: "Mở cổng nhân viên đánh giá",
            value: period?.employeeStartDate,
            icon: <UserOutlined />,
        },
        {
            key: "employeeDeadline",
            index: "2",
            label: "Hạn nhân viên nộp",
            value: period?.employeeDeadline,
            icon: <CheckOutlined />,
        },
        {
            key: "managerStartDate",
            index: "3",
            label: "Bắt đầu quản lý chấm",
            value: period?.employeeDeadline,
            icon: <TeamOutlined />,
        },
        {
            key: "managerDeadline",
            index: "4",
            label: "Hạn quản lý chấm",
            value: period?.managerDeadline,
            icon: <TeamOutlined />,
        },
        {
            key: "approvalStartDate",
            index: "5",
            label: "Bắt đầu QL gián tiếp duyệt",
            value: period?.managerDeadline,
            icon: <CheckCircleOutlined />,
        },
        {
            key: "approvalDeadline",
            index: "6",
            label: "Hạn QL gián tiếp duyệt",
            value: period?.approvalDeadline,
            icon: <CheckCircleOutlined />,
        },
    ]), [period?.approvalDeadline, period?.employeeDeadline, period?.employeeStartDate, period?.managerDeadline]);
    const scheduleModalGroups = useMemo(() => ([
        {
            key: "employee",
            number: "1",
            title: "Nhân viên đánh giá",
            icon: <UserOutlined />,
            times: [
                { label: "Mở cổng", value: period?.employeeStartDate },
                { label: "Hạn nộp", value: period?.employeeDeadline },
            ],
        },
        {
            key: "manager",
            number: "2",
            title: "Quản lý trực tiếp chấm",
            icon: <TeamOutlined />,
            times: [
                { label: "Bắt đầu", value: period?.employeeDeadline },
                { label: "Hạn chấm", value: period?.managerDeadline },
            ],
        },
        {
            key: "approval",
            number: "3",
            title: "Quản lý gián tiếp duyệt",
            icon: <CheckCircleOutlined />,
            times: [
                { label: "Bắt đầu", value: period?.managerDeadline },
                { label: "Hạn duyệt", value: period?.approvalDeadline },
            ],
        },
    ]), [period?.approvalDeadline, period?.employeeDeadline, period?.employeeStartDate, period?.managerDeadline]);
    const missingScheduleCount = [
        period?.employeeStartDate,
        period?.employeeDeadline,
        period?.managerDeadline,
        period?.approvalDeadline,
    ].filter(value => !value).length;
    const canShowEditScheduleButton = !readOnly && period?.status === "DRAFT" && !!onEditPeriod && (isSuperAdmin || canUpdatePeriod);
    const canShowActivateButton = !readOnly && period?.status === "DRAFT" && (isSuperAdmin || canActivatePeriod);

    return (
    <>
        <LotusDetailDrawer
            open={open}
            onClose={onClose}
            destroyOnClose
            keyboard={false}
            maskClosable={false}
            closeAriaLabel={readOnly ? "Đóng chi tiết kỳ đánh giá" : "Đóng thiết lập kỳ đánh giá"}
        >
            <div className="period-config-drawer">
                <div className="period-config-title">
                    <div className="period-config-title__icon"><TeamOutlined /></div>
                    <div className="period-config-title__content">
                        <div className="period-config-title__label">{readOnly ? "Chi tiết kỳ đánh giá" : "Cấu hình kỳ đánh giá"}</div>
                        <div className="period-config-title__name">{period?.name}</div>
                    </div>
                    <div className="period-config-title__meta">
                        {period?.company?.name && <Tag style={{ margin: 0, borderRadius: 999, border: "1px solid #ffd3e0", background: "#fff0f5", color: "#e8356d", fontWeight: 600 }}>{period.company.name}</Tag>}
                        <Tag color={period?.status === "DRAFT" ? "default" : period?.status === "ACTIVE" ? "processing" : "default"} style={{ margin: 0, borderRadius: 999 }}>
                            {period?.status === "DRAFT" ? "Bản nháp" : period?.status === "ACTIVE" ? "Đang mở" : "Đã đóng"}
                        </Tag>
                    </div>
                </div>
            <style>{`
                /* Custom Select Dropdown options styling to match brand pink theme and Tailwind rounded style */
                .ant-select-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) {
                    background-color: #f8fafc !important;
                    color: #0f172a !important;
                    font-weight: 600 !important;
                }
                .ant-select-dropdown .ant-select-item-option-selected:not(.ant-select-item-option-disabled) .ant-select-item-option-state {
                    color: #e8356d !important;
                }
                .ant-select-dropdown .ant-select-item {
                    border-radius: 6px !important;
                    margin: 2px 4px !important;
                    transition: all 0.15s ease !important;
                }
                .ant-select-dropdown .ant-select-item-option-active:not(.ant-select-item-option-selected) {
                    background-color: #f1f5f9 !important;
                    color: #0f172a !important;
                }
                .period-config-drawer { height: 100%; min-height: 0; display: flex; flex-direction: column; background: #fff; }
                .period-config-title {
                    min-height: 68px;
                    flex: 0 0 auto;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 24px;
                    border-bottom: 1px solid #e9eef5;
                    background: linear-gradient(180deg, #ffffff 0%, #fffafb 100%);
                }
                .period-config-title__icon {
                    width: 34px;
                    height: 34px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    background: #fff1f7;
                    color: #e11d72;
                    font-size: 16px;
                    box-shadow: inset 0 0 0 1px #ffd3e0;
                }
                .period-config-title__content { min-width: 0; }
                .period-config-title__label { color: #e8356d; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.55px; }
                .period-config-title__name { margin-top: 2px; color: #172033; font-size: 17px; font-weight: 760; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .period-config-title__meta { display: flex; align-items: center; gap: 6px; margin-left: auto; flex-wrap: wrap; justify-content: flex-end; }
                .period-schedule-panel {
                    flex: 0 0 auto;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    padding: 10px 24px;
                    border-bottom: 1px solid #e9eef5;
                    background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
                }
                .period-schedule-compact {
                    min-width: 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #172033;
                }
                .period-schedule-compact__icon {
                    width: 32px;
                    height: 32px;
                    flex: 0 0 auto;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 10px;
                    background: #fff1f7;
                    color: #e8356d;
                    font-size: 14px;
                    box-shadow: inset 0 0 0 1px #ffd7e4;
                }
                .period-schedule-compact__title {
                    color: #172033;
                    font-size: 13px;
                    font-weight: 800;
                    line-height: 1;
                }
                .period-schedule-compact__range {
                    margin-top: 4px;
                    color: #64748b;
                    font-size: 12px;
                    font-weight: 650;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .period-schedule-detail-trigger {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    height: 34px;
                    padding: 0 12px;
                    border: 1px solid #e2e8f0;
                    border-radius: 9px;
                    background: #ffffff;
                    color: #475569;
                    font-size: 12px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.16s ease;
                }
                .period-schedule-detail-trigger:hover {
                    border-color: #f9a8c6;
                    color: #e8356d;
                    box-shadow: 0 6px 16px -14px rgba(232, 53, 109, 0.55);
                }
                .period-schedule-modal-list {
                    position: relative;
                    display: grid;
                    gap: 14px;
                    padding-left: 4px;
                }
                .period-schedule-modal-list::before {
                    content: "";
                    position: absolute;
                    left: 22px;
                    top: 22px;
                    bottom: 22px;
                    width: 2px;
                    background: #edf2f7;
                }
                .period-schedule-modal-stage {
                    position: relative;
                    display: grid;
                    grid-template-columns: 44px minmax(0, 1fr);
                    gap: 12px;
                    align-items: flex-start;
                    z-index: 1;
                }
                .period-schedule-modal-stage__marker {
                    width: 44px;
                    height: 44px;
                    flex: 0 0 auto;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 14px;
                    background: #fff7fb;
                    color: #e8356d;
                    font-size: 14px;
                    box-shadow: 0 0 0 5px #ffffff, inset 0 0 0 1px #ffd7e4;
                }
                .period-schedule-modal-stage__body {
                    min-width: 0;
                    padding: 2px 0 0;
                }
                .period-schedule-modal-stage__eyebrow {
                    color: #e8356d;
                    font-size: 11px;
                    font-weight: 800;
                    line-height: 1;
                    margin-bottom: 5px;
                }
                .period-schedule-modal-stage__title {
                    color: #172033;
                    font-size: 15px;
                    font-weight: 800;
                    line-height: 1.25;
                }
                .period-schedule-modal-stage__times {
                    margin-top: 10px;
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 10px;
                }
                .period-schedule-modal-time {
                    min-width: 0;
                    padding: 10px 12px;
                    border: 1px solid #e7edf5;
                    border-radius: 10px;
                    background: #fbfdff;
                }
                .period-schedule-modal-time__label {
                    color: #64748b;
                    font-size: 11.5px;
                    font-weight: 700;
                    line-height: 1;
                }
                .period-schedule-modal-time__value {
                    margin-top: 7px;
                    color: #0f172a;
                    font-size: 14px;
                    font-weight: 760;
                    line-height: 1.2;
                }
                .period-schedule-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    justify-content: flex-end;
                    flex-wrap: wrap;
                }
                .period-config-layout { flex: 1 1 auto; min-height: 0; display: grid; grid-template-columns: minmax(270px, 320px) minmax(0, 1fr); overflow: hidden; }
                .period-config-sidebar { min-width: 0; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 12px; border-right: 1px solid #e9eef5; background: #fafbfc; overscroll-behavior: contain; }
                .period-config-main { min-width: 0; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; background: #ffffff; overscroll-behavior: contain; }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
                .template-card {
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .template-card:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 14px -8px rgba(15, 23, 42, 0.35) !important;
                    border-color: #f9a8d4 !important;
                }
                .template-card:focus-visible {
                    outline: 2px solid #e8356d;
                    outline-offset: 2px;
                }
                .template-card__remove {
                    width: 26px !important;
                    min-width: 26px !important;
                    height: 26px !important;
                    padding: 0 !important;
                    border-radius: 7px !important;
                    display: inline-flex !important;
                    align-items: center;
                    justify-content: center;
                    flex: 0 0 auto;
                    transition: background-color 0.16s ease, color 0.16s ease, border-color 0.16s ease;
                }
                .template-card__remove:not(:disabled):hover {
                    background: #fff1f2 !important;
                    border-color: #fecdd3 !important;
                    color: #dc2626 !important;
                }
                .template-card__remove:disabled {
                    color: #94a3b8 !important;
                    background: #f8fafc !important;
                    border-color: #e2e8f0 !important;
                }
                .period-config-drawer .ant-table {
                    border-radius: 8px !important;
                }
                .period-config-drawer .ant-table-thead > tr > th {
                    background: rgba(241, 245, 249, 0.6) !important;
                    color: #475569 !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.6px !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    padding: 8px 10px !important;
                }
                .period-config-drawer .ant-table-tbody > tr > td {
                    padding: 8px 10px !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                }
                .period-config-drawer .ant-table-tbody > tr:last-child > td {
                    border-bottom: none !important;
                }
                .period-config-drawer .ant-table-row {
                    transition: background-color 0.2s;
                }
                .period-config-drawer .ant-table-row:hover {
                    background-color: #f8fafc !important;
                }
                .add-employee-panel {
                    background: #fbfdff;
                    border: 1px solid #e7edf5;
                    border-radius: 12px;
                    padding: 12px 14px;
                }
                .add-employee-panel__head {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0 0 10px 0;
                    font-size: 13.5px;
                    font-weight: 700;
                    color: #0f172a;
                    border-bottom: 1px solid #f1f5f9;
                    margin-bottom: 12px;
                }
                .add-employee-panel__head-icon {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 26px;
                    height: 26px;
                    border-radius: 8px;
                    background: #fff1f7;
                    color: #e8356d;
                    font-size: 13px;
                }
                .add-employee-panel > form {
                    padding: 0;
                    display: grid;
                    grid-template-columns: minmax(260px, 0.42fr) minmax(300px, 0.58fr);
                    gap: 12px;
                    align-items: end;
                }
                .add-employee-panel__form--with-company {
                    grid-template-columns: minmax(180px, 0.25fr) minmax(240px, 0.35fr) minmax(280px, 0.4fr);
                }
                .add-employee-panel__filters {
                    margin-bottom: 0;
                }
                .add-employee-panel__scope {
                    min-width: 0;
                }
                .add-employee-panel__filters-label,
                .add-employee-panel__field-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: #334155;
                    display: block;
                    margin-bottom: 6px;
                }
                .add-employee-panel__filters-label {
                    display: block;
                    margin-bottom: 6px;
                }
                .add-employee-panel__hint {
                    grid-column: 1 / -1;
                    color: #64748b;
                    font-size: 11.5px;
                    line-height: 1.45;
                    margin-top: -4px;
                }
                .template-add-btn,
                .template-add-btn.ant-btn-primary {
                    border-radius: 7px;
                    font-weight: 600;
                    background: linear-gradient(135deg, #f24d84 0%, #e8356d 100%) !important;
                    border: none !important;
                    color: #fff !important;
                    box-shadow: 0 2px 6px rgba(232, 53, 109, 0.2);
                    transition: box-shadow 0.15s ease, filter 0.15s ease;
                }
                .template-add-btn:hover,
                .template-add-btn.ant-btn-primary:hover,
                .template-add-btn:focus,
                .template-add-btn.ant-btn-primary:focus {
                    background: linear-gradient(135deg, #f65f92 0%, #ef4079 100%) !important;
                    color: #fff !important;
                    box-shadow: 0 4px 10px rgba(232, 53, 109, 0.3) !important;
                }
                .template-add-btn:disabled,
                .template-add-btn.ant-btn-primary:disabled {
                    background: #f5b3c8 !important;
                    box-shadow: none !important;
                }
                .bulk-action-pink,
                .bulk-action-pink.ant-btn-primary {
                    background: #e8356d !important;
                    border-color: #e8356d !important;
                    color: #fff !important;
                }
                .bulk-action-pink:hover,
                .bulk-action-pink.ant-btn-primary:hover,
                .bulk-action-pink:focus,
                .bulk-action-pink.ant-btn-primary:focus {
                    background: #f04c85 !important;
                    border-color: #f04c85 !important;
                    color: #fff !important;
                }
                @media (max-width: 1100px) {
                    .period-config-layout { grid-template-columns: minmax(0, 1fr); overflow-y: auto; }
                    .period-config-sidebar { overflow: visible; border-right: 0; border-bottom: 1px solid #e9eef5; }
                    .period-config-main { overflow: visible; }
                    .add-employee-panel > form,
                    .add-employee-panel__form--with-company { grid-template-columns: minmax(0, 1fr); }
                    .period-schedule-panel { align-items: flex-start; flex-direction: column; }
                    .period-schedule-actions { justify-content: flex-start; }
                }
                @media (max-width: 767px) {
                    .period-config-title { padding: 16px 54px 16px 16px; align-items: flex-start; }
                    .period-config-title__meta { margin-left: 0; width: 100%; justify-content: flex-start; }
                    .period-config-title { flex-wrap: wrap; }
                    .period-config-title__name { white-space: normal; font-size: 16px; }
                    .period-schedule-panel { padding: 10px 16px; }
                    .period-schedule-modal-stage__times { grid-template-columns: minmax(0, 1fr); }
                }
            `}</style>
            <section className="period-schedule-panel">
                <div className="period-schedule-compact">
                    <span className="period-schedule-compact__icon"><CalendarOutlined /></span>
                    <div style={{ minWidth: 0 }}>
                        <div className="period-schedule-compact__title">Lịch trình đánh giá</div>
                        <div className="period-schedule-compact__range">
                            {period?.employeeStartDate ? dayjs(period.employeeStartDate).format("DD/MM/YYYY HH:mm") : "Chưa có ngày mở"}
                            {" "}
                            →
                            {" "}
                            {period?.approvalDeadline ? dayjs(period.approvalDeadline).format("DD/MM/YYYY HH:mm") : "Chưa có hạn cuối"}
                        </div>
                    </div>
                </div>
                <div className="period-schedule-actions">
                    {missingScheduleCount > 0 && (
                        <Tag color="warning" style={{ margin: 0, borderRadius: 999 }}>
                            Thiếu {missingScheduleCount} mốc
                        </Tag>
                    )}
                    <button className="period-schedule-detail-trigger" type="button" onClick={() => setScheduleModalOpen(true)}>
                        Xem lịch trình <RightOutlined style={{ fontSize: 10 }} />
                    </button>
                    {canShowEditScheduleButton && period && (
                        <button className="period-schedule-detail-trigger" type="button" onClick={() => onEditPeriod(period)}>
                            Chỉnh lịch <EditOutlined style={{ fontSize: 12 }} />
                        </button>
                    )}
                    {canShowActivateButton && (
                        <Popconfirm
                            title="Kích hoạt kỳ đánh giá?"
                            description="Hệ thống sẽ sinh phiếu đánh giá cho các nhân sự đã gán vào từng biểu mẫu."
                            okText="Kích hoạt"
                            cancelText="Hủy"
                            onConfirm={handleActivatePeriodInDrawer}
                        >
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                loading={activatingPeriod}
                                disabled={missingScheduleCount > 0 || totalActiveEmployeeCount === 0}
                                className="template-add-btn"
                                style={{ height: 38, borderRadius: 8, fontWeight: 750 }}
                            >
                                Kích hoạt kỳ
                            </Button>
                        </Popconfirm>
                    )}
                </div>
            </section>
            <div className="period-config-layout">
                <aside className="period-config-sidebar">
                    <div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                            <BookOutlined style={{ color: "#3b82f6", fontSize: "13px" }} />
                            <span>Biểu mẫu đã gán ({linkedTemplates.length})</span>
                        </div>

                        {!readOnly && period?.status === "DRAFT" ? (
                            <Form 
                                form={templateForm} 
                                layout="vertical" 
                                onFinish={handleAddTemplate} 
                                style={{ 
                                    background: "#f8fafc", 
                                    padding: "14px 16px", 
                                    borderRadius: "12px", 
                                    border: "1px solid #e2e8f0", 
                                    marginBottom: "12px" 
                                }}
                            >
                                <Form.Item
                                    name="templateId"
                                    rules={[{ required: true, message: "Hãy chọn mẫu!" }]}
                                    style={{ marginBottom: 12 }}
                                    label={<span style={{ fontWeight: 650, color: "#334155", fontSize: "12px" }}>Chọn mẫu đánh giá</span>}
                                    className="custom-form-item"
                                >
                                    <Select
                                        showSearch
                                        placeholder={availableTemplateOptions.length > 0 ? "Chọn mẫu đánh giá..." : "Đã gán tất cả mẫu khả dụng"}
                                        optionFilterProp="label"
                                        options={availableTemplateOptions}
                                        loading={loadingAssignmentReferenceData}
                                        onFocus={() => { void loadAssignmentReferenceData(); }}
                                        notFoundContent={loadingAssignmentReferenceData ? "Đang tải..." : "Không còn mẫu khả dụng"}
                                        styles={{ popup: { root: { borderRadius: 8 } } }}
                                        size="middle"
                                        style={{ borderRadius: "8px" }}
                                    />
                                </Form.Item>

                                <Access permission={ALL_PERMISSIONS.EVALUATION.ADD_TEMPLATE_TO_PERIOD} hideChildren>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={submittingTemplate}
                                        icon={<PlusOutlined />}
                                        disabled={availableTemplateOptions.length === 0}
                                        size="middle"
                                        block
                                        className="template-add-btn"
                                        style={{ height: "36px", fontSize: "13px", borderRadius: "8px" }}
                                    >
                                        Gán mẫu vào kỳ
                                    </Button>
                                </Access>
                            </Form>
                        ) : (
                            <SystemAlert
                                variant="warning"
                                compact
                                description="Kỳ đã được kích hoạt. Không thể thay đổi biểu mẫu, nhưng vẫn có thể theo dõi và xử lý nhân sự theo quyền được cấp."
                                style={{ marginBottom: 12 }}
                            />
                        )}

                        {/* LIST CARDS */}
                        <div 
                            style={{ 
                                maxHeight: "calc(65vh - 80px)", 
                                overflowY: "auto", 
                                display: "flex", 
                                flexDirection: "column", 
                                gap: "8px", 
                                paddingRight: "6px" 
                            }} 
                            className="custom-scrollbar"
                        >
                            {linkedTemplates.map(t => {
                                const isSelected = selectedTemplateId === t.template?.id;
                                const isStaff = t.template?.type === "STAFF";
                                const empCount = templateEmployeeCounts[t.template?.id ?? 0] || 0;

                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => setSelectedTemplateId(t.template?.id)}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault();
                                                setSelectedTemplateId(t.template?.id);
                                            }
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={isSelected}
                                        aria-label={`Chọn biểu mẫu ${t.template?.name || ""}`}
                                        className="template-card"
                                        style={{
                                            padding: "12px 14px 12px 18px",
                                            borderRadius: "10px",
                                            border: "1px solid #e2e8f0",
                                            background: "#ffffff",
                                            cursor: "pointer",
                                            position: "relative",
                                            boxShadow: isSelected ? "0 4px 12px rgba(15, 23, 42, 0.03)" : "none",
                                            overflow: "hidden"
                                        }}
                                    >
                                        {isSelected && (
                                            <div style={{
                                                position: "absolute",
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: "4px",
                                                background: "#e8356d",
                                            }} />
                                        )}
                                        <div style={{ display: "flex", gap: "6px", alignItems: "flex-start", marginBottom: "8px" }}>
                                            <BookOutlined style={{ color: isSelected ? "#e8356d" : "#64748b", fontSize: "14px", marginTop: "2px" }} />
                                            <div style={{
                                                fontWeight: 600,
                                                color: isSelected ? "#9d174d" : "#1e293b",
                                                fontSize: "13px",
                                                lineHeight: "1.35",
                                                flex: 1
                                            }}>
                                                {t.template?.name}
                                            </div>
                                            {!readOnly && period?.status === "DRAFT" && (
                                                <Access permission={ALL_PERMISSIONS.EVALUATION.REMOVE_TEMPLATE_FROM_PERIOD} hideChildren>
                                                    {empCount > 0 ? (
                                                        <Tooltip title={`Gỡ ${empCount} nhân sự đang tham gia trước khi gỡ mẫu`}>
                                                            <span onClick={(event) => event.stopPropagation()}>
                                                                <Button
                                                                    type="text"
                                                                    icon={<DeleteOutlined />}
                                                                    disabled
                                                                    className="template-card__remove"
                                                                    aria-label="Không thể gỡ mẫu vì còn nhân sự"
                                                                />
                                                            </span>
                                                        </Tooltip>
                                                    ) : (
                                                        <Popconfirm
                                                            title="Gỡ mẫu khỏi kỳ đánh giá?"
                                                            description="Chỉ gỡ liên kết trong kỳ này, mẫu gốc vẫn được giữ nguyên."
                                                            okText="Gỡ mẫu"
                                                            cancelText="Hủy"
                                                            okButtonProps={{ danger: true }}
                                                            onConfirm={() => t.template?.id && handleRemoveTemplate(t.template.id)}
                                                        >
                                                            <Tooltip title="Gỡ mẫu khỏi kỳ">
                                                                <Button
                                                                    type="text"
                                                                    danger
                                                                    icon={<DeleteOutlined />}
                                                                    loading={removingTemplateId === t.template?.id}
                                                                    className="template-card__remove"
                                                                    aria-label={`Gỡ mẫu ${t.template?.name || ""}`}
                                                                    onClick={(event) => event.stopPropagation()}
                                                                />
                                                            </Tooltip>
                                                        </Popconfirm>
                                                    )}
                                                </Access>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <Tag
                                                style={{
                                                    borderRadius: "6px",
                                                    padding: "2px 8px",
                                                    fontSize: "10.5px",
                                                    fontWeight: 600,
                                                    border: "none",
                                                    background: "#f1f5f9",
                                                    color: "#475569",
                                                    margin: 0
                                                }}
                                            >
                                                {isStaff ? "Nhân viên" : "Quản lý"}
                                            </Tag>
                                            <span style={{ fontSize: "11.5px", color: isSelected ? "#be185d" : "#64748b", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                                <TeamOutlined style={{ fontSize: "12px" }} />
                                                {empCount} nhân sự
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                            {linkedTemplates.length === 0 && (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có biểu mẫu" style={{ margin: "32px 0" }} />
                            )}
                        </div>
                    </div>
                </aside>

                <main className="period-config-main">
                    {!selectedTemplateId ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 450, height: "100%" }}>
                            <Empty description="Chọn biểu mẫu ở cột bên trái để thiết lập danh sách nhân sự" />
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {/* Header chi tiết */}
                            <div style={{
                                borderBottom: "1px solid #e9eef5",
                                padding: "0 0 14px",
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "10px",
                                boxShadow: "none"
                            }}>
                                <BookOutlined style={{ color: "#e11d72", fontSize: "18px", marginTop: 2 }} />
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.45px" }}>
                                        Biểu mẫu đang chọn
                                    </div>
                                    <div style={{ fontSize: "15px", fontWeight: 760, color: "#172033", marginTop: "2px" }}>
                                        {activeT?.template?.name}
                                    </div>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                                        <Tag style={{ margin: 0, borderRadius: 999, border: "none", background: "#f1f5f9", color: "#475569" }}>{activeEmployeesForTemplate.length} nhân sự đang tham gia</Tag>
                                        {missingDirectManagerCount > 0 && <Tag color="warning" style={{ margin: 0, borderRadius: 4 }}>{missingDirectManagerCount} thiếu quản lý trực tiếp</Tag>}
                                        {missingIndirectManagerCount > 0 && <Tag color="warning" style={{ margin: 0, borderRadius: 4 }}>{missingIndirectManagerCount} thiếu quản lý gián tiếp</Tag>}
                                    </div>
                                </div>
                            </div>

                            {(missingDirectManagerCount > 0 || missingIndirectManagerCount > 0) && (
                                <SystemAlert
                                    variant="warning"
                                    compact
                                    description="Một số nhân sự chưa đủ tuyến quản lý. Hãy bổ sung hoặc điều chuyển người chấm/duyệt trước khi đến bước xử lý tương ứng."
                                />
                            )}

                            {/* Form gán nhân sự (nếu là Draft) */}
                            {!readOnly && period?.status === "DRAFT" && (
                                <div className="add-employee-panel">
                                    <div className="add-employee-panel__head">
                                        <span className="add-employee-panel__head-icon"><PartitionOutlined /></span>
                                        <span>Chọn nhân sự áp dụng cho biểu mẫu</span>
                                    </div>

                                    <Form
                                        form={employeeForm}
                                        layout="vertical"
                                        onFinish={handleAddEmployee}
                                        className={!period?.company?.id ? "add-employee-panel__form--with-company" : undefined}
                                    >
                                        {/* Bộ lọc phạm vi tìm kiếm (chỉ hiện ô chọn Công ty nếu chưa có companyId gắn với Kỳ) */}
                                        {!period?.company?.id && (
                                            <div className="add-employee-panel__filters">
                                                <div className="add-employee-panel__filters-label" style={{ marginBottom: "6px" }}>Chọn Công ty</div>
                                                <Select
                                                    allowClear
                                                    placeholder="Tất cả công ty"
                                                    value={selectedCompanyId}
                                                    onChange={handleCompanyFilterChange}
                                                    onFocus={() => { void loadAssignmentReferenceData(); }}
                                                    options={companyFilterOptions}
                                                    styles={{ popup: { root: { borderRadius: 8 } } }}
                                                    style={FULL_WIDTH}
                                                />
                                            </div>
                                        )}

                                        <div className="add-employee-panel__scope">
                                            <div>
                                                <div className="add-employee-panel__field-label" style={{ marginBottom: 6 }}>Lọc theo phòng ban</div>
                                                <DepartmentPicker
                                                    departments={departments}
                                                    value={selectedDepartmentIds}
                                                    onChange={handleDepartmentFilterChange}
                                                    disabled={!selectedCompanyId}
                                                    emptyLabel="Chọn phòng ban để lọc nhân sự"
                                                />
                                            </div>
                                        </div>

                                        <Form.Item
                                            label={<span className="add-employee-panel__field-label">Nhân sự áp dụng</span>}
                                            name="employeeId"
                                            style={NO_MARGIN}
                                        >
                                            <EmployeeTrigger
                                                onClick={() => setEmployeePickerOpen(true)}
                                                loading={submittingEmployee}
                                            />
                                        </Form.Item>

                                        <div className="add-employee-panel__hint">
                                            Chọn phòng ban để lọc danh sách, sau đó chọn đúng nhân sự cần áp dụng vào biểu mẫu đang chọn.
                                        </div>
                                    </Form>
                                </div>
                            )}

                            {!readOnly && selectedRowKeys.length > 0 && (
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "8px 16px",
                                    background: "#fff1f7",
                                    border: "1px solid #fbcfe0",
                                    borderRadius: "6px",
                                    marginBottom: "12px",
                                }}>
                                    <span style={{ fontSize: 13, fontWeight: 550, color: "#e11d72" }}>
                                        Đang chọn {selectedRowKeys.length} nhân sự
                                    </span>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <Access permission={ALL_PERMISSIONS.EVALUATION.EXTEND_RECORD_DEADLINE} hideChildren>
                                            <Button
                                                type="primary"
                                                size="small"
                                                icon={<CalendarOutlined />}
                                                onClick={handleBulkExtend}
                                                className="bulk-action-pink"
                                                style={{ borderRadius: "4px" }}
                                            >
                                                Gia hạn hàng loạt
                                            </Button>
                                        </Access>
                                        <Access permission={ALL_PERMISSIONS.EVALUATION.REASSIGN_EVALUATOR} hideChildren>
                                            <Button
                                                type="primary"
                                                size="small"
                                                icon={<TeamOutlined />}
                                                onClick={handleBulkReassign}
                                                style={{ borderRadius: "4px", backgroundColor: "#722ed1", borderColor: "#722ed1" }}
                                            >
                                                Điều chuyển hàng loạt
                                            </Button>
                                        </Access>
                                        <Access permission={ALL_PERMISSIONS.EVALUATION.CANCEL_PERIOD_EMPLOYEE} hideChildren>
                                            <Popconfirm
                                                title={`Gỡ ${selectedRowKeys.length} nhân viên đã chọn khỏi kỳ đánh giá?`}
                                                onConfirm={handleBulkCancel}
                                                okText="Đồng ý"
                                                cancelText="Hủy"
                                            >
                                                <Button
                                                    danger
                                                    type="primary"
                                                    size="small"
                                                    icon={<DeleteOutlined />}
                                                    style={{ borderRadius: "4px" }}
                                                >
                                                    Gỡ khỏi kỳ
                                                </Button>
                                            </Popconfirm>
                                        </Access>
                                    </div>
                                </div>
                            )}

                            {/* Bảng danh sách nhân sự */}
                            <Table
                                rowSelection={canManageEmployeeActions ? {
                                    selectedRowKeys,
                                    onChange: (newSelectedRowKeys: React.Key[]) => setSelectedRowKeys(newSelectedRowKeys),
                                    getCheckboxProps: (record: any) => ({
                                        disabled: !record.recordId || record.status !== "ACTIVE" || period?.status === "CLOSED",
                                    }),
                                } : undefined}
                                columns={visibleEmployeeColumns}
                                dataSource={activeEmployeesForTemplate}
                                rowKey="id"
                                loading={loadingEmployees}
                                pagination={{ pageSize: 5, size: "small" }}
                                size="small"
                                tableLayout="fixed"
                                style={{ 
                                    background: "#ffffff", 
                                    borderRadius: "8px", 
                                    border: "1px solid rgba(226, 232, 240, 0.8)", 
                                    overflow: "hidden",
                                    boxShadow: "0 2px 4px -1px rgba(0, 0, 0, 0.01)"
                                }}
                                locale={{ emptyText: <Empty description="Chưa có nhân sự nào áp dụng biểu mẫu này" style={{ margin: "24px 0" }} /> }}
                            />
                        </div>
                    )}
                </main>
            </div>
            </div>
        </LotusDetailDrawer>

        <Modal
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                        width: 34,
                        height: 34,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 10,
                        background: "#fff1f7",
                        color: "#e8356d",
                    }}>
                        <CalendarOutlined />
                    </span>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 850, color: "#172033", lineHeight: 1.2 }}>
                            Lịch trình đánh giá
                        </div>
                        <div style={{ marginTop: 3, fontSize: 12, fontWeight: 650, color: "#64748b" }}>
                            {period?.name || "Kỳ đánh giá"}
                        </div>
                    </div>
                </div>
            }
            open={scheduleModalOpen}
            onCancel={() => setScheduleModalOpen(false)}
            footer={null}
            centered
            width={640}
            destroyOnHidden
        >
            <div className="period-schedule-modal-list" style={{ marginTop: 18 }}>
                {scheduleModalGroups.map(group => (
                    <div className="period-schedule-modal-stage" key={group.key}>
                        <span className="period-schedule-modal-stage__marker">{group.icon}</span>
                        <div className="period-schedule-modal-stage__body">
                            <div className="period-schedule-modal-stage__eyebrow">Giai đoạn {group.number}</div>
                            <div className="period-schedule-modal-stage__title">{group.title}</div>
                            <div className="period-schedule-modal-stage__times">
                                {group.times.map(time => (
                                    <div className="period-schedule-modal-time" key={time.label}>
                                        <div className="period-schedule-modal-time__label">{time.label}</div>
                                        <div className="period-schedule-modal-time__value">
                                            {time.value ? dayjs(time.value).format("DD/MM/YYYY HH:mm") : "Chưa cấu hình"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Modal>

        <Modal
            title={null}
            open={extendModalOpen}
            onCancel={() => { setExtendModalOpen(false); setSelectedEmployeeForExtend(null); setExtendDeadlineMode("SHARED"); setExtendInputMode("DATE"); setExtendStrategy("CASCADE"); setCustomExtendDeadlines({}); setPhaseCustomDeadlines({}); }}
            footer={null}
            destroyOnHidden
            centered
            width={940}
            style={{ top: 16 }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, padding: "2px 2px 14px", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 20, fontWeight: 850, lineHeight: 1.2, color: "#0f172a" }}>
                        Gia hạn thời gian đánh giá
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, color: "#64748b" }}>
                        Nhân viên: <strong style={{ color: "#1d4ed8" }}>{selectedEmployeeForExtend?.employee?.name || selectedEmployeeForExtend?.employee?.username}</strong>
                        {selectedEmployeeForExtend?.isBulk && (
                            <span style={{ marginLeft: 8, color: "#475569", fontWeight: 600 }}>
                                • {extendPreview?.recordCount || 0} hồ sơ cùng bước
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.08fr) minmax(330px, 0.92fr)", gap: 16, marginTop: 14 }}>
                <Form form={extendForm} layout="vertical" onFinish={handleExtendDeadlineSubmit}>
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, boxShadow: "0 4px 14px -12px rgba(15,23,42,0.18)" }}>
                        <div style={{ display: "grid", gap: 10, marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", background: "#fff5f8", borderLeft: "4px solid #e8356d", borderRadius: 10 }}>
                                <div style={{ color: "#0f172a", fontSize: 13, fontWeight: 800, minWidth: 0 }}>
                                    {selectedEmployeeForExtend?.phase ? DEADLINE_PHASE_LABELS[selectedEmployeeForExtend.phase as DeadlinePhase] : "—"}
                                </div>
                                <div style={{ color: "#475569", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}>
                                    Hạn: {formatDeadline(selectedEmployeeForExtend?.currentDeadline)}
                                </div>
                            </div>

                            <div style={{ display: "grid", gap: 10 }}>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                                    {[
                                        {
                                            value: "CASCADE",
                                            title: "Tịnh tiến mốc sau",
                                            desc: "Gia hạn bước hiện tại, các mốc sau tự lùi theo đúng khoảng đó.",
                                        },
                                        {
                                            value: "PHASE_CUSTOM",
                                            title: "Chỉnh từng mốc",
                                            desc: "Đặt hạn riêng cho QL trực tiếp và QL gián tiếp.",
                                        },
                                    ].map(option => {
                                        const active = extendStrategy === option.value;
                                        const disabled = Boolean(selectedEmployeeForExtend?.isBulk);
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                disabled={disabled && option.value === "PHASE_CUSTOM"}
                                                onClick={() => {
                                                    if (disabled && option.value === "PHASE_CUSTOM") return;
                                                    if (option.value === "PHASE_CUSTOM") {
                                                        setExtendStrategy("PHASE_CUSTOM");
                                                        extendForm.setFieldsValue({ cascade: false });
                                                    } else {
                                                        setExtendStrategy("CASCADE");
                                                        setExtendInputMode("DATE");
                                                        extendForm.setFieldsValue({ cascade: true });
                                                    }
                                                }}
                                                style={{
                                                    border: `1px solid ${active ? "#60a5fa" : "#e2e8f0"}`,
                                                    background: active ? "#eff6ff" : "#ffffff",
                                                    color: disabled && option.value === "PHASE_CUSTOM" ? "#94a3b8" : "#0f172a",
                                                    borderRadius: 10,
                                                    padding: "9px 10px",
                                                    textAlign: "left",
                                                    cursor: disabled && option.value === "PHASE_CUSTOM" ? "not-allowed" : "pointer",
                                                    opacity: disabled && option.value === "PHASE_CUSTOM" ? 0.65 : 1,
                                                }}
                                            >
                                                <div style={{ fontSize: 13, fontWeight: 800, color: active ? "#1d4ed8" : "#334155" }}>{option.title}</div>
                                                <div style={{ marginTop: 3, fontSize: 11, lineHeight: 1.3, color: "#64748b" }}>{option.desc}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                                <Form.Item name="cascade" hidden initialValue={true}>
                                    <Input />
                                </Form.Item>
                            </div>

                            {extendStrategy === "CASCADE" && extendInputMode === "DATE" && !(selectedEmployeeForExtend?.isBulk && extendDeadlineMode === "CUSTOM") && (
                                <Form.Item
                                    name="deadline"
                                    label={<span style={{ fontWeight: 700, color: "#334155" }}>Hạn mới của bước hiện tại</span>}
                                    rules={[{ required: true, message: "Vui lòng chọn hạn chót mới!" }]}
                                    extra={!selectedEmployeeForExtend?.isBulk ? "Mốc sau sẽ tự lùi theo đúng khoảng gia hạn của bước này." : "Hạn mới phải lớn hơn hạn hiện tại của từng hồ sơ."}
                                >
                                    <div style={{ display: "grid", gap: 8 }}>
                                        <DatePicker
                                            showTime
                                            format="DD/MM/YYYY HH:mm"
                                            style={{ width: "100%" }}
                                            placeholder="Chọn hạn chót mới"
                                            disabledDate={(date) => {
                                                const min = selectedEmployeeForExtend?.currentDeadline ? dayjs(selectedEmployeeForExtend.currentDeadline) : dayjs();
                                                return date.endOf("day").isBefore(min.startOf("day"));
                                            }}
                                        />
                                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                            {[1, 2, 3].map(days => (
                                                <Button
                                                    key={days}
                                                    size="small"
                                                    onClick={() => {
                                                        const base = selectedEmployeeForExtend?.currentDeadline
                                                            ? dayjs(selectedEmployeeForExtend.currentDeadline)
                                                            : dayjs();
                                                        extendForm.setFieldsValue({
                                                            deadline: base.add(days, "day").second(0).millisecond(0),
                                                        });
                                                    }}
                                                >
                                                    +{days} ngày
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </Form.Item>
                            )}

                            {extendStrategy === "CASCADE" && extendInputMode === "OFFSET" && !(selectedEmployeeForExtend?.isBulk && extendDeadlineMode === "CUSTOM") && (
                                <div style={{ display: "grid", gap: 12 }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                        <Form.Item
                                            name="offsetDays"
                                            label={<span style={{ fontWeight: 700, color: "#334155" }}>Cộng thêm ngày</span>}
                                            rules={[{ required: true, message: "Nhập số ngày" }]}
                                        >
                                            <InputNumber min={0} max={365} style={{ width: "100%" }} />
                                        </Form.Item>
                                        <Form.Item
                                            name="offsetHours"
                                            label={<span style={{ fontWeight: 700, color: "#334155" }}>Cộng thêm giờ</span>}
                                        >
                                            <InputNumber min={0} max={23} style={{ width: "100%" }} />
                                        </Form.Item>
                                    </div>
                                    <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #dbeafe", background: "#eff6ff" }}>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: "#1d4ed8" }}>Hạn mới dự kiến</div>
                                        <div style={{ marginTop: 6, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                                            {formatDeadline(getOffsetExtendDeadline(selectedEmployeeForExtend?.currentDeadline, Number(extendOffsetDays ?? 1), Number(extendOffsetHours ?? 0)).toISOString())}
                                        </div>
                                        <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
                                            Tăng thêm {formatDeadlineShift(selectedEmployeeForExtend?.currentDeadline, getOffsetExtendDeadline(selectedEmployeeForExtend?.currentDeadline, Number(extendOffsetDays ?? 1), Number(extendOffsetHours ?? 0)).toISOString())}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedEmployeeForExtend?.isBulk && (
                                <div style={{ display: "grid", gap: 10 }}>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Phạm vi áp dụng</div>
                                    <Select
                                        value={extendDeadlineMode}
                                        onChange={(value) => {
                                            setExtendDeadlineMode(value);
                                            if (value === "CUSTOM") setExtendInputMode("DATE");
                                        }}
                                        options={[
                                            { value: "SHARED", label: "Gia hạn đồng loạt" },
                                            { value: "CUSTOM", label: "Tùy chỉnh theo hồ sơ" },
                                        ]}
                                    />
                                </div>
                            )}

                            {extendStrategy === "PHASE_CUSTOM" && !selectedEmployeeForExtend?.isBulk && (
                                <div style={{ display: "grid", gap: 8, padding: 10, borderRadius: 12, border: "1px solid #dbeafe", background: "#f8fbff" }}>
                                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>Hạn riêng từng mốc</div>
                                    <div style={{ display: "grid", gap: 8 }}>
                                        {getEditableDeadlinePhases(selectedEmployeeForExtend?.phase as DeadlinePhase).map((phaseKey, index) => {
                                            const current = getRecordPhaseDeadline(selectedEmployeeForExtend, period, phaseKey);
                                            const previousPhase = getEditableDeadlinePhases(selectedEmployeeForExtend?.phase as DeadlinePhase)[index - 1];
                                            const quickBase = index === 0
                                                ? (current ? dayjs(current) : dayjs())
                                                : (phaseCustomDeadlines[previousPhase] ?? (previousPhase ? dayjs(getRecordPhaseDeadline(selectedEmployeeForExtend, period, previousPhase)) : dayjs()));
                                            const picked = phaseCustomDeadlines[phaseKey] ?? (current ? dayjs(current) : null);
                                            return (
                                                <div key={phaseKey} style={{ display: "grid", gap: 8, padding: "9px 10px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#ffffff" }}>
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                                                        <div style={{ minWidth: 0 }}>
                                                            <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a", lineHeight: 1.25 }}>
                                                                {DEADLINE_PHASE_LABELS[phaseKey]}
                                                            </div>
                                                            <div style={{ marginTop: 3, fontSize: 11.5, color: "#64748b" }}>
                                                                Hiện tại: <strong style={{ color: "#334155" }}>{current ? dayjs(current).format("DD/MM HH:mm") : "—"}</strong>
                                                            </div>
                                                        </div>
                                                        <Tag color={index === 0 ? "blue" : "purple"} style={{ margin: 0, flexShrink: 0 }}>
                                                            {index === 0 ? "Đang chỉnh" : "Sau"}
                                                        </Tag>
                                                    </div>
                                                    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 8, alignItems: "center" }}>
                                                        <DatePicker
                                                            showTime
                                                            format="DD/MM/YYYY HH:mm"
                                                            style={{ width: "100%" }}
                                                            value={picked}
                                                            onChange={(nextValue) => setPhaseCustomDeadlines(prev => ({ ...prev, [phaseKey]: nextValue }))}
                                                            disabledDate={(date) => {
                                                                const min = index === 0
                                                                    ? (current ? dayjs(current) : dayjs())
                                                                    : (quickBase || dayjs());
                                                                return date.endOf("day").isBefore(min.startOf("day"));
                                                            }}
                                                        />
                                                        <div style={{ display: "flex", gap: 4, flexWrap: "nowrap" }}>
                                                            {[1, 2, 3].map(days => (
                                                                <Button
                                                                    key={days}
                                                                    size="small"
                                                                    onClick={() => {
                                                                        const base = quickBase || dayjs();
                                                                        setPhaseCustomDeadlines(prev => ({
                                                                            ...prev,
                                                                            [phaseKey]: base.add(days, "day").second(0).millisecond(0),
                                                                        }));
                                                                    }}
                                                                >
                                                                    +{days}
                                                                </Button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        <Form.Item
                            name="reason"
                            label={<span style={{ fontWeight: 700, color: "#334155" }}>Lý do gia hạn</span>}
                            rules={[{ required: true, whitespace: true, message: "Vui lòng nhập lý do gia hạn!" }]}
                            style={{ marginBottom: 0 }}
                        >
                            <Input.TextArea rows={3} placeholder="Nhập lý do gia hạn..." />
                        </Form.Item>
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                        <Button onClick={() => { setExtendModalOpen(false); setSelectedEmployeeForExtend(null); setExtendDeadlineMode("SHARED"); setExtendInputMode("DATE"); setExtendStrategy("CASCADE"); setCustomExtendDeadlines({}); setPhaseCustomDeadlines({}); }}>
                            Hủy
                        </Button>
                        <Button type="primary" htmlType="submit" loading={extending}>
                            Gia hạn
                        </Button>
                    </div>
                </Form>

                <aside style={{ display: "grid", gap: 10, alignContent: "start" }}>
                    <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14, boxShadow: "0 4px 14px -12px rgba(15,23,42,0.18)", alignSelf: "start" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                            <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                                Xem trước tác động
                            </div>
                            {selectedEmployeeForExtend?.isBulk && extendDeadlineMode === "CUSTOM" ? (
                                <Tag color="gold" style={{ margin: 0 }}>Tùy chỉnh</Tag>
                            ) : extendStrategy === "PHASE_CUSTOM" ? (
                                <Tag color="purple" style={{ margin: 0 }}>Chỉnh từng mốc</Tag>
                            ) : (
                                <Tag color="green" style={{ margin: 0 }}>Tịnh tiến</Tag>
                            )}
                        </div>

                        {selectedEmployeeForExtend?.isBulk && extendDeadlineMode === "CUSTOM" ? (
                            <div style={{ display: "grid", gap: 10 }}>
                                <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>
                                    Hạn riêng cho từng hồ sơ
                                </div>
                                <div style={{ display: "grid", gap: 10, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
                                    {extendRecordRows.map((record: any) => {
                                        const recordId = String(record.recordId ?? record.id);
                                        const current = getRecordPhaseDeadline(record, period, selectedEmployeeForExtend.phase as DeadlinePhase);
                                        const value = customExtendDeadlines[recordId] ?? (current ? dayjs(current) : null);
                                        return (
                                            <div key={recordId} style={{ padding: "12px 12px 14px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#fafafa" }}>
                                                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                                                    <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{record.employee?.name || record.employee?.username || `Hồ sơ ${recordId}`}</div>
                                                    <Tag color="blue" style={{ margin: 0 }}>Cá nhân</Tag>
                                                </div>
                                                <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                                                    Hạn hiện tại: <strong style={{ color: "#334155" }}>{formatDeadline(current)}</strong>
                                                </div>
                                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 6, marginTop: 10 }}>
                                                    {(["EMPLOYEE", "MANAGER", "APPROVAL"] as DeadlinePhase[]).map(phaseKey => {
                                                        const phaseDeadline = getRecordPhaseDeadline(record, period, phaseKey);
                                                        const hasOverride =
                                                            (phaseKey === "EMPLOYEE" && !!record.employeeDeadlineOverride) ||
                                                            (phaseKey === "MANAGER" && !!record.managerDeadlineOverride) ||
                                                            (phaseKey === "APPROVAL" && !!record.approvalDeadlineOverride);
                                                        return (
                                                            <div key={phaseKey} style={{ padding: "7px 8px", borderRadius: 8, background: hasOverride ? "#eff6ff" : "#ffffff", border: `1px solid ${hasOverride ? "#bfdbfe" : "#e2e8f0"}` }}>
                                                                <div style={{ fontSize: 10, fontWeight: 800, color: hasOverride ? "#1d4ed8" : "#94a3b8" }}>
                                                                    {phaseKey === "EMPLOYEE" ? "NV" : phaseKey === "MANAGER" ? "QL" : "Duyệt"}
                                                                </div>
                                                                <div style={{ marginTop: 3, fontSize: 10.5, fontWeight: 700, color: "#334155", whiteSpace: "nowrap" }}>
                                                                    {phaseDeadline ? dayjs(phaseDeadline).format("DD/MM HH:mm") : "—"}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                <div style={{ marginTop: 10 }}>
                                                    <DatePicker
                                                        showTime
                                                        format="DD/MM/YYYY HH:mm"
                                                        style={{ width: "100%" }}
                                                        value={value}
                                                        onChange={(nextValue) => {
                                                            setCustomExtendDeadlines(prev => ({
                                                                ...prev,
                                                                [recordId]: nextValue,
                                                            }));
                                                        }}
                                                        disabledDate={(date) => {
                                                            const min = current ? dayjs(current) : dayjs();
                                                            return date.endOf("day").isBefore(min.startOf("day"));
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #dbeafe", background: "#eff6ff", color: "#1d4ed8", fontSize: 12, lineHeight: 1.6 }}>
                                    Mỗi hồ sơ có thể nhận một hạn riêng. Khi bật tịnh tiến, phần sau của từng hồ sơ sẽ đi theo độ lùi riêng của hồ sơ đó.
                                </div>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: "grid", gap: 8, marginBottom: 0 }}>
                                    {extendPreview?.phaseRows.map((row) => (
                                        <div key={row.phase} style={{ display: "grid", gap: 8, padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: row.cascadeState === "selected" ? "#eff6ff" : row.cascadeState === "cascade" ? "#f0fdf4" : "#ffffff" }}>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                                                    <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0f172a", lineHeight: 1.25 }}>{row.label}</div>
                                                    <Tag color={row.cascadeState === "selected" ? "blue" : row.cascadeState === "cascade" ? "green" : row.cascadeState === "custom" ? "purple" : "default"} style={{ margin: 0, flexShrink: 0 }}>
                                                        {row.cascadeState === "selected" ? (extendStrategy === "PHASE_CUSTOM" ? "Tùy chỉnh" : "Gia hạn") : row.cascadeState === "custom" ? "Tùy chỉnh" : row.cascadeState === "cascade" ? "Tịnh tiến" : "Giữ nguyên"}
                                                    </Tag>
                                                </div>
                                            </div>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto", gap: 8, alignItems: "center", fontSize: 11.5, color: "#475569" }}>
                                                <strong style={{ color: "#334155", whiteSpace: "nowrap" }}>{row.current ? dayjs(row.current).format("DD/MM HH:mm") : "—"}</strong>
                                                <RightOutlined style={{ color: "#94a3b8", fontSize: 10 }} />
                                                <strong style={{ color: "#0f172a", whiteSpace: "nowrap" }}>{row.projected ? dayjs(row.projected).format("DD/MM HH:mm") : "—"}</strong>
                                                <span style={{ color: "#64748b", whiteSpace: "nowrap" }}>{formatDeadlineShift(row.current, row.projected)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {selectedEmployeeForExtend?.isBulk && extendPreview?.bulkRows?.length > 1 && (
                                    <div style={{ paddingTop: 14, borderTop: "1px solid #e2e8f0" }}>
                                        <div style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>
                                            Tác động theo từng hồ sơ
                                        </div>
                                        <div style={{ display: "grid", gap: 10 }}>
                                            {extendPreview?.bulkRows?.map((row: any) => (
                                                <div key={row.id} style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fafafa" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{row.name}</div>
                                                        <Tag color={row.cascade ? "green" : "default"} style={{ margin: 0 }}>
                                                            {row.cascade ? "Tịnh tiến" : "Giữ nguyên"}
                                                        </Tag>
                                                    </div>
                                                    <div style={{ marginTop: 6, fontSize: 12, color: "#475569" }}>
                                                        {formatDeadline(row.current)} → {formatDeadline(row.next)}
                                                    </div>
                                                    <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>
                                                        {row.shift}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <div style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: 11.5, lineHeight: 1.5, alignSelf: "start" }}>
                        Tịnh tiến luôn giữ đúng thứ tự luồng: quản lý trực tiếp xong mới tới quản lý gián tiếp. Chỉnh từng mốc dùng khi cần chia hạn riêng.
                    </div>
                </aside>
            </div>
        </Modal>

        <Modal
            title={
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "15px" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                        Điều chuyển người chấm/duyệt đánh giá
                    </span>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                        Đối tượng: <strong style={{ color: "#722ed1" }}>{selectedEmployeeForReassign?.employee?.name || selectedEmployeeForReassign?.employee?.username}</strong>
                    </div>
                </div>
            }
            open={reassignModalOpen && !managerPickerOpen}
            onCancel={() => { setReassignModalOpen(false); setSelectedEmployeeForReassign(null); setManagerPickerOpen(false); }}
            footer={null}
            destroyOnHidden
            centered
            width={450}
        >
            <Form form={reassignForm} layout="vertical" onFinish={handleReassignSubmit}>
                <Form.Item
                    name="evaluatorRole"
                    label={<span style={{ fontWeight: 600, color: "#475569" }}>Vai trò điều chuyển</span>}
                    rules={[{ required: true, message: "Vui lòng chọn vai trò điều chuyển!" }]}
                    initialValue="DIRECT_MANAGER"
                >
                    <Select options={[
                        { label: "Quản lý trực tiếp (DIRECT_MANAGER)", value: "DIRECT_MANAGER" },
                        { label: "Quản lý gián tiếp / Người duyệt (INDIRECT_MANAGER)", value: "INDIRECT_MANAGER" },
                    ]} />
                </Form.Item>

                <Form.Item
                    name="newEvaluatorUserId"
                    label={<span style={{ fontWeight: 600, color: "#475569" }}>Người chấm/duyệt mới</span>}
                    rules={[{ required: true, message: "Vui lòng chọn người chấm/duyệt mới!" }]}
                >
                    <Input type="hidden" />
                </Form.Item>
                <Button
                    onClick={() => setManagerPickerOpen(true)}
                    style={{ width: "100%", height: 54, marginTop: -18, marginBottom: 18, padding: "7px 10px", display: "flex", alignItems: "center", textAlign: "left", borderColor: selectedReassignEvaluator ? "#f3a5bd" : "#d9d9d9" }}
                >
                    <span style={{ width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#e8356d", background: "#fff0f5", borderRadius: 5 }}>
                        <UserOutlined />
                    </span>
                    <span style={{ flex: 1, minWidth: 0, margin: "0 9px" }}>
                        <span style={{ display: "block", color: "#1e293b", fontSize: 12, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {selectedReassignEvaluator?.name || "Chọn người chấm/duyệt mới"}
                        </span>
                        <span style={{ display: "block", marginTop: 2, color: "#64748b", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {selectedReassignEvaluator
                                ? [selectedReassignEvaluator.jobTitle, selectedReassignEvaluator.positionLevel, selectedReassignEvaluator.departmentName, selectedReassignEvaluator.companyName].filter(Boolean).join(" · ") || selectedReassignEvaluator.email
                                : "Tìm theo mã NV, chức danh, cấp bậc và đơn vị"}
                        </span>
                    </span>
                    <RightOutlined style={{ color: "#94a3b8", fontSize: 11 }} />
                </Button>

                <Form.Item
                    name="reason"
                    label={<span style={{ fontWeight: 600, color: "#475569" }}>Lý do điều chuyển</span>}
                    style={{ marginBottom: 20 }}
                >
                    <Input.TextArea rows={3} placeholder="Nhập lý do điều chuyển..." />
                </Form.Item>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                    <Button onClick={() => { setReassignModalOpen(false); setSelectedEmployeeForReassign(null); }}>
                        Hủy
                    </Button>
                    <Button type="primary" htmlType="submit" loading={reassigning}>
                        Điều chuyển
                    </Button>
                </div>
            </Form>
        </Modal>

        <ManagerPickerModal
            open={managerPickerOpen}
            onClose={() => setManagerPickerOpen(false)}
            onSelect={handleSelectReassignEvaluator}
            title="Chọn người chấm/duyệt mới"
            description="Tìm và chọn nhân sự theo mã nhân viên, chức danh, cấp bậc và đơn vị"
        />

        <UserPickerModal
            open={employeePickerOpen}
            onClose={() => setEmployeePickerOpen(false)}
            companyId={period?.company?.id ?? selectedCompanyId}
            selectedIds={selectedEmployeeIds || []}
            onChange={handlePickerChange}
            sourceUsers={pickerSourceUsers}
            filterDepartmentIds={selectedDepartmentIds}
            departmentOptions={departments.map(d => ({ label: d.name, value: d.id }))}
            isCrossCompany={true}
            title="Chọn nhân sự áp dụng mẫu"
            confirmText="Thêm vào mẫu"
            hasDirectManager={true}
        />
    </>
    );
};

export default PeriodDetailDrawer;
