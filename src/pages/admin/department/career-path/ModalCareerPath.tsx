import {
    ModalForm,
    ProFormText,
    ProFormTextArea,
    ProFormSwitch,
    ProFormSelect,
} from "@ant-design/pro-components";
import { Col, Row, Form, Card, Button, Space, Tag, Divider, Typography } from "antd";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import {
    useCreateCareerPathMutation,
    useUpdateCareerPathMutation,
    usePreviewBulkCareerPathMutation,
    useBulkCreateCareerPathMutation,
    useActiveJobTitlesByDepartment,
} from "@/hooks/useCareerPaths";

import type {
    ICareerPath,
    ICareerPathPreviewResponse,
} from "@/types/backend";
import { notify } from "@/components/common/notification/notify";

const { Title, Text } = Typography;

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: ICareerPath | null;
    setDataInit: (v: any) => void;
}

const cardStyle: React.CSSProperties = {
    marginBottom: 12,
    borderRadius: 8,
    border: "1px solid #f0f0f0",
};

const ModalCareerPath = ({
    openModal,
    setOpenModal,
    dataInit,
    setDataInit,
}: IProps) => {
    const { departmentId } = useParams();
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName") || "Không xác định";

    const [form] = Form.useForm();
    const isEdit = Boolean(dataInit?.id);

    const [selectedJobTitleIds, setSelectedJobTitleIds] = useState<number[]>([]);
    const [previewData, setPreviewData] = useState<ICareerPathPreviewResponse | null>(null);

    // Hook lấy danh sách chức danh
    const { data: jobTitles = [], isFetching: loadingJobTitles } =
        useActiveJobTitlesByDepartment(Number(departmentId));

    const { mutate: createCareerPath, isPending: isCreating } = useCreateCareerPathMutation();
    const { mutate: updateCareerPath, isPending: isUpdating } = useUpdateCareerPathMutation();
    const { mutateAsync: previewBulk, isPending: isPreviewing } = usePreviewBulkCareerPathMutation();
    const { mutateAsync: bulkCreate, isPending: isBulkCreating } = useBulkCreateCareerPathMutation();

    useEffect(() => {
        if (isEdit && dataInit) {
            form.setFieldsValue({
                ...dataInit,
                active: dataInit.active ?? true,
            });
        } else {
            form.resetFields();
            form.setFieldValue("departmentId", Number(departmentId));
            form.setFieldValue("active", true);
            form.setFieldValue("status", 1);
            setSelectedJobTitleIds([]);
            setPreviewData(null);
        }
    }, [dataInit, isEdit, departmentId, form]);

    const handleReset = () => {
        form.resetFields();
        setSelectedJobTitleIds([]);
        setPreviewData(null);
        setDataInit(null);
        setOpenModal(false);
    };

    const handlePreview = async () => {
        try {
            const values = await form.validateFields();
            const jobTitleIds: number[] = form.getFieldValue("jobTitleIds") || [];

            if (jobTitleIds.length === 0) {
                notify.warning("Vui lòng chọn ít nhất một chức danh");
                return;
            }

            const payload = {
                departmentId: Number(departmentId),
                jobTitleIds,
                jobStandard: values.jobStandard,
                trainingRequirement: values.trainingRequirement,
                evaluationMethod: values.evaluationMethod,
                requiredTime: values.requiredTime,
                trainingOutcome: values.trainingOutcome,
                performanceRequirement: values.performanceRequirement,
                salaryNote: values.salaryNote,
                status: values.status,
            };

            const preview = await previewBulk(payload);
            setPreviewData(preview);
            setSelectedJobTitleIds(jobTitleIds);
        } catch (err: any) {
            notify.error(err?.message || "Không thể xem trước");
        }
    };

    const handleConfirmCreate = async () => {
        if (!previewData) return;

        const values = form.getFieldsValue();

        const payload = {
            departmentId: Number(departmentId),
            jobTitleIds: selectedJobTitleIds,
            ...values,
        };

        try {
            if (selectedJobTitleIds.length === 1) {
                createCareerPath({
                    ...payload,
                    jobTitleId: selectedJobTitleIds[0],
                });
            } else {
                await bulkCreate(payload);
            }
            handleReset();
        } catch (err: any) {
            notify.error(err?.message || "Có lỗi xảy ra");
        }
    };

    return (
        <ModalForm
            title={isEdit ? "Cập nhật lộ trình thăng tiến" : "Tạo lộ trình thăng tiến"}
            open={openModal}
            form={form}
            modalProps={{
                onCancel: handleReset,
                afterClose: handleReset,
                destroyOnClose: true,
                width: "min(1000px, 95vw)",
                maskClosable: false,
            }}
            submitter={
                isEdit
                    ? undefined
                    : {
                        render: () => (
                            <Space>
                                <Button onClick={handleReset}>Hủy</Button>
                                <Button
                                    type="primary"
                                    loading={isPreviewing}
                                    onClick={handlePreview}
                                >
                                    Xem trước
                                </Button>
                            </Space>
                        ),
                    }
            }
        >
            {/* Nhóm 1: Thông tin cơ bản */}
            <Card title="Thông tin cơ bản" bordered={false} style={cardStyle}>
                <Row gutter={[12, 0]}>
                    <Col xs={24} sm={8}>
                        <ProFormText
                            label="Phòng ban"
                            name="departmentNameDisplay"
                            initialValue={departmentName}
                            disabled
                            fieldProps={{
                                style: {
                                    background: "#f0f5ff",
                                    borderRadius: 6,
                                    color: "#1890ff",
                                    fontWeight: 500,
                                },
                            }}
                        />
                        <ProFormText name="departmentId" hidden />
                    </Col>

                    <Col xs={24} sm={8}>
                        <ProFormSelect
                            name="jobTitleIds"
                            label="Chức danh"
                            mode="multiple"
                            placeholder="Chọn một hoặc nhiều chức danh"
                            rules={[{ required: true, message: "Vui lòng chọn ít nhất một chức danh" }]}
                            options={jobTitles.map((jt: any) => ({
                                label: (
                                    <Space>
                                        {jt.nameVi}
                                        {jt.alreadyExists && <Tag color="red">Đã tồn tại</Tag>}
                                    </Space>
                                ),
                                value: jt.id,
                                disabled: jt.alreadyExists,
                            }))}
                            fieldProps={{
                                loading: loadingJobTitles,
                                showSearch: true,
                                filterOption: (input: string, option: any) =>
                                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase()),
                                onChange: () => setPreviewData(null),
                            }}
                        />
                    </Col>

                    <Col xs={24} sm={8}>
                        <ProFormText
                            name="requiredTime"
                            label="Thời gian giữ vị trí (tháng)"
                            placeholder="Ví dụ: 12, 18, 24..."
                        />
                    </Col>
                </Row>
            </Card>

            {/* Nhóm 2: Yêu cầu & Tiêu chuẩn */}
            <Card title="Yêu cầu & Tiêu chuẩn" bordered={false} style={cardStyle}>
                <Row gutter={[12, 0]}>
                    <Col xs={24} sm={12}>
                        <ProFormTextArea
                            name="jobStandard"
                            label="Tiêu chuẩn chức danh"
                            placeholder="Mô tả tiêu chuẩn cần đạt..."
                            fieldProps={{ rows: 4 }}
                        />
                    </Col>
                    <Col xs={24} sm={12}>
                        <ProFormTextArea
                            name="trainingRequirement"
                            label="Yêu cầu đào tạo"
                            placeholder="Các khóa học, kỹ năng cần đào tạo..."
                            fieldProps={{ rows: 4 }}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Nhóm 3: Đánh giá & Kết quả */}
            <Card title="Đánh giá & Kết quả mong đợi" bordered={false} style={cardStyle}>
                <Row gutter={[12, 0]}>
                    <Col xs={24} sm={8}>
                        <ProFormTextArea
                            name="evaluationMethod"
                            label="Phương pháp đánh giá"
                            placeholder="KPI, 360 độ, phỏng vấn..."
                            fieldProps={{ rows: 4 }}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <ProFormTextArea
                            name="trainingOutcome"
                            label="Kết quả đào tạo mong đợi"
                            placeholder="Kỹ năng đạt được sau đào tạo..."
                            fieldProps={{ rows: 4 }}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <ProFormTextArea
                            name="performanceRequirement"
                            label="Yêu cầu hiệu quả công việc"
                            placeholder="Mức KPI, chỉ số hiệu suất..."
                            fieldProps={{ rows: 4 }}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Nhóm 4: Ghi chú & Trạng thái */}
            <Card title="Ghi chú & Trạng thái" bordered={false} style={{ ...cardStyle, marginBottom: 0 }}>
                <Row gutter={[12, 0]} align="middle">
                    <Col xs={24} sm={12}>
                        <ProFormTextArea
                            name="salaryNote"
                            label="Ghi chú về lương"
                            placeholder="Lương, phụ cấp, thưởng theo lộ trình..."
                            fieldProps={{ rows: 3 }}
                        />
                    </Col>

                    <Col xs={12} sm={6}>
                        <ProFormSwitch
                            name="active"
                            label="Kích hoạt lộ trình"
                            checkedChildren="Bật"
                            unCheckedChildren="Tắt"
                        />
                    </Col>

                    <Col xs={12} sm={6}>
                        <ProFormSelect
                            name="status"
                            label="Trạng thái phê duyệt"
                            initialValue={1}
                            options={[
                                { label: "Draft (Nháp)", value: 0 },
                                { label: "Approved (Đã duyệt)", value: 1 },
                                { label: "Archived (Lưu trữ)", value: 2 },
                            ]}
                        />
                    </Col>
                </Row>
            </Card>

            {/* ==================== PREVIEW SECTION ==================== */}
            {previewData && !isEdit && (
                <>
                    <Divider />
                    <Card title="📋 Kết quả xem trước" bordered={false}>
                        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                            <Title level={5}>
                                Tổng chọn: <Text strong>{selectedJobTitleIds.length}</Text> chức danh
                            </Title>

                            {previewData.willCreate?.length > 0 && (
                                <div>
                                    <Tag color="green">Sẽ tạo: {previewData.willCreate.length}</Tag>
                                    <ul style={{ paddingLeft: 16, marginTop: 8 }}>
                                        {previewData.willCreate.map((item: any) => (
                                            <li key={item.jobTitleId}>
                                                {item.jobTitleName || item.nameVi}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {previewData.willSkip?.length > 0 && (
                                <div>
                                    <Tag color="orange">Bỏ qua: {previewData.willSkip.length}</Tag>
                                    <ul style={{ paddingLeft: 16, marginTop: 8 }}>
                                        {previewData.willSkip.map((item: any) => (
                                            <li key={item.jobTitleId} style={{ color: "#fa8c16" }}>
                                                {item.jobTitleName} — {item.reason}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <Button
                                type="primary"
                                size="large"
                                block
                                loading={isBulkCreating || isCreating}
                                onClick={handleConfirmCreate}
                                disabled={!previewData.willCreate || previewData.willCreate.length === 0}
                            >
                                Xác nhận tạo {previewData.willCreate?.length || 0} lộ trình
                            </Button>
                        </Space>
                    </Card>
                </>
            )}
        </ModalForm>
    );
};

export default ModalCareerPath;