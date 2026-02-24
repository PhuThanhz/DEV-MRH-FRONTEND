import { useEffect, useLayoutEffect, useRef } from "react";
import { Modal, Form, Typography, ConfigProvider } from "antd";
import { ProFormDigit } from "@ant-design/pro-components";

const { Text } = Typography;

interface Props {
    open: boolean;
    onClose: () => void;
    onFinish: (values: { gradeLevel: number }) => void;
    isCreating: boolean;
    initialGrade?: number;
}

const ModalCreateDepartmentSalaryGrade = ({
    open,
    onClose,
    onFinish,
    isCreating,
    initialGrade = 1,
}: Props) => {
    const [form] = Form.useForm();
    const inputRef = useRef<any>(null);

    useLayoutEffect(() => {
        if (open) form.setFieldsValue({ gradeLevel: initialGrade });
    }, [open, initialGrade]);

    useEffect(() => {
        if (open) {
            setTimeout(() => {
                inputRef.current?.focus?.();
            }, 50);
        }
    }, [open]);

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            onFinish(values);
        } catch { }
    };

    return (
        <ConfigProvider>
            <Modal
                title="Thêm bậc lương mới"
                open={open}
                onCancel={() => {
                    onClose();
                    form.resetFields();
                }}
                onOk={handleOk}
                okText="Tạo"
                cancelText="Hủy"
                confirmLoading={isCreating}
                destroyOnClose
                centered
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="gradeLevel"
                        label={<strong>Bậc lương</strong>}
                        rules={[
                            { required: true, message: "Vui lòng nhập bậc lương" },
                            { type: "number", min: 1 },
                        ]}
                    >
                        <ProFormDigit
                            fieldProps={{
                                min: 1,
                                precision: 0,
                                ref: inputRef,
                                size: "large",
                                style: { width: "100%" },
                                disabled: isCreating,
                            }}
                        />
                    </Form.Item>

                    <Text type="secondary" style={{ fontSize: 13 }}>
                        Gợi ý hệ thống: <Text strong>{initialGrade}</Text>
                    </Text>
                </Form>
            </Modal>
        </ConfigProvider>
    );
};

export default ModalCreateDepartmentSalaryGrade;
