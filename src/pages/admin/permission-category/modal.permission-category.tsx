import { Modal, Form, Input, Select, Switch } from "antd";
import { useEffect, useMemo, useState } from "react";

import {
    useCreatePermissionCategoryMutation,
    useUpdatePermissionCategoryMutation,
} from "@/hooks/usePermissionCategory";
import { useCompaniesQuery } from "@/hooks/useCompanies";

import { callFetchDepartmentsByCompany } from "@/config/api";

import type { IPermissionCategory } from "@/types/backend";

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    dataInit: IPermissionCategory | null;
    setDataInit: (v: IPermissionCategory | null) => void;
    onSuccess?: () => void;  // ✅ thêm dòng này

}

const ModalCategory = ({ open, setOpen, dataInit, setDataInit, onSuccess }: IProps) => {
    const [form] = Form.useForm();

    const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
    const [deptOptions, setDeptOptions] = useState<any[]>([]);
    const [loadingDept, setLoadingDept] = useState(false);

    const createMutation = useCreatePermissionCategoryMutation();
    const updateMutation = useUpdatePermissionCategoryMutation();

    /* ================= COMPANY ================= */
    const { data: companyData } = useCompaniesQuery("page=1&size=100");

    const companyOptions = useMemo(
        () =>
            companyData?.result?.map((c: any) => ({
                label: c.name,
                value: c.id,
            })) || [],
        [companyData]
    );

    /* ================= LOAD DEPARTMENT ================= */
    const fetchDepartments = async (companyId: number) => {
        setLoadingDept(true);
        try {
            const res = await callFetchDepartmentsByCompany(companyId);

            const options =
                res?.data?.map((d: any) => ({
                    label: d.name,
                    value: d.id,
                })) || [];

            setDeptOptions(options);
        } finally {
            setLoadingDept(false);
        }
    };

    /* ================= CHANGE COMPANY ================= */
    const handleCompanyChange = async (value: number) => {
        setSelectedCompanyId(value);
        form.setFieldsValue({ departmentId: undefined });
        setDeptOptions([]);

        if (value) {
            await fetchDepartments(value);
        }
    };

    /* ================= PREFILL EDIT ================= */
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

            // 🔥 load department khi edit
            if (companyId) {
                fetchDepartments(companyId);
            }
        } else {
            form.resetFields();
            form.setFieldsValue({ active: true });
            setSelectedCompanyId(null);
            setDeptOptions([]);
        }
    }, [open, dataInit]);

    /* ================= SUBMIT ================= */
    const handleSubmit = async () => {
        const values = await form.validateFields();

        if (dataInit?.id) {
            updateMutation.mutate(
                { id: dataInit.id, data: values },
                {
                    onSuccess: () => {
                        onSuccess?.();  // ✅ thêm
                        handleClose();
                    },
                }
            );
        } else {
            createMutation.mutate(values, {
                onSuccess: () => {
                    onSuccess?.();  // ✅ thêm
                    handleClose();
                },
            });
        }
    };

    /* ================= CLOSE ================= */
    const handleClose = () => {
        form.resetFields();
        setSelectedCompanyId(null);
        setDeptOptions([]);
        setDataInit(null);
        setOpen(false);
    };

    /* ================= UI ================= */
    return (
        <Modal
            title={dataInit ? "Cập nhật danh mục" : "Thêm danh mục phân quyền"}
            open={open}
            onCancel={handleClose}
            onOk={handleSubmit}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={createMutation.isPending || updateMutation.isPending}
            destroyOnClose
        >
            <Form layout="vertical" form={form}>
                <Form.Item
                    label="Mã danh mục"
                    name="code"
                    rules={[{ required: true, message: "Nhập mã danh mục" }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    label="Tên danh mục"
                    name="name"
                    rules={[{ required: true, message: "Nhập tên danh mục" }]}
                >
                    <Input />
                </Form.Item>

                {/* COMPANY */}
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
                        placeholder="Chọn công ty trước"
                    />
                </Form.Item>

                {/* DEPARTMENT */}
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

                {dataInit && (
                    <Form.Item
                        label="Trạng thái"
                        name="active"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                )}
            </Form>
        </Modal>
    );
};

export default ModalCategory;