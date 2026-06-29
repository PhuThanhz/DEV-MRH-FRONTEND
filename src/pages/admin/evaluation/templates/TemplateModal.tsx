import { Modal, Form, Input, Select, Button } from 'antd';
import { useState, useEffect } from 'react';
import { callCreateEvaluationTemplate, callUpdateEvaluationTemplate, callFetchCompany, callFetchCompanyJobTitlesByCompany } from '@/config/api';
import type { IEvaluationTemplate } from '@/types/backend';
import Access from '@/components/share/access';
import { ALL_PERMISSIONS } from '@/config/permissions';
import { notify } from '@/components/common/notification/notify';
import { getModalWidth } from '@/utils/responsive';

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
    const [jobTitles, setJobTitles] = useState<{ label: string; value: number }[]>([]);

    useEffect(() => {
        const loadOptions = async () => {
            try {
                const compRes = await callFetchCompany("page=1&size=200&sort=name,asc");
                if (compRes?.data?.result) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    targetJobTitles: dataInit.targetJobTitles?.map(jt => jt.id) || [],
                });
            } else {
                form.resetFields();
            }
        }
    }, [openModal, dataInit, form]);

    const watchCompanyId = Form.useWatch('companyId', form);

    useEffect(() => {
        const loadJobTitles = async () => {
            if (watchCompanyId) {
                try {
                    const res = await callFetchCompanyJobTitlesByCompany(watchCompanyId);
                    if (res?.data) {
                        // Trích xuất jobTitle gốc từ danh sách company job titles
                        const uniqueTitles = Array.from(
                            new Map(res.data
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                .filter((cjt: any) => cjt.jobTitle)
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                .map((cjt: any) => [cjt.jobTitle.id, { label: cjt.jobTitle.nameVi, value: cjt.jobTitle.id }])
                            ).values()
                        );
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        setJobTitles(uniqueTitles as any);
                    }
                } catch {
                    setJobTitles([]);
                }
            } else {
                setJobTitles([]);
                // Xóa chọn chức danh nếu chưa chọn công ty
                form.setFieldValue('targetJobTitles', []);
            }
        };
        
        loadJobTitles();
    }, [watchCompanyId, form]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                targetJobTitles: values.targetJobTitles?.map((id: number) => ({ id })) || [],
            };

            if (dataInit?.id) {
                res = await callUpdateEvaluationTemplate(dataInit.id, payload);
                if (res?.data) {
                    notify.success('Cập nhật mẫu đánh giá thành công');
                }
            } else {
                res = await callCreateEvaluationTemplate(payload);
                if (res?.data) {
                    notify.success('Tạo mẫu đánh giá thành công');
                }
            }

            if (res?.data) {
                setOpenModal(false);
                if (setDataInit) setDataInit(null);
                reloadTable();
            } else {
                notify.error('Có lỗi xảy ra');
            }
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            const msg = error?.message || error?.response?.data?.message || 'Lỗi kết nối máy chủ';
            notify.error(msg);
        } finally {
            setIsSubmit(false);
        }
    };

    return (
        <Modal
            title={dataInit ? "Cập nhật Mẫu đánh giá" : "Tạo mới Mẫu đánh giá"}
            open={openModal}
            footer={[
                <Button key="cancel" onClick={() => {
                    setOpenModal(false);
                    if (setDataInit) setDataInit(null);
                }}>
                    Hủy
                </Button>,
                <Access
                    key="submit"
                    permission={dataInit?.id ? ALL_PERMISSIONS.EVALUATION.UPDATE_TEMPLATE : ALL_PERMISSIONS.EVALUATION.CREATE_TEMPLATE}
                    hideChildren
                >
                    <Button type="primary" onClick={() => form.submit()} loading={isSubmit}>
                        {dataInit?.id ? "Cập nhật" : "Tạo mới"}
                    </Button>
                </Access>
            ]}
            onCancel={() => {
                setOpenModal(false);
                if (setDataInit) setDataInit(null);
            }}
            confirmLoading={isSubmit}
            width={getModalWidth(600)}
            destroyOnClose
            maskClosable={false}
        >
            <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
                <Form.Item
                    label="Tên mẫu đánh giá"
                    name="name"
                    rules={[
                        { required: true, message: 'Vui lòng nhập tên!' },
                        { max: 200, message: 'Tên mẫu đánh giá không vượt quá 200 ký tự!' }
                    ]}
                >
                    <Input placeholder="VD: Đánh giá nhân viên thử việc" />
                </Form.Item>

                <Form.Item
                    label="Công ty"
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
                    label={
                        <span style={{ display: 'inline-flex', flexDirection: 'column' }}>
                            <span>Giới hạn Chức danh áp dụng (Tùy chọn)</span>
                            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 'normal' }}>
                                Vui lòng chọn Công ty trước. Để trống để áp dụng cho TẤT CẢ chức danh trong nhóm đối tượng trên.
                            </span>
                        </span>
                    }
                    name="targetJobTitles"
                >
                    <Select
                        mode="multiple"
                        placeholder={watchCompanyId ? "Chọn chức danh cụ thể..." : "Hãy chọn công ty trước..."}
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        options={jobTitles}
                        disabled={!watchCompanyId}
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
