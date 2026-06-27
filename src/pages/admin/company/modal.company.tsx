import { ModalForm, ProFormText } from "@ant-design/pro-components";
import { Col, Row } from "antd";

import type { ICompany } from "@/types/backend";
import {
    useCreateCompanyMutation,
    useUpdateCompanyMutation,
} from "@/hooks/useCompanies";
import { useIsMobile, useModalWidth } from "@/components/common/modal/detail";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: ICompany | null;
    setDataInit: (v: any) => void;
}

const ModalCompany = ({
    openModal,
    setOpenModal,
    dataInit,
    setDataInit,
}: IProps) => {
    const isEdit    = Boolean(dataInit?.id);
    const isMobile  = useIsMobile();
    const modalWidth = useModalWidth(520);

    const createMutation = useCreateCompanyMutation();
    const updateMutation = useUpdateCompanyMutation();

    const handleClose = () => {
        setDataInit(null);
        setOpenModal(false);
    };

    const submitCompany = async (values: any) => {
        if (isEdit) {
            updateMutation.mutate(
                { id: dataInit!.id, name: values.name, englishName: values.englishName },
                { onSuccess: handleClose }
            );
        } else {
            createMutation.mutate(values, { onSuccess: handleClose });
        }
    };

    return (
        <>
            <style>{`
                .company-form-modal .ant-modal-content {
                    border-radius: 16px !important;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.10), 0 2px 10px rgba(0,0,0,0.06) !important;
                    overflow: hidden;
                    padding: 0 !important;
                }
                .company-form-modal .ant-modal-header {
                    padding: ${isMobile ? "14px 16px 0" : "18px 24px 0"} !important;
                    border-bottom: none !important;
                    background: #fff !important;
                    margin-bottom: 0 !important;
                }
                .company-form-modal .ant-modal-title {
                    font-size: 15px !important;
                    font-weight: 700 !important;
                    color: #111827 !important;
                    letter-spacing: -0.03em !important;
                }
                .company-form-modal .ant-modal-body {
                    padding: ${isMobile ? "14px 16px 4px" : "16px 24px 4px"} !important;
                }
                .company-form-modal .ant-modal-footer {
                    padding: ${isMobile ? "10px 16px 14px" : "10px 24px 18px"} !important;
                    border-top: 1.5px solid #f3f4f6 !important;
                    margin-top: 0 !important;
                }
                .company-form-modal .ant-modal-close {
                    top: 12px !important; right: 18px !important;
                    width: 28px !important; height: 28px !important;
                    border-radius: 8px !important;
                    background: #f7f7f8 !important;
                    border: 1.5px solid #efefef !important;
                    display: flex !important; align-items: center !important;
                    justify-content: center !important; transition: all 0.2s !important;
                }
                .company-form-modal .ant-modal-close:hover {
                    background: #f0f0f0 !important; border-color: #e0e0e0 !important;
                }
                .company-form-modal .ant-modal-close .ant-modal-close-x {
                    width: 28px !important; height: 28px !important;
                    line-height: 28px !important; font-size: 12px !important;
                    color: #6b7280 !important;
                }
                .company-form-modal .ant-btn-primary {
                    background: #f5317f !important;
                    border-color: #f5317f !important;
                    border-radius: 8px !important;
                    font-weight: 600 !important;
                    box-shadow: 0 2px 8px rgba(245,49,127,0.25) !important;
                }
                .company-form-modal .ant-btn-primary:hover {
                    background: #d4206a !important;
                    border-color: #d4206a !important;
                }
                .company-form-modal .ant-btn-default {
                    border-radius: 8px !important;
                    border-color: #e5e7eb !important;
                    color: #6b7280 !important;
                }
                .company-form-modal .ant-form-item-label > label {
                    font-size: 13px !important;
                    font-weight: 500 !important;
                    color: #374151 !important;
                }
                .company-form-modal .ant-input {
                    border-radius: 8px !important;
                    border-color: #e5e7eb !important;
                }
                .company-form-modal .ant-input:focus,
                .company-form-modal .ant-input-focused {
                    border-color: #f5317f !important;
                    box-shadow: 0 0 0 3px rgba(245,49,127,0.1) !important;
                }
            `}</style>

            <ModalForm
                key={dataInit?.id ?? "create"}
                title={isEdit ? "Cập nhật công ty" : "Tạo mới công ty"}
                open={openModal}
                onFinish={submitCompany}
                initialValues={
                    isEdit
                        ? { code: dataInit?.code, name: dataInit?.name, englishName: dataInit?.englishName }
                        : {}
                }
                preserve={false}
                modalProps={{
                    onCancel: handleClose,
                    afterClose: handleClose,
                    destroyOnClose: true,
                    width: modalWidth,
                    centered: true,
                    maskClosable: false,
                    okText: isEdit ? "Cập nhật" : "Tạo mới",
                    cancelText: "Hủy",
                    confirmLoading: createMutation.isPending || updateMutation.isPending,
                    className: "company-form-modal",
                    styles: {
                        mask: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.2)" },
                    },
                }}
            >
                <Row gutter={[16, 4]} data-guide-id="company-form">
                    <Col span={24}>
                        <ProFormText
                            label="Mã công ty"
                            name="code"
                            disabled={isEdit}
                            rules={[{ required: true, message: "Vui lòng nhập mã công ty" }]}
                            placeholder="VD: LOTUS, HRM, ABC_CORP"
                            fieldProps={{ size: "large" }}
                        />
                    </Col>
                    <Col span={24}>
                        <ProFormText
                            label="Tên công ty (Tiếng Việt)"
                            name="name"
                            rules={[{ required: true, message: "Vui lòng nhập tên công ty" }]}
                            placeholder="VD: Công ty TNHH Hoa Sen"
                            fieldProps={{ size: "large" }}
                        />
                    </Col>
                    <Col span={24}>
                        <ProFormText
                            label="Tên công ty (Tiếng Anh)"
                            name="englishName"
                            placeholder="VD: Hoa Sen Company Limited"
                            fieldProps={{ size: "large" }}
                        />
                    </Col>
                </Row>
            </ModalForm>
        </>
    );
};

export default ModalCompany;
