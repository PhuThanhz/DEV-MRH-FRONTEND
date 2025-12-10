import { ModalForm, ProFormText } from "@ant-design/pro-components";
import { message, notification } from "antd";
import { callCreateSourceGroupMain, callUpdateSourceGroupMain } from "@/config/api";
import type { ISourceGroupMain } from "@/types/backend";

interface IProps {
    openModal: boolean;
    setOpenModal: (v: boolean) => void;
    reloadTable: () => void;
    singleMain: ISourceGroupMain | null;
    setSingleMain: (v: ISourceGroupMain | null) => void;
}

const ModalSourceGroupMain = ({ openModal, setOpenModal, reloadTable, singleMain, setSingleMain }: IProps) => {
    const isEdit = !!singleMain;

    const handleSubmit = async (values: any) => {
        try {
            if (isEdit) {
                const res = await callUpdateSourceGroupMain({
                    id: singleMain.id,
                    name: values.name,
                });
                if (res.data) {
                    message.success("Cập nhật nhóm chính thành công");
                    reloadTable();
                    setOpenModal(false);
                }
            } else {
                const res = await callCreateSourceGroupMain(values);
                if (res.data) {
                    message.success("Tạo nhóm chính thành công");
                    reloadTable();
                    setOpenModal(false);
                }
            }
        } catch (err: any) {
            notification.error({
                message: "Không thể lưu nhóm chính",
                description: err.message || "Đã xảy ra lỗi khi lưu dữ liệu",
            });
        }
    };

    return (
        <ModalForm
            title={isEdit ? "Cập nhật Nhóm Chính" : "Tạo Nhóm Chính"}
            open={openModal}
            modalProps={{
                onCancel: () => {
                    setOpenModal(false);
                    setSingleMain(null);
                },
                destroyOnClose: true,
                maskClosable: false,
            }}
            onFinish={handleSubmit}
            initialValues={singleMain || {}}
        >
            <ProFormText
                name="name"
                label="Tên Nhóm Chính"
                placeholder="Nhập tên nhóm chính..."
                rules={[{ required: true, message: "Vui lòng nhập tên nhóm chính" }]}
            />
        </ModalForm>
    );
};

export default ModalSourceGroupMain;
