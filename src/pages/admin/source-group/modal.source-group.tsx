import { ModalForm, ProFormText } from "@ant-design/pro-components";
import { Form, message } from "antd";
import { callCreateSourceGroup, callUpdateSourceGroupName } from "@/config/api";
import type { ISourceGroup } from "@/types/backend";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    reloadTable: () => void;
    singleGroup: ISourceGroup | null;
    setSingleGroup: (v: ISourceGroup | null) => void;
}

const ModalSourceGroup = ({
    openModal,
    setOpenModal,
    reloadTable,
    singleGroup,
    setSingleGroup,
}: IProps) => {
    const [form] = Form.useForm();

    const handleSubmit = async (values: any) => {
        if (singleGroup?.id) {
            const res = await callUpdateSourceGroupName(singleGroup.id, values.groupName);
            if (res.data) {
                message.success("Cập nhật tên group thành công");
                reloadTable();
                handleReset();
            }
        } else {
            const res = await callCreateSourceGroup(values);
            if (res.data) {
                message.success("Tạo group mới thành công");
                reloadTable();
                handleReset();
            }
        }
    };

    const handleReset = () => {
        setSingleGroup(null);
        setOpenModal(false);
        form.resetFields();
    };

    return (
        <ModalForm
            title={singleGroup ? "Cập nhật Group" : "Tạo mới Group"}
            open={openModal}
            modalProps={{
                onCancel: handleReset,
                destroyOnClose: true,
                maskClosable: false,
            }}
            form={form}
            initialValues={{
                groupName: singleGroup?.name || "",
            }}
            onFinish={handleSubmit}
        >
            <ProFormText
                name="groupName"
                label="Tên nhóm"
                placeholder="Nhập tên group..."
                rules={[{ required: true, message: "Vui lòng nhập tên nhóm" }]}
            />
        </ModalForm>
    );
};

export default ModalSourceGroup;
