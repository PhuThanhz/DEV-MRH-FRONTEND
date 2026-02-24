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
import { callFetchPositionLevel } from "@/config/api";

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

    /* ================= PREFILL ================= */
    useEffect(() => {
        if (dataInit?.id) {
            form.setFieldsValue({
                nameVi: dataInit.nameVi,
                nameEn: dataInit.nameEn,
                active: dataInit.active,
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

    /* ================= SUBMIT ================= */
    const submitForm = async (
        values: IJobTitleForm
    ): Promise<boolean> => {
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

    /* ================= LOAD SELECT ================= */
    const loadPositionLevels = async () => {
        const res = await callFetchPositionLevel("page=1&size=500");
        return (
            res?.data?.result?.map((pl: IPositionLevel) => ({
                label: `${pl.code} (Band ${pl.bandOrder})`,
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

                <Col span={12}>
                    <ProFormSelect
                        name="positionLevelId"
                        label="Bậc chức danh"
                        request={loadPositionLevels}
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
