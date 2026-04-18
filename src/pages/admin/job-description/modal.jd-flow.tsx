import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Input, message, Spin, Tag, Avatar, Empty, Space, Typography } from "antd";
import {
    UserOutlined, CrownOutlined, ApartmentOutlined,
    SearchOutlined, CheckOutlined, BankOutlined, CloseCircleOutlined,
    UndoOutlined, ReloadOutlined,
} from "@ant-design/icons";

import { callFetchJdApprovers, callFetchJdIssuers, callFetchJdFlow } from "@/config/api";
import {
    useSubmitJdFlowMutation, useApproveJdFlowMutation,
    useRejectJdFlowMutation, useIssueJdFlowMutation,
    useRecallJdFlowMutation,
} from "@/hooks/useJdFlow";

import ModalRejectJd from "../job-description/components/modal-reject-jd";

const { Text } = Typography;

const backendURL = import.meta.env.VITE_BACKEND_URL;

const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return undefined;
    return `${backendURL}/uploads/avatar/${avatar}?t=${Date.now()}`;
};

interface Props {
    open: boolean;
    onClose: () => void;
    record: any;
}

interface PositionInfo {
    companyName: string;
    departmentName?: string;
    jobTitleName: string;
    positionCode?: string;
    source: string;
}

interface Approver {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    isFinal: boolean;
    positions?: PositionInfo[];
}

interface RejectInfo {
    rejectorName: string;
    rejectorPosition?: string;
    comment: string;
}

const PositionTags = ({ p }: { p: PositionInfo }) => {
    const tagStyle: React.CSSProperties = {
        fontSize: 10, padding: "0 5px", margin: 0, lineHeight: "17px",
    };
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#555", fontWeight: 400, lineHeight: "17px" }}>
                {p.jobTitleName}
            </span>
            {p.positionCode && <Tag color="blue" style={tagStyle}>{p.positionCode}</Tag>}
            {p.departmentName && (
                <Tag icon={<ApartmentOutlined style={{ fontSize: 9 }} />} color="purple" style={tagStyle}>
                    {p.departmentName}
                </Tag>
            )}
            {!p.departmentName && p.companyName && (
                <Tag icon={<BankOutlined style={{ fontSize: 9 }} />} color="geekblue" style={tagStyle}>
                    {p.companyName}
                </Tag>
            )}
        </div>
    );
};

const ApproverCard = ({ user, selected, onClick }: {
    user: Approver; selected: boolean; onClick: () => void;
}) => (
    <div
        onClick={onClick}
        style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "10px 12px", borderRadius: 10,
            border: `1px solid ${selected ? "#f48cb6" : "#efefef"}`,
            background: selected ? "#fff5f9" : "#fff",
            cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
        }}
    >
        <Avatar
            size={38}
            src={getAvatarUrl(user.avatar)}
            icon={!user.avatar && <UserOutlined />}
            style={{ flexShrink: 0, background: "#f0f0f0", color: "#bbb" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a", lineHeight: "18px" }}>
                    {user.name}
                </span>
                {user.isFinal && (
                    <Tag icon={<CrownOutlined style={{ fontSize: 9 }} />} color="gold" style={{ fontSize: 10, padding: "0 5px", margin: 0, lineHeight: "17px" }}>
                        Duyệt cuối
                    </Tag>
                )}
            </div>
            {user.positions && user.positions.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {user.positions.map((p, i) => <PositionTags key={i} p={p} />)}
                </div>
            )}
        </div>
        <div style={{
            width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: selected ? "#d6336c" : "#f0f0f0",
            transition: "background 0.15s",
        }}>
            <CheckOutlined style={{ fontSize: 10, color: selected ? "#fff" : "#ccc" }} />
        </div>
    </div>
);

