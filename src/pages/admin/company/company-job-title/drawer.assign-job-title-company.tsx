// src/pages/admin/company/company-job-title/drawer.assign-job-title-company.tsx

import { useEffect, useState } from "react";
import {
    Drawer,
    Table,
    Checkbox,
    Space,
    Badge,
    Button,
    Input,
    Spin,
    Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";

import {
    callFetchJobTitle,
    callFetchCompanyJobTitlesByCompany,
    callCreateCompanyJobTitle,
} from "@/config/api";
import { notify } from "@/components/common/notification/notify";

import DrawerSalaryGrade from "./company-salary-grade/drawer.company-salary-grade";

interface JobTitle {
    id: number;
    nameVi: string;
    positionLevel?: {
        code?: string;
        bandOrder?: number;
        levelNumber?: number;
    };
}

interface IProps {
    open: boolean;
    onClose: () => void;
    companyId: number;
    onSuccess?: () => void;
}

const DrawerAssignCompanyJobTitle = ({
    open,
    onClose,
    companyId,
    onSuccess,
}: IProps) => {
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState(false);
    const [allJobTitles, setAllJobTitles] = useState<JobTitle[]>([]);
    const [assignedIds, setAssignedIds] = useState<number[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [search, setSearch] = useState("");

    // State cho drawer bậc lương
    const [openSalaryDrawer, setOpenSalaryDrawer] = useState(false);
    const [lastCompanyJobTitleId, setLastCompanyJobTitleId] = useState<number | null>(null);

    const fetchAllJobTitles = async () => {
        try {
            const filters: string[] = [];
            if (search) filters.push(`nameVi~'${search}'`);

            const query =
                filters.length > 0
                    ? `page=1&size=300&filter=${filters.join(" and ")}`
                    : `page=1&size=300`;

            const res = await callFetchJobTitle(query);
            const list = res?.data?.result ?? [];

            const sorted = [...list].sort((a: JobTitle, b: JobTitle) => {
                const orderA = a.positionLevel?.bandOrder ?? 999;
                const orderB = b.positionLevel?.bandOrder ?? 999;
                if (orderA !== orderB) return orderA - orderB;

                return (
                    (a.positionLevel?.levelNumber ?? 0) -
                    (b.positionLevel?.levelNumber ?? 0)
                );
            });

            setAllJobTitles(sorted);
        } catch {
            notify.error("Không thể tải danh sách chức danh");
        }
    };

    const fetchAssigned = async () => {
        try {
            const res = await callFetchCompanyJobTitlesByCompany(companyId);
            const ids = (res?.data ?? []).map((item: any) => item.jobTitle.id);
            setAssignedIds(ids);
        } catch {
            setAssignedIds([]);
        }
    };

    useEffect(() => {
        if (open && companyId) {
            setSelected([]);
            setSearch("");
            setLoading(true);
            Promise.all([fetchAllJobTitles(), fetchAssigned()]).finally(() =>
                setLoading(false)
            );
        }
    }, [open, companyId, search]);

    const unassigned = allJobTitles.filter(
        (jt) => !assignedIds.includes(jt.id)
    );

    const handleSelectAll = (checked: boolean) => {
        setSelected(checked ? unassigned.map((jt) => jt.id) : []);
    };

    const handleAssign = async () => {
        if (selected.length === 0) return;

        setAssigning(true);
        try {
            let lastId: number | null = null;
            for (const jobTitleId of selected) {
                const res = await callCreateCompanyJobTitle({ companyId, jobTitleId });
                lastId = res?.data?.id || jobTitleId; // nếu backend trả id mapping mới thì dùng, không thì dùng jobTitleId
            }
            notify.success(`Đã gán ${selected.length} chức danh thành công`);

            onSuccess?.();

            // Mở drawer bậc lương cho chức danh cuối
            if (lastId) {
                setLastCompanyJobTitleId(lastId);
                setOpenSalaryDrawer(true);
            }

            onClose();
        } catch (err: any) {
            notify.error(err?.response?.data?.message || "Lỗi khi gán chức danh");
        } finally {
            setAssigning(false);
        }
    };

    const columns: ColumnsType<JobTitle> = [
        {
            title: (
                <Checkbox
                    indeterminate={selected.length > 0 && selected.length < unassigned.length}
                    checked={selected.length === unassigned.length && unassigned.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                />
            ),
            width: 50,
            align: "center",
            render: (_, record) => {
                const disabled = assignedIds.includes(record.id);
                return (
                    <Tooltip title={disabled ? "Chức danh đã được sử dụng trong công ty" : ""}>
                        <Checkbox
                            checked={selected.includes(record.id)}
                            disabled={disabled}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelected((prev) => [...prev, record.id]);
                                } else {
                                    setSelected((prev) => prev.filter((x) => x !== record.id));
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
        {
            title: "Cấp bậc",
            align: "center",
            width: 120,
            render: (_, record) => {
                const code = record.positionLevel?.code;
                return <Badge color="blue" text={code ?? "--"} />;
            },
        },
        {
            title: "Trạng thái",
            align: "center",
            width: 160,
            render: (_, record) =>
                assignedIds.includes(record.id) ? (
                    <Badge status="success" text="Đã được sử dụng" />
                ) : (
                    <Badge status="processing" text="Chưa gán" />
                ),
        },
    ];

    return (
        <>
            <Drawer
                title="Gán chức danh vào công ty"
                open={open}
                onClose={onClose}
                width={750}
                destroyOnClose
                footer={
                    <div style={{ textAlign: "right" }}>
                        <Button onClick={onClose} disabled={assigning}>
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            disabled={selected.length === 0 || assigning}
                            loading={assigning}
                            onClick={handleAssign}
                            style={{ marginLeft: 12 }}
                        >
                            Gán ({selected.length})
                        </Button>
                    </div>
                }
            >
                <Space direction="vertical" style={{ width: "100%" }} size="middle">
                    <Input.Search
                        placeholder="Tìm theo tên chức danh..."
                        allowClear
                        enterButton="Tìm"
                        onSearch={setSearch}
                        style={{ maxWidth: 400 }}
                    />

                    <Spin spinning={loading}>
                        <Table
                            dataSource={unassigned}
                            columns={columns}
                            rowKey="id"
                            pagination={{ pageSize: 10, showSizeChanger: false }}
                            locale={{ emptyText: "Không có chức danh nào chưa gán" }}
                            size="middle"
                        />
                    </Spin>
                </Space>
            </Drawer>

            {/* Drawer bậc lương cho chức danh vừa gán */}
            {lastCompanyJobTitleId && (
                <DrawerSalaryGrade
                    open={openSalaryDrawer}
                    onClose={() => setOpenSalaryDrawer(false)}
                    companyJobTitleId={lastCompanyJobTitleId}
                    jobTitleName={allJobTitles.find((jt) => jt.id === lastCompanyJobTitleId)?.nameVi || "Chưa có tên"}
                />
            )}
        </>
    );
};

export default DrawerAssignCompanyJobTitle;