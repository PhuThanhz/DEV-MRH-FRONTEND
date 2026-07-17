import { Modal, Table, Form, Select, Button, Popconfirm, Tag, Row, Col, Empty, Tooltip, DatePicker, Input, Checkbox } from "antd";
import { useState, useEffect, useMemo, useRef } from "react";
import useAccess from "@/hooks/useAccess";
import { useAppSelector } from "@/redux/hooks";
import dayjs from "dayjs";
import { notify } from "@/components/common/notification/notify";
import {
    PlusOutlined,
    DeleteOutlined,
    BookOutlined,
    TeamOutlined,
    UserAddOutlined,
    CalendarOutlined,
    InfoCircleOutlined,
    WarningOutlined,
    UserOutlined,
    RightOutlined,
} from "@ant-design/icons";
import {
    callFetchTemplatesInPeriod,
    callAddTemplateToPeriod,
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

type DeadlinePhase = "EMPLOYEE" | "MANAGER" | "APPROVAL";

const DEADLINE_PHASE_LABELS: Record<DeadlinePhase, string> = {
    EMPLOYEE: "Nhân viên tự đánh giá",
    MANAGER: "Quản lý trực tiếp chấm",
    APPROVAL: "Quản lý gián tiếp duyệt",
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

const isRecordDeadlineOverdue = (record: any, period: IEvaluationPeriod | null) => {
    const deadline = getRecordPhaseDeadline(record, period);
    return !!deadline && dayjs().isAfter(dayjs(deadline));
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderUserOption = (u: any) => {
    if (!u) return null;
    return (
        <div style={{ display: "flex", flexDirection: "column", padding: "4px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontWeight: 700, color: "#1e293b", fontSize: "13px" }}>{u.name}</span>
                {u.positionLevel && (
                    <span style={{
                        fontSize: "10px",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        fontWeight: 600,
                        border: "1px solid #dbeafe"
                    }}>
                        {u.positionLevel}
                    </span>
                )}
            </div>
            <div style={{ 
                fontSize: "11px", 
                color: "#64748b", 
                marginTop: "4px",
                whiteSpace: "nowrap", 
                overflow: "hidden", 
                textOverflow: "ellipsis" 
            }}>
                <span style={{ color: "#4f46e5", fontWeight: 600 }}>{u.jobTitle || "Không có chức danh"}</span>
                {u.departmentName && ` | ${u.departmentName}`}
            </div>
        </div>
    );
};

interface IProps {
    open: boolean;
    onClose: () => void;
    period: IEvaluationPeriod | null;
    readOnly?: boolean;
}

const PeriodDetailDrawer = (props: IProps) => {
    const { open, onClose, period, readOnly = false } = props;
    const roleName = useAppSelector(state => state.account.user.role?.name?.toUpperCase() || "");
    const isSuperAdmin = roleName === "SUPER_ADMIN";
    const canExtendDeadline = useAccess(ALL_PERMISSIONS.EVALUATION.EXTEND_RECORD_DEADLINE);
    const canReassignEvaluator = useAccess(ALL_PERMISSIONS.EVALUATION.REASSIGN_EVALUATOR);
    const canCancelEmployee = useAccess(ALL_PERMISSIONS.EVALUATION.CANCEL_PERIOD_EMPLOYEE);

    // Form instances
    const [templateForm] = Form.useForm();
    const [employeeForm] = Form.useForm();
    const [extendForm] = Form.useForm();
    const selectedEmployeeIds = Form.useWatch("employeeId", employeeForm);

    // Data states
    const [extendModalOpen, setExtendModalOpen] = useState(false);
    const [selectedEmployeeForExtend, setSelectedEmployeeForExtend] = useState<any>(null);
    const [extending, setExtending] = useState(false);

    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    const [reassignForm] = Form.useForm();
    const [reassignModalOpen, setReassignModalOpen] = useState(false);
    const [selectedEmployeeForReassign, setSelectedEmployeeForReassign] = useState<any>(null);
    const [selectedReassignEvaluator, setSelectedReassignEvaluator] = useState<any>(null);
    const [managerPickerOpen, setManagerPickerOpen] = useState(false);
    const [reassigning, setReassigning] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [linkedTemplates, setLinkedTemplates] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [linkedEmployees, setLinkedEmployees] = useState<any[]>([]);
    const [activeTemplates, setActiveTemplates] = useState<IEvaluationTemplate[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [allUsers, setAllUsers] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
    const referenceDataPeriodIdRef = useRef<number | null>(null);

    // Loading states
    const [, setLoadingTemplates] = useState(false);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [submittingTemplate, setSubmittingTemplate] = useState(false);
    const [submittingEmployee, setSubmittingEmployee] = useState(false);
    const [loadingAssignmentReferenceData, setLoadingAssignmentReferenceData] = useState(false);

    // Fetch initial templates & users on open
    useEffect(() => {
        if (open && period?.id) {
            fetchLinkedTemplates();
            fetchLinkedEmployees();
            referenceDataPeriodIdRef.current = null;
            setSelectedCompanyId(period.company?.id ?? null);
            setSelectedDepartmentId(null);
            setDepartments([]);
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

    const handleCompanyFilterChange = async (value: number | null) => {
        setSelectedCompanyId(value);
        setSelectedDepartmentId(null);
        setDepartments([]);
        if (value) {
            try {
                const res = await callFetchDepartmentsByCompany(value);
                if (res?.data) {
                    setDepartments(res.data);
                }
            } catch {
                // ignore
            }
        }
    };

    const filteredUsers = useMemo(() => allUsers.filter(u => {
        // Khi kỳ đã có công ty, API người dùng đã lọc theo companyId; không cần
        // tải thêm danh sách công ty và so sánh chuỗi ở phía trình duyệt.
        if (selectedCompanyId && !period?.company?.id) {
            const comp = companies.find(c => c.id === selectedCompanyId);
            if (!comp) return false;
            if (!u.companyName || u.companyName.trim().toLowerCase() !== comp.name.trim().toLowerCase()) {
                return false;
            }
        }
        if (selectedDepartmentId) {
            const dept = departments.find(d => d.id === selectedDepartmentId);
            if (!dept) return false;
            if (!u.departmentName || u.departmentName.trim().toLowerCase() !== dept.name.trim().toLowerCase()) {
                return false;
            }
        }
        return true;
    }), [allUsers, selectedCompanyId, selectedDepartmentId, period?.company?.id, companies, departments]);
    const selectedEmployeeIdSet = useMemo(() => new Set(
        (Array.isArray(selectedEmployeeIds) ? selectedEmployeeIds : [selectedEmployeeIds]).filter(Boolean)
    ), [selectedEmployeeIds]);
    const eligibleDirectManagers = useMemo(() => filteredUsers.filter((user) =>
        user.active !== false && !!user.directManagerId && !selectedEmployeeIdSet.has(user.id)
    ), [filteredUsers, selectedEmployeeIdSet]);
    const employeeOptions = useMemo(() => filteredUsers
        .filter(user => user.active !== false)
        .map(user => {
            const jobInfo = [user.jobTitle, user.positionLevel].filter(Boolean).join(" - ");
            const deptOrComp = [user.departmentName, user.companyName].filter(Boolean).join(" - ");
            const detail = [jobInfo, deptOrComp].filter(Boolean).join(" | ");
            return { label: user.name, value: user.id, searchValue: `${user.name} ${detail}`, rawUser: user };
        }), [filteredUsers]);
    const directManagerOptions = useMemo(() => eligibleDirectManagers.map(user => {
        const jobInfo = [user.jobTitle, user.positionLevel].filter(Boolean).join(" - ");
        const deptOrComp = [user.departmentName, user.companyName].filter(Boolean).join(" - ");
        const detail = [jobInfo, deptOrComp].filter(Boolean).join(" | ");
        return { label: user.name, value: user.id, searchValue: `${user.name} ${detail}`, rawUser: user };
    }), [eligibleDirectManagers]);

    const handleEmployeeChange = (employeeId: string) => {
        const emp = allUsers.find(u => u.id === employeeId);
        if (emp && emp.directManagerId) {
            employeeForm.setFieldsValue({
                directManagerId: emp.directManagerId
            });
        } else {
            employeeForm.setFieldsValue({
                directManagerId: undefined
            });
        }
    };

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
            notify.error("Lỗi tải danh sách biểu mẫu trong kỳ");
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
            notify.error("Lỗi tải danh sách nhân sự tham gia");
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

    const loadAllUsers = async () => {
        try {
            const res = await callFetchUsersCrossCompany(`companyId=${period?.company?.id || ''}&page=1&size=500`);
            if (res?.data?.result) {
                setAllUsers(res.data.result);
            }
        } catch {
            // ignore
        }
    };

    const loadAssignmentReferenceData = async () => {
        if (!period?.id || period.status !== "DRAFT" || referenceDataPeriodIdRef.current === period.id) return;

        referenceDataPeriodIdRef.current = period.id;
        setLoadingAssignmentReferenceData(true);
        try {
            await Promise.all([
                loadActiveTemplates(),
                loadAllUsers(),
                period.company?.id
                    ? handleCompanyFilterChange(period.company.id)
                    : loadCompanies(),
            ]);
        } finally {
            setLoadingAssignmentReferenceData(false);
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
            const msg = error?.response?.data?.message || "Lỗi liên kết biểu mẫu";
            notify.error(msg);
        } finally {
            setSubmittingTemplate(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAddEmployee = async (values: any) => {
        if (!period?.id || !selectedTemplateId) return;
        const employeeIds: string[] = Array.isArray(values.employeeId) ? values.employeeId : [values.employeeId];
        if (employeeIds.length === 0) return;
        setSubmittingEmployee(true);
        try {
            let successCount = 0;
            const failed: string[] = [];
            for (const empId of employeeIds) {
                try {
                    await callAddEmployeeToPeriod(period.id, {
                        employeeId: empId,
                        directManagerId: values.directManagerId,
                        templateId: selectedTemplateId,
                    });
                    successCount++;
                } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                    const empName = allUsers.find(u => u.id === empId)?.name || empId;
                    failed.push(`${empName}: ${error?.response?.data?.message || "lỗi"}`);
                }
            }
            if (successCount > 0) {
                notify.success(`Đã thêm ${successCount} nhân viên vào kỳ`);
                employeeForm.resetFields(["employeeId", "directManagerId"]);
                fetchLinkedEmployees();
            }
            if (failed.length > 0) {
                notify.warning(`${failed.length} nhân viên không thêm được: ${failed.join("; ")}`);
            }
        } finally {
            setSubmittingEmployee(false);
        }
    };

    const handleCancelEmployee = async (id: number) => {
        try {
            const res = await callCancelPeriodEmployee(id);
            if (res?.data) {
                notify.success("Đã hủy bản đánh giá của nhân viên");
                fetchLinkedEmployees();
            }
        } catch {
            notify.error("Lỗi hủy bản đánh giá");
        }
    };

    const handleOpenExtendModal = (record: any) => {
        if (!isRecordDeadlineOverdue(record, period)) {
            notify.warning("Chỉ có thể gia hạn khi bước xử lý hiện tại đã quá hạn");
            return;
        }
        const phase = getRecordDeadlinePhase(record.recordStatus);
        setSelectedEmployeeForExtend({
            ...record,
            phase,
            currentDeadline: getRecordPhaseDeadline(record, period, phase),
        });
        extendForm.resetFields();
        extendForm.setFieldsValue({ cascade: true });
        setExtendModalOpen(true);
    };

    const handleExtendDeadlineSubmit = async (values: any) => {
        if (!selectedEmployeeForExtend) return;
        const recordIds = selectedEmployeeForExtend.isBulk
            ? selectedEmployeeForExtend.recordId
            : [selectedEmployeeForExtend.recordId];

        if (!recordIds || recordIds.length === 0) return;
        setExtending(true);
        try {
            const res = await callExtendEvaluationRecordDeadline({
                recordIds,
                phase: selectedEmployeeForExtend.phase,
                deadline: values.deadline.toISOString(),
                reason: values.reason,
                cascade: values.cascade,
            });
            if (res?.data) {
                notify.success("Gia hạn thành công!");
                setExtendModalOpen(false);
                setSelectedEmployeeForExtend(null);
                setSelectedRowKeys([]);
                fetchLinkedEmployees();
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Lỗi gia hạn bản đánh giá";
            notify.error(msg);
        } finally {
            setExtending(false);
        }
    };

    const handleBulkExtend = () => {
        const selectedRecords = employeesForSelectedTemplate.filter(e => selectedRowKeys.includes(e.id));
        const eligibleRecords = selectedRecords.filter(record => record.recordId && isRecordDeadlineOverdue(record, period));
        const recordIds = eligibleRecords.map(e => e.recordId).filter(Boolean);
        
        if (eligibleRecords.length !== selectedRecords.length || recordIds.length === 0) {
            notify.warning("Chỉ chọn các hồ sơ đã quá hạn để gia hạn hàng loạt");
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

        setSelectedEmployeeForExtend({
            employee: { name: `${recordIds.length} nhân sự đã chọn` },
            recordId: recordIds,
            isBulk: true,
            phase,
            currentDeadline: latestDeadline.toISOString(),
        });
        extendForm.resetFields();
        extendForm.setFieldsValue({ cascade: true });
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
                    r.reason?.response?.data?.message || r.reason?.message || "Lỗi không xác định"
                );
                const uniqueErrors = Array.from(new Set(errorMessages));
                notify.error(`Hủy gán thất bại ${rejected.length}/${selectedRowKeys.length} nhân viên. Lỗi: ${uniqueErrors.join(", ")}`);
            } else {
                notify.success("Hủy gán hàng loạt thành công!");
            }
            
            setSelectedRowKeys([]);
            fetchLinkedEmployees();
        } catch (error: any) {
            notify.error("Có lỗi xảy ra khi hủy gán hàng loạt.");
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
                notify.success("Điều chuyển thành công!");
                setReassignModalOpen(false);
                setSelectedEmployeeForReassign(null);
                setSelectedRowKeys([]);
                fetchLinkedEmployees();
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Lỗi điều chuyển người chấm/duyệt";
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
            width: 155,
            render: (_: any, record: any) => {
                if (record.status !== "ACTIVE") {
                    return (
                        <Tag color="default" style={{ fontWeight: 600, borderRadius: 12, border: "1px solid #e2e8f0" }}>
                            Đã hủy tham gia
                        </Tag>
                    );
                }
                if (!record.recordId) {
                    return (
                        <Tag color="default" style={{ fontWeight: 600, borderRadius: 12, border: "1px solid #e2e8f0" }}>
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

                if (isEmpOverdue) {
                    return (
                        <Tag color="error" style={{ fontWeight: 600, borderRadius: 12, padding: "2px 8px" }}>
                            Trễ hạn tự đánh giá
                        </Tag>
                    );
                }

                if (isMgrOverdue) {
                    return (
                        <Tag color="error" style={{ fontWeight: 600, borderRadius: 12, padding: "2px 8px" }}>
                            Trễ hạn chấm điểm
                        </Tag>
                    );
                }

                if (isAppOverdue) {
                    return (
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
                return (
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
                        {record.recordId && isRecordDeadlineOverdue(record, period) && (
                            <Access permission={ALL_PERMISSIONS.EVALUATION.EXTEND_RECORD_DEADLINE} hideChildren>
                                <Button
                                    type="text"
                                    icon={<CalendarOutlined style={{ fontSize: 13 }} />}
                                    title="Gia hạn đánh giá"
                                    style={{ 
                                        borderRadius: "6px", 
                                        display: "inline-flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        width: "26px",
                                        height: "26px",
                                        background: "rgba(59, 130, 246, 0.04)",
                                        border: "1px solid rgba(59, 130, 246, 0.08)",
                                        color: "#3b82f6",
                                        transition: "all 0.2s"
                                    }}
                                    onClick={() => handleOpenExtendModal(record)}
                                    className="btn-extend-action"
                                />
                            </Access>
                        )}

                        {record.recordId && (
                            <Access permission={ALL_PERMISSIONS.EVALUATION.REASSIGN_EVALUATOR} hideChildren>
                                <Button
                                    type="text"
                                    icon={<TeamOutlined style={{ fontSize: 13 }} />}
                                    title="Điều chuyển người chấm/duyệt"
                                    style={{ 
                                        borderRadius: "6px", 
                                        display: "inline-flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        width: "26px",
                                        height: "26px",
                                        background: "rgba(114, 46, 209, 0.04)",
                                        border: "1px solid rgba(114, 46, 209, 0.08)",
                                        color: "#722ed1",
                                        transition: "all 0.2s"
                                    }}
                                    onClick={() => handleOpenReassignModal(record)}
                                />
                            </Access>
                        )}

                        <Access permission={ALL_PERMISSIONS.EVALUATION.CANCEL_PERIOD_EMPLOYEE} hideChildren>
                            <Popconfirm
                                title="Bạn có chắc chắn muốn hủy gán nhân viên này khỏi kỳ đánh giá?"
                                onConfirm={() => handleCancelEmployee(record.id)}
                                okText="Đồng ý"
                                cancelText="Hủy"
                                placement="topRight"
                            >
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined style={{ fontSize: 13 }} />}
                                    title="Hủy gán nhân viên"
                                    style={{ 
                                        borderRadius: "6px", 
                                        display: "inline-flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        width: "26px",
                                        height: "26px",
                                        background: "rgba(239, 68, 68, 0.04)",
                                        border: "1px solid rgba(239, 68, 68, 0.08)",
                                        transition: "all 0.2s"
                                    }}
                                    className="btn-delete-action"
                                />
                            </Popconfirm>
                        </Access>
                    </div>
                );
            },
        },
    ];

    const activeT = linkedTemplates.find(t => t.template?.id === selectedTemplateId);
    const employeesForSelectedTemplate = linkedEmployees.filter(
        emp => emp.template?.id === selectedTemplateId
    );
    const activeEmployeesForTemplate = employeesForSelectedTemplate.filter(emp => emp.status === "ACTIVE");
    const missingDirectManagerCount = activeEmployeesForTemplate.filter(emp => !emp.directManager?.id).length;
    const missingIndirectManagerCount = activeEmployeesForTemplate.filter(emp => !emp.indirectManager?.id).length;
    const canManageEmployeeActions = !readOnly && (isSuperAdmin || canExtendDeadline || canReassignEvaluator || canCancelEmployee);
    const visibleEmployeeColumns = readOnly
        ? employeeColumns.filter(column => column.key !== "action")
        : employeeColumns;

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
                        <div className="period-config-title__label">{readOnly ? "Chi tiết kỳ đánh giá" : "Thiết lập kỳ đánh giá"}</div>
                        <div className="period-config-title__name">{period?.name}</div>
                    </div>
                    <div className="period-config-title__meta">
                        {period?.company?.name && <Tag style={{ margin: 0, borderRadius: 999, border: "none", background: "#f1f5f9", color: "#475569" }}>{period.company.name}</Tag>}
                        <Tag color={period?.status === "DRAFT" ? "default" : period?.status === "ACTIVE" ? "processing" : "default"} style={{ margin: 0, borderRadius: 999 }}>
                            {period?.status === "DRAFT" ? "Bản nháp" : period?.status === "ACTIVE" ? "Đang mở" : "Đã đóng"}
                        </Tag>
                    </div>
                </div>
            <style>{`
                .period-config-drawer { height: 100%; min-height: 0; display: flex; flex-direction: column; background: #fff; }
                .period-config-title {
                    min-height: 76px;
                    flex: 0 0 auto;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 24px;
                    border-bottom: 1px solid #e9eef5;
                    background: #ffffff;
                }
                .period-config-title__icon {
                    width: 38px;
                    height: 38px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 12px;
                    background: #fff1f7;
                    color: #e11d72;
                    font-size: 18px;
                }
                .period-config-title__content { min-width: 0; }
                .period-config-title__label { color: #64748b; font-size: 12px; font-weight: 650; }
                .period-config-title__name { margin-top: 2px; color: #172033; font-size: 18px; font-weight: 760; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .period-config-title__meta { display: flex; align-items: center; gap: 6px; margin-left: auto; flex-wrap: wrap; justify-content: flex-end; }
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
                .btn-delete-action:hover {
                    background: rgba(239, 68, 68, 0.1) !important;
                    border-color: rgba(239, 68, 68, 0.2) !important;
                    color: #dc2626 !important;
                }
                @media (max-width: 1100px) {
                    .period-config-layout { grid-template-columns: minmax(0, 1fr); overflow-y: auto; }
                    .period-config-sidebar { overflow: visible; border-right: 0; border-bottom: 1px solid #e9eef5; }
                    .period-config-main { overflow: visible; }
                }
                @media (max-width: 767px) {
                    .period-config-title { padding: 16px 54px 16px 16px; align-items: flex-start; }
                    .period-config-title__meta { margin-left: 0; width: 100%; justify-content: flex-start; }
                    .period-config-title { flex-wrap: wrap; }
                    .period-config-title__name { white-space: normal; font-size: 16px; }
                }
            `}</style>
            <div className="period-config-layout">
                <aside className="period-config-sidebar">
                    <div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                            <BookOutlined style={{ color: "#3b82f6", fontSize: "13px" }} />
                            <span>BIỂU MẪU ĐÃ GÁN ({linkedTemplates.length})</span>
                        </div>

                        {!readOnly && period?.status === "DRAFT" ? (
                            <Form 
                                form={templateForm} 
                                layout="vertical" 
                                onFinish={handleAddTemplate} 
                                style={{ 
                                    background: "rgba(248, 250, 252, 0.65)", 
                                    padding: "12px", 
                                    borderRadius: "8px", 
                                    border: "1px solid rgba(226, 232, 240, 0.8)", 
                                    marginBottom: "12px" 
                                }}
                            >
                                <Form.Item
                                    name="templateId"
                                    rules={[{ required: true, message: "Hãy chọn mẫu!" }]}
                                    style={{ marginBottom: 8 }}
                                    label={<span style={{ fontWeight: 600, color: "#475569", fontSize: "11.5px" }}>Chọn mẫu đánh giá</span>}
                                >
                                    <Select
                                        showSearch
                                        placeholder="Chọn Mẫu đánh giá..."
                                        optionFilterProp="label"
                                        options={activeTemplates.map(t => ({ label: t.name, value: t.id }))}
                                        loading={loadingAssignmentReferenceData}
                                        onFocus={() => { void loadAssignmentReferenceData(); }}
                                        styles={{ popup: { root: { borderRadius: 8 } } }}
                                        size="small"
                                    />
                                </Form.Item>

                                <Access permission={ALL_PERMISSIONS.EVALUATION.ADD_TEMPLATE_TO_PERIOD} hideChildren>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={submittingTemplate}
                                        icon={<PlusOutlined />}
                                        size="small"
                                        block
                                        style={{
                                            borderRadius: "6px",
                                            fontWeight: 600,
                                            background: "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
                                            border: "none",
                                            boxShadow: "0 2px 6px rgba(22, 119, 255, 0.15)",
                                            height: "28px",
                                            fontSize: "11.5px"
                                        }}
                                    >
                                        Gán mẫu vào kỳ
                                    </Button>
                                </Access>
                            </Form>
                        ) : (
                            <div style={{
                                background: "#fffbeb",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                border: "1px solid #fef3c7",
                                color: "#b45309",
                                fontSize: "12px",
                                fontWeight: 500,
                                marginBottom: "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                            }}>
                                <span style={{ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", background: "#b45309" }} />
                                Kỳ đã được kích hoạt. Không thể thay đổi biểu mẫu, nhưng vẫn có thể theo dõi và xử lý nhân sự theo quyền được cấp.
                            </div>
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
                                const empCount = linkedEmployees.filter(emp => emp.template?.id === t.template?.id && emp.status === "ACTIVE").length;

                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => setSelectedTemplateId(t.template?.id)}
                                        className="template-card"
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: "10px",
                                            border: isSelected ? "1px solid #f9a8d4" : "1px solid #e5eaf1",
                                            borderLeft: isSelected ? "3px solid #ec4899" : "1px solid #e5eaf1",
                                            background: isSelected ? "#fff5fa" : "#ffffff",
                                            cursor: "pointer",
                                            position: "relative",
                                            boxShadow: isSelected ? "0 5px 12px -10px rgba(236, 72, 153, 0.45)" : "none",
                                            overflow: "hidden"
                                        }}
                                    >
                                        <div style={{ display: "flex", gap: "6px", alignItems: "flex-start", marginBottom: "6px" }}>
                                            <BookOutlined style={{ color: isSelected ? "#e11d72" : "#64748b", fontSize: "13px", marginTop: "2px" }} />
                                            <div style={{
                                                fontWeight: 600,
                                                color: isSelected ? "#9d174d" : "#1e293b",
                                                fontSize: "12.5px",
                                                lineHeight: "1.3",
                                                flex: 1
                                            }}>
                                                {t.template?.name}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <Tag
                                                style={{
                                                    borderRadius: "4px",
                                                    padding: "1px 6px",
                                                    fontSize: "10px",
                                                    fontWeight: 600,
                                                    border: "none",
                                                    background: isStaff ? "#eff6ff" : "#faf5ff",
                                                    color: isStaff ? "#1d4ed8" : "#7c3aed",
                                                    margin: 0
                                                }}
                                            >
                                                {isStaff ? "Nhân viên" : "Quản lý"}
                                            </Tag>
                                            <span style={{ fontSize: "11px", color: isSelected ? "#be185d" : "#64748b", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                                <TeamOutlined style={{ fontSize: "11px" }} />
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
                                <div role="alert" style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "9px 12px", background: "#fff7e6", border: "1px solid #ffd591", borderRadius: 8, color: "#ad4e00", fontSize: 12, lineHeight: 1.5 }}>
                                    <WarningOutlined style={{ marginTop: 2 }} />
                                    <span>
                                        Một số nhân sự chưa đủ tuyến quản lý. Hãy bổ sung hoặc điều chuyển người chấm/duyệt trước khi đến bước xử lý tương ứng.
                                    </span>
                                </div>
                            )}

                            {/* Form gán nhân sự (nếu là Draft) */}
                            {!readOnly && period?.status === "DRAFT" && (
                                <div style={{
                                    background: "#ffffff",
                                    border: "1px solid rgba(226, 232, 240, 0.8)",
                                    padding: "12px 16px",
                                    borderRadius: "10px",
                                    boxShadow: "none"
                                }}>
                                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                                        <TeamOutlined style={{ color: "#3b82f6", fontSize: "14px" }} />
                                        <span>Thêm nhân sự mới vào biểu mẫu</span>
                                    </div>

                                    <Form form={employeeForm} layout="vertical" onFinish={handleAddEmployee}>
                                        {/* Bộ lọc phòng ban/công ty */}
                                        <Row gutter={[12, 12]} style={{ marginBottom: 12, background: "rgba(248, 250, 252, 0.5)", padding: "8px 12px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                                            <Col xs={24} sm={12}>
                                                <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Bộ lọc Công ty</div>
                                                <Select
                                                    allowClear
                                                    placeholder="Bộ lọc Công ty"
                                                    value={selectedCompanyId}
                                                    onChange={handleCompanyFilterChange}
                                                    onFocus={() => { void loadAssignmentReferenceData(); }}
                                                    options={companies.map(c => ({ label: c.name, value: c.id }))}
                                                    styles={{ popup: { root: { borderRadius: 8 } } }}
                                                    size="small"
                                                    style={{ width: "100%" }}
                                                    disabled={!!period?.company?.id}
                                                />
                                            </Col>
                                            <Col xs={24} sm={12}>
                                                <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Bộ lọc Phòng ban</div>
                                                <Select
                                                    allowClear
                                                    placeholder="Bộ lọc Phòng ban"
                                                    value={selectedDepartmentId}
                                                    onChange={setSelectedDepartmentId}
                                                    onFocus={() => { void loadAssignmentReferenceData(); }}
                                                    disabled={!selectedCompanyId}
                                                    options={departments.map(d => ({ label: d.name, value: d.id }))}
                                                    styles={{ popup: { root: { borderRadius: 8 } } }}
                                                    size="small"
                                                    style={{ width: "100%" }}
                                                />
                                            </Col>
                                        </Row>

                                        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    label={<span style={{ fontWeight: 600, color: "#475569", fontSize: "11.5px" }}>Nhân viên tham gia (chọn nhiều)</span>}
                                                    name="employeeId"
                                                    rules={[{ required: true, message: "Chọn nhân viên!" }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Select
                                                        mode="multiple"
                                                        showSearch
                                                        placeholder="Tìm kiếm nhân viên..."
                                                        optionFilterProp="searchValue"
                                                        maxTagCount="responsive"
                                                        options={employeeOptions}
                                                        optionRender={(option) => renderUserOption(option.data.rawUser)}
                                                        loading={loadingAssignmentReferenceData}
                                                        onFocus={() => { void loadAssignmentReferenceData(); }}
                                                        popupMatchSelectWidth={false}
                                                        styles={{ popup: { root: { borderRadius: 8, minWidth: 350 } } }}
                                                        size="small"
                                                        style={{ width: "100%" }}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col xs={24} sm={12}>
                                                <Form.Item
                                                    label={<span style={{ fontWeight: 600, color: "#475569", fontSize: "11.5px" }}>Quản lý trực tiếp</span>}
                                                    name="directManagerId"
                                                    rules={[{ required: true, message: "Chọn quản lý trực tiếp!" }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Select
                                                        showSearch
                                                        placeholder="Chọn quản lý có cấp phê duyệt..."
                                                        optionFilterProp="searchValue"
                                                        options={directManagerOptions}
                                                        optionRender={(option) => renderUserOption(option.data.rawUser)}
                                                        loading={loadingAssignmentReferenceData}
                                                        onFocus={() => { void loadAssignmentReferenceData(); }}
                                                        popupMatchSelectWidth={false}
                                                        styles={{ popup: { root: { borderRadius: 8, minWidth: 350 } } }}
                                                        size="small"
                                                        style={{ width: "100%" }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                                            <Access permission={ALL_PERMISSIONS.EVALUATION.ADD_EMPLOYEE_TO_PERIOD} hideChildren>
                                                <Button
                                                    type="primary"
                                                    htmlType="submit"
                                                    loading={submittingEmployee}
                                                    icon={<UserAddOutlined />}
                                                    size="small"
                                                    style={{
                                                        borderRadius: "6px",
                                                        fontWeight: 600,
                                                        background: "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
                                                        border: "none",
                                                        boxShadow: "0 2px 6px rgba(22, 119, 255, 0.15)",
                                                        padding: "0 14px",
                                                        height: "28px",
                                                        fontSize: "11.5px"
                                                    }}
                                                >
                                                    Thêm nhân sự
                                                </Button>
                                            </Access>
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
                                    background: "#e6f4ff",
                                    border: "1px solid #91caff",
                                    borderRadius: "6px",
                                    marginBottom: "12px",
                                }}>
                                    <span style={{ fontSize: 13, fontWeight: 550, color: "#0958d9" }}>
                                        Đang chọn {selectedRowKeys.length} nhân sự
                                    </span>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <Access permission={ALL_PERMISSIONS.EVALUATION.EXTEND_RECORD_DEADLINE} hideChildren>
                                            <Button
                                                type="primary"
                                                size="small"
                                                icon={<CalendarOutlined />}
                                                onClick={handleBulkExtend}
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
                                                title={`Bạn có chắc chắn muốn hủy gán ${selectedRowKeys.length} nhân viên đã chọn khỏi kỳ đánh giá?`}
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
                                                    Hủy gán hàng loạt
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
                                dataSource={employeesForSelectedTemplate}
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
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "15px" }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                        Gia hạn thời gian đánh giá
                    </span>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                        Nhân viên: <strong style={{ color: "#3b82f6" }}>{selectedEmployeeForExtend?.employee?.name || selectedEmployeeForExtend?.employee?.username}</strong>
                    </div>
                </div>
            }
            open={extendModalOpen}
            onCancel={() => { setExtendModalOpen(false); setSelectedEmployeeForExtend(null); }}
            footer={null}
            destroyOnHidden
            centered
            width={450}
        >
            <Form form={extendForm} layout="vertical" onFinish={handleExtendDeadlineSubmit}>
                <div style={{ padding: "10px 12px", marginBottom: 16, background: "#fff5f8", borderLeft: "3px solid #e8356d", borderRadius: 5 }}>
                    <div style={{ color: "#334155", fontSize: 12, fontWeight: 700 }}>
                        Bước hiện tại: {selectedEmployeeForExtend?.phase ? DEADLINE_PHASE_LABELS[selectedEmployeeForExtend.phase as DeadlinePhase] : "—"}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 11, marginTop: 3 }}>
                        Hạn hiện tại: {selectedEmployeeForExtend?.currentDeadline ? dayjs(selectedEmployeeForExtend.currentDeadline).format("DD/MM/YYYY HH:mm") : "—"}
                    </div>
                </div>

                <Form.Item
                    name="deadline"
                    label={<span style={{ fontWeight: 600, color: "#475569" }}>Hạn chót mới</span>}
                    rules={[{ required: true, message: "Vui lòng chọn hạn chót mới!" }]}
                >
                    <DatePicker
                        showTime
                        format="DD/MM/YYYY HH:mm"
                        style={{ width: "100%" }}
                        disabledDate={date => date.endOf("day").isBefore(dayjs())}
                    />
                </Form.Item>

                <Form.Item
                    name="reason"
                    label={<span style={{ fontWeight: 600, color: "#475569" }}>Lý do gia hạn</span>}
                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập lý do gia hạn!" }]}
                    style={{ marginBottom: 12 }}
                >
                    <Input.TextArea rows={3} placeholder="Nhập lý do gia hạn..." />
                </Form.Item>

                <Form.Item
                    name="cascade"
                    valuePropName="checked"
                    initialValue={true}
                    style={{ marginBottom: 15 }}
                >
                    <Checkbox>
                        <span style={{ fontSize: "12.5px", fontWeight: 550, color: "#475569" }}>
                            Tự động tịnh tiến các hạn chót tiếp theo
                        </span>
                    </Checkbox>
                </Form.Item>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 15 }}>
                    <Button onClick={() => { setExtendModalOpen(false); setSelectedEmployeeForExtend(null); }}>
                        Hủy
                    </Button>
                    <Button type="primary" htmlType="submit" loading={extending}>
                        Gia hạn
                    </Button>
                </div>
            </Form>
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
    </>
    );
};

export default PeriodDetailDrawer;
