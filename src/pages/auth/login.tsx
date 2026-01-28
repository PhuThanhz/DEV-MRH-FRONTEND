import { Button, Divider, Form, Input, message, notification, Card } from "antd";
import { Link, useLocation } from "react-router-dom";
import { callLogin } from "config/api";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setUserLoginInfo } from "@/redux/slice/accountSlide";
import { useAppSelector } from "@/redux/hooks";

const LoginPage = () => {
    const [isSubmit, setIsSubmit] = useState(false);
    const dispatch = useDispatch();
    const isAuthenticated = useAppSelector(
        (state) => state.account.isAuthenticated
    );

    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const callback = params.get("callback");

    useEffect(() => {
        if (isAuthenticated) {
            window.location.href = "/";
        }
    }, [isAuthenticated]);

    const onFinish = async (values: any) => {
        const { username, password } = values;
        setIsSubmit(true);

        const res = await callLogin(username, password);

        setIsSubmit(false);

        if (res?.data) {
            localStorage.setItem("access_token", res.data.access_token);
            dispatch(setUserLoginInfo(res.data.user));
            message.success("Đăng nhập tài khoản thành công!");
            window.location.href = callback || "/";
        } else {
            notification.error({
                message: "Có lỗi xảy ra",
                description:
                    Array.isArray(res?.message)
                        ? res.message[0]
                        : res?.message,
                duration: 5,
            });
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f5f5f5",
                padding: 16,
            }}
        >
            <Card
                title="Đăng nhập"
                style={{
                    width: "100%",
                    maxWidth: 420,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
            >
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        label="Email"
                        name="username"
                        rules={[
                            {
                                required: true,
                                message: "Email không được để trống!",
                            },
                        ]}
                    >
                        <Input placeholder="Nhập email" />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: "Mật khẩu không được để trống!",
                            },
                        ]}
                    >
                        <Input.Password placeholder="Nhập mật khẩu" />
                    </Form.Item>

                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={isSubmit}
                            block
                        >
                            Đăng nhập
                        </Button>
                    </Form.Item>

                    <Divider>Hoặc</Divider>

                    <div style={{ textAlign: "center" }}>
                        Chưa có tài khoản?{" "}
                        <Link to="/register">Đăng ký</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;
