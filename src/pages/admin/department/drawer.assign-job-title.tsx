import { useEffect, useState } from "react";
import {
    Drawer,
    Table,
    Input,
    Checkbox,
    Space,
    Badge,
    Button,
    Spin,
    Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";

import {
    callFetchJobTitle,
    callCreateDepartmentJobTitle,
    callFetchCompanyJobTitlesOfDepartment,
} from "@/config/api";

import { notify } from "@/components/common/notification/notify";

interface IProps {
    open: boolean;
    onClose: () => void;
    departmentId: number;
    assignedJobIds: number[];
    onSuccess: () => void;
}

type BlockSource = "COMPANY" | "SECTION";

interface IBlockedJob {
    jobTitleId: number;
    source: BlockSource;
}

const DrawerAssignJobTitle = ({
    open,
    onClose,
    departmentId,
    assignedJobIds,
    onSuccess,
}: IProps) => {
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [search, setSearch] = useState("");
    const [blockedJobs, setBlockedJobs] = useState<IBlockedJob[]>([]);

    /* ================= LOAD JOB TITLES ĐÃ GÁN Ở CẤP KHÁC ================= */
    const loadBlockedJobTitles = async () => {
        try {
            const res = await callFetchCompanyJobTitlesOfDepartment(departmentId);
            const list = res?.data ?? [];

            const mapped: IBlockedJob[] = list
                .filter(
                    (x: any) =>
                        x.source === "COMPANY" || x.source === "SECTION"
                )
                .map((x: any) => ({
                    jobTitleId: x.jobTitle.id,
                    source: x.source,
                }));

            setBlockedJobs(mapped);
        } catch {
            setBlockedJobs([]);
        }
    };

    const getBlockedSource = (jobTitleId: number): BlockSource | undefined =>
        blockedJobs.find((x) => x.jobTitleId === jobTitleId)?.source;

    /* ================= FETCH MASTER JOB TITLES ================= */
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
            setData(res?.data?.result ?? []);
        } catch {
            notify.error("Không thể tải danh sách chức danh");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            setSelected([]);
            loadBlockedJobTitles();
            fetchData();
        }
    }, [open, search]);

    /* ================= ASSIGN ================= */
    const handleAssign = async () => {
        if (selected.length === 0) return;

        setAssigning(true);
        try {
            for (const id of selected) {
                await callCreateDepartmentJobTitle({
                    departmentId,
                    jobTitleId: id,
                });
            }
            notify.created(`Đã gán ${selected.length} chức danh thành công`);
            onSuccess();
            onClose();
        } catch (err: any) {
            notify.error(err?.response?.data?.message || "Không thể gán chức danh");
        } finally {
            setAssigning(false);
        }
    };

    /* ================= COLUMNS ================= */
    const columns: ColumnsType<any> = [
        {
            title: "Chọn",
            width: 60,
            render: (_, record) => {
                const id = record.id;
                const blockedSource = getBlockedSource(id);
                const disabled =
                    assignedJobIds.includes(id) || !!blockedSource;

                let tooltip = "";
                if (assignedJobIds.includes(id)) {
                    tooltip = "Đã gán trực tiếp ở phòng ban";
                } else if (blockedSource === "COMPANY") {
                    tooltip = "Đã gán ở cấp công ty";
                } else if (blockedSource === "SECTION") {
                    tooltip = "Đã gán ở bộ phận";
                }

                return (
                    <Tooltip title={tooltip}>
                        <Checkbox
                            disabled={disabled}
                            checked={selected.includes(id)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelected((prev) => [...prev, id]);
                                } else {
                                    setSelected((prev) =>
                                        prev.filter((x) => x !== id)
                                    );
                                }
                            }}
                        />
                    </Tooltip>
                );
            },
        },
        {
            title: "Tên chức danh",
            dataIndex: "nameVi",
        },

        /* ====== ⭐ CỘT CẤP BẬC (MỚI THÊM) ====== */
        {
            title: "Cấp bậc",
            align: "center",
            width: 120,
            render: (_, r) => {
                const pl = r.positionLevel;
                const display =
                    pl?.code ||
                    (pl?.band && pl?.level
                        ? `${pl.band}${pl.level}`
                        : "--");

                return <Badge color="blue" text={display} />;
            },
        },

        {
            title: "Trạng thái",
            align: "center",
            width: 140,
            render: (_, r) => {
                const blockedSource = getBlockedSource(r.id);

                if (assignedJobIds.includes(r.id)) {
                    return <Badge status="success" text="Đã gán phòng ban" />;
                }

                if (blockedSource === "COMPANY") {
                    return <Badge status="error" text="Đã gán công ty" />;
                }

                if (blockedSource === "SECTION") {
                    return <Badge status="warning" text="Đã gán bộ phận" />;
                }

                return <Badge status="processing" text="Chưa gán" />;
            },
        },
    ];

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Gán chức danh vào phòng ban"
            width={800}
            footer={
                <div style={{ textAlign: "right" }}>
                    <Button onClick={onClose} disabled={assigning}>
                        Hủy
                    </Button>
                    <Button
                        type="primary"
                        disabled={selected.length === 0}
                        loading={assigning}
                        onClick={handleAssign}
                        style={{ marginLeft: 12 }}
                    >
                        Gán ({selected.length})
                    </Button>
                </div>
            }
        >
            <Space direction="vertical" style={{ width: "100%" }}>
                <Input.Search
                    placeholder="Tìm theo tên chức danh"
                    allowClear
                    onSearch={setSearch}
                />

                <Spin spinning={loading}>
                    <Table
                        rowKey="id"
                        dataSource={data}
                        columns={columns}
                        pagination={{ pageSize: 10 }}
                    />
                </Spin>
            </Space>
        </Drawer>
    );
};

export default DrawerAssignJobTitle;
