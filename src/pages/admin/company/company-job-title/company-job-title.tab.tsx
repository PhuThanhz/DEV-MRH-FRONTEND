// src/pages/admin/company/company-job-title/company.job-title.tab.tsx

import { useEffect, useRef, useState } from "react";
import { Button, Popconfirm, Badge, Space, Tooltip } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
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

/* ================= TYPES ================= */
interface ICompanyJobTitleRow {
    id: number;
    active: boolean;
    jobTitle: IJobTitle;
    source?: "SECTION" | "DEPARTMENT" | "COMPANY";
}

/* ================= COMPONENT ================= */
const CompanyJobTitleTab = ({ companyId }: { companyId?: number }) => {
    const [data, setData] = useState<ICompanyJobTitleRow[]>([]);
    const [loading, setLoading] = useState(false);

    const [openAssign, setOpenAssign] = useState(false);

    // ====== MANAGE (SALARY GRADE) ======
    const [openSalary, setOpenSalary] = useState(false);

    // ====== MANAGE (PERFORMANCE CONTENT) ======
    const [openPerformance, setOpenPerformance] = useState(false);

    const [selectedCompanyJobTitleId, setSelectedCompanyJobTitleId] =
        useState<number | null>(null);

    const [selectedJobTitleName, setSelectedJobTitleName] = useState<string>("");

    const tableRef = useRef<ActionType>(null);
    const queryClient = useQueryClient();

    /* ================= FETCH DATA ================= */
    const fetchData = async () => {
        if (!companyId || companyId <= 0) return;

        setLoading(true);
        try {
            const res = await callFetchCompanyJobTitlesByCompany(companyId);
            setData(res?.data ?? []);
        } catch {
            notify.error("Không thể tải danh sách chức danh công ty");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (companyId) fetchData();
    }, [companyId]);

    /* ================= DELETE ================= */
    const handleDelete = async (id: number) => {
        try {
            await callDeleteCompanyJobTitle(id);
            notify.deleted("Đã xoá chức danh khỏi công ty");
            fetchData();
        } catch {
            notify.error("Không thể xoá chức danh");
        }
    };

    /* ================= COLUMNS ================= */
    const columns: ProColumns<ICompanyJobTitleRow>[] = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_, __, idx) => idx + 1,
        },
        {
            title: "Tên chức danh",
            dataIndex: ["jobTitle", "nameVi"],
            ellipsis: true,
        },
        {
            title: "Nguồn gán",
            align: "center",
            width: 140,
            render: (_, record) => (
                <Badge
                    status={
                        record.source === "COMPANY"
                            ? "success"
                            : record.source === "DEPARTMENT"
                                ? "warning"
                                : "processing"
                    }
                    text={
                        record.source === "COMPANY"
                            ? "Công ty"
                            : record.source === "DEPARTMENT"
                                ? "Phòng ban"
                                : "Bộ phận"
                    }
                />
            ),
        },

        /* ================= QUẢN LÝ ================= */
        {
            title: "Quản lý",
            align: "center",
            width: 200,
            render: (_, record) => {
                if (record.source !== "COMPANY") {
                    return (
                        <Tooltip title="Chức danh kế thừa, quản lý tại cấp nguồn">
                            <span style={{ color: "#999" }}>—</span>
                        </Tooltip>
                    );
                }

                return (
                    <Space>
                        {/* BUTTON: BẬC LƯƠNG */}
                        <Button
                            type="link"
                            onClick={() => {
                                setSelectedCompanyJobTitleId(record.id);
                                setSelectedJobTitleName(record.jobTitle.nameVi);
                                setOpenSalary(true);
                            }}
                        >
                            Bậc lương
                        </Button>

                        {/* BUTTON: TIÊU CHÍ */}
                        <Button
                            type="link"
                            onClick={() => {
                                setSelectedCompanyJobTitleId(record.id);
                                setSelectedJobTitleName(record.jobTitle.nameVi);
                                setOpenPerformance(true);
                            }}
                        >
                            Tiêu chí
                        </Button>
                    </Space>
                );
            },
        },

        /* ================= HÀNH ĐỘNG ================= */
        {
            title: "Hành động",
            align: "center",
            width: 120,
            render: (_, record) => {
                if (record.source !== "COMPANY") {
                    return (
                        <Tooltip title="Không thể thao tác ở cấp công ty">
                            <span style={{ color: "#999" }}>—</span>
                        </Tooltip>
                    );
                }

                return (
                    <Popconfirm
                        title="Xoá chức danh khỏi công ty?"
                        okText="Xoá"
                        cancelText="Huỷ"
                        onConfirm={() => handleDelete(record.id)}
                    >
                        <DeleteOutlined style={{ color: "red", cursor: "pointer" }} />
                    </Popconfirm>
                );
            },
        },
    ];

    return (
        <PageContainer
            title="Chức danh công ty"
            filter={
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setOpenAssign(true)}
                    disabled={!companyId || loading}
                >
                    Gán chức danh
                </Button>
            }
        >
            <DataTable<ICompanyJobTitleRow>
                actionRef={tableRef}
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={data}
                pagination={false}
            />

            {/* Drawer gán chức danh */}
            {openAssign && companyId && (
                <DrawerAssignCompanyJobTitle
                    open={openAssign}
                    onClose={() => setOpenAssign(false)}
                    companyId={companyId}
                    onSuccess={() => {
                        fetchData();
                        setOpenAssign(false);
                    }}
                />
            )}

            {/* Drawer quản lý BẬC LƯƠNG */}
            {selectedCompanyJobTitleId && openSalary && (
                <DrawerSalaryGrade
                    open={openSalary}
                    onClose={() => {
                        setOpenSalary(false);
                        setSelectedCompanyJobTitleId(null);
                        queryClient.invalidateQueries({
                            queryKey: ["company-salary-grades", selectedCompanyJobTitleId],
                        });
                    }}
                    companyJobTitleId={selectedCompanyJobTitleId}
                    jobTitleName={selectedJobTitleName}
                    onSuccess={fetchData}
                />
            )}

            {/* Drawer quản lý TIÊU CHÍ ĐÁNH GIÁ */}
            {selectedCompanyJobTitleId && openPerformance && (
                <DrawerJobTitlePerformanceContent
                    open={openPerformance}
                    onClose={() => {
                        setOpenPerformance(false);
                        setSelectedCompanyJobTitleId(null);
                    }}
                    ownerLevel="COMPANY"
                    ownerJobTitleId={selectedCompanyJobTitleId}
                    ownerJobTitleName={selectedJobTitleName}
                    onSuccess={fetchData}
                />
            )}
        </PageContainer>
    );
};

export default CompanyJobTitleTab;
