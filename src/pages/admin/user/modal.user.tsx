import { useEffect, useState } from "react";
import { ModalForm } from "@ant-design/pro-components";
import { Form, message, Steps, Button, Typography, ConfigProvider } from "antd";
import { isMobile } from "react-device-detect";
import dayjs from "dayjs";
import { CheckOutlined, ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";

import type { IUser } from "@/types/backend";
import { useCreateUserMutation, useUpdateUserMutation } from "@/hooks/useUsers";
import { callUploadSingleFile } from "@/config/api";

import UserInfoForm, { type IRoleSelect } from "./components/modal.user-info";
import UserPositionForm from "./components/modal.user-position";

const { Text } = Typography;

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: IUser | null;
    setDataInit: (v: any) => void;
}

const ACCENT = "#f5317f";
const CONNECTOR_COLOR = "#e5e7eb";

const ModalUser = ({ openModal, setOpenModal, dataInit, setDataInit }: IProps) => {
    const [selectedRole, setSelectedRole] = useState<IRoleSelect | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [currentStep, setCurrentStep] = useState(0);
    const [activeTab, setActiveTab] = useState<string>("account");
    const [createdUserId, setCreatedUserId] = useState<string | null>(null);

    const [form] = Form.useForm();
    const isEdit = Boolean(dataInit?.id);
    const activeUserId = isEdit ? (dataInit?.id) : (createdUserId ?? undefined);

    const { mutate: createUser, isPending: isCreating } = useCreateUserMutation();
    const { mutate: updateUser, isPending: isUpdating } = useUpdateUserMutation();

    const backendURL = import.meta.env.VITE_BACKEND_URL;

    useEffect(() => {
        if (dataInit?.id) {
            const roleItem: IRoleSelect = {
                label: dataInit.role?.name ?? "",
                value: dataInit.role?.id ?? "",
                key: dataInit.role?.id ?? "",
            };
            setSelectedRole(roleItem);
            setPreviewUrl(
                dataInit.avatar ? `${backendURL}/storage/avatar/${dataInit.avatar}` : ""
            );
            form.setFieldsValue({
                email: dataInit.email,
                name: dataInit.name,
                active: dataInit.active ?? true,
                role: roleItem,
                employeeCode: dataInit.userInfo?.employeeCode,
                phone: dataInit.userInfo?.phone,
                dateOfBirth: dataInit.userInfo?.dateOfBirth ? dayjs(dataInit.userInfo.dateOfBirth) : null,
                gender: dataInit.userInfo?.gender,
                startDate: dataInit.userInfo?.startDate ? dayjs(dataInit.userInfo.startDate) : null,
                contractSignDate: dataInit.userInfo?.contractSignDate ? dayjs(dataInit.userInfo.contractSignDate) : null,
            });
            setCurrentStep(0);
            setActiveTab("account");
            setCreatedUserId((dataInit.id));
        } else {
            form.resetFields();
            setSelectedRole(null);
            setAvatarFile(null);
            setPreviewUrl("");
            setCurrentStep(0);
            setActiveTab("account");
            setCreatedUserId(null);
        }
    }, [dataInit, form]);

    useEffect(() => {
        return () => {
            if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleReset = () => {
        form.resetFields();
        setSelectedRole(null);
        setAvatarFile(null);
        setPreviewUrl("");
        setCurrentStep(0);
        setActiveTab("account");
        setCreatedUserId(null);
        setDataInit(null);
        setOpenModal(false);
    };

    const handleFileSelect = (file: File): false => {
        if (!file.type.startsWith("image/")) {
            message.error("Vui lòng chọn file ảnh!");
            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            message.error("Kích thước file không vượt quá 5MB!");
            return false;
        }
        setAvatarFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        return false;
    };

    const submitUser = async (values: any) => {
        try {
            const { name, email, password, role, active } = values;
            let avatarFileName = dataInit?.avatar || "";

            if (avatarFile) {
                const uploadRes = await callUploadSingleFile(avatarFile, "avatar");
                if (uploadRes?.data?.fileName) avatarFileName = uploadRes.data.fileName;
            }

            const payload: any = isEdit
                ? {
                    id: dataInit!.id,
                    name, email, avatar: avatarFileName, active,
                    roleId: role?.value,
                    employeeCode: values.employeeCode,
                    phone: values.phone,
                    dateOfBirth: values.dateOfBirth?.toISOString(),
                    gender: values.gender,
                    startDate: values.startDate?.toISOString(),
                    contractSignDate: values.contractSignDate?.toISOString(),
                }
                : {
                    name, email, avatar: avatarFileName, active,
                    ...(password && password.trim() !== "" ? { password } : {}),
                    roleId: role?.value,
                    employeeCode: values.employeeCode,
                    phone: values.phone,
                    dateOfBirth: values.dateOfBirth?.toISOString(),
                    gender: values.gender,
                    startDate: values.startDate?.toISOString(),
                    contractSignDate: values.contractSignDate?.toISOString(),
                };

            if (isEdit) {
                updateUser(payload, { onSuccess: () => setCurrentStep(1) });
            } else {
                createUser(payload, {
                    onSuccess: (res: any) => {
                        const newId = res?.data?.id;
                        if (newId) setCreatedUserId((newId));
                        setCurrentStep(1);
                    },
                });
            }
        } catch (error: any) {
            message.error(error?.response?.data?.message || "Có lỗi xảy ra!");
        }
    };

    const getSubmitConfig = () => {
        if (currentStep === 1) return { text: "Hoàn tất", icon: <CheckOutlined /> };
        if (activeTab === "account") return { text: "Tiếp theo", icon: <ArrowRightOutlined /> };
        return { text: "Lưu & tiếp tục", icon: <ArrowRightOutlined /> };
    };

    const handleSubmitClick = async () => {
        if (currentStep === 1) {
            handleReset();
            return;
        }
        if (activeTab === "account") {
            try {
                await form.validateFields(["email", "password", "name", "role"]);
                setActiveTab("hr");
            } catch { }
            return;
        }
        try {
            const values = await form.validateFields();
            await submitUser(values);
        } catch { }
    };

    const submitConfig = getSubmitConfig();

    return (
        <>
            <style>{`
                /* ===== Modal ===== */
                .elegant-modal .ant-modal-content {
                    border-radius: ${isMobile ? "16px 16px 0 0" : "16px"} !important;
                    box-shadow: 0 12px 40px rgba(0,0,0,0.10), 0 2px 10px rgba(0,0,0,0.06) !important;
                    overflow: hidden;
                    padding: 0 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    ${isMobile
                    ? "max-height: 92dvh !important; height: 92dvh !important;"
                    : "max-height: 82vh !important;"
                }
                }
                .elegant-modal .ant-modal-header {
                    padding: ${isMobile ? "14px 16px 0 16px" : "18px 24px 0 24px"} !important;
                    border-bottom: none !important;
                    background: #fff !important;
                    margin-bottom: 0 !important;
                    flex-shrink: 0 !important;
                }
                .elegant-modal .ant-modal-title {
                    font-size: ${isMobile ? "15px" : "16px"} !important;
                    font-weight: 700 !important;
                    color: #111827 !important;
                    letter-spacing: -0.03em !important;
                }
                .elegant-modal .ant-modal-body {
                    padding: 0 !important;
                    overflow: hidden !important;
                    display: flex !important;
                    flex-direction: column !important;
                    flex: 1 !important;
                    min-height: 0 !important;
                }
                .elegant-modal .ant-modal-body > form {
                    display: flex !important;
                    flex-direction: column !important;
                    flex: 1 !important;
                    min-height: 0 !important;
                    overflow: hidden !important;
                }
                .elegant-modal .ant-modal-close {
                    top: ${isMobile ? "12px" : "16px"} !important;
                    right: ${isMobile ? "14px" : "18px"} !important;
                    width: 28px !important;
                    height: 28px !important;
                    border-radius: 8px !important;
                    background: #f7f7f8 !important;
                    border: 1.5px solid #efefef !important;
                    display: flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    transition: all 0.2s !important;
                }
                .elegant-modal .ant-modal-close:hover {
                    background: #f0f0f0 !important;
                    border-color: #e0e0e0 !important;
                }
                .elegant-modal .ant-modal-close .ant-modal-close-x {
                    width: 28px !important;
                    height: 28px !important;
                    line-height: 28px !important;
                    font-size: 12px !important;
                    color: #6b7280 !important;
                }

                /* ===== Steps ===== */
                .elegant-steps .ant-steps-item-process .ant-steps-item-icon {
                    background: #f5317f !important;
                    border-color: #f5317f !important;
                    box-shadow: 0 3px 8px rgba(245,49,127,0.28) !important;
                }
                .elegant-steps .ant-steps-item-finish .ant-steps-item-icon {
                    background: #fff0f6 !important;
                    border-color: #f5317f !important;
                }
                .elegant-steps .ant-steps-item-finish .ant-steps-item-icon .ant-steps-icon {
                    color: #f5317f !important;
                }
                .elegant-steps .ant-steps-item-wait .ant-steps-item-icon {
                    background: #f7f7f8 !important;
                    border-color: #e5e7eb !important;
                }
                .elegant-steps .ant-steps-item-wait .ant-steps-item-icon .ant-steps-icon {
                    color: #9ca3af !important;
                }
                .elegant-steps *[class*="ant-steps-item"] .ant-steps-item-tail::after,
                .elegant-steps .ant-steps-item-tail::after {
                    background: ${CONNECTOR_COLOR} !important;
                    background-color: ${CONNECTOR_COLOR} !important;
                    background-image: none !important;
                }
                .elegant-steps .ant-steps-item-process .ant-steps-item-title {
                    color: #111827 !important;
                    font-weight: 600 !important;
                    font-size: 12px !important;
                }
                .elegant-steps .ant-steps-item-title {
                    font-size: 12px !important;
                }
                .elegant-steps .ant-steps-item-wait .ant-steps-item-title {
                    color: #9ca3af !important;
                }
                .elegant-steps .ant-steps-item-finish .ant-steps-item-title {
                    color: #374151 !important;
                }
                .elegant-steps .ant-steps-item-description {
                    display: none !important;
                }

                /* ===== Buttons ===== */
                .btn-cancel {
                    border-radius: 8px !important;
                    border: 1.5px solid #e5e7eb !important;
                    color: #6b7280 !important;
                    background: #fff !important;
                    font-size: 13px !important;
                    font-weight: 500 !important;
                    height: 36px !important;
                    padding: 0 14px !important;
                }
                .btn-cancel:hover {
                    border-color: #d1d5db !important;
                    color: #374151 !important;
                    background: #f9fafb !important;
                }
                .btn-back {
                    border-radius: 8px !important;
                    border: 1.5px solid #e5e7eb !important;
                    color: #374151 !important;
                    background: #fff !important;
                    font-size: 13px !important;
                    font-weight: 500 !important;
                    height: 36px !important;
                    padding: 0 14px !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 5px !important;
                }
                .btn-back:hover {
                    border-color: #d1d5db !important;
                    background: #f9fafb !important;
                }
                .btn-primary-pink {
                    border-radius: 8px !important;
                    background: #f5317f !important;
                    border-color: #f5317f !important;
                    color: #fff !important;
                    font-size: 13px !important;
                    font-weight: 600 !important;
                    height: 36px !important;
                    padding: 0 18px !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 6px !important;
                    box-shadow: 0 3px 10px rgba(245,49,127,0.25) !important;
                    transition: all 0.2s !important;
                }
                .btn-primary-pink:hover {
                    background: #d4206a !important;
                    border-color: #d4206a !important;
                    transform: translateY(-1px) !important;
                }

                /* ===== Form label ===== */
                .ant-form-item-label > label {
                    font-size: 13px !important;
                    font-weight: 500 !important;
                    color: #374151 !important;
                }

                ${isMobile ? `
                .elegant-modal {
                    margin: 0 !important;
                    padding: 0 !important;
                    max-width: 100vw !important;
                    top: auto !important;
                    bottom: 0 !important;
                    position: fixed !important;
                }
                ` : ""}
            `}</style>

            <ModalForm
                title={
                    <span style={{ letterSpacing: "-0.03em" }}>
                        {isEdit ? "Cập nhật người dùng" : "Tạo mới người dùng"}
                    </span>
                }
                open={openModal}
                modalProps={{
                    onCancel: handleReset,
                    afterClose: handleReset,
                    destroyOnClose: true,
                    // ← WIDTH nhỏ lại: desktop 680, mobile 100%
                    width: isMobile ? "100%" : 680,
                    maskClosable: false,
                    footer: null,
                    className: "elegant-modal",
                    style: isMobile
                        ? { top: "auto", bottom: 0, margin: 0, padding: 0, maxWidth: "100vw" }
                        : { top: 60 }, // ← top 60 thay vì 40 để không quá sát đầu
                    styles: {
                        mask: { backdropFilter: "blur(4px)", background: "rgba(0,0,0,0.25)" },
                    },
                }}
                form={form}
                submitter={false}
                onFinish={async () => true}
            >
                {/* ===== STEPS ===== */}
                <div style={{
                    padding: isMobile ? "10px 16px 0 16px" : "12px 24px 0 24px",
                    background: "#fff",
                    flexShrink: 0,
                }}>
                    <div style={{
                        background: "#fafafa",
                        border: "1.5px solid #f0f0f0",
                        borderRadius: 10,
                        padding: isMobile ? "8px 12px" : "10px 16px",
                        marginBottom: isMobile ? 10 : 12,
                    }}>
                        <ConfigProvider
                            theme={{
                                components: {
                                    Steps: {
                                        colorPrimary: ACCENT,
                                        colorSplit: CONNECTOR_COLOR,
                                        colorBorderSecondary: CONNECTOR_COLOR,
                                    },
                                },
                                token: { colorPrimaryBorder: CONNECTOR_COLOR },
                            }}
                        >
                            <Steps
                                current={currentStep}
                                size="small"
                                className="elegant-steps"
                                items={[
                                    { title: "Thông tin người dùng" },
                                    { title: "Gán chức danh" },
                                ]}
                            />
                        </ConfigProvider>
                    </div>
                </div>

                {/* ===== CONTENT — scrollable ===== */}
                <div style={{
                    flex: 1,
                    padding: isMobile ? "4px 16px 0 16px" : "4px 24px 0 24px",
                    minHeight: 0,
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch",
                } as React.CSSProperties}>
                    {currentStep === 0 && (
                        <UserInfoForm
                            isEdit={isEdit}
                            avatarFile={avatarFile}
                            previewUrl={previewUrl}
                            selectedRole={selectedRole}
                            setSelectedRole={setSelectedRole}
                            onFileSelect={handleFileSelect}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                        />
                    )}
                    {currentStep === 1 && (
                        <UserPositionForm activeUserId={activeUserId} />
                    )}
                </div>

                {/* ===== FOOTER ===== */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: isMobile
                        ? `12px 16px calc(14px + env(safe-area-inset-bottom)) 16px`
                        : "12px 24px 16px 24px",
                    borderTop: "1.5px solid #f3f4f6",
                    background: "#fff",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 10,
                }}>
                    <Text style={{
                        fontSize: 12,
                        color: "#9ca3af",
                        letterSpacing: "-0.01em",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                    }}>
                        Bước {currentStep + 1} / 2
                    </Text>

                    <div style={{
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                        flexShrink: 0,
                    }}>
                        {currentStep === 0 && activeTab === "hr" && (
                            <Button
                                className="btn-back"
                                onClick={() => setActiveTab("account")}
                                icon={<ArrowLeftOutlined style={{ fontSize: 11 }} />}
                            >
                                {!isMobile && "Quay lại"}
                            </Button>
                        )}

                        <Button className="btn-cancel" onClick={handleReset}>
                            Hủy
                        </Button>

                        <Button
                            className="btn-primary-pink"
                            loading={isCreating || isUpdating}
                            onClick={handleSubmitClick}
                        >
                            {!isCreating && !isUpdating && submitConfig.icon}
                            {submitConfig.text}
                        </Button>
                    </div>
                </div>
            </ModalForm>
        </>
    );
};

export default ModalUser;