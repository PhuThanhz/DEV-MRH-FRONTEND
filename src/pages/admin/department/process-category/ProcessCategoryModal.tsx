import { Modal, Table, Typography } from "antd";
import { mockProcessCategories, mockProcessDetail } from "./mock-data";

const { Title } = Typography;

interface ProcessCategoryModalProps {
    open: boolean;
    onClose: () => void;
    departmentName: string;
}

const ProcessCategoryModal: React.FC<ProcessCategoryModalProps> = ({
    open,
    onClose,
    departmentName,
}) => {
    const columns = [
        { title: "Mã quy trình", dataIndex: "code", key: "code" },
        { title: "Tên quy trình", dataIndex: "name", key: "name" },
        { title: "Trạng thái", dataIndex: "status", key: "status" },
        { title: "Cập nhật", dataIndex: "updatedAt", key: "updatedAt" },
    ];

    return (
        <Modal
            title={`Danh mục quy trình - ${departmentName}`}
            open={open}
            onCancel={onClose}
            footer={null}
            width={900}
        >
            <Title level={5}>Danh sách quy trình</Title>
            <Table
                dataSource={mockProcessCategories}
                columns={columns}
                rowKey="id"
                pagination={false}
            />
        </Modal>
    );
};

export default ProcessCategoryModal;

