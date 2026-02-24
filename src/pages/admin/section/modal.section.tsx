import { useEffect, useState } from "react";
import { ModalForm, ProFormText, ProFormSwitch, ProForm } from "@ant-design/pro-components";
import { Col, Form, Row } from "antd";
import type { ISection } from "@/types/backend";
import { DebounceSelect } from "@/components/common/debouce.select";
import { useCreateSectionMutation, useUpdateSectionMutation } from "@/hooks/useSections";
import { callFetchDepartment } from "@/config/api";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: ISection | null;
    setDataInit: (v: any) => void;
}

export interface IDepartmentOption {
    label: string;
    value: number;
}

const ModalSection = ({ openModal, setOpenModal, dataInit, setDataInit }: IProps) => {
    const [form] = Form.useForm();
    const isEdit = Boolean(dataInit?.id);

    const { mutate: createSection, isPending: isCreating } = useCreateSectionMutation();
    const { mutate: updateSection, isPending: isUpdating } = useUpdateSectionMutation();

    const [selectedDept, setSelectedDept] = useState<IDepartmentOption | null>(null);

    /** Prefill form khi edit */
    useEffect(() => {
        if (dataInit?.id) {
            const dept = {
                label: dataInit.department?.name ?? "",
                value: dataInit.department?.id ?? 0,
            };

            setSelectedDept(dept);
            form.setFieldsValue({
                code: dataInit.code,
                name: dataInit.name,
                department: dept,
                active: dataInit.active,
            });
        } else {
            form.resetFields();
            setSelectedDept(null);
        }
    }, [dataInit, form]);

    /** Reset form */
    const handleReset = () => {
        form.resetFields();
        setSelectedDept(null);
        setDataInit(null);
        setOpenModal(false);
    };

    /** Load danh sách phòng ban */
    async function fetchDepartmentList(input: string): Promise<IDepartmentOption[]> {
        const res = await callFetchDepartment(`page=1&size=200&name=/${input}/i`);
        return (
            res?.data?.result?.map((d: any) => ({
                label: d.name,
                value: d.id,
            })) ?? []
        );
    }

    /** Submit form */
    const submitForm = async (values: any) => {
        const payload = {
            id: dataInit?.id,
            code: values.code,
            name: values.name,
            departmentId: values.department?.value, // ⭐ Quan trọng!
            status: values.active ? 1 : 0,
        };

        if (isEdit) updateSection(payload, { onSuccess: handleReset });
        else createSection(payload, { onSuccess: handleReset });
    };

    return (
        <ModalForm
            title={isEdit ? "Cập nhật bộ phận" : "Tạo mới bộ phận"}
            open={openModal}
            modalProps={{
                onCancel: handleReset,
                destroyOnClose: true,
                maskClosable: false,
                okText: isEdit ? "Cập nhật" : "Tạo mới",
                cancelText: "Hủy",
                confirmLoading: isCreating || isUpdating,
            }}
            form={form}
            onFinish={submitForm}
        >
            <Row gutter={[16, 8]}>
                <Col span={12}>
                    <ProFormText
                        label="Mã bộ phận"
                        name="code"
                        rules={[{ required: true, message: "Vui lòng nhập mã bộ phận" }]}
                        placeholder="Nhập mã bộ phận"
                    />
                </Col>

                <Col span={12}>
                    <ProFormText
                        label="Tên bộ phận"
                        name="name"
                        rules={[{ required: true, message: "Vui lòng nhập tên bộ phận" }]}
                        placeholder="Nhập tên bộ phận"
                    />
                </Col>

                <Col span={12}>
                    <ProForm.Item
                        name="department"
                        label="Phòng ban"
                        rules={[{ required: true, message: "Vui lòng chọn phòng ban" }]}
                    >
                        <DebounceSelect
                            allowClear
                            placeholder="Chọn phòng ban"
                            fetchOptions={fetchDepartmentList}
                            value={selectedDept as any}
                            onChange={(v: any) => setSelectedDept(v)}
                            style={{ width: "100%" }}
                        />
                    </ProForm.Item>
                </Col>

                <Col span={12}>
                    <ProFormSwitch
                        name="active"
                        label="Kích hoạt"
                        initialValue={dataInit?.active ?? true}
                        checkedChildren="Bật"
                        unCheckedChildren="Tắt"
                    />
                </Col>
            </Row>
        </ModalForm>
    );
};

export default ModalSection;
