import { Drawer, Form, Input, Button, Space, Spin } from "antd";
import { useEffect } from "react";

interface IProps {
    open: boolean;
    onClose: () => void;
    salaryGradeId: number;
    gradeLevel: number;
    jobTitleName: string;
}

const { TextArea } = Input;

const DrawerSalaryGradePerformanceRating = ({
    open,
    onClose,
    salaryGradeId,
    gradeLevel,
    jobTitleName,
}: IProps) => {
    const [form] = Form.useForm();

    // FAKE: sau này gắn API getBySalaryGrade
    useEffect(() => {
        if (open) {
            form.setFieldsValue({
                ratingAText: "",
                ratingBText: "",
                ratingCText: "",
                ratingDText: "",
            });
        }
    }, [open, form]);

    const handleSubmit = (values: any) => {
        console.log("SUBMIT PERFORMANCE RATING:", {
            salaryGradeId,
            ...values,
        });
        onClose();
    };

    return (
        <Drawer
            title={`Tiêu chí đánh giá – Bậc ${gradeLevel} – ${jobTitleName}`}
            open={open}
            onClose={onClose}
            width="60vw"
            destroyOnClose
            footer={
                <div style={{ textAlign: "right" }}>
                    <Button onClick={onClose}>Hủy</Button>
                    <Button
                        type="primary"
                        style={{ marginLeft: 12 }}
                        onClick={() => form.submit()}
                    >
                        Lưu tiêu chí
                    </Button>
                </div>
            }
        >
            <Form layout="vertical" form={form} onFinish={handleSubmit}>
                <Form.Item label="Xếp loại A" name="ratingAText">
                    <TextArea rows={6} placeholder="Nhập tiêu chí xếp loại A..." />
                </Form.Item>

                <Form.Item label="Xếp loại B" name="ratingBText">
                    <TextArea rows={6} placeholder="Nhập tiêu chí xếp loại B..." />
                </Form.Item>

                <Form.Item label="Xếp loại C" name="ratingCText">
                    <TextArea rows={6} placeholder="Nhập tiêu chí xếp loại C..." />
                </Form.Item>

                <Form.Item label="Xếp loại D" name="ratingDText">
                    <TextArea rows={6} placeholder="Nhập tiêu chí xếp loại D..." />
                </Form.Item>
            </Form>
        </Drawer>
    );
};

export default DrawerSalaryGradePerformanceRating;
