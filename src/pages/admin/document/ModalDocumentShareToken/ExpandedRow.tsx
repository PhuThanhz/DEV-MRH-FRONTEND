/**
 * ExpandedRow.tsx
 * Dùng để: hiển thị QR + bảng lịch sử truy cập của từng document share token
 */

import { Table, Image, Button, Typography, Flex, Badge, Tooltip } from "antd";
import { EyeOutlined, DownloadOutlined, GlobalOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import type { IResShareTokenDTO } from "@/types/backend";
import { useDocumentShareTokenAccessLogsQuery } from "@/hooks/useDocuments";
import { useIsMobile } from "@/hooks/useIsMobile";
import { parseUserAgentDetail, getDeviceIcon, parseIp } from "./parseUserAgent";




const { Text } = Typography;

interface Props {
    token: IResShareTokenDTO;
    documentCode?: string;
}

export const ExpandedRow = ({ token, documentCode }: Props) => {
    const isMobile = useIsMobile();
    const { data: logs = [], isLoading } = useDocumentShareTokenAccessLogsQuery(token.id, true);

    const logColumns = [
        {
            title: "Thời điểm",
            dataIndex: "accessedAt",
            width: isMobile ? 120 : 155,
            render: (v: string) => (
                <Text style={{ fontSize: 12 }}>
                    {v ? dayjs(v).format(isMobile ? "DD/MM HH:mm" : "DD/MM/YYYY HH:mm:ss") : "—"}
                </Text>
            ),
        },
        ...(!isMobile ? [{
            title: "Địa chỉ IP",
            dataIndex: "ipAddress",
            width: 150,
            render: (v: string) => (
                <Flex align="center" gap={5}>
                    <GlobalOutlined style={{ color: "#6b7280", fontSize: 12 }} />
                    <Text style={{ fontSize: 12, fontFamily: "monospace" }}>{parseIp(v)}</Text>
                </Flex>
            ),
        }] : []),
        {
            title: "Thiết bị / Trình duyệt",
            dataIndex: "userAgent",
            render: (v: string) => {
                if (!v) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
                const { browser, os, deviceType } = parseUserAgentDetail(v);
                const deviceLabel = deviceType === "mobile"
                    ? "Di động" : deviceType === "tablet" ? "Máy tính bảng" : "Máy tính";
                return (
                    <Tooltip title={v} placement="topLeft">
                        <Flex align="center" gap={5}>
                            {getDeviceIcon(v)}
                            <Flex vertical gap={0}>
                                <Text style={{ fontSize: 12, lineHeight: "16px" }}>{browser}</Text>
                                <Text type="secondary" style={{ fontSize: 11, lineHeight: "14px" }}>
                                    {isMobile ? os : `${os} · ${deviceLabel}`}
                                </Text>
                            </Flex>
                        </Flex>
                    </Tooltip>
                );
            },
        },
    ];

    return (
        <Flex
            gap={isMobile ? 12 : 20}
            vertical={isMobile}
            style={{
                padding: isMobile ? "10px 8px" : "12px 8px 12px 12px",
                background: "#f8fafc",
                borderRadius: 8,
                margin: "4px 0",
            }}
        >
            {token.qrCode && (
                <Flex gap={12} align="center" style={{ flexShrink: 0 }} vertical={!isMobile}>
                    <div>
                        <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 6 }}>
                            Mã QR
                        </Text>
                        <div style={{
                            padding: 8, background: "#fff",
                            border: "1px solid #e5e7eb", borderRadius: 8,
                            display: "inline-block",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                        }}>
                            <Image
                                src={`data:image/png;base64,${token.qrCode}`}
                                width={isMobile ? 80 : 120}
                                height={isMobile ? 80 : 120}
                                preview={{ mask: <EyeOutlined /> }}
                                style={{ borderRadius: 4, display: "block" }}
                            />
                        </div>
                    </div>
                    <Button
                        size="small"
                        icon={<DownloadOutlined />}
                        style={{ borderColor: "#fcc", color: "#e8256b", alignSelf: isMobile ? "flex-start" : "center" }}
                        onClick={() => {
                            const a = document.createElement("a");
                            a.href = `data:image/png;base64,${token.qrCode}`;
                            a.download = `qr-${documentCode}-${token.id}.png`;
                            a.click();
                        }}
                    >
                        Tải QR
                    </Button>
                </Flex>
            )}

            {!isMobile && (
                <div style={{ width: 1, background: "#e2e8f0", flexShrink: 0, margin: "0 4px" }} />
            )}

            <div style={{ flex: 1, minWidth: 0 }}>
                <Flex align="center" gap={8} style={{ marginBottom: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>Lịch sử truy cập</Text>
                    {logs.length > 0 && (
                        <Badge count={logs.length} size="small" style={{ backgroundColor: "#e8256b" }} />
                    )}
                </Flex>
                <Table
                    rowKey={(r: any) => r.id ?? r.accessedAt}
                    size="small"
                    loading={isLoading}
                    columns={logColumns}
                    dataSource={logs}
                    pagination={logs.length > 5 ? { pageSize: 5, size: "small" } : false}
                    locale={{ emptyText: "Chưa có lượt truy cập nào" }}
                    style={{ background: "#fff", borderRadius: 6 }}
                    scroll={{ x: "max-content" }}
                />
            </div>
        </Flex>
    );
};
