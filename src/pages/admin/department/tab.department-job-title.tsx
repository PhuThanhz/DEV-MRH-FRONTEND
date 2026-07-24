// src/pages/admin/department/department-job-title/department.job-title.tab.tsx

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
    Button,
    Popconfirm,
    Space,
    Empty,
    Tag,
    Typography,
} from "antd";
import {
    PlusOutlined,
    DeleteOutlined,
    CheckCircleOutlined,
    IdcardOutlined,
    SearchOutlined,
} from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/permissions";
import SearchFilter from "@/components/common/filter/SearchFilter";

import {
    useDepartmentJobTitlesQuery,
    useDeleteDepartmentJobTitleMutation,
    useRestoreDepartmentJobTitleMutation,
} from "@/hooks/useDepartmentJobTitles";

import type { IDepartmentJobTitle } from "@/types/backend";

import DrawerAssignJobTitle from "./drawer.assign-job-title";
import DrawerDepartmentSalaryGrade from "./department-salary-grade/drawer.department-salary-grade";
import DrawerJobTitlePerformanceContent from "@/pages/admin/job-title-performance-content/drawer.job-title-performance-content";
import ActionButton from "@/components/common/ui/ActionButton";

const { Text } = Typography;

interface IProps {
    departmentId?: number;
    companyId?: number;
    departmentName?: string;
    hideTitle?: boolean;
}