const ApproverPicker = ({ label, list, selectedId, onSelect }: {
    label: string; list: Approver[];
    selectedId: number | undefined; onSelect: (id: number | undefined) => void;
}) => {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return list;
        return list.filter(a => {
            const base = `${a.name} ${a.email}`.toLowerCase();
            const pos = a.positions?.map(p =>
                `${p.jobTitleName} ${p.positionCode ?? ""} ${p.departmentName ?? ""} ${p.companyName ?? ""}`
            ).join(" ").toLowerCase() ?? "";
            return base.includes(q) || pos.includes(q);
        });
    }, [list, search]);

    return (
        <div>
            <div style={{
                fontSize: 11, fontWeight: 600, color: "#aaa",
                letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8,
            }}>
                {label}
            </div>
            <Input
                prefix={<SearchOutlined style={{ color: "#ccc", fontSize: 13 }} />}
                placeholder="Tìm theo tên, chức danh, phòng ban..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                allowClear
                style={{ marginBottom: 10, borderRadius: 8, fontSize: 13, height: 36 }}
            />
            <div style={{
                maxHeight: 260, overflowY: "auto",
                display: "flex", flexDirection: "column", gap: 6, paddingRight: 2,
            }}>
                {filtered.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<span style={{ fontSize: 12, color: "#bbb" }}>Không tìm thấy</span>}
                        style={{ margin: "16px 0" }}
                    />
                ) : (
                    filtered.map(a => (
                        <ApproverCard
                            key={a.id} user={a}
                            selected={selectedId === a.id}
                            onClick={() => onSelect(selectedId === a.id ? undefined : a.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

const ModalJdFlow = ({ open, onClose, record }: Props) => {

    const [isFinalApprover, setIsFinalApprover] = useState(false);
    const [approvers, setApprovers] = useState<Approver[]>([]);
    const [issuers, setIssuers] = useState<Approver[]>([]);
    const [nextUserId, setNextUserId] = useState<number | undefined>();
    const [nextIssuerId, setNextIssuerId] = useState<number | undefined>();
    const [openReject, setOpenReject] = useState(false);

    const submitMutation = useSubmitJdFlowMutation();
    const approveMutation = useApproveJdFlowMutation();
    const rejectMutation = useRejectJdFlowMutation();
    const issueMutation = useIssueJdFlowMutation();
    const recallMutation = useRecallJdFlowMutation();

    const loading =
        submitMutation.isPending ||
        approveMutation.isPending ||
        rejectMutation.isPending ||
        issueMutation.isPending ||
        recallMutation.isPending;

    const status = useMemo(() =>
        record?.status?.toString()?.trim()?.toUpperCase() || "", [record]);

    const jdId = useMemo(() => record?.id ?? record?.jdId, [record]);

    const rejectInfo = useMemo<RejectInfo | null>(() => {
        if (status !== "REJECTED") return null;
        if (!record?.rejectorName && !record?.rejectComment) return null;
        return {
            rejectorName: record.rejectorName ?? "Không rõ",
            rejectorPosition: record.rejectorPosition
                ? `${record.rejectorPosition}${record.rejectorPositionCode ? ` - ${record.rejectorPositionCode}` : ""}`
                : undefined,
            comment: record.rejectComment ?? "Không có lý do",
        };
    }, [record, status]);

    useEffect(() => {
        if (!open || !jdId) return;

        setNextUserId(undefined);
        setNextIssuerId(undefined);
        setIsFinalApprover(false);
        setApprovers([]);
        setIssuers([]);

        const loadData = async () => {
            try {
                const [resA, resI, resFlow] = await Promise.all([
                    callFetchJdApprovers(),
                    callFetchJdIssuers(),
                    callFetchJdFlow(jdId),
                ]);

                const mapUser = (u: any): Approver => ({
                    id: Number(u.id),
                    name: u.name || "",
                    email: u.email || "",
                    avatar: u.avatar,
                    isFinal: Boolean(u.final || u.isFinal),
                    positions: Array.isArray(u.positions) ? u.positions : [],
                });

                setApprovers(((resA as any)?.data ?? []).map(mapUser));
                setIssuers(((resI as any)?.data ?? []).map((u: any) => ({ ...mapUser(u), isFinal: false })));

                const flowData = (resFlow as any)?.data;
                if (flowData?.currentUserIsFinal === true && status === "IN_REVIEW") {
                    setIsFinalApprover(true);
                }
            } catch (error) {
                console.error("Load data error:", error);
                message.error("Không tải được danh sách người duyệt");
            }
        };

        loadData();
    }, [open, jdId, status]);

    const handleResubmit = (returnToPrevious: boolean) => {
        if (!jdId) return;

        submitMutation.mutate({
            jdId,
            nextUserId: undefined,
            returnToPrevious,
        }, {
            onSuccess: () => {
                message.success(returnToPrevious
                    ? "Đã gửi về người trước đó thành công!"
                    : "Gửi lại cho người vừa từ chối thành công!");
                onClose();
            },
            onError: (error: any) => {
                const msg = error?.response?.data?.message || "Gửi lại thất bại";
                message.error(msg);
            },
        });
    };

    const handleSubmit = () => {
        if (status !== "REJECTED" && !nextUserId) {
            message.warning("Vui lòng chọn người nhận duyệt");
            return;
        }

        submitMutation.mutate({
            jdId,
            nextUserId: status === "REJECTED" ? undefined : nextUserId,
        }, {
            onSuccess: () => {
                message.success("Gửi duyệt thành công");
                onClose();
            },
            onError: (error: any) => message.error(error?.response?.data?.message || "Gửi duyệt thất bại"),
        });
    };

    const handleApprove = () => {
        if (isFinalApprover && !nextIssuerId) {
            message.warning("Vui lòng chọn người ban hành JD");
            return;
        }
        if (!isFinalApprover && !nextUserId) {
            message.warning("Vui lòng chọn người duyệt tiếp theo");
            return;
        }

        approveMutation.mutate({
            jdId,
            nextUserId: isFinalApprover ? nextIssuerId : nextUserId,
        }, {
            onSuccess: () => { message.success("Duyệt JD thành công"); onClose(); },
            onError: () => message.error("Duyệt thất bại"),
        });
    };

    const handleReject = (reason: string) => {
        rejectMutation.mutate({ jdId, comment: reason }, {
            onSuccess: () => {
                message.success("Đã từ chối JD");
                setOpenReject(false);
                onClose();
            },
            onError: () => message.error("Từ chối thất bại"),
        });
    };

    const handleIssue = () => {
        issueMutation.mutate({ jdId }, {
            onSuccess: () => { message.success("Ban hành JD thành công"); onClose(); },
            onError: () => message.error("Ban hành thất bại"),
        });
    };

    const handleRecall = () => {
        recallMutation.mutate({ jdId }, {
            onSuccess: () => { message.success("Thu hồi JD thành công"); onClose(); },
            onError: (error: any) => message.error(error?.response?.data?.message || "Thu hồi thất bại"),
        });
    };

    return (
        <>
            <Modal
                open={open}
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ width: 3, height: 18, borderRadius: 2, background: "linear-gradient(180deg, #e91e8c, #c2185b)" }} />
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>Xử lý duyệt JD</span>
                    </div>
                }
                onCancel={onClose}
                footer={null}
                destroyOnClose
                width={580}
                styles={{ body: { paddingTop: 4, paddingBottom: 4 } }}
            >
                <Spin spinning={loading}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "12px 0" }}>

                        {/* Thông tin từ chối (nếu có) */}
                        {rejectInfo && (
                            <div style={{
                                background: "#fff2f0", border: "1px solid #ffccc7",
                                borderRadius: 10, padding: "14px 16px",
                                display: "flex", gap: 12, alignItems: "flex-start",
                            }}>
                                <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 18, marginTop: 2, flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                        <span style={{ fontSize: 13, color: "#ff4d4f", fontWeight: 600 }}>
                                            {rejectInfo.rejectorName}
                                        </span>
                                        {rejectInfo.rejectorPosition && (
                                            <Tag color="red" style={{ fontSize: 11, margin: 0 }}>
                                                {rejectInfo.rejectorPosition}
                                            </Tag>
                                        )}
                                        <span style={{ fontSize: 12, color: "#ff7875" }}>đã từ chối JD này</span>
                                    </div>
                                    <div style={{
                                        fontSize: 13, color: "#5c0011", background: "#fff",
                                        border: "1px solid #ffccc7", borderRadius: 6,
                                        padding: "8px 12px", lineHeight: 1.6,
                                    }}>
                                        {rejectInfo.comment}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* DRAFT: chọn người duyệt */}
                        {status === "DRAFT" && (
                            <ApproverPicker
                                label="Chọn người duyệt tiếp theo"
                                list={approvers}
                                selectedId={nextUserId}
                                onSelect={setNextUserId}
                            />
                        )}

                        {/* IN_REVIEW, không phải người duyệt cuối: chọn người duyệt tiếp */}
                        {status === "IN_REVIEW" && !isFinalApprover && (
                            <ApproverPicker
                                label="Chọn người duyệt tiếp theo"
                                list={approvers}
                                selectedId={nextUserId}
                                onSelect={setNextUserId}
                            />
                        )}

                        {/* IN_REVIEW, người duyệt cuối: chọn người ban hành */}
                        {status === "IN_REVIEW" && isFinalApprover && (
                            <ApproverPicker
                                label="Chọn người ban hành JD"
                                list={issuers}
                                selectedId={nextIssuerId}
                                onSelect={setNextIssuerId}
                            />
                        )}

                        <div style={{ height: 1, background: "#f5f5f5", margin: "0 -24px" }} />

                        {/* REJECTED */}
                        {status === "REJECTED" && (
                            <Space direction="vertical" size={12} style={{ width: "100%" }}>
                                <Button
                                    type="primary"
                                    block
                                    size="large"
                                    icon={<ReloadOutlined />}
                                    onClick={() => handleResubmit(false)}
                                >
                                    Gửi lại cho người vừa từ chối
                                </Button>

                                {record?.canReturnToPrevious && (
                                    <Button
                                        block
                                        size="large"
                                        icon={<UndoOutlined />}
                                        onClick={() => handleResubmit(true)}
                                        style={{ borderColor: "#fa8c16", color: "#fa8c16" }}
                                    >
                                        Gửi về người trước đó trong chuỗi duyệt
                                    </Button>
                                )}
                            </Space>
                        )}

                        {/* DRAFT */}
                        {status === "DRAFT" && (
                            <Button
                                type="primary"
                                block
                                onClick={handleSubmit}
                                disabled={!nextUserId}
                            >
                                Gửi duyệt
                            </Button>
                        )}

                        {/* IN_REVIEW
                            - Người duyệt THƯỜNG: hiện [Duyệt & chuyển tiếp] + [Từ chối] + [Thu hồi]
                            - Người duyệt CUỐI:   chỉ hiện [Duyệt & gửi ban hành] (Từ chối và Thu hồi đã có ngoài bảng)
                        */}
                        {status === "IN_REVIEW" && (
                            <>
                                {isFinalApprover ? (
                                    // Người duyệt cuối — chỉ nút duyệt, bỏ từ chối & thu hồi
                                    <Button
                                        type="primary"
                                        block
                                        disabled={!nextIssuerId}
                                        onClick={handleApprove}
                                    >
                                        Duyệt & gửi ban hành
                                    </Button>
                                ) : (
                                    // Người duyệt thường — giữ đầy đủ
                                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            <Button
                                                type="primary"
                                                block
                                                disabled={!nextUserId}
                                                onClick={handleApprove}
                                            >
                                                Duyệt & chuyển tiếp
                                            </Button>
                                            <Button block danger onClick={() => setOpenReject(true)}>
                                                Từ chối
                                            </Button>
                                        </div>
                                        <Button block onClick={handleRecall} icon={<UndoOutlined />}>
                                            Thu hồi JD
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* APPROVED */}
                        {status === "APPROVED" && (
                            <Button type="primary" block onClick={handleIssue}>
                                Ban hành JD
                            </Button>
                        )}

                    </div>
                </Spin>
            </Modal>

            <ModalRejectJd
                open={openReject}
                record={record}
                loading={rejectMutation.isPending}
                onConfirm={handleReject}
                onCancel={() => setOpenReject(false)}
            />
        </>
    );
};

export default ModalJdFlow;