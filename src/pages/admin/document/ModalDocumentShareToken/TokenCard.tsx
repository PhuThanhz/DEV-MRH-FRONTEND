/**
 * TokenCard.tsx
 * Dùng để: hiển thị từng share token dạng card trên mobile
 */

import { Button, Typography, Flex, Tag, Popconfirm } from "antd";
import {
    CaretDownOutlined, CaretRightOutlined,
    SendOutlined, MailOutlined, StopOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { IResShareTokenDTO } from "@/types/backend";
import { ExpandedRow } from "./ExpandedRow";

const { Text } = Typography;

interface Props {
    token: IResShareTokenDTO;
    expanded: boolean;
    onToggle: () => void;
    onRevoke: () => void;
    onSystemEmail: () => void;
    onGmailEmail: () => void;
    documentCode?: string;
}

export const TokenCard = ({
    token, expanded, onToggle, onRevoke,
    onSystemEmail, onGmailEmail, documentCode,
}: Props) => (
    <div style={{
        border: "1px solid #e2e8f0", borderRadius: 10,
        marginBottom: 8, overflow: "hidden", background: "#fff",
    }}>
        <div
            style={{ padding: "10px 12px", cursor: "pointer", background: expanded ? "#fef2f8" : "#fff" }}
            onClick={onToggle}
        >
            <Flex align="center" justify="space-between">
                <Flex align="center" gap={8} style={{ flex: 1, minWidth: 0 }}>
                    {expanded
                        ? <CaretDownOutlined style={{ color: "#e8256b", fontSize: 12, flexShrink: 0 }} />
                        : <CaretRightOutlined style={{ color: "#9ca3af", fontSize: 12, flexShrink: 0 }} />
                    }
                    <Flex vertical gap={2} style={{ minWidth: 0 }}>
                        <Flex align="center" gap={6} wrap="wrap">
                            {token.isRevoked
                                ? <Tag color="red" style={{ margin: 0, fontSize: 11 }}>Đã thu hồi</Tag>
                                : <Tag color="green" style={{ margin: 0, fontSize: 11 }}>Hoạt động</Tag>
                            }
                            {token.pin && (
                                <Text
                                    copyable={{ text: token.pin, tooltips: ["Sao chép", "Đã sao chép!"] }}
                                    style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: "#d97706" }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    PIN: {token.pin}
                                </Text>
                            )}
                        </Flex>
                        <Flex align="center" gap={10}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {token.expiresAt
                                    ? `HH: ${dayjs(token.expiresAt).format("DD/MM/YYYY")}`
                                    : "Vô thời hạn"
                                }
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                👁 {token.accessCount}{token.maxAccessCount ? `/${token.maxAccessCount}` : ""}
                            </Text>
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
        </div>

        {!token.isRevoked && (
            <div style={{ padding: "8px 12px", borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
                <Flex gap={6} wrap="wrap">
                    <Button size="small" icon={<SendOutlined />} onClick={onSystemEmail} style={{ fontSize: 12 }}>
                        Hệ thống
                    </Button>
                    <Button size="small" icon={<MailOutlined />} onClick={onGmailEmail} style={{ fontSize: 12 }}>
                        Gmail
                    </Button>
                    <Popconfirm
                        title="Thu hồi link này?"
                        description="Link sẽ không thể dùng được nữa."
                        onConfirm={onRevoke}
                        okText="Thu hồi" cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                        placement="topRight"
                    >
                        <Button size="small" danger icon={<StopOutlined />} style={{ fontSize: 12 }}>
                            Thu hồi
                        </Button>
                    </Popconfirm>
                </Flex>
            </div>
        )}

        {expanded && (
            <div style={{ borderTop: "1px solid #e2e8f0" }}>
                <ExpandedRow token={token} documentCode={documentCode} />
            </div>
        )}
    </div>
);