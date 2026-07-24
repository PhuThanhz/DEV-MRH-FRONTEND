import { useState } from "react";
import {
    Form, Button, Table, Tag, Popconfirm,
    Typography, Tooltip, Flex, Badge, Input, Modal,
} from "antd";
import {
    ShareAltOutlined, StopOutlined,
    PlusOutlined, CaretDownOutlined, CaretRightOutlined,
    MailOutlined, SendOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { notify } from "@/components/common/notification/notify";
import type { IProcedure, ProcedureType, IResShareTokenDTO } from "@/types/backend";
import {
    useShareTokensQuery,
    useCreateShareTokenMutation,
    useRevokeShareTokenMutation,
    useSendShareEmailMutation,
} from "@/hooks/useProcedure";
import { useIsMobile } from "@/hooks/useIsMobile";
import LotusDetailDrawer from "@/components/common/drawer/LotusDetailDrawer";
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

const isShareTokenExpired = (token: IResShareTokenDTO) =>
    Boolean(token.expiresAt && dayjs(token.expiresAt).isBefore(dayjs()));

const isShareTokenMaxReached = (token: IResShareTokenDTO) =>
    token.maxAccessCount != null && token.accessCount >= token.maxAccessCount;

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

    const activeTokenCount = tokens.filter((token) =>
        !token.isRevoked
        && !isShareTokenExpired(token)
        && !isShareTokenMaxReached(token)
    ).length;

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
            notify.warning("Vui lòng nhập email người nhận");
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
            key: "expand",
            width: 36,
            render: (_: any, r: IResShareTokenDTO) => (
                <button
                    onClick={() => toggleExpand(r.id)}
                    style={{
                        border: "none", background: "none", cursor: "pointer",
                        color: "#9ca3af", padding: 0, display: "flex", alignItems: "center",
                    }}
                >
                    {expandedKey === r.id ? <CaretDownOutlined /> : <CaretRightOutlined />}
                </button>
            ),
        },
        {
            title: "Trạng thái",
            key: "status",
            width: 120,
            render: (_: any, r: IResShareTokenDTO) => {
                if (r.isRevoked) return <Badge status="error" text={<Text type="secondary" style={{ fontSize: 12 }}>Đã thu hồi</Text>} />;
                if (isShareTokenExpired(r)) return <Badge status="warning" text={<Text type="warning" style={{ fontSize: 12 }}>Hết hạn</Text>} />;
                if (isShareTokenMaxReached(r)) return <Badge status="warning" text={<Text type="warning" style={{ fontSize: 12 }}>Hết lượt</Text>} />;
                return <Badge status="success" text={<Text type="success" style={{ fontSize: 12, fontWeight: 500 }}>Đang hoạt động</Text>} />;
            },
        },
        {
            title: "Hết hạn",
            dataIndex: "expiresAt",
            key: "expiresAt",
            width: 110,
            render: (d?: string) => d ? dayjs(d).format("DD/MM/YYYY") : <Text type="secondary" style={{ fontSize: 12 }}>Vô thời hạn</Text>,
        },
        {
            title: "Lượt xem",
            key: "accessCount",
            width: 100,
            render: (_: any, r: IResShareTokenDTO) => (
                <Text style={{ fontSize: 12 }}>
                    {r.accessCount}
                    {r.maxAccessCount ? <Text type="secondary"> / {r.maxAccessCount}</Text> : null}
                </Text>
            ),
        },
        {
            title: "PIN",
            dataIndex: "pin",
            key: "pin",
            width: 90,
            render: (pin?: string) => pin ? (
                <Tag color="orange" style={{ fontFamily: "monospace", fontSize: 11, margin: 0, fontWeight: 600 }}>
                    {pin}
                </Tag>
            ) : (
                <Text type="secondary" style={{ fontSize: 12 }}>—</Text>
            ),
        },
        {
            title: "Gửi email",
            key: "sendEmail",
            width: 130,
            render: (_: any, r: IResShareTokenDTO) => {
                if (r.isRevoked || isShareTokenExpired(r) || isShareTokenMaxReached(r)) return null;
                return (
                    <Flex gap={4}>
                        <Tooltip title="Gửi email qua hệ thống">
                            <Button
                                size="small"
                                icon={<SendOutlined />}
                                onClick={() => openEmailModal(r)}
                                style={{ borderRadius: 6, fontSize: 11 }}
                            />
                        </Tooltip>
                        <Tooltip title="Mở Gmail cá nhân">
                            <Button
                                size="small"
                                icon={<MailOutlined />}
                                onClick={() => handleSendPersonalEmail(r)}
                                style={{ borderRadius: 6, fontSize: 11 }}
                            />
                        </Tooltip>
                    </Flex>
                );
            },
        },
        {
            title: "Hành động",
            key: "action",
            width: 90,
            align: "right" as const,
            render: (_: any, r: IResShareTokenDTO) => {
                if (r.isRevoked) return null;
                return (
                    <Popconfirm
                        title="Thu hồi link chia sẻ này?"
                        description="Người dùng có link này sẽ không thể truy cập nữa."
                        okText="Thu hồi"
                        cancelText="Huỷ"
                        okButtonProps={{ danger: true, loading: revokeMutation.isPending }}
                        onConfirm={() => revokeMutation.mutate(r.id)}
                    >
                        <Button
                            danger
                            size="small"
                            type="text"
                            icon={<StopOutlined />}
                            style={{ fontSize: 12 }}
                        >
                            Thu hồi
                        </Button>
                    </Popconfirm>
                );
            },
        },
    ];

    return (
        <>
            <LotusDetailDrawer
                open={open}
                onClose={handleClose}
                destroyOnClose={true}
                keyboard={false}
                maskClosable={false}
            >
                <div className="flex flex-col h-full bg-[#f8f9fb]">
                    {/* ── HEADER ── */}
                    <div className="bg-white border-b border-gray-100 p-5 sm:px-8 flex items-center justify-between gap-4 flex-wrap shrink-0">
                        <div className="min-w-0 flex-1">
                            <Text className="text-[11px] uppercase font-semibold flex items-center gap-1.5" style={{ color: "#e8637a" }}>
                                <ShareAltOutlined />
                                Chia sẻ công khai
                            </Text>
                            <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                                <h2 className="m-0 text-[24px] sm:text-[28px] font-bold text-gray-950">
                                    {procedure?.procedureCode ? `${procedure.procedureCode} — ${procedure.procedureName || ""}` : "Chia sẻ quy trình"}
                                </h2>
                                {activeTokenCount > 0 && (
                                    <Tag color="green" className="!m-0 font-semibold" style={{ borderRadius: 6, fontSize: 12 }}>
                                        {activeTokenCount} link đang hoạt động
                                    </Tag>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <Button
                                type="primary"
                                icon={showForm ? undefined : <PlusOutlined />}
                                onClick={() => {
                                    if (showForm) handleCancelForm();
                                    else setShowForm(true);
                                }}
                                className="!rounded-lg !px-5 !h-10 !text-[13px] !font-semibold !shadow-xs flex items-center gap-1.5"
                                style={{
                                    background: showForm ? "#64748b" : "#e8637a",
                                    borderColor: showForm ? "#64748b" : "#e8637a",
                                }}
                            >
                                {showForm ? "Huỷ tạo link" : "Tạo link mới"}
                            </Button>
                        </div>
                    </div>

                    {/* ── BODY ── */}
                    <div className="p-5 sm:px-8 sm:py-7 flex-1 min-h-0 overflow-auto space-y-6">
                        {/* Form tạo token */}
                        {showForm && (
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
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
                            </div>
                        )}

                        {/* Danh sách token */}
                        <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-100 shadow-xs space-y-4">
                            <div className="text-[13px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-gray-100">
                                <span className="w-1.5 h-3 bg-[#e8637a] rounded-full inline-block" />
                                Danh sách liên kết chia sẻ ({tokens.length})
                            </div>

                            {isMobile ? (
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
                        </div>
                    </div>
                </div>
            </LotusDetailDrawer>

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
                        background: "#e8637a",
                        borderColor: "#e8637a",
                        boxShadow: "0 2px 8px rgba(232,99,122,0.25)",
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
