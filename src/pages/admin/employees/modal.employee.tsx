import { useEffect, useState } from "react";
import { ModalForm } from "@ant-design/pro-components";
import {
    Form,
    message,
    Steps,
    Button,
    Typography,
    ConfigProvider,
    Input,
    Select,
    DatePicker,
    Switch,
    Space,
    Row,
    Col,
    Divider,
    Upload,
    Avatar,
} from "antd";
import { isMobile } from "react-device-detect";
import dayjs from "dayjs";
import {
    CheckOutlined,
    ArrowRightOutlined,
    UserOutlined,
    CameraOutlined,
} from "@ant-design/icons";

import type { IEmployee } from "@/types/backend";
import {
    useCreateEmployeeMutation,
    useUpdateEmployeeMutation,
} from "@/hooks/useEmployees";
import { callUploadSingleFile } from "@/config/api";
import UserPositionForm from "@/pages/admin/user/components/modal.user-position";

const { Text } = Typography;
const { Option } = Select;

const ACCENT = "#f5317f";
const ACCENT_HOVER = "#d4206a";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: IEmployee | null;
    setDataInit: (v: any) => void;
    onSuccess?: () => void;
}

const ModalEmployee = ({
    openModal,
    setOpenModal,
    dataInit,
    setDataInit,
    onSuccess,
}: IProps) => {
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [currentStep, setCurrentStep] = useState(0);
    const [createdUserId, setCreatedUserId] = useState<string | null>(null);

    const [form] = Form.useForm();
    const isEdit = Boolean(dataInit?.id);
    const activeUserId = isEdit
        ? (dataInit?.id)
        : (createdUserId ?? undefined);

    const { mutate: createEmployee, isPending: isCreating } =
        useCreateEmployeeMutation();
    const { mutate: updateEmployee, isPending: isUpdating } =
        useUpdateEmployeeMutation();

    const backendURL = import.meta.env.VITE_BACKEND_URL;

    // ========================= INIT =========================
    useEffect(() => {
        if (dataInit?.id) {
            setPreviewUrl(
                dataInit.avatar
                    ? `${backendURL}/api/v1/files?fileName=${dataInit.avatar}&folder=avatar`
                    : ""
            );
            form.setFieldsValue({
                name: dataInit.name,
                email: dataInit.email,
                active: dataInit.active ?? true,
                employeeCode: dataInit.userInfo?.employeeCode,
                phone: dataInit.userInfo?.phone,
                dateOfBirth: dataInit.userInfo?.dateOfBirth
                    ? dayjs(dataInit.userInfo.dateOfBirth)
                    : null,
                gender: dataInit.userInfo?.gender,
                startDate: dataInit.userInfo?.startDate
                    ? dayjs(dataInit.userInfo.startDate)
                    : null,
                contractSignDate: dataInit.userInfo?.contractSignDate
                    ? dayjs(dataInit.userInfo.contractSignDate)
                    : null,
                contractExpireDate: dataInit.userInfo?.contractExpireDate
                    ? dayjs(dataInit.userInfo.contractExpireDate)
                    : null,
            });
            setCurrentStep(0);
            setCreatedUserId((dataInit.id));
        } else {
            form.resetFields();
            setAvatarFile(null);
            setPreviewUrl("");
            setCurrentStep(0);
            setCreatedUserId(null);
        }
    }, [dataInit, form]);

    useEffect(() => {
        return () => {
            if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // ========================= AVATAR =========================
    const handleAvatarChange = (file: File) => {
        // Revoke old blob URL
        if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        setAvatarFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        return false; // prevent antd auto-upload
    };

    // ========================= RESET =========================
    const handleReset = () => {
        form.resetFields();
        setAvatarFile(null);
        setPreviewUrl("");
        setCurrentStep(0);
        setCreatedUserId(null);
        setDataInit(null);
        setOpenModal(false);
    };

    // ========================= SUBMIT =========================
    const submitEmployee = async (values: any) => {
        try {
            let avatarFileName = dataInit?.avatar || "";
            if (avatarFile) {
                const uploadRes = await callUploadSingleFile(avatarFile, "avatar");
                if (uploadRes?.data?.fileName) avatarFileName = uploadRes.data.fileName;
            }

            const sharedFields = {
                employeeCode: values.employeeCode || undefined,
                phone: values.phone || undefined,
                dateOfBirth: values.dateOfBirth?.toISOString(),
                gender: values.gender,
                startDate: values.startDate?.toISOString(),
                contractSignDate: values.contractSignDate?.toISOString(),
                contractExpireDate: values.contractExpireDate?.toISOString(),
            };

            if (isEdit) {
                const payload = {
                    id: dataInit!.id,
                    name: values.name,
                    active: values.active,
                    avatar: avatarFileName || undefined,
                    ...sharedFields,
                };
                updateEmployee(payload, {
                    onSuccess: () => {
                        onSuccess?.();
                        setCurrentStep(1);
                    },
                });
            } else {
                const payload = {
                    name: values.name,
                    email: values.email,
                    active: values.active,
                    avatar: avatarFileName || undefined,
                    ...sharedFields,
                };
                createEmployee(payload, {
                    onSuccess: (res: any) => {
                        const newId = res?.data?.id;
                        if (newId) setCreatedUserId((newId));
                        onSuccess?.();
                        setCurrentStep(1);
                    },
                });
            }
        } catch (error: any) {
            message.error(error?.response?.data?.message || "Có lỗi xảy ra!");
        }
    };

    // ========================= BUTTON LOGIC =========================
    const handleSubmitClick = async () => {
        if (currentStep === 1) {
            handleReset();
            return;
        }
        try {
            const values = await form.validateFields();
            await submitEmployee(values);
        } catch {
            /* validation errors shown inline */
        }
    };

    const submitConfig =
        currentStep === 1
            ? { text: "Hoàn tất", icon: <CheckOutlined /> }
            : { text: "Lưu & tiếp tục", icon: <ArrowRightOutlined /> };

    // ========================= THEME =========================
    const modalTheme = {
        token: {
            colorPrimary: ACCENT,
            borderRadius: 8,
            fontSize: 13,
        },
        components: {
            Steps: { colorPrimary: ACCENT },
            Button: {
                colorPrimary: ACCENT,
                colorPrimaryHover: ACCENT_HOVER,
                borderRadius: 8,
                controlHeight: 36,
            },
            Input: { borderRadius: 8, controlHeight: 34 },
            Select: { borderRadius: 8, controlHeight: 34 },
            DatePicker: { borderRadius: 8, controlHeight: 34 },
            Switch: { colorPrimary: ACCENT },
            Form: { itemMarginBottom: 12 },
        },
    };

    return (
        <ConfigProvider theme={modalTheme}>
            <ModalForm
                title={
                    <Text strong style={{ fontSize: 16, letterSpacing: "-0.02em", color: "#111827" }}>
                        {isEdit ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
                    </Text>
                }
                open={openModal}
                modalProps={{
                    onCancel: handleReset,
                    afterClose: handleReset,
                    destroyOnClose: true,
                    width: isMobile ? "100%" : 620, maskClosable: false,
                    footer: null,
                    styles: {
                        mask: {
                            backdropFilter: "blur(4px)",
                            background: "rgba(0,0,0,0.25)",
                        },
                        content: {
                            borderRadius: 16,
                            padding: 0,
                            overflow: "hidden",
                            maxHeight: "90vh",
                            display: "flex",
                            flexDirection: "column",
                        },
                        header: {
                            padding: "18px 24px 0 24px",
                            borderBottom: "none",
                            background: "#fff",
                            marginBottom: 0,
                        },
                        body: {
                            padding: 0,
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            minHeight: 0,
                            overflow: "hidden",
                        },
                    },
                }}
                form={form}
                submitter={false}
                onFinish={async () => true}
            >
                {/* ===== STEPS ===== */}
                <div style={{ padding: "12px 24px 0 24px", background: "#fff", flexShrink: 0 }}>
                    <Steps
                        current={currentStep}
                        size="small"
                        style={{ marginBottom: 12 }}
                        items={[
                            {
                                title: <Text style={{ fontSize: 12, fontWeight: 600 }}>Thông tin nhân viên</Text>,
                            },
                            {
                                title: <Text style={{ fontSize: 12, fontWeight: 600 }}>Gán chức danh</Text>,
                            },
                        ]}
                    />
                    <div style={{ height: 1, background: "#f0f0f0", margin: "0 0 4px 0" }} />
                </div>

                {/* ===== CONTENT ===== */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "12px 24px 0 24px",
                        minHeight: 0,
                    }}
                >
                    {/* ── BƯỚC 1: FORM ── */}
                    {currentStep === 0 && (
                        <>
                            {/* Avatar + Account info side by side */}
                            <Row gutter={16} align="middle" style={{ marginBottom: 4 }}>
                                {/* Avatar upload */}
                                <Col flex="none">
                                    <Upload
                                        accept="image/*"
                                        showUploadList={false}
                                        beforeUpload={handleAvatarChange}
                                    >
                                        <div style={{ position: "relative", cursor: "pointer", display: "inline-block" }}>
                                            <Avatar
                                                size={76}
                                                src={previewUrl || undefined}
                                                icon={!previewUrl ? <UserOutlined /> : undefined}
                                                style={{
                                                    background: previewUrl ? "transparent" : "#f3f4f6",
                                                    color: "#9ca3af",
                                                    border: "2px dashed #e5e7eb",
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    bottom: 2,
                                                    right: 2,
                                                    width: 22,
                                                    height: 22,
                                                    borderRadius: "50%",
                                                    background: ACCENT,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                                                }}
                                            >
                                                <CameraOutlined style={{ color: "#fff", fontSize: 11 }} />
                                            </div>
                                        </div>
                                    </Upload>
                                </Col>

                                {/* Name + Email */}
                                <Col flex="1">
                                    <Row gutter={10}>
                                        <Col span={12}>
                                            <Form.Item
                                                name="name"
                                                label="Tên nhân viên"
                                                rules={[{ required: true, message: "Không được để trống" }]}
                                                style={{ marginBottom: 10 }}
                                            >
                                                <Input placeholder="Nhập tên" />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                name="email"
                                                label="Email"
                                                rules={[
                                                    { required: true, message: "Không được để trống" },
                                                    { type: "email", message: "Email không hợp lệ" },
                                                ]}
                                                style={{ marginBottom: 10 }}
                                            >
                                                <Input placeholder="Nhập email" disabled={isEdit} />
                                            </Form.Item>
                                        </Col>
                                        <Col span={12}>
                                            <Form.Item
                                                name="active"
                                                label="Trạng thái"
                                                valuePropName="checked"
                                                initialValue={false} style={{ marginBottom: 0 }}
                                            >
                                                <Switch
                                                    checkedChildren="Hoạt động"
                                                    unCheckedChildren="Ngừng"
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>

                            <Divider style={{ margin: "10px 0 8px 0" }}>
                                <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                                    Thông tin nhân sự
                                </Text>
                            </Divider>

                            <Row gutter={10}>
                                <Col span={8}>
                                    <Form.Item
                                        name="employeeCode"
                                        label="Mã nhân viên"
                                        rules={[{ required: true, message: "Vui lòng nhập mã nhân viên" }]}
                                    >
                                        <Input placeholder="Mã NV" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="phone" label="Số điện thoại">
                                        <Input placeholder="SĐT" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="gender" label="Giới tính">
                                        <Select placeholder="Chọn" allowClear>
                                            <Option value="MALE">Nam</Option>
                                            <Option value="FEMALE">Nữ</Option>
                                            <Option value="OTHER">Khác</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={10}>
                                <Col span={8}>
                                    <Form.Item name="dateOfBirth" label="Ngày sinh">
                                        <DatePicker style={{ width: "100%" }} placeholder="DD/MM/YYYY" format="DD/MM/YYYY" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="startDate" label="Ngày vào làm">
                                        <DatePicker style={{ width: "100%" }} placeholder="DD/MM/YYYY" format="DD/MM/YYYY" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item name="contractSignDate" label="Ngày ký HĐ">
                                        <DatePicker style={{ width: "100%" }} placeholder="DD/MM/YYYY" format="DD/MM/YYYY" />
                                    </Form.Item>
                                </Col>
                            </Row>

                        </>
                    )}

                    {/* ── BƯỚC 2: GÁN CHỨC DANH ── */}
                    {currentStep === 1 && (
                        <UserPositionForm activeUserId={activeUserId} />
                    )}
                </div>

                {/* ===== FOOTER ===== */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 24px 18px 24px",
                        borderTop: "1px solid #f0f0f0",
                        background: "#fff",
                        flexShrink: 0,
                    }}
                >
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        Bước {currentStep + 1} / 2
                    </Text>

                    <Space size={8}>
                        <Button onClick={handleReset} size="small" style={{ height: 34, padding: "0 14px" }}>
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            icon={!isCreating && !isUpdating ? submitConfig.icon : undefined}
                            loading={isCreating || isUpdating}
                            onClick={handleSubmitClick}
                            size="small"
                            style={{
                                height: 34,
                                padding: "0 16px",
                                background: ACCENT,
                                borderColor: ACCENT,
                                fontWeight: 600,
                                boxShadow: "0 2px 8px rgba(245,49,127,0.25)",
                            }}
                        >
                            {submitConfig.text}
                        </Button>
                    </Space>
                </div>
            </ModalForm>
        </ConfigProvider>
    );
};

export default ModalEmployee;