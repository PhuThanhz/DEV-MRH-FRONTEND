import {
    Modal, Table, Tag, Typography, Flex, Tooltip, Button,
} from "antd";
import {
    HistoryOutlined, GlobalOutlined, LaptopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { IResShareTokenDTO } from "@/types/backend";
import { useShareTokenAccessLogsQuery } from "@/hooks/useProcedure";
import { getModalWidth } from "@/utils/responsive";

const { Text } = Typography;

interface IProps {
    open: boolean;
    onClose: () => void;
    token: IResShareTokenDTO | null;
}

const AccessLogTable = ({ open, onClose, token }: IProps) => {
    const { data: logs = [], isLoading } = useShareTokenAccessLogsQuery(
        token?.id,
        open
    );

    const columns = [
        {
            title: "Thời điểm",
            dataIndex: "accessedAt",
            width: 160,
            render: (v: string) => (
                <Text style={{ fontSize: 12 }}>
                    {v ? dayjs(v).format("DD/MM/YYYY HH:mm:ss") : "—"}
                </Text>
            ),
        },
        {
            title: "Địa chỉ IP",
            dataIndex: "ipAddress",
            width: 140,
            render: (v: string) => (
                <Flex align="center" gap={6}>
                    <GlobalOutlined style={{ color: "#6b7280", fontSize: 13 }} />
                    <Text style={{ fontSize: 12, fontFamily: "monospace" }}>
                        {v ?? "—"}
                    </Text>
                </Flex>
            ),
        },
        {
            title: "Thiết bị / Trình duyệt",
            dataIndex: "userAgent",
            render: (v: string) => {
                if (!v) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;

                const parsed = parseUserAgent(v);
                return (
                    <Tooltip title={v} placement="topLeft">
                        <Flex align="center" gap={6}>
                            <LaptopOutlined style={{ color: "#6b7280", fontSize: 13 }} />
                            <Text style={{ fontSize: 12 }}>{parsed}</Text>
                        </Flex>
                    </Tooltip>
                );
            },
        },
    ];

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={
                <Button onClick={onClose}>Đóng</Button>
            }
            title={
                <Flex align="center" gap={8}>
                    <HistoryOutlined style={{ color: "#1677ff" }} />
                    <span>Lịch sử truy cập</span>
                </Flex>
            }
            width={getModalWidth(680)}
            centered
            destroyOnClose
        >
            {token && (
                <Flex gap={24} style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "10px 16px",
                    marginBottom: 16,
                }}>
                    <div>
                        <Text type="secondary" style={{ fontSize: 11 }}>Hết hạn</Text>
                        <div>
                            <Text style={{ fontSize: 13 }}>
                                {token.expiresAt
                                    ? dayjs(token.expiresAt).format("DD/MM/YYYY")
                                    : "Vô thời hạn"}
                            </Text>
                        </div>
                    </div>
                    <div>
                        <Text type="secondary" style={{ fontSize: 11 }}>Lượt truy cập</Text>
                        <div>
                            <Text style={{ fontSize: 13 }}>
                                {token.accessCount}
                                {token.maxAccessCount ? ` / ${token.maxAccessCount}` : ""}
                            </Text>
                        </div>
                    </div>
                    <div>
                        <Text type="secondary" style={{ fontSize: 11 }}>Trạng thái</Text>
                        <div>
                            {token.isRevoked
                                ? <Tag color="red" style={{ margin: 0 }}>Đã thu hồi</Tag>
                                : <Tag color="green" style={{ margin: 0 }}>Hoạt động</Tag>
                            }
                        </div>
                    </div>
                    {token.hasPin && (
                        <div>
                            <Text type="secondary" style={{ fontSize: 11 }}>PIN</Text>
                            <div>
                                <Text
                                    copyable={{ text: token.pin ?? "", tooltips: ["Sao chép PIN", "Đã sao chép!"] }}
                                    style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#d97706" }}
                                >
                                    {token.pin}
                                </Text>
                            </div>
                        </div>
                    )}
                </Flex>
            )}

            <Table
                rowKey={(r: any) => r.id ?? r.accessedAt}
                size="small"
                loading={isLoading}
                columns={columns}
                dataSource={logs}
                pagination={logs.length > 10 ? { pageSize: 10, size: "small" } : false}
                locale={{ emptyText: "Chưa có lượt truy cập nào" }}
                scroll={{ x: "max-content" }}
            />
        </Modal>
    );
};

function parseUserAgent(ua: string): string {
    if (!ua) return "Không rõ";

    let browser = "Trình duyệt khác";
    let os = "";

    if (ua.includes("Chrome") && !ua.includes("Edg") && !ua.includes("OPR")) {
        const match = ua.match(/Chrome\/([\d.]+)/);
        browser = `Chrome ${match?.[1]?.split(".")[0] ?? ""}`;
    } else if (ua.includes("Firefox")) {
        const match = ua.match(/Firefox\/([\d.]+)/);
        browser = `Firefox ${match?.[1]?.split(".")[0] ?? ""}`;
    } else if (ua.includes("Safari") && !ua.includes("Chrome")) {
        const match = ua.match(/Version\/([\d.]+)/);
        browser = `Safari ${match?.[1]?.split(".")[0] ?? ""}`;
    } else if (ua.includes("Edg")) {
        const match = ua.match(/Edg\/([\d.]+)/);
        browser = `Edge ${match?.[1]?.split(".")[0] ?? ""}`;
    } else if (ua.includes("OPR") || ua.includes("Opera")) {
        browser = "Opera";
    }

    if (ua.includes("Windows NT")) os = "Windows";
    else if (ua.includes("Mac OS X")) os = "macOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Linux")) os = "Linux";

    return os ? `${browser} · ${os}` : browser;
}

export default AccessLogTable;