// components/ObjectivesCard.tsx
import { Card, List, Typography } from "antd";
import { AimOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface Props {
    objectives: string[];
}

const ObjectivesCard = ({ objectives }: Props) => {
    return (
        <Card style={{ borderRadius: 10 }}>
            <Title level={4} style={{ marginTop: 0 }}>
                🎯 Mục tiêu hoạt động
            </Title>

            <List
                size="small"
                dataSource={objectives}
                renderItem={(item, index) => (
                    <List.Item style={{ paddingLeft: 4 }}>
                        <Text>
                            <AimOutlined style={{ marginRight: 6, color: "#1677ff" }} />
                            <b>{index + 1}.</b> {item}
                        </Text>
                    </List.Item>
                )}
            />
        </Card>
    );
};

export default ObjectivesCard;
