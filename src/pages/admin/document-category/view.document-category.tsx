import { Descriptions, Drawer, Tag, Badge } from "antd";
import dayjs from "dayjs";

import type { IDocumentCategory } from "@/types/backend";

interface Props {
    open: boolean;
    onClose: (v: boolean) => void;
    dataInit: IDocumentCategory | null;
    setDataInit: (v: IDocumentCategory | null) => void;
}

const ViewDetailDocumentCategory = ({
    open,
    onClose,
    dataInit,
    setDataInit,
}: Props) => {
    return (
        <Drawer
            title="Chi tiết danh mục loại văn bản"
            open={open}
            onClose={() => {
                onClose(false);
                setDataInit(null);
            }}
            width={600}
        >
            {dataInit && (
                <Descriptions column={1} bordered size="small" labelStyle={{ width: 160 }}>
                    <Descriptions.Item label="Mã danh mục">
                        <Tag color="blue">{dataInit.categoryCode}</Tag>
                    </Descriptions.Item>

                    <Descriptions.Item label="Tên danh mục">
                        {dataInit.categoryName}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ký hiệu">
                        {dataInit.symbol ? <Tag>{dataInit.symbol}</Tag> : "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Định nghĩa">
                        {dataInit.definition || "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Mapping quy trình">
                        {dataInit.mappingProcedure ? (
                            <Tag color="green">Có mapping</Tag>
                        ) : (
                            <Tag color="default">Không</Tag>
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Trạng thái">
                        {dataInit.active ? (
                            <Badge status="success" text="Đang hoạt động" />
                        ) : (
                            <Badge status="error" text="Ngừng hoạt động" />
                        )}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày tạo">
                        {dataInit.createdAt
                            ? dayjs(dataInit.createdAt).format("DD/MM/YYYY HH:mm")
                            : "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người tạo">
                        {dataInit.createdBy || "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Ngày cập nhật">
                        {dataInit.updatedAt
                            ? dayjs(dataInit.updatedAt).format("DD/MM/YYYY HH:mm")
                            : "—"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Người cập nhật">
                        {dataInit.updatedBy || "—"}
                    </Descriptions.Item>
                </Descriptions>
            )}
        </Drawer>
    );
};

export default ViewDetailDocumentCategory;