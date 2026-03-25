import { useEffect, useMemo, useState } from "react";
import { Modal, Button, Select, Space, message, Spin } from "antd";

import {
    callFetchJdApprovers,
    callFetchJdIssuers,
    callFetchJdFlow,
} from "@/config/api";

import {
    useSubmitJdFlowMutation,
    useApproveJdFlowMutation,
    useRejectJdFlowMutation,
    useIssueJdFlowMutation,
} from "@/hooks/useJdFlow";

interface Props {
    open: boolean;
    onClose: () => void;
    record: any;
}

interface Approver {
    id: number;
    name: string;
    isFinal: boolean;
}

const ModalJdFlow = ({ open, onClose, record }: Props) => {

    const [isFinalApprover, setIsFinalApprover] = useState(false);
    const [approvers, setApprovers] = useState<Approver[]>([]);
    const [issuers, setIssuers] = useState<Approver[]>([]);
    const [nextUserId, setNextUserId] = useState<number | undefined>();
    const [nextIssuerId, setNextIssuerId] = useState<number | undefined>();

    const submitMutation = useSubmitJdFlowMutation();
    const approveMutation = useApproveJdFlowMutation();
    const rejectMutation = useRejectJdFlowMutation();
    const issueMutation = useIssueJdFlowMutation();

    const loading =
        submitMutation.isPending ||
        approveMutation.isPending ||
        rejectMutation.isPending ||
        issueMutation.isPending;

    const status = useMemo(() => {
        return record?.status?.toString()?.trim()?.toUpperCase();
    }, [record]);

    const jdId = useMemo(() => {
        return record?.id ?? record?.jdId;
    }, [record]);

    const isApprover = record?.isApprover === true;

    const approverOptions = useMemo(() => {
        return approvers.map(a => ({ label: a.name, value: a.id }));
    }, [approvers]);

    const issuerOptions = useMemo(() => {
        return issuers.map(a => ({ label: a.name, value: a.id }));
    }, [issuers]);

    useEffect(() => {

        if (!open || !jdId) return;

        setNextUserId(undefined);
        setNextIssuerId(undefined);
        setIsFinalApprover(false);

        const loadData = async () => {

            try {
                const [resApprovers, resIssuers] = await Promise.all([
                    callFetchJdApprovers(),
                    callFetchJdIssuers(),
                ]);
                setApprovers((resApprovers as any)?.data ?? []);
                setIssuers((resIssuers as any)?.data ?? []);
            } catch {
                message.error("Không tải được danh sách người duyệt");
            }

            try {
                const resFlow = await callFetchJdFlow(jdId);
                const flowData = (resFlow as any)?.data;
                if (flowData?.currentUserIsFinal === true) {
                    setIsFinalApprover(true);
                }
            } catch {
                // Bỏ qua
            }

        };

        loadData();

    }, [open, jdId]);

    const handleSubmit = () => {

        if (!nextUserId) {
            message.warning("Vui lòng chọn người duyệt tiếp theo");
            return;
        }

        submitMutation.mutate(
            { jdId, nextUserId },
            {
                onSuccess: () => {
                    message.success(
                        status === "REJECTED"
                            ? "Gửi lại duyệt thành công"
                            : "Gửi JD đi duyệt thành công"
                    );
                    onClose();
                },
                onError: () => {
                    message.error("Gửi duyệt thất bại");
                },
            }
        );
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

        approveMutation.mutate(
            {
                jdId,
                nextUserId: isFinalApprover ? nextIssuerId : nextUserId
            },
            {
                onSuccess: () => {
                    message.success("Duyệt JD thành công");
                    onClose();
                },
                onError: () => {
                    message.error("Duyệt thất bại");
                },
            }
        );
    };

    const handleReject = () => {

        rejectMutation.mutate(
            { jdId, comment: "Không đạt yêu cầu" },
            {
                onSuccess: () => {
                    message.success("Đã từ chối JD");
                    onClose();
                },
                onError: () => {
                    message.error("Từ chối thất bại");
                },
            }
        );
    };

    const handleIssue = () => {

        issueMutation.mutate(
            { jdId },
            {
                onSuccess: () => {
                    message.success("Ban hành JD thành công");
                    onClose();
                },
                onError: () => {
                    message.error("Ban hành thất bại");
                },
            }
        );
    };

    return (

        <Modal
            open={open}
            title="Xử lý duyệt JD"
            onCancel={onClose}
            footer={null}
            destroyOnClose
        >

            <Spin spinning={loading}>

                <Space direction="vertical" style={{ width: "100%" }}>

                    {/* SELECT NGƯỜI DUYỆT — ẩn khi là duyệt cuối */}

                    {!isFinalApprover && status !== "APPROVED" && status !== "ISSUED" && (
                        <>
                            <div style={{ fontSize: 13, color: "#666" }}>
                                Chọn người duyệt tiếp theo
                            </div>
                            <Select
                                placeholder="Chọn người duyệt tiếp theo"
                                style={{ width: "100%" }}
                                options={approverOptions}
                                value={nextUserId}
                                onChange={(v) => setNextUserId(v)}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                            />
                        </>
                    )}

                    {/* SELECT NGƯỜI BAN HÀNH — chỉ hiện khi là duyệt cuối */}

                    {isFinalApprover && status === "IN_REVIEW" && (
                        <>
                            <div style={{ fontSize: 13, color: "#666" }}>
                                Chọn người ban hành JD
                            </div>
                            <Select
                                placeholder="Chọn người ban hành JD"
                                style={{ width: "100%" }}
                                options={issuerOptions}
                                value={nextIssuerId}
                                onChange={(v) => setNextIssuerId(v)}
                                allowClear
                                showSearch
                                optionFilterProp="label"
                            />
                        </>
                    )}

                    {/* GỬI DUYỆT — ẩn khi là duyệt cuối hoặc đang ở vai trò approver */}

                    {!isFinalApprover && !isApprover && (
                        <Button
                            type="primary"
                            block
                            disabled={!nextUserId}
                            onClick={handleSubmit}
                        >
                            {status === "REJECTED"
                                ? "Gửi lại duyệt"
                                : "Gửi duyệt"}
                        </Button>
                    )}

                    {/* DUYỆT */}

                    {status === "IN_REVIEW" && (
                        <>
                            <Button
                                type="primary"
                                block
                                disabled={
                                    isFinalApprover
                                        ? !nextIssuerId
                                        : !nextUserId
                                }
                                onClick={handleApprove}
                            >
                                {/* ✅ Label rõ ràng hơn */}
                                {isFinalApprover
                                    ? "Xác nhận duyệt & gửi ban hành"
                                    : "Duyệt & chuyển tiếp"}
                            </Button>

                            <Button
                                danger
                                block
                                onClick={handleReject}
                            >
                                Từ chối
                            </Button>
                        </>
                    )}

                    {/* BAN HÀNH */}

                    {status === "APPROVED" && (
                        <Button
                            type="primary"
                            block
                            onClick={handleIssue}
                        >
                            Ban hành JD
                        </Button>
                    )}

                </Space>

            </Spin>

        </Modal>

    );
};

export default ModalJdFlow;