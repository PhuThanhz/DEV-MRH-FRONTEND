import { Modal, Form, Input, Select, Switch } from "antd";
import { useEffect, useMemo } from "react";

import {
    useCreatePermissionCategoryMutation,
    useUpdatePermissionCategoryMutation,
} from "@/hooks/usePermissionCategory";
import { useDepartmentsQuery } from "@/hooks/useDepartments";

import type { IPermissionCategory } from "@/types/backend";

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    dataInit: IPermissionCategory | null;
    setDataInit: (v: IPermissionCategory | null) => void;
}

const ModalCategory = ({ open, setOpen, dataInit, setDataInit }: IProps) => {
    const [form] = Form.useForm();

    const createMutation = useCreatePermissionCategoryMutation();
    const updateMutation = useUpdatePermissionCategoryMutation();

    const { data: departmentData, isFetching } =
        useDepartmentsQuery("page=1&size=100");

    const departmentOptions = useMemo(
        () =>
            departmentData?.result?.map((d: any) => ({
                label: d.name,
                value: d.id,
            })) || [],
        [departmentData]
    );

    useEffect(() => {
        if (dataInit) {
            form.setFieldsValue(dataInit);
        } else {
            form.resetFields();
            form.setFieldsValue({ active: true });
        }
    }, [dataInit, form]);

    const handleSubmit = async () => {
        const values = await form.validateFields();

        if (!values.departmentId) return;

        if (dataInit?.id) {
            updateMutation.mutate({
                id: dataInit.id,
                data: values,
            });
        } else {
            createMutation.mutate(values);
        }

        handleClose();
    };

    const handleClose = () => {
        form.resetFields();
        setDataInit(null);
        setOpen(false);
    };

    return (
        <Modal
            title={dataInit ? "Cập nhật danh mục" : "Thêm danh mục phân quyền"}
            open={open}
            onCancel={handleClose}
            onOk={handleSubmit}
            okText="Lưu"
            cancelText="Hủy"
            confirmLoading={
                createMutation.isPending || updateMutation.isPending
            }
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

                <Form.Item
                    label="Phòng ban"
                    name="departmentId"
                    rules={[{ required: true, message: "Chọn phòng ban" }]}
                >
                    <Select
                        options={departmentOptions}
                        loading={isFetching}
                        showSearch
                        optionFilterProp="label"
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
