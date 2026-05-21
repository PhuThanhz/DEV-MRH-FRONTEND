import { Modal, Table, Form, Select, Button, Popconfirm, Space, Tag, Row, Col, Empty, Tooltip } from "antd";
import { useState, useEffect } from "react";
import { notify } from "@/components/common/notification/notify";
import {
    PlusOutlined,
    DeleteOutlined,
    BookOutlined,
    TeamOutlined,
    UserAddOutlined,
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
} from "@/config/api";
import type { IEvaluationPeriod, IEvaluationTemplate } from "@/types/backend";

interface IProps {
    open: boolean;
    onClose: () => void;
    period: IEvaluationPeriod | null;
}

const PeriodDetailDrawer = (props: IProps) => {
    const { open, onClose, period } = props;

    // Form instances
    const [templateForm] = Form.useForm();
    const [employeeForm] = Form.useForm();

    // Data states
    const [linkedTemplates, setLinkedTemplates] = useState<any[]>([]);
    const [linkedEmployees, setLinkedEmployees] = useState<any[]>([]);
    const [activeTemplates, setActiveTemplates] = useState<IEvaluationTemplate[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

    // Loading states
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [submittingTemplate, setSubmittingTemplate] = useState(false);
    const [submittingEmployee, setSubmittingEmployee] = useState(false);

    // Fetch initial templates & users on open
    useEffect(() => {
        if (open && period?.id) {
            fetchLinkedTemplates();
            fetchLinkedEmployees();
            loadActiveTemplates();
            loadAllUsers();
            loadCompanies();
        }
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

    const filteredUsers = allUsers.filter(u => {
        if (selectedCompanyId) {
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
    });

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
                setActiveTemplates(res.data.result);
            }
        } catch {
            // ignore
        }
    };

    const loadAllUsers = async () => {
        try {
            const res = await callFetchUsersCrossCompany("page=1&size=500");
            if (res?.data?.result) {
                setAllUsers(res.data.result);
            }
        } catch {
            // ignore
        }
    };

    const handleAddTemplate = async (values: any) => {
        if (!period?.id) return;
        setSubmittingTemplate(true);
        try {
            const res = await callAddTemplateToPeriod(period.id, values.templateId, values.applyToRole);
            if (res?.data) {
                notify.success("Liên kết biểu mẫu thành công");
                templateForm.resetFields();
                setSelectedTemplateId(values.templateId);
                fetchLinkedTemplates();
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Lỗi liên kết biểu mẫu";
            notify.error(msg);
        } finally {
            setSubmittingTemplate(false);
        }
    };

    const handleAddEmployee = async (values: any) => {
        if (!period?.id || !selectedTemplateId) return;
        setSubmittingEmployee(true);
        try {
            const payload = {
                employeeId: values.employeeId,
                directManagerId: values.directManagerId,
                templateId: selectedTemplateId,
            };
            const res = await callAddEmployeeToPeriod(period.id, payload);
            if (res?.data) {
                notify.success("Thêm nhân viên vào kỳ thành công");
                employeeForm.resetFields(["employeeId", "directManagerId"]);
                fetchLinkedEmployees();
            }
        } catch (error: any) {
            const msg = error?.response?.data?.message || "Lỗi thêm nhân viên";
            notify.error(msg);
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
            render: (_: any, __: any, index: number) => (
                <span style={{ fontWeight: 600, color: "#64748b", fontSize: "12px" }}>{index + 1}</span>
            ),
        },
        {
            title: "Nhân viên",
            dataIndex: ["employee", "name"],
            key: "employeeName",
            width: 200,
            render: (val: string, record: any) =>
                renderUserAvatar(
                    val || record.employee?.username,
                    record.employee?.email,
                    record.employee?.jobTitle,
                    record.employee?.positionLevel
                ),
        },
        {
            title: "Quản lý Trực tiếp",
            dataIndex: ["directManager", "name"],
            key: "directManagerName",
            width: 200,
            render: (val: string, record: any) =>
                renderUserAvatar(
                    val || record.directManager?.username,
                    record.directManager?.email,
                    record.directManager?.jobTitle,
                    record.directManager?.positionLevel
                ),
        },
        {
            title: "Quản lý Gián tiếp (Tự động)",
            dataIndex: ["indirectManager", "name"],
            key: "indirectManagerName",
            width: 210,
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
                            Chưa gán
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
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            align: "center" as const,
            width: 120,
            render: (val: string) => {
                const isActive = val === "ACTIVE";
                return (
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        background: isActive ? "#ecfdf5" : "#f1f5f9",
                        color: isActive ? "#047857" : "#475569",
                        border: isActive ? "1px solid #a7f3d0" : "1px solid #e2e8f0",
                        borderRadius: "12px",
                        padding: "2px 8px",
                        fontSize: "11px",
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        flexShrink: 0
                    }}>
                        <span style={{
                            width: "5px",
                            height: "5px",
                            borderRadius: "50%",
                            background: isActive ? "#10b981" : "#64748b",
                            display: "inline-block",
                            boxShadow: isActive ? "0 0 6px #10b981" : "none",
                            flexShrink: 0
                        }} />
                        {isActive ? "Đang tham gia" : "Đã hủy"}
                    </div>
                );
            },
        },
        {
            title: "Hành động",
            key: "action",
            align: "center" as const,
            width: 70,
            render: (_: any, record: any) => {
                console.log("Action Column Row Data:", { record, period });
                const isRecordActive = record?.status?.toUpperCase() === "ACTIVE";
                const isPeriodClosed = period?.status?.toUpperCase() === "CLOSED";
                if (!isRecordActive || isPeriodClosed) return null;
                return (
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
                );
            },
        },
    ];

    const activeT = linkedTemplates.find(t => t.template?.id === selectedTemplateId);
    const employeesForSelectedTemplate = linkedEmployees.filter(
        emp => emp.template?.id === selectedTemplateId
    );

    return (
        <Modal
            title={
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "10px" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ display: "inline-flex", background: "#eff6ff", color: "#1d4ed8", padding: "4px", borderRadius: "6px" }}><TeamOutlined /></span>
                        <span>Cấu hình Kỳ Đánh Giá:</span>
                        <span style={{ color: "#1d4ed8" }}>{period?.name}</span>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 400, color: "#64748b", marginTop: 4, marginLeft: 34 }}>
                        Quản lý các biểu mẫu và phân công nhân sự tương ứng cho kỳ đánh giá.
                    </div>
                </div>
            }
            open={open}
            onCancel={onClose}
            width={1200}
            footer={null}
            centered
            maskClosable={false}
            styles={{ body: { padding: "4px 12px 12px 12px" } }}
        >
            <style>{`
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
                    box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.04) !important;
                    border-color: #3b82f6 !important;
                }
                .ant-table {
                    border-radius: 8px !important;
                }
                .ant-table-thead > tr > th {
                    background: rgba(241, 245, 249, 0.6) !important;
                    color: #475569 !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.6px !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                    padding: 8px 10px !important;
                }
                .ant-table-tbody > tr > td {
                    padding: 8px 10px !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                }
                .ant-table-tbody > tr:last-child > td {
                    border-bottom: none !important;
                }
                .ant-table-row {
                    transition: background-color 0.2s;
                }
                .ant-table-row:hover {
                    background-color: #f8fafc !important;
                }
                .btn-delete-action:hover {
                    background: rgba(239, 68, 68, 0.1) !important;
                    border-color: rgba(239, 68, 68, 0.2) !important;
                    color: #dc2626 !important;
                }
            `}</style>
            <Row gutter={16} style={{ margin: 0 }}>
                {/* CỘT TRÁI: DANH SÁCH BIỂU MẪU ĐÃ GÁN (width: 33%) */}
                <Col span={8} style={{ borderRight: "1px solid #e2e8f0", padding: "0 12px 8px 4px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                            <BookOutlined style={{ color: "#3b82f6", fontSize: "13px" }} />
                            <span>BIỂU MẪU ĐÃ GÁN ({linkedTemplates.length})</span>
                        </div>

                        {period?.status === "DRAFT" ? (
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
                                        dropdownStyle={{ borderRadius: 8 }}
                                        size="small"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="applyToRole"
                                    rules={[{ required: true, message: "Hãy chọn đối tượng!" }]}
                                    style={{ marginBottom: 10 }}
                                    label={<span style={{ fontWeight: 600, color: "#475569", fontSize: "11.5px" }}>Đối tượng áp dụng</span>}
                                >
                                    <Select
                                        placeholder="Đối tượng áp dụng..."
                                        options={[
                                            { label: "Nhân viên (STAFF)", value: "STAFF" },
                                            { label: "Quản lý (MANAGER)", value: "MANAGER" },
                                        ]}
                                        dropdownStyle={{ borderRadius: 8 }}
                                        size="small"
                                    />
                                </Form.Item>

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
                                Kỳ đánh giá không còn ở trạng thái Bản nháp.
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
                                const isStaff = t.applyToRole === "STAFF";
                                const empCount = linkedEmployees.filter(emp => emp.template?.id === t.template?.id && emp.status === "ACTIVE").length;

                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => setSelectedTemplateId(t.template?.id)}
                                        className="template-card"
                                        style={{
                                            padding: "10px 12px",
                                            borderRadius: "8px",
                                            border: isSelected ? "1px solid #3b82f6" : "1px solid rgba(226, 232, 240, 0.8)",
                                            borderLeft: isSelected ? "4px solid #3b82f6" : "1px solid rgba(226, 232, 240, 0.8)",
                                            background: isSelected ? "#f8fafc" : "#ffffff",
                                            cursor: "pointer",
                                            position: "relative",
                                            boxShadow: isSelected ? "0 4px 10px -2px rgba(59, 130, 246, 0.06)" : "0 1px 2px rgba(0,0,0,0.01)",
                                            overflow: "hidden"
                                        }}
                                    >
                                        <div style={{ display: "flex", gap: "6px", alignItems: "flex-start", marginBottom: "6px" }}>
                                            <BookOutlined style={{ color: isSelected ? "#3b82f6" : "#64748b", fontSize: "13px", marginTop: "2px" }} />
                                            <div style={{
                                                fontWeight: 600,
                                                color: isSelected ? "#1e3a8a" : "#1e293b",
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
                                            <span style={{ fontSize: "11px", color: isSelected ? "#2563eb" : "#64748b", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "3px" }}>
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
                </Col>

                {/* CỘT PHẢI: CHI TIẾT NHÂN SỰ & QUY TRÌNH GÁN (width: 67%) */}
                <Col span={16} style={{ padding: "0 4px 8px 12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {!selectedTemplateId ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 450, height: "100%" }}>
                            <Empty description="Chọn biểu mẫu ở cột bên trái để thiết lập danh sách nhân sự" />
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {/* Header chi tiết */}
                            <div style={{
                                background: "linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)",
                                border: "1px solid #bae6fd",
                                padding: "8px 12px",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                boxShadow: "0 2px 4px -1px rgba(0, 0, 0, 0.01)"
                            }}>
                                <BookOutlined style={{ color: "#0284c7", fontSize: "18px" }} />
                                <div>
                                    <div style={{ fontSize: "10px", fontWeight: 700, color: "#0369a1", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                        Đang cấu hình nhân sự cho biểu mẫu
                                    </div>
                                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#0c4a6e", marginTop: "2px" }}>
                                        {activeT?.template?.name}
                                    </div>
                                </div>
                            </div>

                            {/* Form gán nhân sự (nếu là Draft) */}
                            {period?.status === "DRAFT" && (
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
                                        <Row gutter={12} style={{ marginBottom: 12, background: "rgba(248, 250, 252, 0.5)", padding: "8px 12px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                                            <Col span={12}>
                                                <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Bộ lọc Công ty</div>
                                                <Select
                                                    allowClear
                                                    placeholder="Bộ lọc Công ty"
                                                    value={selectedCompanyId}
                                                    onChange={handleCompanyFilterChange}
                                                    options={companies.map(c => ({ label: c.name, value: c.id }))}
                                                    dropdownStyle={{ borderRadius: 8 }}
                                                    size="small"
                                                    style={{ width: "100%" }}
                                                />
                                            </Col>
                                            <Col span={12}>
                                                <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Bộ lọc Phòng ban</div>
                                                <Select
                                                    allowClear
                                                    placeholder="Bộ lọc Phòng ban"
                                                    value={selectedDepartmentId}
                                                    onChange={setSelectedDepartmentId}
                                                    disabled={!selectedCompanyId}
                                                    options={departments.map(d => ({ label: d.name, value: d.id }))}
                                                    dropdownStyle={{ borderRadius: 8 }}
                                                    size="small"
                                                    style={{ width: "100%" }}
                                                />
                                            </Col>
                                        </Row>

                                        <Row gutter={12} style={{ marginBottom: 12 }}>
                                            <Col span={12}>
                                                <Form.Item
                                                    label={<span style={{ fontWeight: 600, color: "#475569", fontSize: "11.5px" }}>Nhân viên tham gia</span>}
                                                    name="employeeId"
                                                    rules={[{ required: true, message: "Chọn nhân viên!" }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Select
                                                        showSearch
                                                        placeholder="Tìm kiếm nhân viên..."
                                                        optionFilterProp="label"
                                                        onChange={handleEmployeeChange}
                                                        options={filteredUsers.map(u => {
                                                            const jobInfo = [u.jobTitle, u.positionLevel].filter(Boolean).join(" - ");
                                                            const deptOrComp = [u.departmentName, u.companyName].filter(Boolean).join(" - ");
                                                            const detail = [jobInfo, deptOrComp].filter(Boolean).join(" | ");
                                                            const label = `${u.name}${detail ? ` - [${detail}]` : ""}`;
                                                            return { label, value: u.id };
                                                        })}
                                                        dropdownStyle={{ borderRadius: 8 }}
                                                        size="small"
                                                        style={{ width: "100%" }}
                                                    />
                                                </Form.Item>
                                            </Col>

                                            <Col span={12}>
                                                <Form.Item
                                                    label={<span style={{ fontWeight: 600, color: "#475569", fontSize: "11.5px" }}>Quản lý Trực tiếp</span>}
                                                    name="directManagerId"
                                                    rules={[{ required: true, message: "Chọn quản lý trực tiếp!" }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Select
                                                        showSearch
                                                        placeholder="Tìm quản lý trực tiếp..."
                                                        optionFilterProp="label"
                                                        options={filteredUsers.map(u => {
                                                            const jobInfo = [u.jobTitle, u.positionLevel].filter(Boolean).join(" - ");
                                                            const deptOrComp = [u.departmentName, u.companyName].filter(Boolean).join(" - ");
                                                            const detail = [jobInfo, deptOrComp].filter(Boolean).join(" | ");
                                                            const label = `${u.name}${detail ? ` - [${detail}]` : ""}`;
                                                            return { label, value: u.id };
                                                        })}
                                                        dropdownStyle={{ borderRadius: 8 }}
                                                        size="small"
                                                        style={{ width: "100%" }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
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
                                        </div>
                                    </Form>
                                </div>
                            )}

                            {/* Bảng danh sách nhân sự */}
                            <Table
                                columns={employeeColumns}
                                dataSource={employeesForSelectedTemplate}
                                rowKey="id"
                                loading={loadingEmployees}
                                pagination={{ pageSize: 5, size: "small" }}
                                size="small"
                                scroll={{ x: "max-content" }}
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
                </Col>
            </Row>
        </Modal>
    );
};

export default PeriodDetailDrawer;
