import { useEffect, useState } from "react";
import { Drawer, Table, Input, Checkbox, Space, Badge, Button } from "antd";
import type { ColumnsType } from "antd/es/table";

import {
    callFetchJobTitle,
    callCreateSectionJobTitle,
    callFetchCompanyJobTitlesOfDepartment,
} from "@/config/api";

import { notify } from "@/components/common/notification/notify";

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
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [search, setSearch] = useState("");

    // jobTitleId bị block do COMPANY hoặc DEPARTMENT
    const [blockedJobIds, setBlockedJobIds] = useState<number[]>([]);

    /*
     * =====================================================
     * LOAD COMPANY_JOB_TITLE EFFECTIVE AT DEPARTMENT
     * =====================================================
     */
    const loadDepartmentCompanyJobTitles = async () => {
        const res = await callFetchCompanyJobTitlesOfDepartment(departmentId);
        const list = res?.data ?? [];

        const blocked = list
            .filter(
                (x: any) =>
                    x.source === "COMPANY" || x.source === "DEPARTMENT"
            )
            .map((x: any) => x.jobTitle.id);

        setBlockedJobIds(blocked);
    };

    /*
     * =====================================================
     * FETCH ALL JOB TITLES (MASTER)
     * =====================================================
     */
    const fetchData = async () => {
        setLoading(true);
        try {
            const filters: string[] = [];
            if (search) filters.push(`nameVi~'${search}'`);

            const query =
                filters.length > 0
                    ? `page=1&size=300&filter=${filters.join(" and ")}`
                    : `page=1&size=300`;

            const res = await callFetchJobTitle(query);
            const list = res?.data?.result ?? [];

            const sorted = [...list].sort((a: any, b: any) => {
                const orderA = a.positionLevel?.bandOrder ?? 999;
                const orderB = b.positionLevel?.bandOrder ?? 999;

                if (orderA !== orderB) return orderA - orderB;

                const levelA = a.positionLevel?.levelNumber ?? 0;
                const levelB = b.positionLevel?.levelNumber ?? 0;

                return levelA - levelB;
            });

            setData(sorted);
        } catch {
            notify.error("Không thể tải danh sách chức danh");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            setSelected([]);
            loadDepartmentCompanyJobTitles();
            fetchData();
        }
    }, [open, search]);

    /*
     * =====================================================
     * ASSIGN
     * =====================================================
     */
    const handleAssign = async () => {
        try {
            for (const id of selected) {
                await callCreateSectionJobTitle({ sectionId, jobTitleId: id });
            }
            notify.created("Gán chức danh thành công");
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
    const columns: ColumnsType<any> = [
        {
            title: "",
            dataIndex: "id",
            width: 50,
            render: (id: number) => {
                const disabled =
                    assignedJobIds.includes(id) || blockedJobIds.includes(id);

                return (
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
                );
            },
        },
        {
            title: "Tên chức danh",
            dataIndex: "nameVi",
        },
        {
            title: "Cấp bậc",
            align: "center",
            render: (_, record) => {
                const pl = record.positionLevel;
                const display =
                    pl?.code ||
                    (record.band && record.level
                        ? `${record.band}${record.level}`
                        : "--");

                return <Badge color="blue" text={display} />;
            },
        },
        {
            title: "Trạng thái",
            align: "center",
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
            width="45vw"
            onClose={onClose}
            destroyOnClose
        >
            <Space direction="vertical" style={{ width: "100%" }}>
                <Input.Search
                    placeholder="Tìm kiếm chức danh…"
                    allowClear
                    enterButton
                    onSearch={setSearch}
                />

                <Table
                    loading={loading}
                    dataSource={data}
                    columns={columns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    size="small"
                />

                <div style={{ textAlign: "right" }}>
                    <Button onClick={onClose}>Huỷ</Button>
                    <Button
                        type="primary"
                        style={{ marginLeft: 8 }}
                        onClick={handleAssign}
                        disabled={selected.length === 0}
                    >
                        Gán ({selected.length})
                    </Button>
                </div>
            </Space>
        </Drawer>
    );
};

export default DrawerAssignSectionJobTitle;
