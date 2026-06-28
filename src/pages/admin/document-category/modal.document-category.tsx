import { useEffect } from "react";
import { Form, Input, Switch, Row, Col, Tooltip } from "antd";
import { ModalForm } from "@ant-design/pro-components";
import { FolderOutlined, InfoCircleOutlined } from "@ant-design/icons";

import type { IDocumentCategory } from "@/types/backend";
import {
    useCreateDocumentCategoryMutation,
    useUpdateDocumentCategoryMutation,
} from "@/hooks/useDocumentCategories";
import { useModalWidth } from "@/components/common/modal/detail";

const PINK = "#f5317f";
const PINK_HOVER = "#d4206c";

interface Props {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit: IDocumentCategory | null;
    setDataInit: (v: IDocumentCategory | null) => void;
}

const ModalDocumentCategory = ({ openModal, setOpenModal, dataInit, setDataInit }: Props) => {
    const [form] = Form.useForm();
    const isEdit = !!dataInit?.id;
    const width = useModalWidth(560);

    const createMutation = useCreateDocumentCategoryMutation();
    const updateMutation = useUpdateDocumentCategoryMutation();
    const isLoading = createMutation.isPending || updateMutation.isPending;

    const mappingProcedureVal = Form.useWatch("mappingProcedure", form) ?? false;
    const isCrossCompanyVal = Form.useWatch("isCrossCompany", form) ?? false;

    useEffect(() => {
        if (openModal) {
            if (dataInit) {
                form.setFieldsValue({
                    categoryCode: dataInit.categoryCode,
                    categoryName: dataInit.categoryName,
                    symbol: dataInit.symbol,
                    definition: dataInit.definition,
                    active: dataInit.active ?? true,
                    mappingProcedure: dataInit.mappingProcedure ?? false,
                    isCrossCompany: (dataInit as any).isCrossCompany ?? false,
                });
            } else {
                form.resetFields();
                form.setFieldsValue({ active: true, mappingProcedure: false, isCrossCompany: false });
            }
        }
    }, [openModal, dataInit]);

    const handleClose = () => {
        setOpenModal(false);
        setDataInit(null);
        form.resetFields();
    };

    const handleSubmit = async (values: any) => {
        const payload: IDocumentCategory = {
            categoryCode: values.categoryCode?.trim().toUpperCase(),
            categoryName: values.categoryName?.trim(),
            symbol: values.symbol?.trim() || undefined,
            definition: values.definition?.trim() || undefined,
            active: values.active ?? true,
            mappingProcedure: values.mappingProcedure ?? false,
            isCrossCompany: values.isCrossCompany ?? false,
        };

        if (isEdit && dataInit?.id) {
            await updateMutation.mutateAsync({ id: dataInit.id, data: payload });
        } else {
            await createMutation.mutateAsync(payload);
        }

        handleClose();
        return true;
    };

    const handleMappingProcedureChange = (checked: boolean) => {
        form.setFieldValue("mappingProcedure", checked);
        if (checked) {
            form.setFieldValue("isCrossCompany", false);
        }
    };

    const handleCrossCompanyChange = (checked: boolean) => {
        form.setFieldValue("isCrossCompany", checked);
        if (checked) {
            form.setFieldValue("mappingProcedure", false);
        }
    };

    return (
        <ModalForm
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: "linear-gradient(135deg,#fff0f6,#ffe6f0)",
                        border: "1.5px solid #ffd6dd",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <FolderOutlined style={{ fontSize: 15, color: PINK }} />
                    </div>
                    <div>
                        <div style={{
                            fontSize: 15, fontWeight: 700, color: "#111827",
                            letterSpacing: "-0.03em", lineHeight: 1.2,
                        }}>
                            {isEdit ? "Cập nhật danh mục loại văn bản" : "Thêm danh mục loại văn bản"}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                            {isEdit ? `Chỉnh sửa: ${dataInit?.categoryCode ?? ""}` : "Nhập thông tin để tạo mới"}
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
                    style: { borderRadius: 8, background: PINK, borderColor: PINK, fontWeight: 600 },
                    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
                        (e.currentTarget as HTMLButtonElement).style.background = PINK_HOVER;
                        (e.currentTarget as HTMLButtonElement).style.borderColor = PINK_HOVER;
                    },
                    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
                        (e.currentTarget as HTMLButtonElement).style.background = PINK;
                        (e.currentTarget as HTMLButtonElement).style.borderColor = PINK;
                    },
                },
            }}
            modalProps={{
                onCancel: handleClose,
                destroyOnHidden: true,
                maskClosable: false,
                className: "document-category-form-modal",
                styles: {
                    body: { padding: "16px 24px" },
                    header: { paddingBottom: 12, borderBottom: "1px solid #f3f4f6" },
                },
            }}
        >
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        label="Mã danh mục"
                        name="categoryCode"
                        rules={[
                            { required: true, message: "Vui lòng nhập mã danh mục" },
                            { max: 50, message: "Tối đa 50 ký tự" },
                            { pattern: /^[A-Za-z0-9_]*$/, message: "Chỉ chấp nhận chữ, số và dấu gạch dưới" },
                        ]}
                    >
                        <Input
                            placeholder="VD: QUY_CHE"
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
                        <Input placeholder="VD: QC" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item
                label="Tên danh mục"
                name="categoryName"
                rules={[
                    { required: true, message: "Vui lòng nhập tên danh mục" },
                    { max: 200, message: "Tối đa 200 ký tự" },
                ]}
            >
                <Input placeholder="VD: Quy chế" />
            </Form.Item>

            <Form.Item label="Định nghĩa" name="definition">
                <Input.TextArea
                    rows={3}
                    placeholder="Mô tả ngắn về loại văn bản này..."
                    style={{ borderRadius: 8 }}
                />
            </Form.Item>

            <div style={{
                display: "flex",
                justifyContent: "space-around",
                alignItems: "flex-start",
                padding: "12px 0",
                background: "#f9fafb",
                borderRadius: 12,
                marginTop: 8,
                border: "1px dashed #e5e7eb"
            }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                        Mapping QT
                        {isCrossCompanyVal && (
                            <Tooltip title="Không thể bật khi đang chọn Liên công ty">
                                <InfoCircleOutlined style={{ fontSize: 11, color: "#d1d5db" }} />
                            </Tooltip>
                        )}
                    </span>
                    <Form.Item name="mappingProcedure" valuePropName="checked" noStyle>
                        <Switch
                            checkedChildren="Có"
                            unCheckedChildren="Không"
                            disabled={isCrossCompanyVal}
                            onChange={handleMappingProcedureChange}
                            className="blue-switch"
                        />
                    </Form.Item>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}>
                        Liên công ty
                        {mappingProcedureVal && (
                            <Tooltip title="Không thể bật khi đang chọn Mapping quy trình">
                                <InfoCircleOutlined style={{ fontSize: 11, color: "#d1d5db" }} />
                            </Tooltip>
                        )}
                    </span>
                    <Form.Item name="isCrossCompany" valuePropName="checked" noStyle>
                        <Switch
                            checkedChildren="Có"
                            unCheckedChildren="Không"
                            disabled={mappingProcedureVal}
                            onChange={handleCrossCompanyChange}
                            className="blue-switch"
                        />
                    </Form.Item>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>
                        Trạng thái
                    </span>
                    <Form.Item name="active" valuePropName="checked" noStyle>
                        <Switch
                            checkedChildren="Bật"
                            unCheckedChildren="Tắt"
                            className="pink-switch"
                        />
                    </Form.Item>
                </div>
            </div>

            <style>{`
                .blue-switch.ant-switch-checked { background-color: #1677ff !important; }
                .pink-switch.ant-switch-checked { background-color: ${PINK} !important; }
                .ant-switch:not(.ant-switch-checked) { background-color: #d1d5db !important; }
                .ant-switch-disabled { opacity: 0.45 !important; }
            `}</style>
        </ModalForm>
    );
};

export default ModalDocumentCategory;
