// src/pages/admin/company/company-job-title/company.job-title.tab.tsx

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
    Button,
    Popconfirm,
    Space,
    Tooltip,
    Input,
    Select,
    Empty,
    Tag,
    Typography,
} from "antd";
import {
    PlusOutlined,
    DeleteOutlined,
    SearchOutlined,
    FilterOutlined,
    ApartmentOutlined,
} from "@ant-design/icons";
import type { ActionType, ProColumns } from "@ant-design/pro-components";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import { notify } from "@/components/common/notification/notify";

import {
    callFetchCompanyJobTitlesByCompany,
    callDeleteCompanyJobTitle,
} from "@/config/api";

import DrawerAssignCompanyJobTitle from "./drawer.assign-job-title-company";
import DrawerSalaryGrade from "./company-salary-grade/drawer.company-salary-grade";
import DrawerJobTitlePerformanceContent from "../../job-title-performance-content/drawer.job-title-performance-content";

import type { IJobTitle } from "@/types/backend";
import { useQueryClient } from "@tanstack/react-query";

const { Text } = Typography;

/* ================= TYPES ================= */
interface ICompanyJobTitleRow {
    id: number;
    active: boolean;
    jobTitle: IJobTitle;
    source?: "SECTION" | "DEPARTMENT" | "COMPANY";
}

type SourceFilter = "ALL" | "SECTION" | "DEPARTMENT" | "COMPANY";

/* ================= CONSTANTS ================= */
const SOURCE_OPTIONS: { label: string; value: SourceFilter }[] = [
    { label: "Tất cả nguồn", value: "ALL" },
    { label: "Công ty", value: "COMPANY" },
    { label: "Phòng ban", value: "DEPARTMENT" },
    { label: "Bộ phận", value: "SECTION" },
];

const SOURCE_CONFIG: Record<
    "COMPANY" | "DEPARTMENT" | "SECTION",
    { label: string; color: string }
