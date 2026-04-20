/* ===================== PROCESS ACTION MODAL ===================== */

import { ModalForm, ProFormText, ProFormSwitch, ProFormTextArea } from "@ant-design/pro-components";
import { Form } from "antd";

import type { IProcessAction } from "@/types/backend";
import {
    useCreateProcessActionMutation,
    useUpdateProcessActionMutation,
} from "@/hooks/useProcessActions";

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

    const { mutate: create, isPending: isCreating } =
        useCreateProcessActionMutation();
    const { mutate: update, isPending: isUpdating } =
        useUpdateProcessActionMutation();

    const handleReset = () => {
        form.resetFields();
        setDataInit(null);
        setOpenModal(false);
    };

    const onFinish = async (values: any) => {
        const payload: IProcessAction = {
            ...values,
            id: dataInit?.id,
        };

        return new Promise<void>((resolve) => {
            if (isEdit) {
                update(payload, {
                    onSuccess: () => {
                        handleReset();
                        resolve();
                    },
                });
            } else {
                create(payload, {
                    onSuccess: () => {
                        handleReset();
                        resolve();
                    },
                });
            }
        });
    };

    return (
        <ModalForm
            title={isEdit ? "Cập nhật Process Action" : "Tạo Process Action"}
            open={openModal}
            form={form}
            onFinish={onFinish}
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
            modalProps={{
                onCancel: handleReset,
                destroyOnClose: true,
                maskClosable: false,
                confirmLoading: isCreating || isUpdating,
            }}
        >
            <ProFormText
                name="code"
                label="Mã hành động"
                placeholder="Nhập mã hành động"
                rules={[{ required: true, message: "Vui lòng nhập mã hành động" }]}
                disabled={isEdit}
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
                placeholder="Nhập định nghĩa"
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
            />
        </ModalForm>
    );
};

export default ModalProcessAction;