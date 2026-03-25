import { useEffect } from "react";
import {
    ModalForm,
    ProFormText,
    ProFormSelect,
    ProFormSwitch,
} from "@ant-design/pro-components";
import { Col, Form, Row, message } from "antd";

import type { IJobTitle, IPositionLevel } from "@/types/backend";
import type { IJobTitleForm } from "@/types/backend";
import {
    useCreateJobTitleMutation,
    useUpdateJobTitleMutation,
} from "@/hooks/useJobTitles";
import { callFetchCompany, callFetchPositionLevel } from "@/config/api";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit: IJobTitle | null;
    setDataInit: (v: IJobTitle | null) => void;
}

const ModalJobTitle = ({
    openModal,
    setOpenModal,
    dataInit,
    setDataInit,
}: IProps) => {
    const [form] = Form.useForm<IJobTitleForm>();
    const isEdit = Boolean(dataInit?.id);

    const { mutateAsync: createData, isPending: isCreating } =
        useCreateJobTitleMutation();
    const { mutateAsync: updateData, isPending: isUpdating } =
        useUpdateJobTitleMutation();

    /*
     * ================= PREFILL =================
     */
    useEffect(() => {
        if (dataInit?.id) {
            form.setFieldsValue({
                nameVi: dataInit.nameVi,
                nameEn: dataInit.nameEn,
                active: dataInit.active,
                // prefill companyId từ positionLevel để dropdown công ty hiển thị đúng
                companyId: dataInit.positionLevel?.companyId,
                positionLevelId: dataInit.positionLevel?.id,
            });
        } else {
            form.resetFields();
        }
    }, [dataInit, form]);

    const handleClose = () => {
        form.resetFields();
        setDataInit(null);
        setOpenModal(false);
    };

    /*
     * ================= SUBMIT =================
     */
    const submitForm = async (values: IJobTitleForm): Promise<boolean> => {
        try {
            const payload = {
                nameVi: values.nameVi,
                nameEn: values.nameEn,
                positionLevelId: values.positionLevelId,
            };

            if (isEdit) {
                await updateData({
                    ...payload,
                    id: dataInit!.id,
                    active: values.active,
                });
            } else {
                await createData({
                    ...payload,
                    active: true,
                });
            }

            handleClose();
            return true;
        } catch (err: any) {
            message.error(
                err?.response?.data?.message || "Có lỗi khi lưu chức danh"
            );
            return false;
        }
    };

    /*
     * ================= LOAD COMPANIES =================
     */
    const loadCompanies = async () => {
        const res = await callFetchCompany("page=1&size=100&sort=name,asc");
        return (
            res?.data?.result?.map((c: any) => ({
                label: c.name,
                value: c.id,
            })) ?? []
        );
    };

    /*
     * ================= LOAD POSITION LEVELS THEO CÔNG TY =================
     */
    const loadPositionLevelsByCompany = async ({ companyId }: any) => {
        if (!companyId) return [];
        const res = await callFetchPositionLevel(
            `page=1&size=500&sort=bandOrder,asc&sort=code,asc&filter=company.id:${companyId}`
        );
        return (
            res?.data?.result?.map((pl: IPositionLevel) => ({
                label: `${pl.code} — Nhóm ${pl.bandOrder ?? "?"}`,
                value: pl.id,
            })) ?? []
        );
    };

    return (
        <ModalForm<IJobTitleForm>
            title={isEdit ? "Cập nhật chức danh" : "Tạo chức danh mới"}
            open={openModal}
            onOpenChange={setOpenModal}
            form={form}
            onFinish={submitForm}
            modalProps={{
                destroyOnClose: true,
                maskClosable: false,
                confirmLoading: isCreating || isUpdating,
            }}
            width={600}
        >
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <ProFormText
                        name="nameVi"
                        label="Tên chức danh (VI)"
                        rules={[
                            { required: true, message: "Vui lòng nhập tên VI" },
                        ]}
                    />
                </Col>

                <Col span={12}>
                    <ProFormText
                        name="nameEn"
                        label="Tên chức danh (EN)"
                    />
                </Col>

                {/* BƯỚC 1 — Chọn công ty */}
                <Col span={12}>
                    <ProFormSelect
                        name="companyId"
                        label="Công ty"
                        request={loadCompanies}
                        fieldProps={{
                            showSearch: true,
                            optionFilterProp: "label",
                            placeholder: "Chọn công ty...",
                            onChange: () => {
                                // Đổi công ty → reset bậc chức danh
                                form.setFieldValue("positionLevelId", undefined);
                            },
                        }}
                        rules={[
                            { required: true, message: "Vui lòng chọn công ty" },
                        ]}
                    />
                </Col>

                {/* BƯỚC 2 — Chọn bậc chức danh theo công ty */}
                <Col span={12}>
                    <ProFormSelect
                        name="positionLevelId"
                        label="Bậc chức danh"
                        dependencies={["companyId"]}
                        request={loadPositionLevelsByCompany}
                        fieldProps={{
                            showSearch: true,
                            optionFilterProp: "label",
                            placeholder: "Chọn bậc chức danh...",
                        }}
                        rules={[
                            {
                                required: true,
                                message: "Vui lòng chọn bậc chức danh",
                            },
                        ]}
                    />
                </Col>

                {isEdit && (
                    <Col span={12}>
                        <ProFormSwitch
                            name="active"
                            label="Kích hoạt"
                            checkedChildren="Bật"
                            unCheckedChildren="Tắt"
                        />
                    </Col>
                )}
            </Row>
        </ModalForm>
    );
};

export default ModalJobTitle;