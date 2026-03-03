// src/pages/admin/department/access-control/ModalPermissionMatrix.tsx

import { useEffect, useMemo, useState } from "react";
import { Modal, List, Card, Spin, Empty, Table, Tag } from "antd";

import {
    usePermissionCategoriesByDepartment,
    usePermissionMatrixByCategory,
} from "@/hooks/usePermissionMatrixByCategory";

import type {
    IPermissionCategory,
    IPermissionCategoryMatrix,
} from "@/types/backend";

interface Props {
    open: boolean;
    onClose: () => void;
    departmentId: number;
    departmentName: string;
}

const ModalPermissionMatrix = ({
    open,
    onClose,
    departmentId,
    departmentName,
}: Props) => {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

    useEffect(() => {
        if (open) {
            setSelectedCategory(null);
        }
    }, [open, departmentId]);

    /* ===================== LOAD DATA ===================== */

    const { data: categories = [], isLoading: loadingCategories } =
        usePermissionCategoriesByDepartment(departmentId);

    const { data: matrix, isLoading: loadingMatrix } =
        usePermissionMatrixByCategory(selectedCategory);

    /* ===================== BUILD COLUMNS ===================== */

    const columns = useMemo(() => {
        if (!matrix?.columns?.length) return [];

        const cols: any[] = [
            {
                title: "Nội dung",
                dataIndex: "contentName",
                key: "contentName",
                fixed: "left" as const,
                width: 300,
            },
        ];

        matrix.columns.forEach((col) => {
            cols.push({
                title: col.jobTitleName,
                dataIndex: String(col.departmentJobTitleId),
                key: String(col.departmentJobTitleId),
                width: 140,
                align: "center" as const,
                render: (code: string | null) =>
                    code ? <Tag color="blue">{code}</Tag> : "-",
            });
        });

        return cols;
    }, [matrix]);

    /* ===================== BUILD DATA SOURCE ===================== */

    const dataSource = useMemo(() => {
        if (!matrix?.rows?.length) return [];

        return matrix.rows.map((row) => {
            const rowData: any = {
                key: row.contentId,
                contentName: row.contentName,
            };

            row.cells.forEach((cell) => {
                rowData[String(cell.departmentJobTitleId)] =
                    cell.processActionCode;
            });

            return rowData;
        });
    }, [matrix]);

    /* ===================== RENDER ===================== */

    return (
        <Modal
            open={open}
            onCancel={onClose}
            title={`Phân quyền — ${departmentName}`}
            width={1300}
            footer={null}
            destroyOnClose
        >
            <div className="grid grid-cols-3 gap-4">
                {/* LEFT PANEL */}
                <Card title="Danh mục phân quyền">
                    {loadingCategories && <Spin />}

                    {!loadingCategories && categories.length === 0 && (
                        <Empty description="Không có danh mục" />
                    )}

                    {!loadingCategories && categories.length > 0 && (
                        <List
                            dataSource={categories}
                            renderItem={(item: IPermissionCategory) => (
                                <List.Item
                                    onClick={() =>
                                        setSelectedCategory(item.id ?? null)
                                    }
                                    className="cursor-pointer hover:bg-gray-100 p-2 rounded"
                                    style={{
                                        background:
                                            selectedCategory === item.id
                                                ? "#e6f7ff"
                                                : undefined,
                                    }}
                                >
                                    {item.name}
                                </List.Item>
                            )}
                        />
                    )}
                </Card>

                {/* RIGHT PANEL */}
                <Card title="Ma trận phân quyền" className="col-span-2">
                    {loadingMatrix && selectedCategory && <Spin />}

                    {!selectedCategory && (
                        <Empty description="Chọn danh mục để xem ma trận" />
                    )}

                    {selectedCategory &&
                        !loadingMatrix &&
                        (!matrix || !matrix.rows?.length) && (
                            <Empty description="Không có dữ liệu ma trận" />
                        )}

                    {matrix && matrix.rows?.length > 0 && !loadingMatrix && (
                        <Table
                            columns={columns}
                            dataSource={dataSource}
                            scroll={{ x: "max-content", y: 600 }}
                            pagination={false}
                            bordered
                            size="middle"
                        />
                    )}
                </Card>
            </div>
        </Modal>
    );
};

export default ModalPermissionMatrix;