import { useEffect, useState } from "react";
import { Table, Card, Spin, Empty } from "antd";

import { callFetchCompanyJobTitlesOfDepartment } from "@/config/api";
import type { IDepartmentJobTitle } from "@/types/backend";

interface JobTitleOrgChartTableProps {
    departmentId: number;
}

const JobTitleOrgChartTable = ({ departmentId }: JobTitleOrgChartTableProps) => {
    const [data, setData] = useState<IDepartmentJobTitle[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
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
                            positionCode: x.jobTitle?.positionCode || "",
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
            } catch (err) {
                console.error("Lỗi tải bản đồ chức danh:", err);
            } finally {
                setLoading(false);
            }
        };

        if (departmentId) fetchData();
    }, [departmentId]);

    const columns = [
        {
            title: "STT",
            width: 60,
            align: "center" as const,
            render: (_: any, __: any, index: number) => index + 1,
        },
        {
            title: "Bậc chức danh",                 // ⭐ Cột duy nhất giữ lại về cấp bậc
            dataIndex: ["jobTitle", "positionCode"],
            width: 140,
            align: "center" as const,
            render: (code: string) => code || "--",
        },
        {
            title: "Chức danh Tiếng Việt",
            dataIndex: ["jobTitle", "nameVi"],
            render: (nameVi: string) => nameVi || "--",
        },
        {
            title: "Chức danh Tiếng Anh",
            dataIndex: ["jobTitle", "nameEn"],
            render: (nameEn: string) => nameEn || "--",
        },
    ];

    return (
        <Card
            bordered={false}
            style={{ background: "#fafafa", minHeight: 400, borderRadius: 8 }}
        >
            {loading ? (
                <div style={{ textAlign: "center", padding: "100px 0" }}>
                    <Spin size="large" />
                </div>
            ) : data.length > 0 ? (
                <Table
                    columns={columns}
                    dataSource={data}
                    rowKey="id"
                    pagination={false}
                    bordered
                    size="middle"
                    style={{ background: "#fff" }}
                />
            ) : (
                <Empty
                    description="Chưa có chức danh nào được gán cho phòng ban này"
                    style={{ margin: "100px 0" }}
                />
            )}
        </Card>
    );
};

export default JobTitleOrgChartTable;
