import { Modal, Descriptions, Tag } from "antd";
import dayjs from "dayjs";
import type { IPermissionCategory } from "@/types/backend";

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    dataInit: IPermissionCategory | null;
    setDataInit: (v: IPermissionCategory | null) => void;
}

const ViewCategory = ({
    open,
    setOpen,
    dataInit,
    setDataInit,
}: IProps) => {
    if (!dataInit) return null;

    const handleClose = () => {
        setOpen(false);
        setDataInit(null);
    };

    return (
        <Modal
            title="Chi tiết danh mục phân quyền"
            open={open}
            onCancel={handleClose}
            footer={null}
        >
            <Descriptions bordered column={1}>
                <Descriptions.Item label="ID">
                    {dataInit.id}
                </Descriptions.Item>

                <Descriptions.Item label="Mã danh mục">
                    {dataInit.code}
                </Descriptions.Item>

                <Descriptions.Item label="Tên danh mục">
                    {dataInit.name}
                </Descriptions.Item>

                <Descriptions.Item label="Phòng ban">
                    {dataInit.departmentName || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Trạng thái">
                    {dataInit.active ? (
                        <Tag color="green">Hoạt động</Tag>
                    ) : (
                        <Tag color="red">Ngưng</Tag>
                    )}
                </Descriptions.Item>

                <Descriptions.Item label="Người tạo">
                    {dataInit.createdBy || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Ngày tạo">
                    {dataInit.createdAt
                        ? dayjs(dataInit.createdAt).format(
                            "DD/MM/YYYY HH:mm"
                        )
                        : "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Người cập nhật">
                    {dataInit.updatedBy || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Ngày cập nhật">
                    {dataInit.updatedAt
                        ? dayjs(dataInit.updatedAt).format(
                            "DD/MM/YYYY HH:mm"
                        )
                        : "-"}
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

export default ViewCategory;
