import { useEffect, useMemo, useState } from "react";
import { Drawer, Table, Input, Checkbox, Space, Badge, Button, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";

import { useJobTitlesQuery } from "@/hooks/useJobTitles";
import { useCompanyJobTitlesOfDepartmentQuery } from "@/hooks/useDepartmentJobTitles";
import { useCreateSectionJobTitleMutation } from "@/hooks/useSectionJobTitle";
import { notify } from "@/components/common/notification/notify";
import { getModalWidth } from "@/utils/responsive";

interface IProps {
    open: boolean;
    onClose: () => void;
    sectionId: number;
    departmentId: number;
    assignedJobIds: number[]; // jobTitleId đã gán ở section
    onSuccess: () => void;
}

const DrawerAssignSectionJobTitle = ({
    open,
    onClose,
    sectionId,
    departmentId,
    assignedJobIds,
    onSuccess,
}: IProps) => {
    const [selected, setSelected] = useState<number[]>([]);
    const [search, setSearch] = useState("");

    const query = search ? `page=1&size=300&filter=nameVi~'${search}'` : `page=1&size=300`;
    const { data: jobTitleRes, isLoading: loadingJobTitles } = useJobTitlesQuery(query, open);
    const { data: deptCompanyJobTitles = [], isLoading: loadingDeptTitles } = useCompanyJobTitlesOfDepartmentQuery(open ? departmentId : undefined);
    const createMutation = useCreateSectionJobTitleMutation();

    const loading = loadingJobTitles || loadingDeptTitles;

    const blockedJobIds = useMemo(() => {
        return (deptCompanyJobTitles ?? [])
            .filter((x: any) => x.source === "COMPANY" || x.source === "DEPARTMENT")
            .map((x: any) => x.jobTitle.id);
    }, [deptCompanyJobTitles]);

    const data = useMemo(() => {
        const list = jobTitleRes?.result ?? [];
        return [...list].sort((a: any, b: any) => {
            const orderA = a.positionLevel?.bandOrder ?? 999;
            const orderB = b.positionLevel?.bandOrder ?? 999;
            if (orderA !== orderB) return orderA - orderB;
            return (a.positionLevel?.levelNumber ?? 0) - (b.positionLevel?.levelNumber ?? 0);
        });
    }, [jobTitleRes]);

    useEffect(() => {
        if (open) {
            setSelected([]);
        }
    }, [open]);

    const handleAssign = async () => {
        try {
            for (const id of selected) {
                await createMutation.mutateAsync({ sectionId, jobTitleId: id });
            }
            onSuccess();
            onClose();
        } catch {
            notify.error("Không thể gán chức danh");
        }
    };

    /*
     * =====================================================
     * TABLE COLUMNS
     * =====================================================
     */
    const getTooltip = (id: number): string => {
        if (assignedJobIds.includes(id)) return "Chức danh này đã được gán vào bộ phận";
        if (blockedJobIds.includes(id)) return "Chức danh đã được gán ở cấp trên (Công ty hoặc Phòng ban)";
        return "Có thể gán chức danh này";
    };

    const columns: ColumnsType<any> = [
        {
            title: "Chọn",
            dataIndex: "id",
            width: 70,
            align: "center",
            render: (id: number) => {
                const disabled =
                    assignedJobIds.includes(id) || blockedJobIds.includes(id);

                return (
                    <Tooltip title={getTooltip(id)}>
                        <Checkbox
                            checked={selected.includes(id)}
                            disabled={disabled}
                            onChange={(e) => {
                                if (e.target.checked)
                                    setSelected((prev) => [...prev, id]);
                                else
                                    setSelected((prev) =>
                                        prev.filter((x) => x !== id)
                                    );
                            }}
                        />
                    </Tooltip>
                );
            },
        },
        {
            title: "Tên chức danh",
            dataIndex: "nameVi",
            render: (text, record) => (
                <Space direction="vertical" size={0}>
                    <span>{text}</span>
                    {record.nameEn && (
                        <span style={{ fontSize: "12px", color: "#666" }}>{record.nameEn}</span>
                    )}
                </Space>
            ),
        },
        {
            title: "Cấp bậc",
            align: "center",
            width: 120,
            render: (_, record) => {
                const pl = record.positionLevel;
                const display =
                    pl?.code ||
                    (record.band && record.level
                        ? `${record.band}${record.level}`
                        : "—");

                return <Tag color="blue" style={{ fontWeight: 500 }}>{display}</Tag>;
            },
        },
        {
            title: "Trạng thái",
            align: "center",
            width: 180,
            render: (_, record) => {
                if (assignedJobIds.includes(record.id))
                    return <Badge status="success" text="Đã gán bộ phận" />;

                if (blockedJobIds.includes(record.id))
                    return (
                        <Badge
                            status="warning"
                            text="Đã gán cấp trên"
                        />
                    );

                return <Badge status="processing" text="Chưa gán" />;
            },
        },
    ];

    return (
        <Drawer
            title="Gán chức danh vào bộ phận"
            open={open}
            placement="right"
            width={getModalWidth(750)}
            onClose={onClose}
            destroyOnHidden
            footer={
                <div style={{ textAlign: "right" }}>
                    <Button onClick={onClose}>Huỷ</Button>
                    <Button
                        type="primary"
                        style={{ marginLeft: 12 }}
                        onClick={handleAssign}
                        disabled={selected.length === 0}
                    >
                        Gán ({selected.length})
                    </Button>
                </div>
            }
        >
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
                <Input.Search
                    placeholder="Tìm kiếm chức danh…"
                    allowClear
                    enterButton
                    onSearch={setSearch}
                    style={{ width: "100%" }}
                />

                <Table
                    loading={loading}
                    dataSource={data}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                    size="middle"
                />
            </Space>
        </Drawer>
    );
};

export default DrawerAssignSectionJobTitle;
