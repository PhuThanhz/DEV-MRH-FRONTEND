import { Table, Select, Tag, Button, Space } from "antd";

const { Option } = Select;

const PERMISSIONS = {
    XD: { label: "Xây dựng", color: "blue" },
    RS: { label: "Rà soát", color: "orange" },
    TĐ: { label: "Thẩm định", color: "purple" },
    PD: { label: "Phê duyệt", color: "red" },
    TH: { label: "Thực hiện", color: "green" },
    KS: { label: "Kiểm soát", color: "gold" },
    TB: { label: "Thông báo", color: "default" },
};

export default function PermissionMatrix() {
    return (
        <Space>
            <Tag color="blue">XD</Tag>
            <Tag color="orange">RS</Tag>
            <Tag color="red">PD</Tag>
            <Button disabled>Chế độ chỉnh sửa sẽ làm sau</Button>
        </Space>
    );
}
