import { ModalForm, ProFormText, ProFormTextArea, ProFormSelect } from "@ant-design/pro-components";
import { Form, Divider } from "antd";
import { useEffect } from "react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dataInit: any | null;
    onFinish: (values: any) => void;
}

const ModalJobDescription = ({ open, onOpenChange, dataInit, onFinish }: Props) => {
    const [form] = Form.useForm();
    const isEdit = !!dataInit;

    useEffect(() => {
        if (open) {
            if (dataInit) {
                form.setFieldsValue({
                    title: dataInit.title || "",
                    department: dataInit.department || "",
                    manager: dataInit.manager || "",
                    responsibilities: dataInit.responsibilities || "",
                    knowledge: dataInit.knowledge || "",
                    experience: dataInit.experience || "",
                    skills: dataInit.skills || "",
                    qualities: dataInit.qualities || "",
                    otherRequirements: dataInit.otherRequirements || "",
                });
            } else {
                form.resetFields();
            }
        } else {
            form.resetFields();
        }
    }, [open, dataInit, form]);

    return (
        <ModalForm
            title={isEdit ? "Cập nhật JD" : "Tạo JD"}
            open={open}
            form={form}
            onFinish={async (values) => {
                onFinish(values);
                return true;
            }}
            onOpenChange={onOpenChange}
            key={dataInit ? `edit-${dataInit.id || 'temp'}` : 'create'}
            modalProps={{
                destroyOnClose: true,
                maskClosable: false,
            }}
            submitter={{
                searchConfig: {
                    submitText: isEdit ? "Cập nhật" : "Tạo mới",
                    resetText: "Hủy",
                },
            }}
            width={1000}
            layout="horizontal"
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
        >
            <Divider orientation="left" style={{ fontSize: 16, fontWeight: 600 }}>
                I. THÔNG TIN CHUNG
            </Divider>

            <ProFormText
                name="title"
                label="Chức vụ"
                placeholder="VD: Giám đốc Nhân sự"
                rules={[{ required: true, message: "Vui lòng nhập chức vụ" }]}
            />

            <ProFormSelect
                name="department"
                label="Phòng Ban/Bộ phận"
                placeholder="Chọn phòng ban"
                options={[
                    { label: "Hành chính Nhân sự", value: "Hành chính Nhân sự" },

                ]}
                rules={[{ required: true, message: "Vui lòng chọn phòng ban" }]}
            />

            <ProFormText
                name="manager"
                label="Cấp quản lý trực tiếp"
                placeholder="VD: Giám đốc Điều Hành"
                rules={[{ required: true, message: "Vui lòng nhập cấp quản lý" }]}
            />

            <Divider orientation="left" style={{ fontSize: 16, fontWeight: 600 }}>
                II. MÔ TẢ CÔNG VIỆC
            </Divider>

            <ProFormTextArea
                name="responsibilities"
                label="Trách nhiệm công việc"
                placeholder="Mô tả chi tiết các trách nhiệm chính..."
                rules={[{ required: true, message: "Vui lòng nhập trách nhiệm công việc" }]}
                fieldProps={{
                    rows: 8,
                    showCount: true,
                    maxLength: 5000,
                }}
            />

            <Divider orientation="left" style={{ fontSize: 16, fontWeight: 600 }}>
                III. YÊU CẦU ĐỐI VỚI VỊ TRÍ
            </Divider>

            <ProFormTextArea
                name="knowledge"
                label="Kiến thức"
                placeholder="VD: Am hiểu quản trị nhân sự chiến lược, luật lao động..."
                rules={[{ required: true, message: "Vui lòng nhập yêu cầu kiến thức" }]}
                fieldProps={{
                    rows: 4,
                    showCount: true,
                    maxLength: 2000,
                }}
            />

            <ProFormTextArea
                name="experience"
                label="Kinh nghiệm"
                placeholder="VD: Tối thiểu 7-10 năm kinh nghiệm trong lĩnh vực..."
                rules={[{ required: true, message: "Vui lòng nhập yêu cầu kinh nghiệm" }]}
                fieldProps={{
                    rows: 4,
                    showCount: true,
                    maxLength: 2000,
                }}
            />

            <ProFormTextArea
                name="skills"
                label="Kỹ năng"
                placeholder="VD: Tư duy chiến lược, kỹ năng giao tiếp..."
                rules={[{ required: true, message: "Vui lòng nhập yêu cầu kỹ năng" }]}
                fieldProps={{
                    rows: 4,
                    showCount: true,
                    maxLength: 2000,
                }}
            />

            <ProFormTextArea
                name="qualities"
                label="Phẩm chất"
                placeholder="VD: Liêm chính, bản lĩnh, điềm tĩnh..."
                rules={[{ required: true, message: "Vui lòng nhập yêu cầu phẩm chất" }]}
                fieldProps={{
                    rows: 4,
                    showCount: true,
                    maxLength: 2000,
                }}
            />

            <ProFormTextArea
                name="otherRequirements"
                label="Yêu cầu khác"
                placeholder="VD: Có uy tín chuyên môn, sẵn sàng đóng vai trò..."
                fieldProps={{
                    rows: 4,
                    showCount: true,
                    maxLength: 2000,
                }}
            />
        </ModalForm>
    );
};

export default ModalJobDescription;