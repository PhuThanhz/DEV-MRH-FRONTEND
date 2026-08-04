import { Modal, Form, Input, Select, Button, ConfigProvider } from 'antd';
import { useState, useEffect, useMemo } from 'react';
import { useCompaniesQuery } from '@/hooks/useCompanies';
import { useCompanyJobTitlesQuery } from '@/hooks/useCompanyJobTitles';
import {
    useCreateEvaluationTemplateMutation,
    useUpdateEvaluationTemplateMutation,
} from '@/hooks/useEvaluations';
import type { IEvaluationTemplate } from '@/types/backend';
import Access from '@/components/share/access';
import { ALL_PERMISSIONS } from '@/config/permissions';
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
    const watchCompanyId = Form.useWatch('companyId', form);
    const createTemplateMutation = useCreateEvaluationTemplateMutation();
    const updateTemplateMutation = useUpdateEvaluationTemplateMutation();

    const { data: companiesData } = useCompaniesQuery("page=1&size=200&sort=name,asc", openModal);
    const companies = useMemo(() => {
        return (companiesData?.result ?? []).map((c: any) => ({ label: c.name, value: c.id }));
    }, [companiesData]);

    const { data: rawCompanyJts = [] } = useCompanyJobTitlesQuery(openModal && watchCompanyId ? watchCompanyId : undefined);
    const jobTitles = useMemo(() => {
        if (!watchCompanyId) return [];
        return Array.from(
            new Map(rawCompanyJts
                .filter((cjt: any) => cjt.jobTitle)
                .map((cjt: any) => [cjt.jobTitle.id, { label: cjt.jobTitle.nameVi, value: cjt.jobTitle.id }])
            ).values()
        ) as { label: string; value: number }[];
    }, [watchCompanyId, rawCompanyJts]);

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
                res = await updateTemplateMutation.mutateAsync({ id: dataInit.id, data: payload });
            } else {
                res = await createTemplateMutation.mutateAsync(payload);
            }

            if (res?.data) {
                setOpenModal(false);
                if (setDataInit) setDataInit(null);
                reloadTable();
            }
        } catch {
            return;
        } finally {
            setIsSubmit(false);
        }
    };

    return (
        <ConfigProvider
            theme={{
                components: {
                    Modal: {
                        contentBg: "#ffffff",
                        headerBg: "#ffffff",
                        titleColor: "#0f172a",
                        borderRadiusLG: 16,
                        titleFontSize: 18,
                    },
                    Input: {
                        controlHeight: 42,
                        borderRadius: 8,
                        colorBorder: "#cbd5e1",
                        activeBorderColor: "#2563eb",
                        hoverBorderColor: "#94a3b8",
                        colorTextPlaceholder: "#94a3b8",
                    },
                    Select: {
                        controlHeight: 42,
                        borderRadius: 8,
                        colorBorder: "#cbd5e1",
                        activeBorderColor: "#2563eb",
                        hoverBorderColor: "#94a3b8",
                        colorTextPlaceholder: "#94a3b8",
                    },
                    Button: {
                        controlHeight: 40,
                        borderRadius: 8,
                        fontWeight: 500,
                        colorPrimary: "#e8637a",
                        colorPrimaryHover: "#db4f67",
                        colorPrimaryActive: "#c83e54",
                    },
                },
            }}
        >
            <Modal
                title={
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingBottom: 6 }}>
                        <span style={{
                            fontSize: "10px",
                            textTransform: "uppercase",
                            letterSpacing: "0.15em",
                            color: "#94a3b8",
                            fontWeight: 600
                        }}>
                            {dataInit ? "Cấu hình dữ liệu" : "Khởi tạo dữ liệu"}
                        </span>
                        <span style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>
                            {dataInit ? "Cập nhật Mẫu đánh giá" : "Tạo mới Mẫu đánh giá"}
                        </span>
                    </div>
                }
                open={openModal}
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => {
                            setOpenModal(false);
                            if (setDataInit) setDataInit(null);
                        }}
                        style={{
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            color: "#475569",
                            fontWeight: 500,
                            height: 40
                        }}
                    >
                        Hủy
                    </Button>,
                    <Access
                        key="submit"
                        permission={dataInit?.id ? ALL_PERMISSIONS.EVALUATION.UPDATE_TEMPLATE : ALL_PERMISSIONS.EVALUATION.CREATE_TEMPLATE}
                        hideChildren
                    >
                        <Button
                            type="primary"
                            onClick={() => form.submit()}
                            loading={isSubmit}
                            style={{
                                borderRadius: 8,
                                height: 40,
                                fontWeight: 500,
                                background: "#e8637a",
                                border: "none",
                                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                            }}
                        >
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
                destroyOnHidden
                maskClosable={false}
            >
                <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
                    <Form.Item
                        label={<span style={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}>Tên mẫu đánh giá</span>}
                        name="name"
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên!' },
                            { max: 200, message: 'Tên mẫu đánh giá không vượt quá 200 ký tự!' }
                        ]}
                    >
                        <Input placeholder="VD: Đánh giá nhân viên thử việc" />
                    </Form.Item>

                    <Form.Item
                        label={<span style={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}>Công ty áp dụng</span>}
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
                        label={<span style={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}>Đối tượng áp dụng</span>}
                        name="type"
                        rules={[{ required: true, message: 'Vui lòng chọn đối tượng!' }]}
                    >
                        <Select
                            placeholder="Chọn đối tượng áp dụng..."
                            options={[
                                { label: 'Nhân viên', value: 'STAFF' },
                                { label: 'Quản lý', value: 'MANAGER' },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        label={
                            <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 2 }}>
                                <span style={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}>Chức danh áp dụng (Tùy chọn)</span>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'normal', lineHeight: '1.4' }}>
                                    {!watchCompanyId
                                        ? "Vui lòng chọn Công ty trước để tải danh sách chức danh"
                                        : "Để trống để áp dụng cho TẤT CẢ chức danh trong nhóm đối tượng trên."
                                    }
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

                    <Form.Item
                        label={<span style={{ fontWeight: 600, color: '#334155', fontSize: '13px' }}>Mô tả chi tiết</span>}
                        name="description"
                        style={{ marginBottom: 0 }}
                    >
                        <Input.TextArea rows={3} placeholder="Mô tả ngắn gọn về mẫu..." style={{ borderRadius: 8 }} />
                    </Form.Item>
                </Form>
            </Modal>
        </ConfigProvider>
    );
};

export default TemplateModal;
