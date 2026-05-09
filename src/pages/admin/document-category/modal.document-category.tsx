import { useEffect } from "react";
import { Form, Input, Switch, Row, Col } from "antd";
import { ModalForm } from "@ant-design/pro-components";

import type { IDocumentCategory } from "@/types/backend";
import {
    useCreateDocumentCategoryMutation,
    useUpdateDocumentCategoryMutation,
} from "@/hooks/useDocumentCategories";

interface Props {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit: IDocumentCategory | null;
    setDataInit: (v: IDocumentCategory | null) => void;
}

const ModalDocumentCategory = ({
    openModal,
    setOpenModal,
    dataInit,
    setDataInit,
}: Props) => {
    const [form] = Form.useForm();
    const isEdit = !!dataInit?.id;

    const createMutation = useCreateDocumentCategoryMutation();
    const updateMutation = useUpdateDocumentCategoryMutation();

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
                });
            } else {
                form.resetFields();
                form.setFieldsValue({ active: true, mappingProcedure: false });
            }
        }
    }, [openModal, dataInit]);

    const handleSubmit = async (values: any) => {
        const payload: IDocumentCategory = {
            categoryCode: values.categoryCode?.trim().toUpperCase(),
            categoryName: values.categoryName?.trim(),
            symbol: values.symbol?.trim() || undefined,
            definition: values.definition?.trim() || undefined,
            active: values.active ?? true,
            mappingProcedure: values.mappingProcedure ?? false,
        };

        if (isEdit && dataInit?.id) {
            await updateMutation.mutateAsync({ id: dataInit.id, data: payload });
        } else {
            await createMutation.mutateAsync(payload);
        }

        setOpenModal(false);
        setDataInit(null);
        form.resetFields();
    };

    return (
        <ModalForm
            title={isEdit ? "Cập nhật danh mục loại văn bản" : "Thêm danh mục loại văn bản"}
            open={openModal}
            form={form}
            modalProps={{
                destroyOnClose: true,
                onCancel: () => {
                    setOpenModal(false);
                    setDataInit(null);
                    form.resetFields();
                },
                width: 600,
            }}
            submitter={{
                searchConfig: {
                    submitText: isEdit ? "Cập nhật" : "Tạo mới",
                    resetText: "Huỷ",
                },
            }}
            onFinish={handleSubmit}
        >
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        label="Mã danh mục"
                        name="categoryCode"
                        rules={[
                            { required: true, message: "Vui lòng nhập mã danh mục" },
                            { max: 50, message: "Tối đa 50 ký tự" },
                        ]}
                    >
                        <Input
                            placeholder="VD: QUY_CHE"
                            disabled={isEdit}
                            style={{ textTransform: "uppercase" }}
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
                />
            </Form.Item>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        label="Mapping quy trình"
                        name="mappingProcedure"
                        valuePropName="checked"
                        tooltip="Bật nếu loại văn bản này liên kết với quy trình"
                    >
                        <Switch checkedChildren="Có" unCheckedChildren="Không" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        label="Trạng thái"
                        name="active"
                        valuePropName="checked"
                    >
                        <Switch checkedChildren="Hoạt động" unCheckedChildren="Tắt" />
                    </Form.Item>
                </Col>
            </Row>
        </ModalForm>
    );
};

export default ModalDocumentCategory;