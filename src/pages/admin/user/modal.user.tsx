import { useEffect, useState } from "react";
import {
    ModalForm,
    ProForm,
    ProFormText,
    ProFormSwitch,
} from "@ant-design/pro-components";
import { Col, Form, Row, Upload, Button, Avatar, message } from "antd";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import { isMobile } from "react-device-detect";
import type { IUser } from "@/types/backend";
import { DebounceSelect } from "@/components/common/debouce.select";
import { useCreateUserMutation, useUpdateUserMutation } from "@/hooks/useUsers";
import { callFetchRole, callUploadSingleFile } from "@/config/api";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit?: IUser | null;
    setDataInit: (v: any) => void;
}

export interface IRoleSelect {
    label?: string;
    value: string | number;
    key?: string | number;
}

const ModalUser = ({ openModal, setOpenModal, dataInit, setDataInit }: IProps) => {
    const [selectedRole, setSelectedRole] = useState<IRoleSelect | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>("");
    const [form] = Form.useForm();
    const isEdit = Boolean(dataInit?.id);

    const { mutate: createUser, isPending: isCreating } = useCreateUserMutation();
    const { mutate: updateUser, isPending: isUpdating } = useUpdateUserMutation();

    const backendURL = import.meta.env.VITE_BACKEND_URL;

    /** Prefill khi mở form edit */
    useEffect(() => {
        if (dataInit?.id) {
            const roleItem: IRoleSelect = {
                label: dataInit.role?.name ?? "",
                value: String(dataInit.role?.id ?? ""),
                key: String(dataInit.role?.id ?? ""),
            };
            setSelectedRole(roleItem);
            const currentAvatar = dataInit.avatar
                ? `${backendURL}/storage/avatar/${dataInit.avatar}`
                : "";

            setPreviewUrl(currentAvatar);
            form.setFieldsValue({
                email: dataInit.email,
                name: dataInit.name,
                active: dataInit.active,
                role: roleItem,
            });
        } else {
            form.resetFields();
            setSelectedRole(null);
            setPreviewUrl("");
        }
    }, [dataInit, form]);

    /** Cleanup preview URL khi đóng */
    useEffect(() => {
        return () => {
            if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleReset = () => {
        form.resetFields();
        setSelectedRole(null);
        setDataInit(null);
        setAvatarFile(null);
        setPreviewUrl("");
        setOpenModal(false);
    };

    /** Validate & chọn file ảnh */
    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith("image/")) {
            message.error("Vui lòng chọn file ảnh!");
            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            message.error("Kích thước file không vượt quá 5MB!");
            return false;
        }
        setAvatarFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return false;
    };

    /** Gửi form */
    const submitUser = async (values: any) => {
        try {
            const { name, email, password, role, active } = values;

            let avatarFileName = dataInit?.avatar || "";

            if (avatarFile) {
                const uploadRes = await callUploadSingleFile(avatarFile, "avatar");
                if (uploadRes?.data?.fileName) {
                    avatarFileName = uploadRes.data.fileName;
                }
            }

            const payload: IUser = isEdit
                ? {
                    id: dataInit!.id,
                    name,
                    email,
                    avatar: avatarFileName,
                    active,
                    role: { id: String(role?.value), name: role?.label || "" },
                }
                : {
                    name,
                    email,
                    password,
                    avatar: avatarFileName,
                    active,
                    role: { id: String(role?.value), name: role?.label || "" },
                };

            if (isEdit) updateUser(payload, { onSuccess: handleReset });
            else createUser(payload, { onSuccess: handleReset });
        } catch (error: any) {
            message.error(error?.response?.data?.message || "Có lỗi xảy ra khi lưu người dùng!");
        }
    };

    /** Gọi API lấy danh sách role */
    async function fetchRoleList(name: string): Promise<IRoleSelect[]> {
        const res = await callFetchRole(`page=1&size=100&name=/${name}/i`);
        if (res?.data) {
            return res.data.result.map((item: any) => ({
                label: item.name,
                value: item.id,
            }));
        }
        return [];
    }

    const displayAvatar = previewUrl;

    return (
        <ModalForm
            title={isEdit ? "Cập nhật người dùng" : "Tạo mới người dùng"}
            open={openModal}
            modalProps={{
                onCancel: handleReset,
                afterClose: handleReset,
                destroyOnClose: true,
                width: isMobile ? "100%" : 700,
                maskClosable: false,
                okText: isEdit ? "Cập nhật" : "Tạo mới",
                cancelText: "Hủy",
                confirmLoading: isCreating || isUpdating,
            }}
            form={form}
            onFinish={submitUser}
        >
            <Row gutter={[16, 8]}>
                <Col span={24} style={{ textAlign: "center", marginBottom: 20 }}>
                    <Avatar
                        size={100}
                        src={displayAvatar || undefined}
                        icon={<UserOutlined />}
                    />
                    <div style={{ marginTop: 8 }}>
                        <Upload
                            showUploadList={false}
                            beforeUpload={handleFileSelect}
                            accept="image/*"
                            multiple={false}
                        >
                            <Button icon={<UploadOutlined />}>Chọn Avatar</Button>
                        </Upload>
                    </div>
                    {avatarFile && (
                        <div style={{ fontSize: 12, color: "#999" }}>
                            {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB)
                        </div>
                    )}
                </Col>

                <Col lg={12} md={12} sm={24} xs={24}>
                    <ProFormText
                        label="Email"
                        name="email"
                        disabled={isEdit}
                        rules={[
                            { required: !isEdit, message: "Vui lòng nhập email" },
                            { type: "email", message: "Email không hợp lệ" },
                        ]}
                        placeholder="Nhập email"
                    />
                </Col>

                <Col lg={12} md={12} sm={24} xs={24}>
                    <ProFormText.Password
                        label="Mật khẩu"
                        name="password"
                        disabled={isEdit}
                        rules={[{ required: !isEdit, message: "Vui lòng nhập mật khẩu" }]}
                        placeholder="Nhập mật khẩu"
                    />
                </Col>

                <Col lg={12} md={12} sm={24} xs={24}>
                    <ProFormText
                        label="Tên hiển thị"
                        name="name"
                        rules={[{ required: true, message: "Vui lòng nhập tên hiển thị" }]}
                        placeholder="Nhập tên người dùng"
                    />
                </Col>

                <Col lg={12} md={12} sm={24} xs={24}>
                    <ProForm.Item
                        name="role"
                        label="Vai trò"
                        rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
                    >
                        <DebounceSelect
                            allowClear
                            showSearch
                            placeholder="Chọn vai trò"
                            fetchOptions={fetchRoleList}
                            value={selectedRole as any}
                            onChange={(newValue: any) =>
                                setSelectedRole(newValue as IRoleSelect)
                            }
                            style={{ width: "100%" }}
                        />
                    </ProForm.Item>
                </Col>

                <Col lg={12} md={12} sm={24} xs={24}>
                    <ProFormSwitch
                        name="active"
                        label="Kích hoạt"
                        initialValue={dataInit?.active ?? true}
                        checkedChildren="Bật"
                        unCheckedChildren="Tắt"
                    />
                </Col>
            </Row>
        </ModalForm>
    );
};

export default ModalUser;
