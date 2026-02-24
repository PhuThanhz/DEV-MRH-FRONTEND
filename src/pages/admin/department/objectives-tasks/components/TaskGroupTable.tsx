import { Table, Typography, Badge, Space } from "antd";

const { Title, Text } = Typography;

interface Props {
    name: string;
    tasks: string[];
}

const TaskGroupTable = ({ name, tasks }: Props) => {
    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Title level={5} style={{ margin: 0 }}>
                    {name}
                </Title>
                <Badge
                    count={`${tasks.length} nhiệm vụ`}
                    style={{ backgroundColor: "#52c41a" }}
                />
            </Space>

            <Table
                bordered
                pagination={false}
                rowKey={(r) => r}
                size="middle"
                dataSource={tasks}
                columns={[
                    {
                        title: "STT",
                        width: 80,
                        align: "center",
                        render: (_, __, index) => (
                            <Text strong>{index + 1}</Text>
                        ),
                    },
                    {
                        title: "Nội dung nhiệm vụ",
                        dataIndex: "content",
                        render: (_, text) => <Text>{text}</Text>,
                    },
                ]}
            />
        </div>
    );
};

export default TaskGroupTable;