> = {
    COMPANY: { label: "Công ty", color: "green" },
    DEPARTMENT: { label: "Phòng ban", color: "orange" },
    SECTION: { label: "Bộ phận", color: "blue" },
};
/* ================= STYLES ================= */
const styles: Record<string, React.CSSProperties> = {
    headerWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 0 16px 0",
        borderBottom: "1px solid #f0f0f0",
        marginBottom: 20,
        flexWrap: "wrap",
        gap: 12,
    },
    headerLeft: {
        display: "flex",
        alignItems: "center",
        gap: 10,
    },
    headerIcon: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 36,
        height: 36,
        borderRadius: 8,
        background: "linear-gradient(135deg, #fff0f6 0%, #ffd6e7 100%)",
        color: "#c41d7f",
        fontSize: 16,
        flexShrink: 0,
    },
    headerTitle: {
        fontSize: 15,
        fontWeight: 600,
        color: "#262626",
        margin: 0,
        lineHeight: 1.3,
    },
    headerSubtitle: {
        fontSize: 12,
        color: "#8c8c8c",
        margin: 0,
        lineHeight: 1.4,
    },
    toolbarWrapper: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 16,
        flexWrap: "wrap", // 👈 QUAN TRỌNG
    },
    toolbarLeft: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap", // 👈 thêm cái này
        flex: 1,
    },
    searchInput: {
        width: "100%",
        maxWidth: 300,
        borderRadius: 8,
        fontSize: 13,
    },
    selectFilter: {
        width: "100%",
        maxWidth: 160,
        borderRadius: 8,
    },

    assignButton: {
        borderRadius: 8,
        height: 32,
        padding: "0 12px",
        fontWeight: 500,
        fontSize: 13,
        background: "linear-gradient(135deg, #eb2f96 0%, #c41d7f 100%)",
        borderColor: "transparent",
        boxShadow: "0 2px 8px rgba(196,29,127,0.25)",

        display: "inline-flex", // 👈 đổi từ flex → inline-flex
        alignItems: "center",
        gap: 6,

        whiteSpace: "nowrap",   // 👈 không bị xuống dòng
        maxWidth: "100%",       // 👈 không tràn
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
const CompanyJobTitleTab = ({
    companyId,
    companyName = "",
    hideTitle = false,
}: {
    companyId?: number;
    companyName?: string;
    hideTitle?: boolean;
}) => {
    const [data, setData] = useState<ICompanyJobTitleRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [searchText, setSearchText] = useState("");
    const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");

    const [openAssign, setOpenAssign] = useState(false);
    const [openSalary, setOpenSalary] = useState(false);
    const [openPerformance, setOpenPerformance] = useState(false);

    const [selectedCompanyJobTitleId, setSelectedCompanyJobTitleId] = useState<number | null>(null);
    const [selectedJobTitleName, setSelectedJobTitleName] = useState<string>("");

    const tableRef = useRef<ActionType>(null);
    const queryClient = useQueryClient();

    /* ================= FILTERED DATA ================= */
    const filteredData = data.filter((row) => {
        const matchSearch =
            row.jobTitle?.nameVi
                ?.toLowerCase()
                .includes(searchText.toLowerCase()) ?? false;
        const matchSource =
            sourceFilter === "ALL" || row.source === sourceFilter;
        return matchSearch && matchSource;
    });

    /* ================= FETCH DATA ================= */
    const fetchData = useCallback(
        async (silent = false) => {
            if (!companyId || companyId <= 0) return;
            silent ? setRefreshing(true) : setLoading(true);
            try {
                const res = await callFetchCompanyJobTitlesByCompany(companyId);
                setData(res?.data ?? []);
            } catch {
                notify.error("Không thể tải danh sách chức danh công ty");
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [companyId]
    );

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /* ================= DELETE ================= */
    const handleDelete = async (id: number) => {
        try {
            await callDeleteCompanyJobTitle(id);
            notify.deleted("Đã xoá chức danh khỏi công ty");
            fetchData(true);
        } catch {
            notify.error("Không thể xoá chức danh");
        }
    };

    /* ================= OPEN DRAWER ================= */
    const openDrawer = (
        type: "salary" | "performance",
        record: ICompanyJobTitleRow
    ) => {
        setSelectedCompanyJobTitleId(record.id);
        setSelectedJobTitleName(record.jobTitle.nameVi || "");
        if (type === "salary") setOpenSalary(true);
        else setOpenPerformance(true);
    };

    /* ================= COLUMNS ================= */
    const columns: ProColumns<ICompanyJobTitleRow>[] = [
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
            title: "Nguồn gán",
            align: "center",
            width: 130,
            render: (_, record) => {
                const source = record.source as keyof typeof SOURCE_CONFIG | undefined;
                if (!source || !SOURCE_CONFIG[source])
                    return <Text type="secondary">—</Text>;
                const cfg = SOURCE_CONFIG[source];
                return (
                    <Tag
                        color={cfg.color}
                        style={{ borderRadius: 4, fontWeight: 500, margin: 0 }}
                    >
                        {cfg.label}
                    </Tag>
                );
            },
        },
        {
            title: "Quản lý",
            align: "center",
            width: 200,
            render: (_, record) => {
                if (record.source !== "COMPANY") {
                    return (
                        <Tooltip title="Chức danh kế thừa — quản lý tại cấp nguồn">
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                Kế thừa
                            </Text>
                        </Tooltip>
                    );
                }
                return (
                    <Space size={6}>
                        <Button
                            size="small"
                            style={{ ...styles.actionBtn, ...styles.salaryBtn }}
                            onClick={() => openDrawer("salary", record)}
                        >
                            Bậc lương
                        </Button>
                        <Button
                            size="small"
                            style={{ ...styles.actionBtn, ...styles.criteriaBtn }}
                            onClick={() => openDrawer("performance", record)}
                        >
                            Tiêu chí
                        </Button>
                    </Space>
                );
            },
        },
        {
            title: "Hành động",
            align: "center",
            width: 90,
            render: (_, record) => {
                if (record.source !== "COMPANY")
                    return (
                        <Tooltip title="Không thể xoá ở cấp công ty">
                            <Text type="secondary">—</Text>
                        </Tooltip>
                    );
                return (
                    <Popconfirm
                        title="Xoá chức danh khỏi công ty?"
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
                );
            },
        },
    ];

    /* ================= RENDER ================= */
    return (
        <PageContainer title="">

            {/* ── Header ── */}
            {!hideTitle && (
                <div style={styles.headerWrapper}>
                    <div style={styles.headerLeft}>
                        <span style={styles.headerIcon}>
                            <ApartmentOutlined />
                        </span>
                        <div>
                            <div style={styles.headerTitle}>Chức danh công ty</div>
                            {companyName && (
                                <div style={styles.headerSubtitle}>{companyName}</div>
                            )}
                        </div>
                    </div>
                    <Tag
                        color="pink"
                        style={{
                            borderRadius: 20,
                            fontWeight: 600,
                            fontSize: 12,
                            padding: "2px 12px",
                            border: "1px solid #ffadd2",
                            background: "#fff0f6",
                            color: "#c41d7f",
                        }}
                    >
                        {filteredData.length} chức danh
                    </Tag>
                </div>
            )}

            {/* ── Wrapper fix sticky header ── */}
            <div className="company-job-title-table">
                <style>{`
                    .company-job-title-table .ant-table-sticky-holder {
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
                            disabled={!companyId || loading}
                        />
                        <Select
                            value={sourceFilter}
                            onChange={setSourceFilter}
                            options={SOURCE_OPTIONS}
                            style={styles.selectFilter}
                            suffixIcon={
                                <FilterOutlined style={{ color: "#bbb", fontSize: 12 }} />
                            }
                            disabled={!companyId || loading}
                        />
                    </div>

                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setOpenAssign(true)}
                        disabled={!companyId || loading}
                        style={styles.assignButton}
                    >
                        Gán chức danh
                    </Button>
                </div>

                {/* ── DataTable ── */}
                <DataTable<ICompanyJobTitleRow>
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
                                    searchText || sourceFilter !== "ALL"
                                        ? "Không tìm thấy chức danh phù hợp"
                                        : "Chưa có chức danh nào được gán"
                                }
                                style={{ padding: "48px 0" }}
                            >
                                {!searchText && sourceFilter === "ALL" && (
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => setOpenAssign(true)}
                                        disabled={!companyId}
                                        style={styles.assignButton}
                                    >
                                        Gán chức danh ngay
                                    </Button>
                                )}
                            </Empty>
                        ),
                    }}
                />

            </div> {/* ── đóng company-job-title-table ── */}

            {/* ── Drawers ── */}
            <DrawerAssignCompanyJobTitle
                open={openAssign}
                onClose={() => setOpenAssign(false)}
                companyId={companyId!}
                onSuccess={() => {
                    fetchData();
                    setOpenAssign(false);
                }}
            />

            <DrawerSalaryGrade
                open={openSalary}
                onClose={() => {
                    setOpenSalary(false);
                    setSelectedCompanyJobTitleId(null);
                    if (selectedCompanyJobTitleId)
                        queryClient.invalidateQueries({
                            queryKey: ["company-salary-grades", selectedCompanyJobTitleId],
                        });
                }}
                companyJobTitleId={selectedCompanyJobTitleId!}
                jobTitleName={selectedJobTitleName}
                onSuccess={() => fetchData(true)}
            />

            <DrawerJobTitlePerformanceContent
                open={openPerformance}
                onClose={() => {
                    setOpenPerformance(false);
                    setSelectedCompanyJobTitleId(null);
                }}
                ownerLevel="COMPANY"
                ownerJobTitleId={selectedCompanyJobTitleId!}
                ownerJobTitleName={selectedJobTitleName}
                onSuccess={() => fetchData(true)}
            />

        </PageContainer>
    );
};

export default CompanyJobTitleTab;