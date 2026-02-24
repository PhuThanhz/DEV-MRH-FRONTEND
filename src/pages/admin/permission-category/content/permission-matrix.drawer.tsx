import {
    Modal,
    Table,
    Select,
    Spin,
} from "antd";
import { useEffect } from "react";

import {
    usePermissionMatrixQuery,
    useAssignPermissionMutation,
} from "@/hooks/usePermissionAssignment";
import { useProcessActionsQuery } from "@/hooks/useProcessActions";

import type { IPermissionMatrix } from "@/types/backend";

interface IProps {
    open: boolean;
    setOpen: (v: boolean) => void;
    contentId: number | null;
}

const PermissionMatrixDrawer = ({ open, setOpen, contentId }: IProps) => {
    /* ===================== QUERY ===================== */
    const { data, refetch, isFetching } = usePermissionMatrixQuery(
        contentId ?? undefined
    );

    const { data: actionPage, isFetching: isLoadingActions } =
        useProcessActionsQuery("isActive==true");

    const assignMutation = useAssignPermissionMutation();

    /* ===================== EFFECT ===================== */
    useEffect(() => {
        if (open && contentId) {
            refetch();
        }
    }, [open, contentId, refetch]);

    if (!open || !contentId || !data) return null;

    const matrix = data as IPermissionMatrix;

    /* ===================== RENDER ===================== */
    return (
        <Modal
            open={open}
            width={1200}
            title={
                <div style={{ fontSize: 16, fontWeight: 600, color: "#262626" }}>
                    Ma trận phân quyền: <span style={{ color: "#eb2f96", fontWeight: 500 }}>{matrix.contentName}</span>
                </div>
            }
            onCancel={() => setOpen(false)}
            footer={null}
            destroyOnClose
            centered
            styles={{
                body: {
                    maxHeight: "75vh",
                    overflowY: "auto",
                    padding: "24px",
                    backgroundColor: "#fafafa",
                },
            }}
        >
            <Spin spinning={isLoadingActions} tip="Đang tải dữ liệu...">
                {/* ===================== MATRIX ===================== */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {matrix.departments.map((dept) => (
                        <div
                            key={dept.departmentId}
                            style={{
                                border: "1px solid #f0f0f0",
                                borderRadius: 8,
                                overflow: "hidden",
                                backgroundColor: "#fff",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                                transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(235,47,150,0.08)";
                                e.currentTarget.style.borderColor = "#ffc0e3";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
                                e.currentTarget.style.borderColor = "#f0f0f0";
                            }}
                        >
                            {/* ===== Department Header ===== */}
                            <div
                                style={{
                                    padding: "12px 20px",
                                    background: "linear-gradient(to right, #fff5f9, #ffffff)",
                                    borderBottom: "1px solid #ffe8f2",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: "#262626",
                                    }}
                                >
                                    {dept.departmentName}
                                </span>
                                <span
                                    style={{
                                        fontSize: 12,
                                        color: "#8c8c8c",
                                        backgroundColor: "#fff",
                                        padding: "2px 10px",
                                        borderRadius: 12,
                                        border: "1px solid #ffe8f2",
                                    }}
                                >
                                    {dept.jobTitles.length} chức danh
                                </span>
                            </div>

                            {/* ===== Job Titles Table ===== */}
                            <Table
                                rowKey="departmentJobTitleId"
                                loading={isFetching}
                                dataSource={dept.jobTitles}
                                pagination={false}
                                size="small"
                                showHeader={dept === matrix.departments[0]}
                                columns={[
                                    {
                                        title: "STT",
                                        width: 60,
                                        align: "center",
                                        render: (_, __, index) => (
                                            <span style={{ color: "#8c8c8c", fontSize: 13 }}>
                                                {index + 1}
                                            </span>
                                        ),
                                    },
                                    {
                                        title: "Chức danh",
                                        dataIndex: "jobTitleName",
                                        render: (text) => (
                                            <span
                                                style={{
                                                    color: "#262626",
                                                }}
                                            >
                                                {text}
                                            </span>
                                        ),
                                    },
                                    {
                                        title: "Quyền",
                                        width: 320,
                                        render: (_, record) => (
                                            <Select
                                                style={{ width: 300 }}
                                                placeholder="Chọn quyền"
                                                allowClear
                                                value={
                                                    record.processActionId ??
                                                    null
                                                }
                                                loading={isLoadingActions}
                                                optionLabelProp="label"
                                                onChange={(processActionId) => {
                                                    if (!processActionId)
                                                        return;

                                                    assignMutation.mutate(
                                                        {
                                                            contentId,
                                                            data: {
                                                                departmentJobTitleId:
                                                                    record.departmentJobTitleId,
                                                                processActionId,
                                                            },
                                                        },
                                                        {
                                                            onSuccess: () =>
                                                                refetch(),
                                                        }
                                                    );
                                                }}
                                            >
                                                {actionPage?.result.map(
                                                    (action) => (
                                                        <Select.Option
                                                            key={action.id}
                                                            value={action.id}
                                                            label={`${action.code} - ${action.name}`}
                                                        >
                                                            {action.code} -{" "}
                                                            {action.name}
                                                        </Select.Option>
                                                    )
                                                )}
                                            </Select>
                                        ),
                                    },
                                ]}
                            />
                        </div>
                    ))}
                </div>

                {/* ===================== BẢNG GIẢI THÍCH QUYỀN ===================== */}
                {actionPage?.result && actionPage.result.length > 0 && (
                    <div
                        style={{
                            marginTop: 24,
                            padding: 20,
                            backgroundColor: "#fff",
                            borderRadius: 8,
                            border: "1px solid #ffe8f2",
                            boxShadow: "0 2px 4px rgba(235,47,150,0.03)",
                        }}
                    >
                        <div
                            style={{
                                marginBottom: 16,
                                fontWeight: 600,
                                fontSize: 14,
                                color: "#262626",
                                paddingBottom: 12,
                                borderBottom: "2px solid #fff0f6",
                            }}
                        >
                            Danh sách quyền hành động
                        </div>

                        <Table
                            size="small"
                            pagination={false}
                            dataSource={actionPage.result}
                            rowKey="id"
                            bordered
                            columns={[
                                {
                                    title: "Mã",
                                    dataIndex: "code",
                                    width: 100,
                                    align: "center",
                                    render: (v) => (
                                        <span
                                            style={{
                                                fontWeight: 600,
                                                fontFamily: "monospace",
                                                color: "#eb2f96",
                                                fontSize: 13,
                                                padding: "2px 8px",
                                                backgroundColor: "#fff0f6",
                                                borderRadius: 4,
                                            }}
                                        >
                                            {v}
                                        </span>
                                    ),
                                },
                                {
                                    title: "Tên quyền",
                                    dataIndex: "name",
                                    width: 180,
                                    render: (v) => (
                                        <span
                                            style={{
                                                fontWeight: 500,
                                                color: "#262626",
                                            }}
                                        >
                                            {v}
                                        </span>
                                    ),
                                },
                                {
                                    title: "Mô tả ngắn",
                                    dataIndex: "shortDescription",
                                    width: 280,
                                    render: (v) => (
                                        <span
                                            style={{
                                                fontSize: 13,
                                                color: "#595959",
                                            }}
                                        >
                                            {v || "—"}
                                        </span>
                                    ),
                                },
                                {
                                    title: "Mô tả chi tiết",
                                    dataIndex: "description",
                                    render: (v) => (
                                        <span
                                            style={{
                                                fontSize: 13,
                                                color: "#8c8c8c",
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            {v || "—"}
                                        </span>
                                    ),
                                },
                            ]}
                        />
                    </div>
                )}
            </Spin>
        </Modal>
    );
};

export default PermissionMatrixDrawer;