import { useEffect, useState } from "react";
import { ModalForm, ProFormText } from "@ant-design/pro-components";
import { Col, Form, Row } from "antd";

import type { IDepartment } from "@/types/backend";
import { DebounceSelect } from "@/components/common/debouce.select";
import {
    useCreateDepartmentMutation,
    useUpdateDepartmentMutation,
} from "@/hooks/useDepartments";
import { callFetchCompany } from "@/config/api";
import { useIsMobile, useModalWidth } from "@/components/common/modal/detail";

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
    const isEdit     = Boolean(dataInit?.id);
    const isMobile   = useIsMobile();
    const modalWidth = useModalWidth(600);

    const [selectedCompany, setSelectedCompany] = useState<ICompanySelect | null>(null);

    const { mutate: createDepartment, isPending: isCreating } = useCreateDepartmentMutation();
    const { mutate: updateDepartment, isPending: isUpdating } = useUpdateDepartmentMutation();

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

    /* ================= FETCH COMPANY ================= */
    async function fetchCompanyList(_name: string): Promise<ICompanySelect[]> {
        const res = await callFetchCompany(`page=1&size=50`);
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
                { id: dataInit!.id!, data: payload },
                { onSuccess: handleReset }
            );
        } else {
            createDepartment(payload, { onSuccess: handleReset });
        }
    };

    /* ================= RENDER ================= */
    return (
        <>
            <style>{`
                .department-form-modal .ant-modal-content {
                    border-radius: 16px !important;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.10), 0 2px 10px rgba(0,0,0,0.06) !important;
                    overflow: hidden; padding: 0 !important;
                }
                .department-form-modal .ant-modal-header {
                    padding: ${isMobile ? "14px 16px 0" : "18px 24px 0"} !important;
                    border-bottom: none !important;
                    background: #fff !important; margin-bottom: 0 !important;
                }
                .department-form-modal .ant-modal-title {
                    font-size: 15px !important; font-weight: 700 !important;
                    color: #111827 !important; letter-spacing: -0.03em !important;
                }
                .department-form-modal .ant-modal-body {
                    padding: ${isMobile ? "14px 16px 4px" : "16px 24px 4px"} !important;
                }
                .department-form-modal .ant-modal-footer {
                    padding: ${isMobile ? "10px 16px 14px" : "10px 24px 18px"} !important;
                    border-top: 1.5px solid #f3f4f6 !important; margin-top: 0 !important;
                }
                .department-form-modal .ant-modal-close {
                    top: 12px !important; right: 18px !important;
                    width: 28px !important; height: 28px !important;
                    border-radius: 8px !important; background: #f7f7f8 !important;
                    border: 1.5px solid #efefef !important;
                    display: flex !important; align-items: center !important;
                    justify-content: center !important; transition: all 0.2s !important;
                }
                .department-form-modal .ant-modal-close:hover {
                    background: #f0f0f0 !important; border-color: #e0e0e0 !important;
                }
                .department-form-modal .ant-modal-close .ant-modal-close-x {
                    width: 28px !important; height: 28px !important;
                    line-height: 28px !important; font-size: 12px !important; color: #6b7280 !important;
                }
                .department-form-modal .ant-btn-primary {
                    background: #f5317f !important; border-color: #f5317f !important;
                    border-radius: 8px !important; font-weight: 600 !important;
                    box-shadow: 0 2px 8px rgba(245,49,127,0.25) !important;
                }
                .department-form-modal .ant-btn-primary:hover {
                    background: #d4206a !important; border-color: #d4206a !important;
                }
                .department-form-modal .ant-btn-default {
                    border-radius: 8px !important; border-color: #e5e7eb !important; color: #6b7280 !important;
                }
                .department-form-modal .ant-form-item-label > label {
                    font-size: 13px !important; font-weight: 500 !important; color: #374151 !important;
                }
                .department-form-modal .ant-input,
                .department-form-modal .ant-select-selector {
                    border-radius: 8px !important; border-color: #e5e7eb !important;
                }
                .department-form-modal .ant-input:focus,
                .department-form-modal .ant-select-focused .ant-select-selector {
                    border-color: #f5317f !important;
                    box-shadow: 0 0 0 3px rgba(245,49,127,0.10) !important;
                }
            `}</style>

            <ModalForm
                title={isEdit ? "Cập nhật phòng ban" : "Tạo mới phòng ban"}
                open={openModal}
                form={form}
                onFinish={submitDepartment}
                modalProps={{
                    onCancel: handleReset,
                    afterClose: handleReset,
                    destroyOnClose: true,
                    width: modalWidth,
                    centered: true,
                    maskClosable: false,
                    confirmLoading: isCreating || isUpdating,
                    className: "department-form-modal",
                    styles: {
                        mask: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.2)" },
                    },
                }}
            >
                <Row gutter={[16, 4]}>
                    <Col lg={12} md={12} sm={24} xs={24}>
                        <ProFormText
                            label="Mã phòng ban"
                            name="code"
                            disabled={isEdit}
                            rules={[{ required: true, message: "Vui lòng nhập mã phòng ban" }]}
                            placeholder="Nhập mã phòng ban"
                            fieldProps={{ size: "large" }}
                        />
                    </Col>

                    <Col lg={12} md={12} sm={24} xs={24}>
                        <ProFormText
                            label="Tên phòng ban"
                            name="name"
                            rules={[{ required: true, message: "Vui lòng nhập tên phòng ban" }]}
                            placeholder="Nhập tên phòng ban"
                            fieldProps={{ size: "large" }}
                        />
                    </Col>

                    <Col span={24}>
                        <ProFormText
                            label="Tên tiếng Anh"
                            name="englishName"
                            placeholder="Nhập tên tiếng Anh"
                            fieldProps={{ size: "large" }}
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
                                size="large"
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
        </>
    );
};

export default ModalDepartment;
