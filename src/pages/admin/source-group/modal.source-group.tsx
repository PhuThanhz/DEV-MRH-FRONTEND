import { ModalForm, ProFormText } from "@ant-design/pro-components";
import { message, notification } from "antd";
import { callCreateGroupInMain, callUpdateSourceGroupName } from "@/config/api";
import type { ISourceGroup } from "@/types/backend";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    reloadTable: () => void;
    singleGroup: ISourceGroup | null;
    setSingleGroup: (v: ISourceGroup | null) => void;
    mainId: number;
}

const ModalSourceGroup = ({
    openModal,
    setOpenModal,
    reloadTable,
    singleGroup,
    setSingleGroup,
    mainId,
}: IProps) => {
    const isEdit = !!singleGroup;

    const handleSubmit = async (values: any) => {
        try {
            if (isEdit) {
                // ✅ Cập nhật nhóm con
                const res = await callUpdateSourceGroupName({
                    id: singleGroup!.id,
                    name: values.name,
                });
                if (res.data) {
                    message.success("Cập nhật nhóm con thành công");
                    reloadTable();
                    setOpenModal(false);
                    setSingleGroup(null);
                }
            } else {
                // ✅ Tạo nhóm mới trong nhóm chính
                const res = await callCreateGroupInMain(mainId, { groupName: values.name });
                if (res.data) {
                    message.success("Tạo nhóm con thành công");
                    reloadTable();
                    setOpenModal(false);
                }
            }
        } catch (err: any) {
            notification.error({
                message: "Không thể lưu nhóm con",
                description: err.message || "Đã xảy ra lỗi khi lưu dữ liệu",
            });
        }
    };

    return (
        <ModalForm
            title={isEdit ? "Cập nhật Nhóm Con" : "Tạo Nhóm Con"}
            open={openModal}
            modalProps={{
                onCancel: () => {
                    setOpenModal(false);
                    setSingleGroup(null);
                },
                destroyOnClose: true,
                maskClosable: false,
            }}
            onFinish={handleSubmit}
            initialValues={{
                name: singleGroup?.name || "",
            }}
        >
            <ProFormText
                name="name"
                label="Tên Nhóm"
                placeholder="Nhập tên nhóm..."
                rules={[{ required: true, message: "Vui lòng nhập tên nhóm" }]}
            />
        </ModalForm>
    );
};

export default ModalSourceGroup;
