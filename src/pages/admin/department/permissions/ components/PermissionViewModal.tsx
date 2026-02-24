import { Modal, Table, Tag, Typography, Divider, Space, Tooltip, Collapse } from "antd";
import { JOB_TITLES } from "../mock/permissionRoles";
import { PERMISSION_MATRIX } from "../mock/permissionMatrixData";
import { PERMISSION_DEFINITIONS } from "../mock/permissionDefinitions";

const { Title, Text } = Typography;
const { Panel } = Collapse;

const PERMISSION_MAP = PERMISSION_DEFINITIONS.reduce((acc, item) => {
    acc[item.code] = {
        label: item.name,
        color:
            item.code === "XD" ? "blue" :
                item.code === "RS" ? "orange" :
                    item.code === "TĐ" ? "purple" :
                        item.code === "PD" ? "red" :
                            item.code === "TH" ? "green" :
                                item.code === "KS" ? "gold" :
                                    "default",
        detail: item.detail,
        short: item.short,
    };
    return acc;
}, {} as Record<string, { label: string; color: string; detail: string; short: string }>);

interface Props {
    open: boolean;
    onClose: () => void;
    companyName?: string;
    departmentName?: string;
}

const PermissionViewModal = ({
    open,
    onClose,
    companyName = "CÔNG TY CỔ PHẦN V LOTUS HOLDINGS",
    departmentName = "Phòng Hành chính Nhân sự",
}: Props) => {
    const columns: any[] = [
        {
            title: "Danh mục",
            dataIndex: "category",
            fixed: "left",
            width: 220,
        },
        {
            title: "Nội dung chi tiết",
            dataIndex: "action",
            width: 380,
        },
        ...JOB_TITLES.map((title) => ({
            title,
            dataIndex: title,
            align: "center",
            width: 150,
            render: (value: string) => {
                const p = PERMISSION_MAP[value];
                if (!p) return "—";

                return (
                    <Tooltip
                        title={
                            <div style={{ maxWidth: 360, whiteSpace: "pre-wrap" }}>
                                <strong>{p.label} ({value})</strong>
                                <br />
                                {p.short}
                                <br /><br />
                                {p.detail}
                            </div>
                        }
                        placement="topLeft"
                        mouseEnterDelay={0.3}
                    >
                        <Tag color={p.color} style={{ cursor: "help" }}>
                            {value}
                        </Tag>
                    </Tooltip>
                );
            },
        })),
    ];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width="95vw"
            style={{ top: 20 }}
            destroyOnClose
        >
            <Title level={4}>BẢN PHÂN QUYỀN</Title>
            <Text type="secondary">
                {companyName} – {departmentName}
            </Text>

            <Divider />

            {/* Phần giải thích quyền - dùng Collapse để ẩn/mở */}
            <Collapse
                defaultActiveKey={[]}  // mặc định đóng (ẩn)
                ghost
                style={{ marginBottom: 24 }}
            >
                <Panel
                    header={
                        <Title level={5} style={{ margin: 0, display: "inline" }}>
                            Giải thích các mức quyền (click để xem)
                        </Title>
                    }
                    key="1"
                >
                    <Table
                        dataSource={PERMISSION_DEFINITIONS}
                        rowKey="code"
                        pagination={false}
                        size="middle"
                        bordered
                        columns={[
                            {
                                title: "Mã",
                                dataIndex: "code",
                                width: 70,
                                align: "center",
                                render: (code: string) => <Tag color={PERMISSION_MAP[code]?.color}>{code}</Tag>,
                            },
                            {
                                title: "Tên quyền",
                                dataIndex: "name",
                                width: 180,
                            },
                            {
                                title: "Giải thích ngắn",
                                dataIndex: "short",
                                width: 300,
                            },
                            {
                                title: "Chi tiết định nghĩa",
                                dataIndex: "detail",
                                render: (text: string) => (
                                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                                        {text}
                                    </div>
                                ),
                            },
                        ]}
                        scroll={{ y: 320, x: "max-content" }} // cuộn nếu nội dung dài
                    />
                </Panel>
            </Collapse>

            <Divider orientation="left">Ma trận phân quyền chi tiết</Divider>

            <Table
                bordered
                rowKey="id"
                columns={columns}
                dataSource={PERMISSION_MATRIX}
                pagination={false}
                scroll={{ x: "max-content", y: 580 }}
            />
        </Modal>
    );
};

export default PermissionViewModal;