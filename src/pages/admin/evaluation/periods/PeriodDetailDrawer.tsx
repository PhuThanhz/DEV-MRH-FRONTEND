import { Modal, Table, Form, Select, Button, Popconfirm, Space, Tag, Row, Col, Empty } from "antd";
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

    const renderUserAvatar = (name: string, email: string) => {
        const initial = name ? name.trim().charAt(0).toUpperCase() : "?";
        const colors = ["#1677ff", "#13c2c2", "#fa8c16", "#f5222d", "#722ed1", "#eb2f96"];
        const index = (email || name || "").charCodeAt(0) % colors.length;
        const color = colors[index];
        return (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: color,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 14,
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    flexShrink: 0
                }}>
                    {initial}
                </div>
                <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                    <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
                </div>
            </div>
        );
    };

    // Columns for Employees linked Table
    const employeeColumns = [
        {
            title: "STT",
            key: "stt",
            width: 50,
            align: "center" as const,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: "Nhân viên",
            dataIndex: ["employee", "name"],
            key: "employeeName",
            render: (val: string, record: any) =>
                renderUserAvatar(val || record.employee?.username, record.employee?.email),
        },
        {
            title: "Quản lý Trực tiếp",
            dataIndex: ["directManager", "name"],
            key: "directManagerName",
            render: (val: string, record: any) =>
                renderUserAvatar(val || record.directManager?.username, record.directManager?.email),
        },
        {
            title: "Quản lý Gián tiếp (Tự động)",
            dataIndex: ["indirectManager", "name"],
            key: "indirectManagerName",
            render: (val: string, record: any) => {
                if (!record.indirectManager?.id) return <span style={{ color: "#94a3b8", fontStyle: "italic" }}>— Chưa cấu hình</span>;
                return renderUserAvatar(val || record.indirectManager?.username, record.indirectManager?.email);
            },
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            align: "center" as const,
            render: (val: string) => {
                const isActive = val === "ACTIVE";
                return (
                    <Tag
                        color={isActive ? "success" : "default"}
                        style={{
                            borderRadius: 6,
                            fontWeight: 600,
                            padding: "2px 8px",
                        }}
                    >
                        {isActive ? "Đang tham gia" : "Đã hủy"}
                    </Tag>
                );
            },
        },
        {
            title: "Hành động",
            key: "action",
            align: "center" as const,
            width: 100,
            render: (_: any, record: any) => {
                if (record.status !== "ACTIVE" || period?.status !== "DRAFT") return null;
                return (
                    <Popconfirm
                        title="Bạn có chắc chắn muốn hủy gán nhân viên này?"
                        onConfirm={() => handleCancelEmployee(record.id)}
                        okText="Đồng ý"
                        cancelText="Hủy"
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined style={{ fontSize: 16 }} />}
                            title="Hủy gán nhân viên"
                            style={{ borderRadius: 6 }}
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
                <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "8px" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>Cấu hình Kỳ Đánh Giá:</span>
                        <span style={{ color: "#0f172a" }}>{period?.name}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 400, color: "#64748b", marginTop: 4 }}>
                        Quản lý các biểu mẫu và phân công nhân sự tương ứng cho kỳ đánh giá.
                    </div>
                </div>
            }
            open={open}
            onCancel={onClose}
            width={1250}
            footer={null}
            centered
            maskClosable={false}
            bodyStyle={{ padding: "8px 0px 0px 0px" }}
        >
            <Row gutter={24} style={{ margin: 0 }}>
                {/* CỘT TRÁI: DANH SÁCH BIỂU MẪU ĐÃ GÁN (width: 33%) */}
                <Col span={8} style={{ borderRight: "1px solid #e2e8f0", padding: "0 16px 16px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                            <BookOutlined style={{ color: "#475569" }} />
                            <span>BIỂU MẪU ĐÃ GÁN ({linkedTemplates.length})</span>
                        </div>

                        {period?.status === "DRAFT" ? (
                            <Form form={templateForm} layout="vertical" onFinish={handleAddTemplate} style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 16 }}>
                                <Form.Item
                                    name="templateId"
                                    rules={[{ required: true, message: "Hãy chọn mẫu!" }]}
                                    style={{ marginBottom: 8 }}
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

                                <Row gutter={8} style={{ marginBottom: 8 }}>
                                    <Col span={24}>
                                        <Form.Item
                                            name="applyToRole"
                                            rules={[{ required: true, message: "Hãy chọn đối tượng!" }]}
                                            style={{ marginBottom: 0 }}
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
                                    </Col>
                                </Row>

                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={submittingTemplate}
                                    icon={<PlusOutlined />}
                                    size="small"
                                    block
                                    style={{
                                        borderRadius: 6,
                                        fontWeight: 600
                                    }}
                                >
                                    Gán mẫu vào kỳ
                                </Button>
                            </Form>
                        ) : (
                            <div style={{
                                background: "#fffbeb",
                                padding: "10px 12px",
                                borderRadius: 6,
                                border: "1px solid #fef3c7",
                                color: "#b45309",
                                fontSize: "12px",
                                fontWeight: 500,
                                marginBottom: 16
                            }}>
                                Kỳ đánh giá không còn ở trạng thái Bản nháp.
                            </div>
                        )}

                        {/* LIST CARDS */}
                        <div style={{ maxHeight: "calc(65vh - 120px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingRight: 4 }}>
                            {linkedTemplates.map(t => {
                                const isSelected = selectedTemplateId === t.template?.id;
                                const isStaff = t.applyToRole === "STAFF";
                                const empCount = linkedEmployees.filter(emp => emp.template?.id === t.template?.id && emp.status === "ACTIVE").length;

                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => setSelectedTemplateId(t.template?.id)}
                                        style={{
                                            padding: "12px 14px",
                                            borderRadius: "8px",
                                            border: isSelected ? "1.5px solid #1677ff" : "1px solid #e2e8f0",
                                            background: isSelected ? "#f0f7ff" : "#ffffff",
                                            cursor: "pointer",
                                            transition: "all 0.2s",
                                            boxShadow: isSelected ? "0 4px 12px rgba(22, 119, 255, 0.12)" : "none",
                                            position: "relative",
                                            overflow: "hidden"
                                        }}
                                    >
                                        {isSelected && (
                                            <div style={{
                                                position: "absolute",
                                                left: 0,
                                                top: 0,
                                                bottom: 0,
                                                width: 4,
                                                background: "#1677ff"
                                            }} />
                                        )}
                                        <div style={{
                                            fontWeight: 700,
                                            color: isSelected ? "#0050b3" : "#1e293b",
                                            fontSize: "13px",
                                            marginBottom: 6,
                                            lineHeight: "1.4"
                                        }}>
                                            {t.template?.name}
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <Tag
                                                color={isStaff ? "blue" : "purple"}
                                                style={{
                                                    borderRadius: 4,
                                                    padding: "0 6px",
                                                    fontSize: "11px",
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {isStaff ? "Nhân viên" : "Quản lý"}
                                            </Tag>
                                            <span style={{ fontSize: "11px", color: isSelected ? "#0050b3" : "#64748b", fontWeight: 600 }}>
                                                {empCount} nhân sự
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                            {linkedTemplates.length === 0 && (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có biểu mẫu" />
                            )}
                        </div>
                    </div>
                </Col>

                {/* CỘT PHẢI: CHI TIẾT NHÂN SỰ & QUY TRÌNH GÁN (width: 67%) */}
                <Col span={16} style={{ padding: "0 16px 16px 16px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {!selectedTemplateId ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, height: "100%" }}>
                            <Empty description="Chọn biểu mẫu ở cột bên trái để thiết lập danh sách nhân sự" />
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {/* Header chi tiết */}
                            <div style={{
                                background: "#e6f4ff",
                                border: "1px solid #91caee",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 4
                            }}>
                                <div style={{ fontSize: "11px", fontWeight: 700, color: "#0958d9", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                    Đang cấu hình nhân sự cho biểu mẫu:
                                </div>
                                <div style={{ fontSize: "14px", fontWeight: 800, color: "#003eb3" }}>
                                    {activeT?.template?.name}
                                </div>
                            </div>

                            {/* Form gán nhân sự (nếu là Draft) */}
                            {period?.status === "DRAFT" && (
                                <div style={{
                                    background: "#ffffff",
                                    border: "1px solid #e2e8f0",
                                    padding: "16px 20px",
                                    borderRadius: "8px"
                                }}>
                                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                                        <TeamOutlined style={{ color: "#1677ff" }} />
                                        <span>Thêm nhân sự mới vào biểu mẫu</span>
                                    </div>

                                    <Form form={employeeForm} layout="vertical" onFinish={handleAddEmployee}>
                                        {/* Bộ lọc phòng ban/công ty */}
                                        <Row gutter={12} style={{ marginBottom: 12, background: "#f8fafc", padding: "8px 12px", borderRadius: 6, border: "1px solid #e2e8f0" }}>
                                            <Col span={12}>
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

                                        <Row gutter={12} style={{ marginBottom: 16 }}>
                                            <Col span={12}>
                                                <Form.Item
                                                    label={<span style={{ fontWeight: 600, color: "#475569", fontSize: "12px" }}>Nhân viên tham gia</span>}
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
                                                            const deptOrComp = [u.departmentName, u.companyName].filter(Boolean).join(" - ");
                                                            const label = `${u.name}${deptOrComp ? ` - [${deptOrComp}]` : ""}`;
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
                                                    label={<span style={{ fontWeight: 600, color: "#475569", fontSize: "12px" }}>Quản lý Trực tiếp</span>}
                                                    name="directManagerId"
                                                    rules={[{ required: true, message: "Chọn quản lý trực tiếp!" }]}
                                                    style={{ marginBottom: 0 }}
                                                >
                                                    <Select
                                                        showSearch
                                                        placeholder="Tìm quản lý trực tiếp..."
                                                        optionFilterProp="label"
                                                        options={filteredUsers.map(u => {
                                                            const deptOrComp = [u.departmentName, u.companyName].filter(Boolean).join(" - ");
                                                            const label = `${u.name}${deptOrComp ? ` - [${deptOrComp}]` : ""}`;
                                                            return { label, value: u.id };
                                                        })}
                                                        dropdownStyle={{ borderRadius: 8 }}
                                                        size="small"
                                                        style={{ width: "100%" }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                        <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                loading={submittingEmployee}
                                                icon={<UserAddOutlined />}
                                                size="small"
                                                style={{
                                                    borderRadius: 6,
                                                    fontWeight: 600
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
                                size="middle"
                                style={{ background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden" }}
                                locale={{ emptyText: <Empty description="Chưa có nhân sự nào áp dụng biểu mẫu này" /> }}
                            />
                        </div>
                    )}
                </Col>
            </Row>
        </Modal>
    );
};

export default PeriodDetailDrawer;
