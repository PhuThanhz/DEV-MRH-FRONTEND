import {
    ModalForm,
    ProFormText,
    ProFormTextArea,
    ProFormSwitch,
    ProFormSelect,
} from "@ant-design/pro-components";
import { Col, Form, Row, message, Card } from "antd"; // ⭐ Thêm Card để nhóm đẹp
import { useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import {
    useCreateCareerPathMutation,
    useUpdateCareerPathMutation,
} from "@/hooks/useCareerPaths";

import { useDepartmentJobTitlesQuery } from "@/hooks/useDepartmentJobTitles";
import type { ICareerPath } from "@/types/backend";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: ICareerPath | null;
    setDataInit: (v: any) => void;
}

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

    const { data: jobTitles = [], isFetching: loadingJobTitles } =
        useDepartmentJobTitlesQuery(Number(departmentId));

    const { mutate: createCareerPath, isPending: isCreating } =
        useCreateCareerPathMutation();
    const { mutate: updateCareerPath, isPending: isUpdating } =
        useUpdateCareerPathMutation();

    useEffect(() => {
        if (isEdit && dataInit) {
            form.setFieldsValue({
                ...dataInit,
                jobTitleId: dataInit.jobTitleId,
                active: dataInit.active,
            });
        } else {
            form.resetFields();
            form.setFieldValue("departmentId", departmentId);
            form.setFieldValue("active", true);
        }
    }, [dataInit, departmentId, form]);

    const handleReset = () => {
        form.resetFields();
        setDataInit(null);
        setOpenModal(false);
    };

    const submitCareerPath = async (values: any) => {
        try {
            const payload = {
                ...values,
                departmentId: Number(departmentId),
            };

            if (isEdit) {
                updateCareerPath({ id: dataInit!.id!, ...payload });
            } else {
                createCareerPath(payload);
            }

            handleReset();
        } catch (err: any) {
            message.error(err?.response?.data?.message || "Có lỗi xảy ra");
        }
    };

    return (
        <ModalForm
            title={isEdit ? "Cập nhật lộ trình thăng tiến" : "Tạo lộ trình thăng tiến"}
            open={openModal}
            form={form}
            onFinish={submitCareerPath}
            modalProps={{
                onCancel: handleReset,
                afterClose: handleReset,
                destroyOnClose: true,
                width: 1000, // ⭐ Rộng hơn để nằm ngang thoải mái
                maskClosable: false,
                confirmLoading: isCreating || isUpdating,
            }}
        >
            <Row gutter={[16, 16]}>
                {/* Nhóm 1: Thông tin cơ bản - nằm ngang */}
                <Col span={24}>
                    <Card title="Thông tin cơ bản" bordered={false} className="mb-4 shadow-sm">
                        <Row gutter={16}>
                            <Col span={8}>
                                {/* Tên phòng ban đẹp, không viền */}
                                <ProFormText
                                    label="Phòng ban"
                                    name="departmentNameDisplay"
                                    initialValue={departmentName}
                                    disabled
                                    fieldProps={{
                                        bordered: false,
                                        style: {
                                            background: "#f0f5ff",
                                            padding: "8px 12px",
                                            borderRadius: 6,
                                            color: "#1890ff",
                                            fontWeight: "500",
                                        },
                                    }}
                                />
                                <ProFormText name="departmentId" hidden />
                            </Col>

                            <Col span={8}>
                                <ProFormSelect
                                    name="jobTitleId"
                                    label="Chức danh"
                                    placeholder="Chọn chức danh"
                                    disabled={isEdit}
                                    rules={[{ required: true, message: "Vui lòng chọn chức danh" }]}
                                    fieldProps={{
                                        loading: loadingJobTitles,
                                        showSearch: true,
                                        filterOption: (input, option) =>
                                            (option?.label ?? "").toLowerCase().includes(input.toLowerCase()),
                                    }}
                                    options={jobTitles.map((jt: any) => ({
                                        label: jt.jobTitle?.nameVi,
                                        value: jt.jobTitle?.id,
                                    }))}
                                />
                            </Col>

                            <Col span={8}>
                                <ProFormText
                                    name="requiredTime"
                                    label="Thời gian giữ vị trí (tháng)"
                                    placeholder="Ví dụ: 12, 24..."
                                />
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Nhóm 2: Yêu cầu & Tiêu chuẩn */}
                <Col span={24}>
                    <Card title="Yêu cầu & Tiêu chuẩn" bordered={false} className="mb-4 shadow-sm">
                        <Row gutter={16}>
                            <Col span={12}>
                                <ProFormTextArea
                                    name="jobStandard"
                                    label="Tiêu chuẩn chức danh"
                                    placeholder="Mô tả tiêu chuẩn cần đạt..."
                                    fieldProps={{ rows: 4 }}
                                />
                            </Col>
                            <Col span={12}>
                                <ProFormTextArea
                                    name="trainingRequirement"
                                    label="Yêu cầu đào tạo"
                                    placeholder="Các khóa học, kỹ năng cần đào tạo..."
                                    fieldProps={{ rows: 4 }}
                                />
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Nhóm 3: Đánh giá & Kết quả */}
                <Col span={24}>
                    <Card title="Đánh giá & Kết quả mong đợi" bordered={false} className="mb-4 shadow-sm">
                        <Row gutter={16}>
                            <Col span={8}>
                                <ProFormTextArea
                                    name="evaluationMethod"
                                    label="Phương pháp đánh giá"
                                    placeholder="KPI, 360 độ, phỏng vấn..."
                                    fieldProps={{ rows: 4 }}
                                />
                            </Col>
                            <Col span={8}>
                                <ProFormTextArea
                                    name="trainingOutcome"
                                    label="Kết quả đào tạo mong đợi"
                                    placeholder="Kỹ năng đạt được sau đào tạo..."
                                    fieldProps={{ rows: 4 }}
                                />
                            </Col>
                            <Col span={8}>
                                <ProFormTextArea
                                    name="performanceRequirement"
                                    label="Yêu cầu hiệu quả công việc"
                                    placeholder="Mức KPI, chỉ số hiệu suất..."
                                    fieldProps={{ rows: 4 }}
                                />
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Nhóm 4: Ghi chú & Trạng thái - nằm ngang */}
                <Col span={24}>
                    <Card title="Ghi chú & Trạng thái" bordered={false} className="shadow-sm">
                        <Row gutter={16} align="middle">
                            <Col span={12}>
                                <ProFormTextArea
                                    name="salaryNote"
                                    label="Ghi chú về lương"
                                    placeholder="Lương, phụ cấp, thưởng theo lộ trình..."
                                    fieldProps={{ rows: 3 }}
                                />
                            </Col>

                            <Col span={6}>
                                <ProFormSwitch
                                    name="active"
                                    label="Kích hoạt lộ trình"
                                    checkedChildren="Bật"
                                    unCheckedChildren="Tắt"
                                />
                            </Col>

                            <Col span={6}>
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
                </Col>
            </Row>
        </ModalForm>
    );
};

export default ModalCareerPath;