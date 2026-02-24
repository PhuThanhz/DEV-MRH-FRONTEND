import { useEffect } from "react";
import { ModalForm, ProFormText, ProFormSwitch } from "@ant-design/pro-components";
import { Col, Form, Row, message } from "antd";

import type { IPositionLevel } from "@/types/backend";
import {
    useCreatePositionLevelMutation,
    useUpdatePositionLevelMutation,
} from "@/hooks/usePositionLevels";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit: IPositionLevel | null;
    setDataInit: (v: any) => void;
}

const ModalPositionLevel = ({ openModal, setOpenModal, dataInit, setDataInit }: IProps) => {
    const [form] = Form.useForm();
    const isEdit = Boolean(dataInit?.id);

    const { mutate: createLevel, isPending: isCreating } = useCreatePositionLevelMutation();
    const { mutate: updateLevel, isPending: isUpdating } = useUpdatePositionLevelMutation();

    // Prefill form
    useEffect(() => {
        if (dataInit?.id) {
            form.setFieldsValue({
                code: dataInit.code,
                bandOrder: dataInit.bandOrder,
                status: dataInit.status === 1,
            });
        } else {
            form.resetFields();
        }
    }, [dataInit]);

    const handleReset = () => {
        form.resetFields();
        setDataInit(null);
        setOpenModal(false);
    };

    const submitForm = async (values: any) => {
        const payload: any = {
            code: values.code,
            bandOrder: values.bandOrder ? Number(values.bandOrder) : undefined,
        };

        if (isEdit) {
            payload.id = dataInit?.id;
            payload.status = values.status ? 1 : 0;

            updateLevel(payload, {
                onSuccess: handleReset,
                onError: (err: any) =>
                    message.error(err?.response?.data?.message || "Lỗi cập nhật bậc chức danh"),
            });
        } else {
            payload.status = 1;

            createLevel(payload, {
                onSuccess: handleReset,
                onError: (err: any) =>
                    message.error(err?.response?.data?.message || "Lỗi tạo mới bậc chức danh"),
            });
        }
    };

    return (
        <ModalForm
            title={isEdit ? "Cập nhật bậc chức danh" : "Tạo mới bậc chức danh"}
            open={openModal}
            form={form}
            onFinish={submitForm}
            modalProps={{
                onCancel: handleReset,
                afterClose: handleReset,
                destroyOnClose: true,
                maskClosable: false,
                confirmLoading: isCreating || isUpdating,
            }}
            width={550}
        >
            <Row gutter={[16, 16]}>
                <Col span={12}>
                    <ProFormText
                        label="Code"
                        name="code"
                        placeholder="VD: S1, M2..."
                        rules={[{ required: true, message: "Vui lòng nhập code" }]}
                    />
                </Col>

                <Col span={12}>
                    <ProFormText
                        label="Band Order"
                        name="bandOrder"
                        placeholder="VD: 1, 2, 3..."
                    />
                </Col>

                {isEdit && (
                    <Col span={12}>
                        <ProFormSwitch
                            name="status"
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

export default ModalPositionLevel;
