/**
 * index.tsx
 * Dùng để: modal chia sẻ quy trình công khai — tạo/quản lý share token, gửi email
 * Import vào: bất kỳ trang nào cần share quy trình
 *
 * Cấu trúc folder:
 *   ModalShareToken/
 *   ├── index.tsx          ← file này (modal chính + state + logic)
 *   ├── CreateTokenForm.tsx ← form tạo token mới
 *   ├── TokenCard.tsx       ← card layout cho mobile
 *   ├── ExpandedRow.tsx     ← QR + bảng lịch sử truy cập
 *   ├── useIsMobile.ts      ← hook detect mobile/desktop
 *   └── parseUserAgent.ts   ← parse UA, IP, device icon
 */

import { useState } from "react";
import {
    Modal, Form, Button, Table, Tag, Popconfirm,
    Typography, Tooltip, Flex, Badge, message, Input,
} from "antd";
import {
    ShareAltOutlined, StopOutlined,
    PlusOutlined, CaretDownOutlined, CaretRightOutlined,
    MailOutlined, SendOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { IProcedure, ProcedureType, IResShareTokenDTO } from "@/types/backend";
import {
    useShareTokensQuery,
    useCreateShareTokenMutation,
    useRevokeShareTokenMutation,
    useSendShareEmailMutation,
} from "@/hooks/useProcedure";
import { useIsMobile } from "@/hooks/useIsMobile";
 import { CreateTokenForm } from "./CreateTokenForm";
import { TokenCard } from "./TokenCard";
import { ExpandedRow } from "./ExpandedRow";

const { Text } = Typography;

interface IProps {
    open: boolean;
    onClose: () => void;
    procedure: IProcedure | null;
    procedureType: ProcedureType;
}

const ModalShareToken = ({ open, onClose, procedure, procedureType }: IProps) => {
    const isMobile = useIsMobile();
    const [form] = Form.useForm();

    // ── UI state ──
    const [showForm, setShowForm] = useState(false);
    const [newTokenQr, setNewTokenQr] = useState<string | null>(null);
    const [expandedKey, setExpandedKey] = useState<number | null>(null);
    const [autoPin, setAutoPin] = useState(true);

    // ── Email modal state ──
    const [emailModalOpen, setEmailModalOpen] = useState(false);
    const [selectedToken, setSelectedToken] = useState<IResShareTokenDTO | null>(null);
    const [emailInput, setEmailInput] = useState("");

    const procedureId = procedure?.id;

    // ── Queries & mutations ──
    const { data: tokens = [], isLoading } = useShareTokensQuery(procedureId, procedureType, open);
    const createMutation = useCreateShareTokenMutation();
    const revokeMutation = useRevokeShareTokenMutation(procedureId);
    const sendEmailMutation = useSendShareEmailMutation();

    const activeTokenCount = tokens.filter((t) => !t.isRevoked).length;

    // ── Handlers ──
    const handleCreate = async () => {
        if (createMutation.isPending) return;
        const values = await form.validateFields();
        const res = await createMutation.mutateAsync({
            procedureId: procedureId!,
            data: {
                procedureType,
                autoGeneratePin: autoPin,
                pin: autoPin ? undefined : (values.pin || undefined),
                expiresAt: values.expiresAt ? values.expiresAt.endOf("day").toISOString() : undefined,
                maxAccessCount: values.maxAccessCount || undefined,
            },
        });
        if (res?.qrCode) setNewTokenQr(res.qrCode);
        form.resetFields();
        setAutoPin(true);
        setShowForm(false);
    };

    const handleClose = () => {
        setNewTokenQr(null);
        setShowForm(false);
        setExpandedKey(null);
        setEmailModalOpen(false);
        setSelectedToken(null);
        setEmailInput("");
        setAutoPin(false);
        form.resetFields();
        onClose();
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setNewTokenQr(null);
        setAutoPin(true);
        form.resetFields();
    };

    const toggleExpand = (id: number) => {
        setExpandedKey(prev => prev === id ? null : id);
    };

    const handleSendSystemEmail = async (tokenId: number) => {
        const trimmed = emailInput.trim();
        if (!trimmed) {
            message.warning("Vui lòng nhập email người nhận");
            return;
        }
        await sendEmailMutation.mutateAsync({ tokenId, email: trimmed });
        setEmailModalOpen(false);
        setSelectedToken(null);
        setEmailInput("");
    };

    const handleSendPersonalEmail = (r: IResShareTokenDTO) => {
        const shareUrl = `${window.location.origin}/public/view/${r.token}`;
        const pin = r.pin ? `- Mã PIN bảo mật: ${r.pin}\n` : "";
        const expires = r.expiresAt
            ? `- Hạn truy cập: ${dayjs(r.expiresAt).format("DD/MM/YYYY")}`
            : "- Hạn truy cập: Vô thời hạn";
        const subject = encodeURIComponent(`[Lotus HRM] Chia sẻ quy trình — ${procedure?.procedureCode}`);
        const body = encodeURIComponent(
            `KÍNH GỬI BẠN,\n\nBạn được chia sẻ quyền xem quy trình trên hệ thống Lotus HRM.\n\nThông tin chi tiết để truy cập bao gồm:\n- Đường dẫn truy cập: ${shareUrl}\n${pin}${expires}\n\n* LƯU Ý BẢO MẬT: Đường dẫn và mã PIN trên chỉ dành riêng cho bạn. Vui lòng không chia sẻ thông tin này cho người khác dưới mọi hình thức.\n\nTrân trọng,\nBan Quản trị Lotus HRM`
        );
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, "_blank");
    };

    const openEmailModal = (token: IResShareTokenDTO) => {
        setSelectedToken(token);
        setEmailInput("");
        setEmailModalOpen(true);
    };

    // ── Desktop table columns ──
    const desktopColumns = [
        {
            title: "",
            width: 36,
            render: (_: any, r: IResShareTokenDTO) => (
                <Button
                    type="text"
                    size="small"
                    icon={expandedKey === r.id
                        ? <CaretDownOutlined style={{ color: "#e8256b" }} />
                        : <CaretRightOutlined style={{ color: "#9ca3af" }} />
                    }
                    onClick={() => toggleExpand(r.id)}
                />
            ),
        },
        {
            title: "Hết hạn",
            width: 110,
            render: (_: any, r: IResShareTokenDTO) => (
                <Text style={{ fontSize: 12 }}>
                    {r.expiresAt
                        ? dayjs(r.expiresAt).format("DD/MM/YYYY")
                        : <Text type="secondary" style={{ fontSize: 12 }}>Vô thời hạn</Text>
                    }
                </Text>
            ),
        },
        {
            title: "Lượt xem",
            width: 85,
            align: "center" as const,
            render: (_: any, r: IResShareTokenDTO) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {r.accessCount}{r.maxAccessCount ? `/${r.maxAccessCount}` : ""}
                </Text>
            ),
        },
        {
            title: "PIN",
            width: 105,
            align: "center" as const,
            render: (_: any, r: IResShareTokenDTO) => {
                if (!r.pin) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
                return (
                    <Text
                        copyable={{ text: r.pin, tooltips: ["Sao chép", "Đã sao chép!"] }}
                        style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: "#d97706" }}
                    >
                        {r.pin}
                    </Text>
                );
            },
        },
        {
            title: "Trạng thái",
            width: 105,
            align: "center" as const,
            render: (_: any, r: IResShareTokenDTO) => (
                r.isRevoked
                    ? <Tag color="red" style={{ margin: 0 }}>Đã thu hồi</Tag>
                    : <Tag color="green" style={{ margin: 0 }}>Hoạt động</Tag>
            ),
        },
        {
            title: "Gửi email",
            width: 180,
            align: "center" as const,
            render: (_: any, r: IResShareTokenDTO) => {
                if (r.isRevoked) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
                return (
                    <Flex gap={6} justify="center">
                        <Tooltip title="Hệ thống tự gửi mail kèm PIN + QR">
                            <Button size="small" icon={<SendOutlined />} onClick={() => openEmailModal(r)} style={{ fontSize: 12 }}>
                                Hệ thống
                            </Button>
                        </Tooltip>
                        <Tooltip title="Mở Gmail với nội dung điền sẵn">
                            <Button size="small" icon={<MailOutlined />} onClick={() => handleSendPersonalEmail(r)} style={{ fontSize: 12 }}>
                                Gmail
                            </Button>
                        </Tooltip>
                    </Flex>
                );
            },
        },
        {
            title: "",
            width: 95,
            align: "center" as const,
            render: (_: any, r: IResShareTokenDTO) =>
                !r.isRevoked ? (
                    <Popconfirm
                        title="Thu hồi link này?"
                        description="Link sẽ không thể dùng được nữa."
                        onConfirm={() => revokeMutation.mutate(r.id)}
                        okText="Thu hồi"
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true }}
                        placement="topRight"
                    >
                        <Button size="small" danger icon={<StopOutlined />} style={{ fontSize: 12 }}>
                            Thu hồi
                        </Button>
                    </Popconfirm>
                ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
                ),
        },
    ];

    return (
        <>
            {/* ── Main modal ── */}
            <Modal
                open={open}
                onCancel={handleClose}
                footer={null}
                title={
                    <Flex align="center" justify="space-between" style={{ paddingRight: 32, flexWrap: "wrap", gap: 6 }}>
                        <Flex align="center" gap={8} style={{ minWidth: 0, flex: 1 }}>
                            <ShareAltOutlined style={{ color: "#e8256b", flexShrink: 0 }} />
                            <span style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: isMobile ? 13 : 14,
                            }}>
                                Chia sẻ công khai — {procedure?.procedureCode}
                            </span>
                            {activeTokenCount > 0 && (
                                <Badge count={activeTokenCount} size="small" style={{ backgroundColor: "#e8256b", flexShrink: 0 }} />
                            )}
                        </Flex>
                        <Button
                            size="small"
                            icon={<PlusOutlined />}
                            onClick={() => {
                                setShowForm(f => !f);
                                setNewTokenQr(null);
                                setExpandedKey(null);
                                setEmailModalOpen(false);
                                setSelectedToken(null);
                                setEmailInput("");
                                setAutoPin(true);
                            }}
                            style={showForm ? {} : {
                                background: "linear-gradient(135deg,#f0226e,#ff5fa0)",
                                border: "none",
                                color: "white",
                                boxShadow: "0 2px 8px rgba(240,34,110,0.25)",
                                flexShrink: 0,
                            }}
                        >
                            {showForm ? "Huỷ" : "Tạo link mới"}
                        </Button>
                    </Flex>
                }
                width={isMobile ? "100%" : 900}
                style={isMobile ? { top: 0, margin: 0, maxWidth: "100vw", padding: 0 } : { top: 40 }}
                styles={{
                    body: { paddingTop: 8, overflowY: "auto", maxHeight: isMobile ? "calc(100dvh - 110px)" : undefined },
                    content: isMobile ? { borderRadius: 0, minHeight: "100dvh" } : {},
                }}
                centered={!isMobile}
                destroyOnHidden             >
                {/* Form tạo token */}
                {showForm && (
                    <CreateTokenForm
                        form={form}
                        autoPin={autoPin}
                        onAutoPinChange={setAutoPin}
                        onCreate={handleCreate}
                        onCancel={handleCancelForm}
                        isCreating={createMutation.isPending}
                        newTokenQr={newTokenQr}
                        procedureCode={procedure?.procedureCode}
                        isMobile={isMobile}
                    />
                )}

                {/* Danh sách token */}
                {isMobile ? (
                    // Mobile: card layout
                    <div>
                        {isLoading ? (
                            <div style={{ textAlign: "center", padding: 24, color: "#9ca3af" }}>Đang tải...</div>
                        ) : tokens.length === 0 ? (
                            <div style={{ textAlign: "center", padding: 24, color: "#9ca3af" }}>Chưa có link nào được tạo</div>
                        ) : tokens.map((token) => (
                            <TokenCard
                                key={token.id}
                                token={token}
                                expanded={expandedKey === token.id}
                                onToggle={() => toggleExpand(token.id)}
                                onRevoke={() => revokeMutation.mutate(token.id)}
                                onSystemEmail={() => openEmailModal(token)}
                                onGmailEmail={() => handleSendPersonalEmail(token)}
                                procedureCode={procedure?.procedureCode}
                            />
                        ))}
                    </div>
                ) : (
                    // Desktop: table layout
                    <Table
                        rowKey="id"
                        size="small"
                        loading={isLoading}
                        columns={desktopColumns}
                        dataSource={tokens}
                        pagination={tokens.length > 8 ? { pageSize: 8, size: "small" } : false}
                        locale={{ emptyText: "Chưa có link nào được tạo" }}
                        expandable={{
                            expandedRowKeys: expandedKey !== null ? [expandedKey] : [],
                            showExpandColumn: false,
                            expandedRowRender: (r: IResShareTokenDTO) => (
                                <ExpandedRow token={r} procedureCode={procedure?.procedureCode} />
                            ),
                        }}
                    />
                )}
            </Modal>

            {/* ── Modal gửi email qua hệ thống ── */}
            <Modal
                open={emailModalOpen}
                onCancel={() => { setEmailModalOpen(false); setSelectedToken(null); setEmailInput(""); }}
                onOk={() => selectedToken && handleSendSystemEmail(selectedToken.id)}
                okText="Gửi email"
                cancelText="Huỷ"
                confirmLoading={sendEmailMutation.isPending}
                okButtonProps={{
                    style: {
                        background: "linear-gradient(135deg,#f0226e,#ff5fa0)",
                        border: "none",
                        boxShadow: "0 2px 8px rgba(240,34,110,0.25)",
                    },
                }}
                title={
                    <Flex align="center" gap={8}>
                        <SendOutlined style={{ color: "#e8256b" }} />
                        <span>Gửi email chia sẻ qua hệ thống</span>
                    </Flex>
                }
                width={isMobile ? "92vw" : 440}
                centered
            >
                {selectedToken && (
                    <>
                        <div style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: 8,
                            padding: "12px 14px",
                            marginBottom: 16,
                        }}>
                            <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 8 }}>
                                Nội dung sẽ được gửi kèm trong mail
                            </Text>
                            <Flex gap={8} wrap="wrap">
                                {selectedToken.pin ? (
                                    <Tag color="orange" style={{ fontFamily: "monospace", fontWeight: 700 }}>
                                        PIN: {selectedToken.pin}
                                    </Tag>
                                ) : (
                                    <Tag color="default">Không có PIN</Tag>
                                )}
                                {selectedToken.expiresAt ? (
                                    <Tag color="blue">Hết hạn: {dayjs(selectedToken.expiresAt).format("DD/MM/YYYY")}</Tag>
                                ) : (
                                    <Tag color="default">Vô thời hạn</Tag>
                                )}
                            </Flex>
                        </div>

                        <Text style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Email người nhận</Text>
                        <Input
                            placeholder="Nhập email người nhận..."
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            onPressEnter={() => selectedToken && handleSendSystemEmail(selectedToken.id)}
                            prefix={<MailOutlined style={{ color: "#9ca3af" }} />}
                            size="large"
                            autoFocus
                        />
                        <Text type="secondary" style={{ fontSize: 11, marginTop: 6, display: "block" }}>
                            Hệ thống sẽ gửi link truy cập + mã PIN + mã QR đến email này
                        </Text>
                    </>
                )}
            </Modal>
        </>
    );
};

export default ModalShareToken;