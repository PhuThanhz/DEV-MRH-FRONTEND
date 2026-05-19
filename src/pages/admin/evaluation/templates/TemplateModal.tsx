import { Modal, Form, Input, Select, message } from 'antd';
import { useState, useEffect } from 'react';
import { callCreateEvaluationTemplate, callUpdateEvaluationTemplate, callFetchCompany } from '@/config/api';
import type { IEvaluationTemplate } from '@/types/backend';

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    reloadTable: () => void;
    dataInit?: IEvaluationTemplate | null;
    setDataInit?: (v: IEvaluationTemplate | null) => void;
}

const TemplateModal = (props: IProps) => {
    const { openModal, setOpenModal, reloadTable, dataInit, setDataInit } = props;
    const [form] = Form.useForm();
    const [isSubmit, setIsSubmit] = useState(false);
    const [companies, setCompanies] = useState<{ label: string; value: number }[]>([]);

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const compRes = await callFetchCompany("page=1&size=200&sort=name,asc");
                if (compRes?.data?.result) {
                    setCompanies(compRes.data.result.map((c: any) => ({ label: c.name, value: c.id })));
                }
            } catch (error) {
                console.error("Lỗi khi tải cấu hình công ty", error);
            }
        };
        if (openModal) {
            loadOptions();
        }
    }, [openModal]);

    useEffect(() => {
        if (openModal) {
            if (dataInit) {
                form.setFieldsValue({
                    name: dataInit.name,
                    status: dataInit.status,
                    description: dataInit.description,
                    companyId: dataInit.company?.id || null,
                    type: dataInit.type,
                });
            } else {
                form.resetFields();
            }
        }
    }, [openModal, dataInit, form]);

    const onFinish = async (values: any) => {
        setIsSubmit(true);
        try {
            let res;
            const payload = {
                name: values.name,
                type: values.type,
                description: values.description,
                status: values.status || "DRAFT",
                company: { id: Number(values.companyId) },
            };

            if (dataInit?.id) {
                res = await callUpdateEvaluationTemplate(dataInit.id, payload);
                if (res?.data) {
                    message.success('Cập nhật mẫu đánh giá thành công');
                }
            } else {
                res = await callCreateEvaluationTemplate(payload);
                if (res?.data) {
                    message.success('Tạo mẫu đánh giá thành công');
                }
            }

            if (res?.data) {
                setOpenModal(false);
                if (setDataInit) setDataInit(null);
                reloadTable();
            } else {
                message.error('Có lỗi xảy ra');
            }
        } catch (error) {
            message.error('Lỗi kết nối máy chủ');
        } finally {
            setIsSubmit(false);
        }
    };

    return (
        <Modal
            title={dataInit ? "Cập nhật Mẫu đánh giá" : "Tạo mới Mẫu đánh giá"}
            open={openModal}
            onOk={() => form.submit()}
            onCancel={() => {
                setOpenModal(false);
                if (setDataInit) setDataInit(null);
            }}
            confirmLoading={isSubmit}
            width={600}
            destroyOnClose
            maskClosable={false}
        >
            <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
                <Form.Item
                    label="Tên mẫu đánh giá"
                    name="name"
                    rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
                >
                    <Input placeholder="VD: Đánh giá nhân viên thử việc" />
                </Form.Item>

                <Form.Item
                    label="Đối tượng áp dụng"
                    name="type"
                    rules={[{ required: true, message: 'Vui lòng chọn đối tượng!' }]}
                >
                    <Select
                        placeholder="Chọn đối tượng áp dụng..."
                        options={[
                            { label: 'Nhân viên (STAFF)', value: 'STAFF' },
                            { label: 'Quản lý (MANAGER)', value: 'MANAGER' },
                        ]}
                    />
                </Form.Item>

                <Form.Item
                    label={<span><span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>Công ty</span>}
                    name="companyId"
                    rules={[{ required: true, message: 'Vui lòng chọn công ty!' }]}
                >
                    <Select
                        placeholder="Chọn công ty áp dụng..."
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        options={companies}
                    />
                </Form.Item>

                <Form.Item label="Mô tả" name="description" style={{ marginBottom: 0 }}>
                    <Input.TextArea rows={3} placeholder="Mô tả ngắn gọn về mẫu..." />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default TemplateModal;
