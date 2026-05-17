/* ===================== PROCESS ACTION MODAL ===================== */

import { ModalForm, ProFormText, ProFormSwitch, ProFormTextArea } from "@ant-design/pro-components";
import { Form } from "antd";
import { TagOutlined } from "@ant-design/icons";

import type { IProcessAction } from "@/types/backend";
import {
    useCreateProcessActionMutation,
    useUpdateProcessActionMutation,
} from "@/hooks/useProcessActions";
import { useModalWidth } from "@/components/common/modal/detail";

const PINK = "#f5317f";
const PINK_HOVER = "#d4206c";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    dataInit: IProcessAction | null;
    setDataInit: (v: IProcessAction | null) => void;
}

const ModalProcessAction = ({
    openModal,
    setOpenModal,
    dataInit,
    setDataInit,
}: IProps) => {
    const [form] = Form.useForm();
    const isEdit = Boolean(dataInit?.id);
    const width = useModalWidth(480);

    const { mutate: create, isPending: isCreating } = useCreateProcessActionMutation();
    const { mutate: update, isPending: isUpdating } = useUpdateProcessActionMutation();
    const isLoading = isCreating || isUpdating;

    const handleReset = () => {
        form.resetFields();
        setDataInit(null);
        setOpenModal(false);
    };

    const onFinish = async (values: any) => {
        const payload: IProcessAction = { ...values, id: dataInit?.id };
        return new Promise<void>((resolve) => {
            if (isEdit) {
                update(payload, { onSuccess: () => { handleReset(); resolve(); } });
            } else {
                create(payload, { onSuccess: () => { handleReset(); resolve(); } });
            }
        });
    };

    return (
        <ModalForm
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: "linear-gradient(135deg,#fff0f6,#ffe6f0)",
                        border: "1.5px solid #ffd6dd",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <TagOutlined style={{ fontSize: 15, color: PINK }} />
                    </div>
                    <div>
                        <div style={{
                            fontSize: 15, fontWeight: 700, color: "#111827",
                            letterSpacing: "-0.03em", lineHeight: 1.2,
                        }}>
                            {isEdit ? "Cập nhật Process Action" : "Tạo Process Action"}
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                            {isEdit ? `Chỉnh sửa: ${dataInit?.code ?? ""}` : "Nhập thông tin để tạo mới"}
                        </div>
                    </div>
                </div>
            }
            open={openModal}
            form={form}
            onFinish={onFinish}
            width={width}
            initialValues={
                dataInit
                    ? {
                        code: dataInit.code,
                        name: dataInit.name,
                        shortDescription: dataInit.shortDescription,
                        description: dataInit.description,
                        active: dataInit.active,
                    }
                    : { active: true }
            }
            submitter={{
                searchConfig: {
                    submitText: isEdit ? "Cập nhật" : "Tạo mới",
                    resetText: "Huỷ",
                },
                resetButtonProps: { style: { borderRadius: 8 } },
                submitButtonProps: {
                    loading: isLoading,
                    style: {
                        borderRadius: 8,
                        background: PINK,
                        borderColor: PINK,
                        fontWeight: 600,
                    },
                    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
                        (e.currentTarget as HTMLButtonElement).style.background = PINK_HOVER;
                        (e.currentTarget as HTMLButtonElement).style.borderColor = PINK_HOVER;
                    },
                    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
                        (e.currentTarget as HTMLButtonElement).style.background = PINK;
                        (e.currentTarget as HTMLButtonElement).style.borderColor = PINK;
                    },
                },
            }}
            modalProps={{
                onCancel: handleReset,
                destroyOnHidden: true,
                maskClosable: false,
                styles: {
                    body: { padding: "16px 24px" },
                    header: { paddingBottom: 12, borderBottom: "1px solid #f3f4f6" },
                },
            }}
        >
            <ProFormText
                name="code"
                label="Mã hành động"
                placeholder="Nhập mã hành động"
                rules={[{ required: true, message: "Vui lòng nhập mã hành động" }]}
                disabled={isEdit}
                fieldProps={{ style: isEdit ? { background: "#f9fafb" } : undefined }}
            />

            <ProFormText
                name="name"
                label="Đầu mục"
                placeholder="Nhập tên đầu mục"
                rules={[{ required: true, message: "Vui lòng nhập đầu mục" }]}
            />

            <ProFormText
                name="shortDescription"
                label="Giải thích tên đầu mục"
                placeholder="Nhập giải thích ngắn gọn"
            />

            <ProFormTextArea
                name="description"
                label="Định nghĩa"
                placeholder="Nhập định nghĩa (mỗi dòng 1 ý)"
                fieldProps={{
                    rows: 5,
                    autoSize: { minRows: 4, maxRows: 10 },
                }}
            />

            <ProFormSwitch
                name="active"
                label="Kích hoạt"
                checkedChildren="Bật"
                unCheckedChildren="Tắt"
                fieldProps={{
                    style: { "--switch-bg": PINK } as React.CSSProperties,
                }}
            />
        </ModalForm>
    );
};

export default ModalProcessAction;