const styles: Record<string, React.CSSProperties> = {
    assignButton: {
        borderRadius: 10,
        height: 38,
        paddingLeft: 16,
        paddingRight: 16,
        fontWeight: 600,
        fontSize: 13,
        background: "#e9557a",
        borderColor: "#e9557a",
        boxShadow: "0 8px 20px -12px rgba(190, 24, 93, 0.72)",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
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

const DepartmentJobTitleTab = ({
    departmentId,
    companyId,
    departmentName
}: IProps) => {
    const queryClient = useQueryClient();
    const [openDrawer, setOpenDrawer] = useState(false);
    const [searchText, setSearchText] = useState("");

    const handleRefetch = () => {
        if (departmentId) {
            queryClient.invalidateQueries({ queryKey: ["department-job-titles", departmentId] });
        }
    };

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

    const { data: rawList = [], isLoading: loading } = useDepartmentJobTitlesQuery(departmentId);

    const data = useMemo(() => {
        const list = rawList.map((x: any) => ({
            ...x,
            jobTitle: {
                ...x.jobTitle,
                nameEn: x.jobTitle?.nameEn || "",
            },
            active: true,
        }));

        return [...list].sort((a: any, b: any) => {
            const orderA = a.jobTitle?.bandOrder ?? 999;
            const orderB = b.jobTitle?.bandOrder ?? 999;
            if (orderA !== orderB) return orderA - orderB;
            return (a.jobTitle?.levelNumber ?? 0) - (b.jobTitle?.levelNumber ?? 0);
        });
    }, [rawList]);

    const deleteMutation = useDeleteDepartmentJobTitleMutation();
    const restoreMutation = useRestoreDepartmentJobTitleMutation();

    const filteredData = data.filter((row) =>
        row.jobTitle?.nameVi?.toLowerCase().includes(searchText.toLowerCase()) ?? false
    );

    const handleDeactivate = (id: number) => {
        if (!departmentId) return;
        deleteMutation.mutate({ id, departmentId });
    };

    const handleRestore = (id: number) => {
        if (!departmentId) return;
        restoreMutation.mutate({ id, departmentId });
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
                            <ActionButton
                                variant="danger"
                                tooltip="Hủy gán chức danh"
                                icon={<DeleteOutlined />}
                            />
                        </Popconfirm>
                    ) : (
                        <ActionButton
                            variant="success"
                            tooltip="Khôi phục chức danh"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleRestore(record.id)}
                        />
                    )}
                </Access>
            ),
        },
    ];

    return (
        <PageContainer
            title={departmentName ? `Chức danh phòng ban: ${departmentName}` : "Chức danh phòng ban"}
            extra={
                <div className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-rose-100 bg-rose-50/70 px-2.5 text-xs font-semibold text-rose-600">
                    <span className="tabular-nums">{data.length}</span>
                    <span className="font-medium text-rose-500">chức danh</span>
                </div>
            }
            fullHeight
            contentClassName="px-4 pb-5 pt-4 sm:px-5 flex-1 min-h-0 overflow-auto"
        >
            <section className="dept-job-title-table flex min-h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_45px_-35px_rgba(71,85,105,0.5)]">
                <style>{`
                    .dept-job-title-table .ant-table-sticky-holder {
                        top: 0px !important;
                    }

                    .dept-job-title-table .ant-pro-card,
                    .dept-job-title-table .ant-pro-table {
                        border: 0 !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                    }

                    .dept-job-title-table .ant-table-container {
                        border-inline-start: 0 !important;
                        border-radius: 0 !important;
                    }

                    .dept-job-title-table .ant-table-thead > tr > th {
                        background: #f8fafc !important;
                        border-color: #e9edf3 !important;
                        color: #334155 !important;
                        font-size: 12px !important;
                        font-weight: 650 !important;
                        letter-spacing: 0.01em;
                        padding-block: 12px !important;
                    }

                    .dept-job-title-table .ant-table-placeholder > td {
                        height: clamp(360px, calc(100dvh - 330px), 680px);
                        background:
                            radial-gradient(circle at 50% 40%, rgba(251, 207, 232, 0.22), transparent 28%),
                            #ffffff !important;
                        border-bottom: 0 !important;
                    }

                    .dept-job-title-table .ant-empty-normal {
                        margin-block: 0 !important;
                    }
                `}</style>

                <header className="border-b border-slate-100 bg-white px-4 py-4 sm:px-5">
                    <SearchFilter
                        searchPlaceholder="Tìm theo tên chức danh..."
                        showFilterButton={false}
                        showResetButton={false}
                        addLabel="Gán chức danh"
                        guideSearchId="department-job-title-search-input"
                        guideAddId="department-job-title-assign-button"
                        onSearch={(val) => setSearchText(val)}
                        onAddClick={() => setOpenDrawer(true)}
                        addPermission={ALL_PERMISSIONS.DEPARTMENT_JOB_TITLES.CREATE}
                    />
                </header>

                <div className="flex-1" data-guide-id="department-job-title-table">
                    <DataTable<IDepartmentJobTitle>
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
                                    image={
                                        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                                            <div className="absolute inset-0 rounded-[26px] bg-rose-50/80 ring-1 ring-rose-100" />
                                            <div className="absolute -right-1 top-1 h-5 w-5 rounded-full border-4 border-white bg-amber-300 shadow-sm" />
                                            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[23px] text-rose-500 shadow-[0_10px_25px_-15px_rgba(190,24,93,0.75)] ring-1 ring-rose-100">
                                                {searchText ? <SearchOutlined /> : <IdcardOutlined />}
                                            </div>
                                        </div>
                                    }
                                    description={
                                        <div className="mx-auto max-w-md px-5 text-center">
                                            <p className="mb-1 text-[15px] font-semibold text-slate-800">
                                                {searchText
                                                    ? "Không tìm thấy chức danh phù hợp"
                                                    : "Phòng ban chưa có chức danh"}
                                            </p>
                                            <p className="m-0 text-[13px] leading-5 text-slate-500">
                                                {searchText
                                                    ? "Hãy thử một từ khóa ngắn hơn hoặc kiểm tra lại tên chức danh."
                                                    : "Gán chức danh để bắt đầu thiết lập bậc lương, tiêu chí đánh giá và cơ cấu nhân sự cho phòng ban này."}
                                            </p>
                                        </div>
                                    }
                                    style={{ padding: "36px 0 44px" }}
                                >
                                    {!searchText && (
                                        <Access permission={ALL_PERMISSIONS.DEPARTMENT_JOB_TITLES.CREATE}>
                                            <Button
                                                data-guide-id="department-job-title-empty-assign-button"
                                                type="primary"
                                                icon={<PlusOutlined />}
                                                onClick={() => setOpenDrawer(true)}
                                                disabled={!departmentId}
                                                style={styles.assignButton}
                                            >
                                                Gán chức danh đầu tiên
                                            </Button>
                                        </Access>
                                    )}
                                </Empty>
                            ),
                        }}
                    />
                </div>
            </section>

            {/* Drawer Gán chức danh */}
            {openDrawer && departmentId && (
                <DrawerAssignJobTitle
                    open={openDrawer}
                    onClose={() => setOpenDrawer(false)}
                    departmentId={departmentId}
                    departmentName={departmentName}
                    onSuccess={handleRefetch}
                />
            )}

            {/* Drawer Bậc lương */}
            {openSalary && selectedSalary && (
                <DrawerDepartmentSalaryGrade
                    open={openSalary}
                    onClose={() => {
                        setOpenSalary(false);
                        setSelectedSalary(null);
                    }}
                    departmentJobTitleId={selectedSalary.departmentJobTitleId}
                    jobTitleName={selectedSalary.jobTitleName}
                    onSuccess={handleRefetch}
                />
            )}

            {/* Drawer Tiêu chí đánh giá */}
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
                    onSuccess={handleRefetch}
                />
            )}
        </PageContainer>
    );
};

export default DepartmentJobTitleTab;
