import { useEffect } from "react";
import { ModalForm, ProFormText, ProFormSwitch } from "@ant-design/pro-components";
import { Col, Form, Row, Select, message } from "antd";

import type { IPositionLevel } from "@/types/backend";
import {
    useCreatePositionLevelMutation,
    useUpdatePositionLevelMutation,
} from "@/hooks/usePositionLevels";
import { useCompaniesQuery } from "@/hooks/useCompanies";
import { useIsMobile, useModalWidth } from "@/components/common/modal/detail";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit: IPositionLevel | null;
    setDataInit: (v: any) => void;
}

const ModalPositionLevel = ({ openModal, setOpenModal, dataInit, setDataInit }: IProps) => {
    const [form]     = Form.useForm();
    const isEdit     = Boolean(dataInit?.id);
    const isMobile   = useIsMobile();
    const modalWidth = useModalWidth(520);

    const { data: companyData } = useCompaniesQuery("page=1&size=100&sort=name,asc&filter=status:1");
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
            payload.id     = dataInit?.id;
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
        <>
            <style>{`
                .position-level-form-modal .ant-modal-content {
                    border-radius: 16px !important;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.10), 0 2px 10px rgba(0,0,0,0.06) !important;
                    overflow: hidden; padding: 0 !important;
                }
                .position-level-form-modal .ant-modal-header {
                    padding: ${isMobile ? "14px 16px 0" : "18px 24px 0"} !important;
                    border-bottom: none !important;
                    background: #fff !important; margin-bottom: 0 !important;
                }
                .position-level-form-modal .ant-modal-title {
                    font-size: 15px !important; font-weight: 700 !important;
                    color: #111827 !important; letter-spacing: -0.03em !important;
                }
                .position-level-form-modal .ant-modal-body {
                    padding: ${isMobile ? "14px 16px 4px" : "16px 24px 4px"} !important;
                }
                .position-level-form-modal .ant-modal-footer {
                    padding: ${isMobile ? "10px 16px 14px" : "10px 24px 18px"} !important;
                    border-top: 1.5px solid #f3f4f6 !important; margin-top: 0 !important;
                }
                .position-level-form-modal .ant-modal-close {
                    top: 12px !important; right: 18px !important;
                    width: 28px !important; height: 28px !important;
                    border-radius: 8px !important; background: #f7f7f8 !important;
                    border: 1.5px solid #efefef !important;
                    display: flex !important; align-items: center !important;
                    justify-content: center !important; transition: all 0.2s !important;
                }
                .position-level-form-modal .ant-modal-close:hover {
                    background: #f0f0f0 !important; border-color: #e0e0e0 !important;
                }
                .position-level-form-modal .ant-modal-close .ant-modal-close-x {
                    width: 28px !important; height: 28px !important;
                    line-height: 28px !important; font-size: 12px !important; color: #6b7280 !important;
                }
                .position-level-form-modal .ant-btn-primary {
                    background: #f5317f !important; border-color: #f5317f !important;
                    border-radius: 8px !important; font-weight: 600 !important;
                    box-shadow: 0 2px 8px rgba(245,49,127,0.25) !important;
                }
                .position-level-form-modal .ant-btn-primary:hover {
                    background: #d4206a !important; border-color: #d4206a !important;
                }
                .position-level-form-modal .ant-btn-default {
                    border-radius: 8px !important; border-color: #e5e7eb !important; color: #6b7280 !important;
                }
                .position-level-form-modal .ant-form-item-label > label {
                    font-size: 13px !important; font-weight: 500 !important; color: #374151 !important;
                }
                .position-level-form-modal .ant-input,
                .position-level-form-modal .ant-select-selector {
                    border-radius: 8px !important; border-color: #e5e7eb !important;
                }
                .position-level-form-modal .ant-input:focus,
                .position-level-form-modal .ant-select-focused .ant-select-selector {
                    border-color: #f5317f !important;
                    box-shadow: 0 0 0 3px rgba(245,49,127,0.10) !important;
                }
                .position-level-form-modal .ant-switch-checked {
                    background: #f5317f !important;
                }
            `}</style>

            <ModalForm
                title={isEdit ? "Cập nhật bậc chức danh" : "Tạo mới bậc chức danh"}
                open={openModal}
                form={form}
                onFinish={submitForm}
                submitter={{
                    searchConfig: {
                        submitText: isEdit ? "Cập nhật" : "Tạo mới",
                        resetText: "Hủy",
                    },
                    submitButtonProps: {
                        style: { backgroundColor: "#f5317f", borderColor: "#f5317f" },
                    },
                }}
                modalProps={{
                    onCancel: handleReset,
                    afterClose: handleReset,
                    destroyOnHidden: true,
                    maskClosable: false,
                    confirmLoading: isCreating || isUpdating,
                    width: modalWidth,
                    centered: true,
                    className: "position-level-form-modal",
                    styles: {
                        mask: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.2)" },
                    },
                }}
            >
                <Row gutter={[16, 4]}>
                    {/* Công ty — chỉ hiện khi tạo mới */}
                    {!isEdit && (
                        <Col span={24}>
                            <Form.Item
                                label="Công ty"
                                name="companyId"
                                rules={[{ required: true, message: "Vui lòng chọn công ty" }]}
                            >
                                <Select
                                    size="large"
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

                    {/* Mã bậc + Thứ tự nhóm */}
                    <Col xs={24} sm={12}>
                        <ProFormText
                            label="Mã bậc"
                            name="code"
                            placeholder="VD: S1, M2..."
                            rules={[{ required: true, message: "Vui lòng nhập mã bậc" }]}
                            fieldProps={{ size: "large" }}
                        />
                    </Col>

                    <Col xs={24} sm={12}>
                        <ProFormText
                            label="Thứ tự nhóm"
                            name="bandOrder"
                            placeholder="VD: 1, 2, 3..."
                            fieldProps={{ size: "large" }}
                        />
                    </Col>

                    {/* Kích hoạt — chỉ hiện khi edit */}
                    {isEdit && (
                        <Col xs={24} sm={12}>
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
        </>
    );
};

export default ModalPositionLevel;