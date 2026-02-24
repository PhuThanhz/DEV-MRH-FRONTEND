import { Drawer, Descriptions, Tag } from "antd";
import type { IPermissionContentDetail } from "@/types/backend";

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    dataInit: IPermissionContentDetail | null;
}

const ViewPermissionContent = ({ open, setOpen, dataInit }: IProps) => {
    return (
        <Drawer
            open={open}
            width={500}
            title="Chi tiết nội dung quyền"
            onClose={() => setOpen(false)}
            destroyOnClose
        >
            {dataInit && (
                <Descriptions column={1} bordered>
                    <Descriptions.Item label="Tên nội dung">
                        {dataInit.name}
                    </Descriptions.Item>

                    <Descriptions.Item label="Thuộc danh mục">
                        {dataInit.category?.name ?? "-"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        {dataInit.active ? (
                            <Tag color="green">Hoạt động</Tag>
                        ) : (
                            <Tag color="red">Ngưng</Tag>
                        )}
                    </Descriptions.Item>
                </Descriptions>
            )}
        </Drawer>
    );
};

export default ViewPermissionContent;
