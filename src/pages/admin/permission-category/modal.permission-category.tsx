import { Form, Input, Select, Switch } from "antd";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { ModalForm } from "@ant-design/pro-components";

import {
    useCreatePermissionCategoryMutation,
    useUpdatePermissionCategoryMutation,
} from "@/hooks/usePermissionCategory";
import { useCompaniesQuery } from "@/hooks/useCompanies";
import { callFetchDepartmentsByCompany } from "@/config/api";
import type { IPermissionCategory } from "@/types/backend";
import { useModalWidth } from "@/components/common/modal/detail";

const PINK = "#f5317f";
const PINK_HOVER = "#d4206c";

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    dataInit: IPermissionCategory | null;
    setDataInit: (v: IPermissionCategory | null) => void;
    onSuccess?: () => void;
}

const ModalCategory = ({ open, setOpen, dataInit, setDataInit, onSuccess }: IProps) => {
    const [form] = Form.useForm();
    const isEdit = Boolean(dataInit?.id);
    const width = useModalWidth(500);

    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [deptOptions, setDeptOptions] = useState<any[]>([]);
    const [loadingDept, setLoadingDept] = useState(false);

    const createMutation = useCreatePermissionCategoryMutation();
    const updateMutation = useUpdatePermissionCategoryMutation();
    const isLoading = createMutation.isPending || updateMutation.isPending;

    const { data: companyData } = useCompaniesQuery("page=1&size=100");
    const companyOptions = useMemo(
        () => companyData?.result?.map((c: any) => ({ label: c.name, value: c.id })) || [],
        [companyData]
    );

    const fetchDepartments = async (companyId: number) => {
        setLoadingDept(true);
        try {
            const res = await callFetchDepartmentsByCompany(companyId);
            setDeptOptions(res?.data?.map((d: any) => ({ label: d.name, value: d.id })) || []);
        } finally {
            setLoadingDept(false);
        }
    };

    const handleCompanyChange = async (value: number) => {
        setSelectedCompanyId(value);
        form.setFieldsValue({ departmentId: undefined });
        setDeptOptions([]);
        if (value) await fetchDepartments(value);
    };

    useEffect(() => {
        if (!open) return;
        if (dataInit) {
            const companyId = dataInit.companyId ?? null;
            setSelectedCompanyId(companyId);
            form.setFieldsValue({
                code: dataInit.code,
                name: dataInit.name,
                companyId: dataInit.companyId,
                departmentId: dataInit.departmentId,
                active: dataInit.active,
            });
            if (companyId) fetchDepartments(companyId);
        } else {
            form.resetFields();
            form.setFieldsValue({ active: true });
            setSelectedCompanyId(null);
            setDeptOptions([]);
        }
    }, [open, dataInit]);

    const handleClose = () => {
        form.resetFields();
        setSelectedCompanyId(null);
        setDeptOptions([]);
        setDataInit(null);
        setOpen(false);
    };

    const handleSubmit = async (values: any) => {
        if (dataInit?.id) {
            updateMutation.mutate(
                { id: dataInit.id, data: values },
                { onSuccess: () => { onSuccess?.(); handleClose(); } }
            );
        } else {
            createMutation.mutate(values, {
                onSuccess: () => { onSuccess?.(); handleClose(); },
            });
        }
        return true;
    };

    return (
        <ModalForm
            key={dataInit?.id ?? "create"}
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: "linear-gradient(135deg,#fff0f6,#ffe6f0)",
                        border: "1.5px solid #ffd6dd",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <SafetyCertificateOutlined style={{ fontSize: 15, color: PINK }} />
                    </div>
                    <div>
                        <div style={{
                            fontSize: 15, fontWeight: 700, color: "#111827",
                            letterSpacing: "-0.03em", lineHeight: 1.2,
                        }}>
                            {isEdit ? "Cập nhật danh mục phân quyền" : "Thêm danh mục phân quyền"}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                            {isEdit ? `Chỉnh sửa: ${dataInit?.code ?? ""}` : "Nhập thông tin để tạo mới"}
                        </div>
                    </div>
                </div>
            }
            open={open}
            form={form}
            onFinish={handleSubmit}
            width={width}
            submitter={{
                searchConfig: {
                    submitText: isEdit ? "Cập nhật" : "Tạo mới",
                    resetText: "Huỷ",
                },
                resetButtonProps: { style: { borderRadius: 8 } },
                submitButtonProps: {
                    loading: isLoading,
                    style: {
                        borderRadius: 8,
                        background: PINK,
                        borderColor: PINK,
                        fontWeight: 600,
                    },
                    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
                        (e.currentTarget as HTMLButtonElement).style.background = PINK_HOVER;
                        (e.currentTarget as HTMLButtonElement).style.borderColor = PINK_HOVER;
                    },
                    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
                        (e.currentTarget as HTMLButtonElement).style.background = PINK;
                        (e.currentTarget as HTMLButtonElement).style.borderColor = PINK;
                    },
                },
            }}
            modalProps={{
                onCancel: handleClose,
                destroyOnHidden: true,
                maskClosable: false,
                styles: {
                    body: { padding: "16px 24px" },
                    header: { paddingBottom: 12, borderBottom: "1px solid #f3f4f6" },
                },
            }}
        >
            <Form.Item
                label="Mã danh mục"
                name="code"
                rules={[{ required: true, message: "Nhập mã danh mục" }]}
            >
                <Input
                    placeholder="Ví dụ: CAT001"
                    disabled={isEdit}
                    style={isEdit ? { background: "#f9fafb" } : undefined}
                />
            </Form.Item>

            <Form.Item
                label="Tên danh mục"
                name="name"
                rules={[{ required: true, message: "Nhập tên danh mục" }]}
            >
                <Input placeholder="Ví dụ: Quyền quản lý nhân sự" />
            </Form.Item>

            <Form.Item
                label="Công ty"
                name="companyId"
                rules={[{ required: true, message: "Chọn công ty" }]}
            >
                <Select
                    options={companyOptions}
                    showSearch
                    optionFilterProp="label"
                    onChange={handleCompanyChange}
                    placeholder="Chọn công ty"
                    disabled={isEdit}
                    style={isEdit ? { background: "#f9fafb" } : undefined}
                />
            </Form.Item>

            <Form.Item
                label="Phòng ban"
                name="departmentId"
                rules={[{ required: true, message: "Chọn phòng ban" }]}
            >
                <Select
                    options={deptOptions}
                    loading={loadingDept}
                    showSearch
                    optionFilterProp="label"
                    disabled={!selectedCompanyId || loadingDept}
                    placeholder={
                        !selectedCompanyId
                            ? "Vui lòng chọn công ty trước"
                            : loadingDept
                                ? "Đang tải phòng ban..."
                                : deptOptions.length === 0
                                    ? "Công ty chưa có phòng ban"
                                    : "Chọn phòng ban"
                    }
                />
            </Form.Item>

            {isEdit && (
                <Form.Item label="Kích hoạt" name="active" valuePropName="checked">
                    <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
                </Form.Item>
            )}
        </ModalForm>
    );
};

export default ModalCategory;