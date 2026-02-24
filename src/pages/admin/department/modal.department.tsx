import { useEffect, useState } from "react";
import {
    ModalForm,
    ProFormText,
} from "@ant-design/pro-components";
import { Col, Form, Row } from "antd";
import { isMobile } from "react-device-detect";

import type { IDepartment } from "@/types/backend";
import { DebounceSelect } from "@/components/common/debouce.select";
import {
    useCreateDepartmentMutation,
    useUpdateDepartmentMutation,
} from "@/hooks/useDepartments";
import { callFetchCompany } from "@/config/api";

/* ================= TYPES ================= */

export interface ICompanySelect {
    label?: string;
    value: number;
    key?: number;
}

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: IDepartment | null;
    setDataInit: (v: any) => void;
}

/* ================= COMPONENT ================= */

const ModalDepartment = ({
    openModal,
    setOpenModal,
    dataInit,
    setDataInit,
}: IProps) => {
    const [form] = Form.useForm();
    const isEdit = Boolean(dataInit?.id);

    const [selectedCompany, setSelectedCompany] =
        useState<ICompanySelect | null>(null);

    const { mutate: createDepartment, isPending: isCreating } =
        useCreateDepartmentMutation();
    const { mutate: updateDepartment, isPending: isUpdating } =
        useUpdateDepartmentMutation();

    /* ================= PREFILL / RESET ================= */
    useEffect(() => {
        if (!openModal) return;

        if (dataInit?.id) {
            const companyItem: ICompanySelect = {
                label: dataInit.company?.name,
                value: dataInit.company?.id,
                key: dataInit.company?.id,
            };

            setSelectedCompany(companyItem);

            form.setFieldsValue({
                code: dataInit.code,
                name: dataInit.name,
                englishName: dataInit.englishName,
                companyId: companyItem,
            });
        } else {
            form.resetFields();
            setSelectedCompany(null);
        }
    }, [openModal, dataInit, form]);

    /* ================= RESET ================= */
    const handleReset = () => {
        form.resetFields();
        setSelectedCompany(null);
        setDataInit(null);
        setOpenModal(false);
    };

    /* ================= FETCH COMPANY (⭐ FIXED) ================= */
    async function fetchCompanyList(name: string): Promise<ICompanySelect[]> {
        const keyword = name?.trim();

        const query = keyword
            ? `page=1&size=50`
            : `page=1&size=50`;

        const res = await callFetchCompany(query);

        if (res?.data?.result) {
            return res.data.result.map((item: any) => ({
                label: item.name,
                value: item.id,
            }));
        }

        return [];
    }

    /* ================= SUBMIT ================= */
    const submitDepartment = async (values: any) => {
        const payload = {
            code: values.code,
            name: values.name,
            englishName: values.englishName,
            companyId: values.companyId?.value,
        };

        if (isEdit) {
            updateDepartment(
                {
                    id: dataInit!.id!,
                    data: payload,
                },
                { onSuccess: handleReset }
            );
        } else {
            createDepartment(payload, { onSuccess: handleReset });
        }
    };

    /* ================= RENDER ================= */
    return (
        <ModalForm
            title={isEdit ? "Cập nhật phòng ban" : "Tạo mới phòng ban"}
            open={openModal}
            form={form}
            onFinish={submitDepartment}
            modalProps={{
                onCancel: handleReset,
                afterClose: handleReset,
                destroyOnClose: true,
                width: isMobile ? "100%" : 700,
                maskClosable: false,
                confirmLoading: isCreating || isUpdating,
            }}
        >
            <Row gutter={[16, 8]}>
                <Col lg={12} md={12} sm={24} xs={24}>
                    <ProFormText
                        label="Mã phòng ban"
                        name="code"
                        disabled={isEdit}
                        rules={[{ required: true, message: "Vui lòng nhập mã phòng ban" }]}
                        placeholder="Nhập mã phòng ban"
                    />
                </Col>

                <Col lg={12} md={12} sm={24} xs={24}>
                    <ProFormText
                        label="Tên phòng ban"
                        name="name"
                        rules={[{ required: true, message: "Vui lòng nhập tên phòng ban" }]}
                        placeholder="Nhập tên phòng ban"
                    />
                </Col>

                <Col span={24}>
                    <ProFormText
                        label="Tên tiếng Anh"
                        name="englishName"
                        placeholder="Nhập tên tiếng Anh"
                    />
                </Col>

                <Col span={24}>
                    <Form.Item
                        name="companyId"
                        label="Công ty"
                        rules={[{ required: true, message: "Vui lòng chọn công ty" }]}
                    >
                        <DebounceSelect
                            allowClear
                            showSearch
                            placeholder="Chọn công ty"
                            fetchOptions={fetchCompanyList}
                            value={selectedCompany as any}
                            onChange={(val: any) => setSelectedCompany(val)}
                            style={{ width: "100%" }}
                        />
                    </Form.Item>
                </Col>
            </Row>
        </ModalForm>
    );
};

export default ModalDepartment;
