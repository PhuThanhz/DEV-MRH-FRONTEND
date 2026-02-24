import { Modal, Form, Input } from "antd";
import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { IPermissionContentForm } from "@/types/backend";
import {
    useCreatePermissionContentMutation,
    useUpdatePermissionContentMutation,
} from "@/hooks/usePermissionContent";

interface IProps {
    open: boolean;
    setOpen: Dispatch<SetStateAction<boolean>>;
    dataInit: IPermissionContentForm | null;
    setDataInit: Dispatch<SetStateAction<IPermissionContentForm | null>>;
}

const ModalPermissionContent = ({
    open,
    setOpen,
    dataInit,
    setDataInit,
}: IProps) => {
    const [form] = Form.useForm();

    const createMutation = useCreatePermissionContentMutation();
    const updateMutation = useUpdatePermissionContentMutation();

    const isEdit = Boolean(dataInit?.id);

    useEffect(() => {
        if (open && dataInit) {
            form.setFieldsValue({ name: dataInit.name });
        }
    }, [open, dataInit, form]);

    const handleOk = async () => {
        const values = await form.validateFields();

        if (isEdit) {
            await updateMutation.mutateAsync({
                id: dataInit!.id!,
                data: { name: values.name },
            });
        } else {
            await createMutation.mutateAsync({
                name: values.name,
                categoryId: dataInit!.categoryId,
            });
        }

        handleClose();
    };

    const handleClose = () => {
        setOpen(false);
        setDataInit(null);
        form.resetFields();
    };

    return (
        <Modal
            title={isEdit ? "Cập nhật nội dung quyền" : "Tạo nội dung quyền"}
            open={open}
            onOk={handleOk}
            onCancel={handleClose}
            okText={isEdit ? "Cập nhật" : "Tạo mới"}
            confirmLoading={
                createMutation.isPending || updateMutation.isPending
            }
            destroyOnClose
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    label="Tên nội dung"
                    name="name"
                    rules={[
                        {
                            required: true,
                            message: "Vui lòng nhập tên nội dung",
                        },
                    ]}
                >
                    <Input placeholder="Nhập tên nội dung" />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ModalPermissionContent;
