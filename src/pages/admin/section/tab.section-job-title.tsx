// src/pages/admin/section/section-job-title/section.job-title.tab.tsx

import { useEffect, useRef, useState } from "react";
import { Button, Popconfirm, Badge, Space } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
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

// ⭐ Drawer tiêu chí đánh giá
import DrawerJobTitlePerformanceContent from "@/pages/admin/job-title-performance-content/drawer.job-title-performance-content";

import type { ISectionJobTitle } from "@/types/backend";

interface IProps {
    sectionId?: number;
    departmentId?: number;
}

const SectionJobTitleTab = ({ sectionId, departmentId }: IProps) => {
    const [data, setData] = useState<ISectionJobTitle[]>([]);
    const [loading, setLoading] = useState(false);

    const [openDrawer, setOpenDrawer] = useState(false);

    // ====== SALARY GRADE ======
    const [openSalary, setOpenSalary] = useState(false);

    // ====== PERFORMANCE CONTENT ======
    const [openPerformance, setOpenPerformance] = useState(false);

    const [selected, setSelected] = useState<{
        sectionJobTitleId: number;
        jobTitleName: string;
    } | null>(null);

    const tableRef = useRef<ActionType>(null);

    /* ========================= FETCH ========================= */
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

    /* ========================= DELETE ========================= */
    const handleDelete = async (id: number) => {
        try {
            await callDeleteSectionJobTitle(id);
            notify.deleted("Đã xoá chức danh khỏi bộ phận");
            fetchData();
        } catch {
            notify.error("Không thể xoá chức danh");
        }
    };

    /* ========================= COLUMNS ========================= */
    const columns: ProColumns<ISectionJobTitle>[] = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, idx) => idx + 1,
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
            width: 200,
            align: "center",
            render: (_, r) => (
                <Space>
                    {/* BẬC LƯƠNG */}
                    <Button
                        type="link"
                        onClick={() => {
                            setSelected({
                                sectionJobTitleId: r.id,
                                jobTitleName: r.jobTitle?.nameVi ?? "Chưa có tên",
                            });
                            setOpenSalary(true);
                        }}
                    >
                        Bậc lương
                    </Button>

                    {/* TIÊU CHÍ ĐÁNH GIÁ */}
                    <Button
                        type="link"
                        onClick={() => {
                            setSelected({
                                sectionJobTitleId: r.id,
                                jobTitleName: r.jobTitle?.nameVi ?? "Chưa có tên",
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
                <Popconfirm
                    title="Xoá chức danh này khỏi bộ phận?"
                    okText="Xoá"
                    cancelText="Huỷ"
                    onConfirm={() => handleDelete(r.id)}
                >
                    <DeleteOutlined style={{ color: "red", cursor: "pointer" }} />
                </Popconfirm>
            ),
        },
    ];

    return (
        <PageContainer
            title=""
            filter={
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setOpenDrawer(true)}
                    disabled={!sectionId}
                >
                    Gán chức danh
                </Button>
            }
        >
            <DataTable<ISectionJobTitle>
                actionRef={tableRef}
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={data}
                pagination={false}
            />

            {/* Drawer gán chức danh */}
            {openDrawer && sectionId && departmentId && (
                <DrawerAssignSectionJobTitle
                    open={openDrawer}
                    onClose={() => setOpenDrawer(false)}
                    sectionId={sectionId}
                    departmentId={departmentId}
                    assignedJobIds={data.map((d) => d.jobTitle.id)}
                    onSuccess={fetchData}
                />
            )}

            {/* Drawer quản lý BẬC LƯƠNG */}
            {openSalary && selected && (
                <DrawerSectionSalaryGrade
                    open={openSalary}
                    onClose={() => setOpenSalary(false)}
                    sectionJobTitleId={selected.sectionJobTitleId}
                    jobTitleName={selected.jobTitleName}
                    onSuccess={fetchData}
                />
            )}

            {/* Drawer quản lý TIÊU CHÍ ĐÁNH GIÁ */}
            {openPerformance && selected && (
                <DrawerJobTitlePerformanceContent
                    open={openPerformance}
                    onClose={() => setOpenPerformance(false)}
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
