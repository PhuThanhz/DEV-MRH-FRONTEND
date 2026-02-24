import { useEffect, useRef, useState } from "react";
import { Space, Button, Popconfirm, Badge } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
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

// Drawers
import DrawerAssignJobTitle from "./drawer.assign-job-title";
import DrawerDepartmentSalaryGrade from "./department-salary-grade/drawer.department-salary-grade";
import DrawerJobTitlePerformanceContent from "@/pages/admin/job-title-performance-content/drawer.job-title-performance-content";

interface IProps {
    departmentId?: number;
}

const DepartmentJobTitleTab = ({ departmentId }: IProps) => {
    const [data, setData] = useState<IDepartmentJobTitle[]>([]);
    const [loading, setLoading] = useState(false);

    const [openDrawer, setOpenDrawer] = useState(false);

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
                        nameEn: x.jobTitle?.nameEn || "",  // ← thêm fallback để lấy nameEn từ backend
                    },
                    active: true,
                }));

            const sorted = [...list].sort((a, b) => {
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
            width: 60,
            align: "center",
            render: (_, __, i) => i + 1,
        },
        {
            title: "Tên chức danh",
            dataIndex: ["jobTitle", "nameVi"],
        },
        {
            title: "Cấp bậc",
            align: "center",
            render: (_, r) => {
                const jt = r.jobTitle;
                const display =
                    jt?.positionCode ||
                    (jt?.band && jt?.level ? `${jt.band}${jt.level}` : "--");
                return <Badge color="blue" text={display} />;
            },
        },
        {
            title: "Quản lý",
            align: "center",
            width: 200,
            render: (_, record) => (
                <Space>
                    <Button
                        type="link"
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
                    <Button
                        type="link"
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
                </Space>
            ),
        },
        {
            title: "Hành động",
            align: "center",
            width: 120,
            render: (_, r) => (
                <Access permission={ALL_PERMISSIONS.DEPARTMENT_JOB_TITLES.DELETE} hideChildren>
                    <Space size="small">
                        {r.active && (
                            <Popconfirm
                                title="Hủy gán chức danh này khỏi phòng ban?"
                                okText="Hủy gán"
                                cancelText="Đóng"
                                onConfirm={() => handleDeactivate(r.id)}
                            >
                                <DeleteOutlined style={{ color: "red", cursor: "pointer" }} />
                            </Popconfirm>
                        )}
                    </Space>
                </Access>
            ),
        },
    ];

    return (
        <PageContainer
            title=""
            filter={
                <Access permission={ALL_PERMISSIONS.DEPARTMENT_JOB_TITLES.CREATE}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setOpenDrawer(true)}
                        disabled={!departmentId}
                    >
                        Gán chức danh
                    </Button>
                </Access>
            }
        >
            <DataTable<IDepartmentJobTitle>
                actionRef={tableRef}
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={data}
                pagination={false}
            />

            {openDrawer && departmentId && (
                <DrawerAssignJobTitle
                    open={openDrawer}
                    onClose={() => setOpenDrawer(false)}
                    departmentId={departmentId}
                    assignedJobIds={data.map((d) => d.jobTitle.id)}
                    onSuccess={fetchData}
                />
            )}

            {openSalary && selectedSalary && (
                <DrawerDepartmentSalaryGrade
                    open={openSalary}
                    onClose={() => setOpenSalary(false)}
                    departmentJobTitleId={selectedSalary.departmentJobTitleId}
                    jobTitleName={selectedSalary.jobTitleName}
                    onSuccess={fetchData}
                />
            )}

            {openPerformance && selectedPerformance && (
                <DrawerJobTitlePerformanceContent
                    open={openPerformance}
                    onClose={() => setOpenPerformance(false)}
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