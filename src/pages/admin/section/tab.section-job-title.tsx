// src/pages/admin/section/section-job-title/section.job-title.tab.tsx

import React, { useEffect, useRef, useState } from "react";
import {
    Button,
    Popconfirm,
    Space,
    Input,
    Empty,
    Tag,
    Typography,
    Tooltip,
} from "antd";
import {
    PlusOutlined,
    DeleteOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import { notify } from "@/components/common/notification/notify";

import {
    callFetchJobTitlesBySection,
    callDeleteSectionJobTitle,
} from "@/config/api";

import DrawerAssignSectionJobTitle from "./drawer.assign-job-title-section";
import DrawerSectionSalaryGrade from "../section/section-salary-grade/drawer.section-salary-grade";
import DrawerJobTitlePerformanceContent from "@/pages/admin/job-title-performance-content/drawer.job-title-performance-content";

import type { ISectionJobTitle } from "@/types/backend";

const { Text } = Typography;

/* ================= TYPES ================= */
interface IProps {
    sectionId?: number;
    departmentId?: number;
}

/* ================= STYLES ================= */
const styles: Record<string, React.CSSProperties> = {
    toolbarWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 16,
        flexWrap: "wrap",
    },
    toolbarLeft: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        flex: 1,
    },
    searchInput: {
        width: 300,
        borderRadius: 8,
        fontSize: 13,
    },
    assignButton: {
        borderRadius: 8,
        height: 32,
        paddingLeft: 14,
        paddingRight: 14,
        fontWeight: 500,
        fontSize: 13,
        background: "linear-gradient(135deg, #eb2f96 0%, #c41d7f 100%)",
        borderColor: "transparent",
        boxShadow: "0 2px 8px rgba(196,29,127,0.25)",
        display: "flex",
        alignItems: "center",
        gap: 4,
    },
    actionBtn: {
        borderRadius: 6,
        fontSize: 13,
        fontWeight: 500,
        height: 28,
        padding: "0 10px",
    },
    salaryBtn: {
        background: "#fff0f6",
        borderColor: "#ffadd2",
        color: "#c41d7f",
    },
    criteriaBtn: {
        background: "#f0f5ff",
        borderColor: "#adc6ff",
        color: "#1d39c4",
    },
};

