import { Drawer, Descriptions, Badge } from "antd";
import type { IJobTitle } from "@/types/backend";

interface IProps {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IJobTitle | null;
    setDataInit: (v: any) => void;
}

const ViewDetailJobTitle = ({ open, onClose, dataInit, setDataInit }: IProps) => {
    const handleClose = () => {
        setDataInit(null);
        onClose(false);
    };

    return (
        <Drawer
            title="Chi tiết chức danh"
            width={500}
            onClose={handleClose}
            open={open}
        >
            {dataInit && (
                <Descriptions column={1} bordered size="middle">
                    <Descriptions.Item label="Tên VI">
                        {dataInit.nameVi}
                    </Descriptions.Item>

                    <Descriptions.Item label="Tên EN">
                        {dataInit.nameEn || "---"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Bậc chức danh">
                        {dataInit.positionLevel?.code}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        {dataInit.active ? (
                            <Badge status="success" text="Đang hoạt động" />
                        ) : (
                            <Badge status="error" text="Ngừng hoạt động" />
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {dataInit.createdAt}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày cập nhật">
                        {dataInit.updatedAt}
                    </Descriptions.Item>
                </Descriptions>
            )}
        </Drawer>
    );
};

export default ViewDetailJobTitle;
