import { useState } from "react";
import { Modal, Tabs, Form, Input, Button, message } from "antd";
import type { TabsProps } from "antd";
import { isMobile } from "react-device-detect";
import { useAppSelector } from "@/redux/hooks";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
}

const UserUpdateInfo = () => {
    const user = useAppSelector((state) => state.account.user);
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            // Gọi API cập nhật thông tin (giả lập)
            console.log("Update info:", values);
            message.success("Cập nhật thông tin thành công!");
        } catch (e) {
            message.error("Đã xảy ra lỗi khi cập nhật thông tin!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
                name: user?.name,
                email: user?.email,
            }}
            className="pt-4"
        >
            <Form.Item
                label="Họ và tên"
                name="name"
                rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
            >
                <Input placeholder="Nhập họ và tên" />
            </Form.Item>

            <Form.Item label="Email" name="email">
                <Input disabled />
            </Form.Item>

            <div className="text-right">
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    Lưu thay đổi
                </Button>
            </div>
        </Form>
    );
};

const ChangePassword = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (values: any) => {
        const { currentPassword, newPassword, confirmPassword } = values;

        if (newPassword !== confirmPassword) {
            message.error("Mật khẩu xác nhận không khớp!");
            return;
        }

        setLoading(true);
        try {
            // Gọi API đổi mật khẩu (giả lập)
            console.log("Change password:", { currentPassword, newPassword });
            message.success("Thay đổi mật khẩu thành công!");
            form.resetFields();
        } catch (e) {
            message.error("Đã xảy ra lỗi khi đổi mật khẩu!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="pt-4"
        >
            <Form.Item
                label="Mật khẩu hiện tại"
                name="currentPassword"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại!" }]}
            >
                <Input.Password placeholder="Nhập mật khẩu hiện tại" />
            </Form.Item>

            <Form.Item
                label="Mật khẩu mới"
                name="newPassword"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu mới!" }]}
            >
                <Input.Password placeholder="Nhập mật khẩu mới" />
            </Form.Item>

            <Form.Item
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                rules={[{ required: true, message: "Vui lòng xác nhận mật khẩu mới!" }]}
            >
                <Input.Password placeholder="Nhập lại mật khẩu mới" />
            </Form.Item>

            <div className="text-right">
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    Cập nhật mật khẩu
                </Button>
            </div>
        </Form>
    );
};

const ManageAccount = (props: IProps) => {
    const { open, onClose } = props;

    const items: TabsProps["items"] = [
        {
            key: "user-update-info",
            label: `Cập nhật thông tin`,
            children: <UserUpdateInfo />,
        },
        {
            key: "user-password",
            label: `Thay đổi mật khẩu`,
            children: <ChangePassword />,
        },
    ];

    return (
        <Modal
            title="Quản lý tài khoản"
            open={open}
            onCancel={() => onClose(false)}
            maskClosable={false}
            footer={null}
            destroyOnClose
            width={isMobile ? "100%" : "600px"}
            className="rounded-lg"
        >
            <div className="min-h-[300px]">
                <Tabs defaultActiveKey="user-update-info" items={items} />
            </div>
        </Modal>
    );
};

export default ManageAccount;
