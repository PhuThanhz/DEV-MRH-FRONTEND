import { useEffect } from "react";
import { ModalForm, ProFormText, ProFormSwitch } from "@ant-design/pro-components";
import { Col, Form, Row, Select, message } from "antd";

import type { IPositionLevel } from "@/types/backend";
import {
    useCreatePositionLevelMutation,
    useUpdatePositionLevelMutation,
} from "@/hooks/usePositionLevels";
import { useCompaniesQuery } from "@/hooks/useCompanies";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit: IPositionLevel | null;
    setDataInit: (v: any) => void;
}

const ModalPositionLevel = ({ openModal, setOpenModal, dataInit, setDataInit }: IProps) => {
    const [form] = Form.useForm();
    const isEdit = Boolean(dataInit?.id);

    const { data: companyData } = useCompaniesQuery(
        "page=1&size=100&sort=name,asc&filter=status:1"
    );
    const companies = companyData?.result ?? [];

    const { mutate: createLevel, isPending: isCreating } = useCreatePositionLevelMutation();
    const { mutate: updateLevel, isPending: isUpdating } = useUpdatePositionLevelMutation();

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
            payload.companyId = values.companyId;

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
            // ⭐ Tiếng Việt + màu hồng cho nút xác nhận
            submitter={{
                searchConfig: {
                    submitText: isEdit ? "Cập nhật" : "Tạo mới",
                    resetText: "Hủy",
                },
                submitButtonProps: {
                    style: { backgroundColor: "#ff85c0", borderColor: "#ff85c0" },
                },
            }}
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
                {!isEdit && (
                    <Col span={24}>
                        <Form.Item
                            label="Công ty"
                            name="companyId"
                            rules={[{ required: true, message: "Vui lòng chọn công ty" }]}
                        >
                            <Select
                                placeholder="Chọn công ty..."
                                showSearch
                                optionFilterProp="label"
                                options={companies.map((c) => ({
                                    value: c.id,
                                    label: c.name,
                                }))}
                            />
                        </Form.Item>
                    </Col>
                )}

                <Col span={12}>
                    <ProFormText
                        label="Mã bậc"
                        name="code"
                        placeholder="VD: S1, M2..."
                        rules={[{ required: true, message: "Vui lòng nhập mã bậc" }]}
                    />
                </Col>

                <Col span={12}>
                    <ProFormText
                        label="Thứ tự nhóm"
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