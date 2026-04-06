// src/pages/admin/department/department-job-title/department.job-title.tab.tsx

import { useEffect, useRef, useState } from "react";
import {
    Button,
    Popconfirm,
    Space,
    Tooltip,
    Input,
    Empty,
    Tag,
    Typography,
} from "antd";
import {
    PlusOutlined,
    DeleteOutlined,
    SearchOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";
import type { ProColumns, ActionType } from "@ant-design/pro-components";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { notify } from "@/components/common/notification/notify";

import {
    callFetchCompanyJobTitlesOfDepartment,
    callDeleteDepartmentJobTitle,
    callRestoreDepartmentJobTitle,
} from "@/config/api";

import type { IDepartmentJobTitle } from "@/types/backend";

import DrawerAssignJobTitle from "./drawer.assign-job-title";
import DrawerDepartmentSalaryGrade from "./department-salary-grade/drawer.department-salary-grade";
import DrawerJobTitlePerformanceContent from "@/pages/admin/job-title-performance-content/drawer.job-title-performance-content";

const { Text } = Typography;

interface IProps {
    departmentId?: number;
    companyId?: number;
    departmentName?: string;
    hideTitle?: boolean;
}

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

const DepartmentJobTitleTab = ({ departmentId, companyId }: IProps) => {
    const [data, setData] = useState<IDepartmentJobTitle[]>([]);
    const [loading, setLoading] = useState(false);
    const [openDrawer, setOpenDrawer] = useState(false);
    const [searchText, setSearchText] = useState("");

    const [openSalary, setOpenSalary] = useState(false);
    const [selectedSalary, setSelectedSalary] = useState<{
        departmentJobTitleId: number;
        jobTitleName: string;
    } | null>(null);

    const [openPerformance, setOpenPerformance] = useState(false);
    const [selectedPerformance, setSelectedPerformance] = useState<{
        departmentJobTitleId: number;
        jobTitleName: string;
    } | null>(null);

    const tableRef = useRef<ActionType>(null);

    const fetchData = async () => {
        if (!departmentId) return;
        setLoading(true);
        try {
            const res = await callFetchCompanyJobTitlesOfDepartment(departmentId);
            const list = (res?.data ?? [])
                .filter((x: any) => x.source === "DEPARTMENT")
                .map((x: any) => ({
                    ...x,
                    jobTitle: {
                        ...x.jobTitle,
                        nameEn: x.jobTitle?.nameEn || "",
                    },
                    active: true,
                }));

            const sorted = [...list].sort((a: any, b: any) => {
                const orderA = a.jobTitle?.bandOrder ?? 999;
                const orderB = b.jobTitle?.bandOrder ?? 999;
                if (orderA !== orderB) return orderA - orderB;
                return (a.jobTitle?.levelNumber ?? 0) - (b.jobTitle?.levelNumber ?? 0);
            });

            setData(sorted);
        } catch {
            notify.error("Không thể tải danh sách chức danh trong phòng ban");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (departmentId) fetchData();
    }, [departmentId]);

    const filteredData = data.filter((row) =>
        row.jobTitle?.nameVi?.toLowerCase().includes(searchText.toLowerCase()) ?? false
    );

    const handleDeactivate = async (id: number) => {
        try {
            await callDeleteDepartmentJobTitle(id);
            notify.deleted("Đã hủy gán chức danh khỏi phòng ban");
            fetchData();
        } catch {
            notify.error("Không thể hủy gán chức danh này");
        }
    };

    const handleRestore = async (id: number) => {
        try {
            await callRestoreDepartmentJobTitle(id);
            notify.success("Đã khôi phục chức danh vào phòng ban");
            fetchData();
        } catch {
            notify.error("Không thể khôi phục chức danh");
        }
    };

    const columns: ProColumns<IDepartmentJobTitle>[] = [
        {
            title: "STT",
            width: 56,
            align: "center",
            render: (_, __, idx) => (
                <Text type="secondary" style={{ fontSize: 13, fontVariantNumeric: "tabular-nums" }}>
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
                    <Access permission={ALL_PERMISSIONS.DEPARTMENT_SALARY_GRADES.GET} hideChildren>
                        <Button
                            size="small"
                            style={{ ...styles.actionBtn, ...styles.salaryBtn }}
                            onClick={() => {
                                setSelectedSalary({
                                    departmentJobTitleId: record.id,
                                    jobTitleName: record.jobTitle?.nameVi ?? "Chưa có tên",
                                });
                                setOpenSalary(true);
                            }}
                        >
                            Bậc lương
                        </Button>
                    </Access>

                    <Access permission={ALL_PERMISSIONS.JOB_TITLE_PERFORMANCE_CONTENT.GET_PAGINATE} hideChildren>
                        <Button
                            size="small"
                            style={{ ...styles.actionBtn, ...styles.criteriaBtn }}
                            onClick={() => {
                                setSelectedPerformance({
                                    departmentJobTitleId: record.id,
                                    jobTitleName: record.jobTitle?.nameVi ?? "Chưa có tên",
                                });
                                setOpenPerformance(true);
                            }}
                        >
                            Tiêu chí
                        </Button>
                    </Access>
                </Space>
            ),
        },
        {
            title: "Hành động",
            align: "center",
            width: 90,
            render: (_, record) => (
                <Access permission={ALL_PERMISSIONS.DEPARTMENT_JOB_TITLES.DELETE} hideChildren>
                    {record.active ? (
                        <Popconfirm
                            title="Hủy gán chức danh này khỏi phòng ban?"
                            description="Thao tác này không thể hoàn tác."
                            okText="Hủy gán"
                            okButtonProps={{ danger: true }}
                            cancelText="Đóng"
                            onConfirm={() => handleDeactivate(record.id)}
                        >
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                size="small"
                                style={{ borderRadius: 6 }}
                            />
                        </Popconfirm>
                    ) : (
                        <Tooltip title="Khôi phục chức danh">
                            <Button
                                type="text"
                                icon={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
                                size="small"
                                style={{ borderRadius: 6 }}
                                onClick={() => handleRestore(record.id)}
                            />
                        </Tooltip>
                    )}
                </Access>
            ),
        },
    ];

    return (
        <PageContainer title="">
            <div className="dept-job-title-table">
                <style>{`
                    .dept-job-title-table .ant-table-sticky-holder {
                        top: 0px !important;
                    }
                `}</style>

                <div style={styles.toolbarWrapper}>
                    <div style={styles.toolbarLeft}>
                        <Input
                            placeholder="Tìm chức danh..."
                            prefix={<SearchOutlined style={{ color: "#bbb", fontSize: 13 }} />}
                            allowClear
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={styles.searchInput}
                            disabled={!departmentId || loading}
                        />
                    </div>

                    <Access permission={ALL_PERMISSIONS.DEPARTMENT_JOB_TITLES.CREATE}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setOpenDrawer(true)}
                            disabled={!departmentId || loading}
                            style={styles.assignButton}
                        >
                            Gán chức danh
                        </Button>
                    </Access>
                </div>

                <DataTable<IDepartmentJobTitle>
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
                                    <Access permission={ALL_PERMISSIONS.DEPARTMENT_JOB_TITLES.CREATE}>
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={() => setOpenDrawer(true)}
                                            disabled={!departmentId}
                                            style={styles.assignButton}
                                        >
                                            Gán chức danh ngay
                                        </Button>
                                    </Access>
                                )}
                            </Empty>
                        ),
                    }}
                />
            </div>

            {openDrawer && departmentId && (
                <DrawerAssignJobTitle
                    open={openDrawer}
                    onClose={() => setOpenDrawer(false)}
                    departmentId={departmentId}
                    companyId={companyId ?? 0}
                    assignedJobIds={data.map((d) => d.jobTitle.id)}
                    onSuccess={() => {
                        fetchData();
                        setOpenDrawer(false);
                    }}
                />
            )}

            {openSalary && selectedSalary && (
                <DrawerDepartmentSalaryGrade
                    open={openSalary}
                    onClose={() => {
                        setOpenSalary(false);
                        setSelectedSalary(null);
                    }}
                    departmentJobTitleId={selectedSalary.departmentJobTitleId}
                    jobTitleName={selectedSalary.jobTitleName}
                    onSuccess={fetchData}
                />
            )}

            {openPerformance && selectedPerformance && (
                <DrawerJobTitlePerformanceContent
                    open={openPerformance}
                    onClose={() => {
                        setOpenPerformance(false);
                        setSelectedPerformance(null);
                    }}
                    ownerLevel="DEPARTMENT"
                    ownerJobTitleId={selectedPerformance.departmentJobTitleId}
                    ownerJobTitleName={selectedPerformance.jobTitleName}
                    onSuccess={fetchData}
                />
            )}
        </PageContainer>
    );
};

export default DepartmentJobTitleTab;