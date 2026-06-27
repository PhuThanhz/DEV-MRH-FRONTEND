import { useEffect } from "react";
import { Form, Input, Switch, Row, Col } from "antd";
import { ModalForm } from "@ant-design/pro-components";
import { AuditOutlined } from "@ant-design/icons";

import type {
    IAccountingDocumentCategory,
    IAccountingDocumentCategoryRequest,
} from "@/types/backend";
import {
    useCreateAccountingDocumentCategoryMutation,
    useUpdateAccountingDocumentCategoryMutation,
} from "@/hooks/useAccountingDocumentCategories";
import { useModalWidth } from "@/components/common/modal/detail";

const BLUE = "#1677ff";
const BLUE_HOVER = "#0958d9";

interface Props {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit: IAccountingDocumentCategory | null;
    setDataInit: (v: IAccountingDocumentCategory | null) => void;
}

const ModalAccountingDocumentCategory = ({
    openModal,
    setOpenModal,
    dataInit,
    setDataInit,
}: Props) => {
    const [form] = Form.useForm();
    const isEdit = !!dataInit?.id;
    const width = useModalWidth(560);

    const createMutation = useCreateAccountingDocumentCategoryMutation();
    const updateMutation = useUpdateAccountingDocumentCategoryMutation();
    const isLoading = createMutation.isPending || updateMutation.isPending;

    useEffect(() => {
        if (openModal) {
            if (dataInit) {
                form.setFieldsValue({
                    categoryCode: dataInit.categoryCode,
                    categoryName: dataInit.categoryName,
                    symbol: dataInit.symbol,
                    description: dataInit.description,
                    active: dataInit.active ?? true,
                });
            } else {
                form.resetFields();
                form.setFieldsValue({ active: true });
            }
        }
    }, [openModal, dataInit]);

    const handleClose = () => {
        setOpenModal(false);
        setDataInit(null);
        form.resetFields();
    };

    const handleSubmit = async (values: any) => {
        const payload: IAccountingDocumentCategoryRequest = {
            categoryCode: values.categoryCode?.trim().toUpperCase(),
            categoryName: values.categoryName?.trim(),
            symbol: values.symbol?.trim() || undefined,
            description: values.description?.trim() || undefined,
            active: values.active ?? true,
        };

        if (isEdit && dataInit?.id) {
            await updateMutation.mutateAsync({ id: dataInit.id, data: payload });
        } else {
            await createMutation.mutateAsync(payload);
        }

        handleClose();
        return true;
    };

    return (
        <ModalForm
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: "linear-gradient(135deg, #e6f4ff, #bae0ff)",
                            border: "1.5px solid #91caff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <AuditOutlined style={{ fontSize: 15, color: BLUE }} />
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: 15,
                                fontWeight: 700,
                                color: "#111827",
                                letterSpacing: "-0.03em",
                                lineHeight: 1.2,
                            }}
                        >
                            {isEdit
                                ? "Cập nhật loại chứng từ kế toán"
                                : "Thêm loại chứng từ kế toán"}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                            {isEdit
                                ? `Chỉnh sửa: ${dataInit?.categoryCode ?? ""}`
                                : "Nhập thông tin để tạo loại chứng từ mới"}
                        </div>
                    </div>
                </div>
            }
            open={openModal}
            form={form}
            onFinish={handleSubmit}
            width={width}
            submitter={{
                searchConfig: {
                    submitText: isEdit ? "Cập nhật" : "Tạo mới",
                    resetText: "Huỷ",
                },
                resetButtonProps: { style: { borderRadius: 8 } },
                submitButtonProps: {
                    loading: isLoading,
                    style: {
                        borderRadius: 8,
                        background: BLUE,
                        borderColor: BLUE,
                        fontWeight: 600,
                    },
                    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
                        (e.currentTarget as HTMLButtonElement).style.background = BLUE_HOVER;
                        (e.currentTarget as HTMLButtonElement).style.borderColor = BLUE_HOVER;
                    },
                    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
                        (e.currentTarget as HTMLButtonElement).style.background = BLUE;
                        (e.currentTarget as HTMLButtonElement).style.borderColor = BLUE;
                    },
                },
            }}
            modalProps={{
                onCancel: handleClose,
                destroyOnHidden: true,
                maskClosable: false,
                styles: {
                    body: { padding: "16px 24px" },
                    header: { paddingBottom: 12, borderBottom: "1px solid #f3f4f6" },
                },
            }}
        >
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        label="Mã loại chứng từ"
                        name="categoryCode"
                        rules={[
                            { required: true, message: "Vui lòng nhập mã loại chứng từ" },
                            { max: 50, message: "Tối đa 50 ký tự" },
                            {
                                pattern: /^[A-Za-z0-9_]*$/,
                                message: "Chỉ chấp nhận chữ, số và dấu gạch dưới",
                            },
                        ]}
                    >
                        <Input
                            placeholder="VD: HOA_DON_VAT"
                            disabled={isEdit}
                            style={{
                                textTransform: "uppercase",
                                ...(isEdit ? { background: "#f9fafb" } : {}),
                            }}
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        label="Ký hiệu"
                        name="symbol"
                        rules={[{ max: 20, message: "Tối đa 20 ký tự" }]}
                    >
                        <Input placeholder="VD: HĐ-VAT" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item
                label="Tên loại chứng từ"
                name="categoryName"
                rules={[
                    { required: true, message: "Vui lòng nhập tên loại chứng từ" },
                    { max: 200, message: "Tối đa 200 ký tự" },
                ]}
            >
                <Input placeholder="VD: Hóa đơn VAT, Phiếu thu, Phiếu chi..." />
            </Form.Item>

            <Form.Item label="Mô tả" name="description">
                <Input.TextArea
                    rows={3}
                    placeholder="Mô tả ngắn về loại chứng từ này..."
                    style={{ borderRadius: 8 }}
                />
            </Form.Item>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    padding: "12px 0",
                    background: "#f0f5ff",
                    borderRadius: 12,
                    marginTop: 8,
                    border: "1px dashed #adc6ff",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <span
                        style={{
                            fontSize: 12,
                            color: "#6b7280",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                        }}
                    >
                        Trạng thái
                    </span>
                    <Form.Item name="active" valuePropName="checked" noStyle>
                        <Switch
                            checkedChildren="Hoạt động"
                            unCheckedChildren="Tắt"
                            style={{ minWidth: 90 }}
                        />
                    </Form.Item>
                </div>
            </div>

            <style>{`
                .ant-switch-checked { background-color: ${BLUE} !important; }
                .ant-switch:not(.ant-switch-checked) { background-color: #d1d5db !important; }
            `}</style>
        </ModalForm>
    );
};

export default ModalAccountingDocumentCategory;