/* ================= MAIN COMPONENT ================= */
const SectionJobTitleTab = ({ sectionId, departmentId }: IProps) => {
    const [data, setData] = useState<ISectionJobTitle[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");

    const [openDrawer, setOpenDrawer] = useState(false);
    const [openSalary, setOpenSalary] = useState(false);
    const [openPerformance, setOpenPerformance] = useState(false);

    const [selected, setSelected] = useState<{
        sectionJobTitleId: number;
        jobTitleName: string;
    } | null>(null);

    const tableRef = useRef<ActionType>(null);

    /* ================= FETCH DATA ================= */
    const fetchData = async () => {
        if (!sectionId) return;
        setLoading(true);
        try {
            const res = await callFetchJobTitlesBySection(sectionId);
            const list = res?.data ?? [];

            const sorted = [...list].sort((a, b) => {
                const orderA = a.jobTitle?.bandOrder ?? 999;
                const orderB = b.jobTitle?.bandOrder ?? 999;
                if (orderA !== orderB) return orderA - orderB;
                return (a.jobTitle?.levelNumber ?? 0) - (b.jobTitle?.levelNumber ?? 0);
            });

            setData(sorted);
        } catch {
            notify.error("Không thể tải danh sách chức danh trong bộ phận");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (sectionId) fetchData();
    }, [sectionId]);

    /* ================= FILTERED DATA ================= */
    const filteredData = data.filter((row) =>
        row.jobTitle?.nameVi?.toLowerCase().includes(searchText.toLowerCase()) ?? false
    );

    /* ================= DELETE ================= */
    const handleDelete = async (id: number) => {
        try {
            await callDeleteSectionJobTitle(id);
            notify.deleted("Đã xoá chức danh khỏi bộ phận");
            fetchData();
        } catch {
            notify.error("Không thể xoá chức danh");
        }
    };

    /* ================= COLUMNS ================= */
    const columns: ProColumns<ISectionJobTitle>[] = [
        {
            title: "STT",
            width: 56,
            align: "center",
            render: (_, __, idx) => (
                <Text
                    type="secondary"
                    style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}
                >
                    {idx + 1}
                </Text>
            ),
        },
        {
            title: "Tên chức danh",
            dataIndex: ["jobTitle", "nameVi"],
            ellipsis: true,
            render: (_, record) => (
                <Text strong style={{ fontSize: 14 }}>
                    {record.jobTitle?.nameVi ?? "—"}
                </Text>
            ),
        },
        {
            title: "Cấp bậc",
            align: "center",
            width: 110,
            render: (_, record) => {
                const jt = record.jobTitle as any;
                const code =
                    jt?.positionCode ||
                    jt?.positionLevel?.code ||
                    (jt?.band && jt?.level ? `${jt.band}${jt.level}` : null);
                return code ? (
                    <Tag color="blue" style={{ borderRadius: 6, fontWeight: 500 }}>
                        {code}
                    </Tag>
                ) : (
                    <Text type="secondary">--</Text>
                );
            },
        },
        {
            title: "Quản lý",
            align: "center",
            width: 200,
            render: (_, record) => (
                <Space size={6}>
                    <Button
                        size="small"
                        style={{ ...styles.actionBtn, ...styles.salaryBtn }}
                        onClick={() => {
                            setSelected({
                                sectionJobTitleId: record.id,
                                jobTitleName: record.jobTitle?.nameVi ?? "Chưa có tên",
                            });
                            setOpenSalary(true);
                        }}
                    >
                        Bậc lương
                    </Button>
                    <Button
                        size="small"
                        style={{ ...styles.actionBtn, ...styles.criteriaBtn }}
                        onClick={() => {
                            setSelected({
                                sectionJobTitleId: record.id,
                                jobTitleName: record.jobTitle?.nameVi ?? "Chưa có tên",
                            });
                            setOpenPerformance(true);
                        }}
                    >
                        Tiêu chí
                    </Button>
                </Space>
            ),
        },
        {
            title: "Hành động",
            align: "center",
            width: 90,
            render: (_, record) => (
                <Popconfirm
                    title="Xoá chức danh này khỏi bộ phận?"
                    description="Thao tác này không thể hoàn tác."
                    okText="Xoá"
                    okButtonProps={{ danger: true }}
                    cancelText="Huỷ"
                    onConfirm={() => handleDelete(record.id)}
                >
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        style={{ borderRadius: 6 }}
                    />
                </Popconfirm>
            ),
        },
    ];

    /* ================= RENDER ================= */
    return (
        <PageContainer title="">

            {/* ── Wrapper fix sticky header ── */}
            <div className="section-job-title-table">
                <style>{`
                    .section-job-title-table .ant-table-sticky-holder {
                        top: 0px !important;
                    }
                `}</style>

                {/* ── Toolbar ── */}
                <div style={styles.toolbarWrapper}>
                    <div style={styles.toolbarLeft}>
                        <Input
                            placeholder="Tìm chức danh..."
                            prefix={
                                <SearchOutlined style={{ color: "#bbb", fontSize: 13 }} />
                            }
                            allowClear
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={styles.searchInput}
                            disabled={!sectionId || loading}
                        />
                    </div>

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setOpenDrawer(true)}
                        disabled={!sectionId || loading}
                        style={styles.assignButton}
                    >
                        Gán chức danh
                    </Button>
                </div>

                {/* ── DataTable ── */}
                <DataTable<ISectionJobTitle>
                    actionRef={tableRef}
                    rowKey="id"
                    loading={loading}
                    columns={columns}
                    dataSource={filteredData}
                    pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        pageSizeOptions: ["10", "20", "50", "100"],
                        showTotal: (total) => `${total} chức danh`,
                        style: { marginTop: 16 },
                    }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    searchText
                                        ? "Không tìm thấy chức danh phù hợp"
                                        : "Chưa có chức danh nào được gán"
                                }
                                style={{ padding: "48px 0" }}
                            >
                                {!searchText && (
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setOpenDrawer(true)}
                                        disabled={!sectionId}
                                        style={styles.assignButton}
                                    >
                                        Gán chức danh ngay
                                    </Button>
                                )}
                            </Empty>
                        ),
                    }}
                />

            </div> {/* ── đóng section-job-title-table ── */}

            {/* ── Drawers ── */}
            {openDrawer && sectionId && departmentId && (
                <DrawerAssignSectionJobTitle
                    open={openDrawer}
                    onClose={() => setOpenDrawer(false)}
                    sectionId={sectionId}
                    departmentId={departmentId}
                    assignedJobIds={data.map((d) => d.jobTitle.id)}
                    onSuccess={() => {
                        fetchData();
                        setOpenDrawer(false);
                    }}
                />
            )}

            {openSalary && selected && (
                <DrawerSectionSalaryGrade
                    open={openSalary}
                    onClose={() => {
                        setOpenSalary(false);
                        setSelected(null);
                    }}
                    sectionJobTitleId={selected.sectionJobTitleId}
                    jobTitleName={selected.jobTitleName}
                    onSuccess={fetchData}
                />
            )}

            {openPerformance && selected && (
                <DrawerJobTitlePerformanceContent
                    open={openPerformance}
                    onClose={() => {
                        setOpenPerformance(false);
                        setSelected(null);
                    }}
                    ownerLevel="SECTION"
                    ownerJobTitleId={selected.sectionJobTitleId}
                    ownerJobTitleName={selected.jobTitleName}
                    onSuccess={fetchData}
                />
            )}

        </PageContainer>
    );
};

export default SectionJobTitleTab;