import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Input, message, Spin, Tag, Avatar, Empty } from "antd";
import {
    UserOutlined, CrownOutlined, ApartmentOutlined,
    SearchOutlined, CheckOutlined, BankOutlined, CloseCircleOutlined,
} from "@ant-design/icons";

import { callFetchJdApprovers, callFetchJdIssuers, callFetchJdFlow, callFetchJdFlowLogs } from "@/config/api";
import {
    useSubmitJdFlowMutation, useApproveJdFlowMutation,
    useRejectJdFlowMutation, useIssueJdFlowMutation,
} from "@/hooks/useJdFlow";

import ModalRejectJd from "../job-description/components/modal-reject-jd";

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
    createdAt?: string;
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
                    <Tag
                        icon={<CrownOutlined style={{ fontSize: 9 }} />}
                        color="gold"
                        style={{ fontSize: 10, padding: "0 5px", margin: 0, lineHeight: "17px" }}
                    >
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
                onChange={e => setSearch(e.target.value)}
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
    const [rejectInfo, setRejectInfo] = useState<RejectInfo | null>(null);

    const submitMutation = useSubmitJdFlowMutation();
    const approveMutation = useApproveJdFlowMutation();
    const rejectMutation = useRejectJdFlowMutation();
    const issueMutation = useIssueJdFlowMutation();

    const loading =
        submitMutation.isPending ||
        approveMutation.isPending ||
        rejectMutation.isPending ||
        issueMutation.isPending;

    const status = useMemo(
        () => record?.status?.toString()?.trim()?.toUpperCase(),
        [record]
    );
    const jdId = useMemo(() => record?.id ?? record?.jdId, [record]);
    const isApprover = record?.isApprover === true;

    useEffect(() => {
        if (!open || !jdId) return;
        setNextUserId(undefined);
        setNextIssuerId(undefined);
        setIsFinalApprover(false);
        setOpenReject(false);
        setRejectInfo(null);

        const loadData = async () => {
            try {
                const [resA, resI] = await Promise.all([
                    callFetchJdApprovers(),
                    callFetchJdIssuers(),
                ]);
                const mapUser = (u: any) => ({ ...u, isFinal: u.final });
                const mappedApprovers = ((resA as any)?.data ?? []).map(mapUser);
                setApprovers(mappedApprovers);
                setIssuers(((resI as any)?.data ?? []).map(mapUser));

                const currentStatus = record?.status?.toString()?.trim()?.toUpperCase();
                if (currentStatus === "REJECTED") {
                    const resLogs = await callFetchJdFlowLogs(jdId);
                    const logs: any[] = (resLogs as any)?.data ?? [];
                    const rejectLog = [...logs].reverse().find((l: any) => l.action === "REJECT");

                    if (rejectLog) {
                        const rejector = mappedApprovers.find((u: any) => u.id === rejectLog.fromUser?.id);
                        const firstPos = rejector?.positions?.[0];
                        const positionLabel = firstPos
                            ? `${firstPos.jobTitleName}${firstPos.positionCode ? ` - ${firstPos.positionCode}` : ""}`
                            : undefined;

                        setRejectInfo({
                            rejectorName: rejectLog.fromUser?.name ?? "Không rõ",
                            rejectorPosition: positionLabel,
                            comment: rejectLog.comment ?? "Không có lý do",
                            createdAt: rejectLog.createdAt,
                        });
                    }
                }
            } catch {
                message.error("Không tải được danh sách người duyệt");
            }

            try {
                const resFlow = await callFetchJdFlow(jdId);
                const flowData = (resFlow as any)?.data;
                if (flowData?.currentUserIsFinal === true && flowData?.status !== "REJECTED") {
                    setIsFinalApprover(true);
                }
            } catch { }
        };

        loadData();
    }, [open, jdId]);

    const handleSubmit = () => {
        if (!nextUserId) { message.warning("Vui lòng chọn người duyệt tiếp theo"); return; }
        submitMutation.mutate({ jdId, nextUserId }, {
            onSuccess: () => {
                message.success(status === "REJECTED" ? "Gửi lại duyệt thành công" : "Gửi JD đi duyệt thành công");
                onClose();
            },
            onError: () => message.error("Gửi duyệt thất bại"),
        });
    };

    const handleApprove = () => {
        if (isFinalApprover && !nextIssuerId) { message.warning("Vui lòng chọn người ban hành JD"); return; }
        if (!isFinalApprover && !nextUserId) { message.warning("Vui lòng chọn người duyệt tiếp theo"); return; }
        approveMutation.mutate(
            { jdId, nextUserId: isFinalApprover ? nextIssuerId : nextUserId },
            {
                onSuccess: () => { message.success("Duyệt JD thành công"); onClose(); },
                onError: () => message.error("Duyệt thất bại"),
            }
        );
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

    const primaryBtn = (disabled: boolean): React.CSSProperties => ({
        height: 40, fontSize: 13, fontWeight: 600, borderRadius: 8, border: "none",
        background: disabled ? "#f5f5f5" : "linear-gradient(135deg, #e91e8c 0%, #c2185b 100%)",
        color: disabled ? "#ccc" : "#fff",
        boxShadow: disabled ? "none" : "0 2px 8px rgba(233,30,140,0.2)",
    });

    return (
        <>
            <Modal
                open={open}
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{
                            width: 3, height: 18, borderRadius: 2,
                            background: "linear-gradient(180deg, #e91e8c, #c2185b)",
                        }} />
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a" }}>
                            Xử lý duyệt JD
                        </span>
                    </div>
                }
                onCancel={onClose}
                footer={null}
                destroyOnClose
                width={580}
                styles={{
                    body: { paddingTop: 4, paddingBottom: 4 },
                    header: { paddingBottom: 12, borderBottom: "1px solid #f5f5f5" },
                }}
            >
                <Spin spinning={loading}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "12px 0" }}>

                        {/* ── BANNER LÝ DO TỪ CHỐI ── */}
                        {status === "REJECTED" && rejectInfo && (
                            <div style={{
                                background: "#fff2f0",
                                border: "1px solid #ffccc7",
                                borderRadius: 10,
                                padding: "14px 16px",
                                display: "flex",
                                gap: 12,
                                alignItems: "flex-start",
                            }}>
                                <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 18, marginTop: 2, flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    {/* Tên + chức danh dạng Tag */}
                                    <div style={{
                                        marginBottom: 8,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 6,
                                        flexWrap: "wrap",
                                    }}>
                                        <span style={{ fontSize: 13, color: "#ff4d4f", fontWeight: 600 }}>
                                            {rejectInfo.rejectorName}
                                        </span>
                                        {rejectInfo.rejectorPosition && (
                                            <Tag color="red" style={{ fontSize: 11, margin: 0 }}>
                                                {rejectInfo.rejectorPosition}
                                            </Tag>
                                        )}
                                        <span style={{ fontSize: 12, color: "#ff7875" }}>
                                            đã từ chối JD này
                                        </span>
                                    </div>
                                    {/* Lý do */}
                                    <div style={{
                                        fontSize: 13, color: "#5c0011",
                                        background: "#fff",
                                        border: "1px solid #ffccc7",
                                        borderRadius: 6,
                                        padding: "8px 12px",
                                        lineHeight: 1.6,
                                    }}>
                                        {rejectInfo.comment}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PICKER NGƯỜI DUYỆT */}
                        {!isFinalApprover && status !== "APPROVED" && status !== "ISSUED" && (
                            <ApproverPicker
                                label="Chọn người duyệt tiếp theo"
                                list={approvers}
                                selectedId={nextUserId}
                                onSelect={setNextUserId}
                            />
                        )}

                        {/* PICKER NGƯỜI BAN HÀNH */}
                        {isFinalApprover && status === "IN_REVIEW" && (
                            <ApproverPicker
                                label="Chọn người ban hành JD"
                                list={issuers}
                                selectedId={nextIssuerId}
                                onSelect={setNextIssuerId}
                            />
                        )}

                        {/* DIVIDER */}
                        <div style={{ height: 1, background: "#f5f5f5", margin: "0 -24px" }} />

                        {/* NÚT GỬI DUYỆT */}
                        {(!isFinalApprover && !isApprover) || status === "REJECTED" ? (
                            <Button
                                type="primary" block
                                disabled={!nextUserId}
                                onClick={handleSubmit}
                                style={primaryBtn(!nextUserId)}
                            >
                                {status === "REJECTED" ? "Gửi lại duyệt" : "Gửi duyệt"}
                            </Button>
                        ) : null}

                        {/* NÚT DUYỆT & TỪ CHỐI */}
                        {status === "IN_REVIEW" && (
                            <div style={{ display: "flex", gap: 8 }}>
                                <Button
                                    type="primary" block
                                    disabled={isFinalApprover ? !nextIssuerId : !nextUserId}
                                    onClick={handleApprove}
                                    style={{
                                        ...primaryBtn(isFinalApprover ? !nextIssuerId : !nextUserId),
                                        flex: 2,
                                    }}
                                >
                                    {isFinalApprover ? "Duyệt & gửi ban hành" : "Duyệt & chuyển tiếp"}
                                </Button>
                                <Button
                                    block
                                    onClick={() => setOpenReject(true)}
                                    style={{
                                        height: 40, fontSize: 13, fontWeight: 600,
                                        borderRadius: 8, flex: 1,
                                        border: "1px solid #ffb3b3",
                                        color: "#e53935", background: "#fff5f5",
                                    }}
                                >
                                    Từ chối
                                </Button>
                            </div>
                        )}

                        {/* NÚT BAN HÀNH */}
                        {status === "APPROVED" && (
                            <Button
                                type="primary" block
                                onClick={handleIssue}
                                style={primaryBtn(false)}
                            >
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