import { useState } from "react";
import {
    Space,
    Tag,
    Badge,
    Segmented,
    Collapse,
    Skeleton,
    Card,
    Typography,
    Button,
    Modal,
    message,
} from "antd";
import {
    EditOutlined,
    EyeOutlined,
    DownOutlined,
    ReloadOutlined,
    DeleteOutlined,
    FilterOutlined,
} from "@ant-design/icons";
import type { ProColumns } from "@ant-design/pro-components";
import { useParams, useSearchParams } from "react-router-dom";

import PageContainer from "@/components/common/data-table/PageContainer";
import DataTable from "@/components/common/data-table";
import SearchFilter from "@/components/common/filter/SearchFilter";
import AdvancedFilterSelect from "@/components/common/filter/AdvancedFilterSelect";

import {
    useCareerPathsByDepartmentQuery,
    useCareerPathsGroupedByBandQuery,
} from "@/hooks/useCareerPaths";
import type { ICareerPath, IResCareerPathBandGroup } from "@/types/backend";

import ModalCareerPath from "./ModalCareerPath";
import ViewCareerPath from "./ViewCareerPath";

const { Text } = Typography;

type ViewMode = "department" | "band";

const CareerPathTab = () => {
    const { departmentId } = useParams();
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName") || "Không xác định";

    const [openModal, setOpenModal] = useState(false);
    const [openViewDetail, setOpenViewDetail] = useState(false);
    const [dataInit, setDataInit] = useState<ICareerPath | null>(null);

    const [searchValue, setSearchValue] = useState("");
    const [activeFilter, setActiveFilter] = useState<boolean | null>(true);
    const [viewMode, setViewMode] = useState<ViewMode>("department");

    // State để toggle hiển thị phần chế độ xem
    const [showViewMode, setShowViewMode] = useState(false);

    // Query theo chế độ
    const deptQuery = useCareerPathsByDepartmentQuery(
        viewMode === "department" ? Number(departmentId) : undefined
    );

    const bandQuery = useCareerPathsGroupedByBandQuery(
        viewMode === "band" ? Number(departmentId) : undefined
    );

    const isFetching = deptQuery.isFetching || bandQuery.isFetching;

    const sortCareerPaths = (paths: ICareerPath[]) => {
        return [...paths].sort((a, b) => {
            const orderA = a.bandOrder ?? a.levelNumber ?? 999;
            const orderB = b.bandOrder ?? b.levelNumber ?? 999;
            return orderA - orderB;
        });
    };

    const filterPaths = (paths: ICareerPath[]) =>
        paths.filter((item) => {
            const matchSearch =
                !searchValue ||
                item.jobTitleName?.toLowerCase().includes(searchValue.toLowerCase());

            const matchActive = activeFilter === null || item.active === activeFilter;

            return matchSearch && matchActive;
        });

    let filteredData: ICareerPath[] = [];
    let groupedData: IResCareerPathBandGroup[] = [];

    if (viewMode === "department") {
        filteredData = sortCareerPaths(filterPaths(deptQuery.data ?? []));
    } else if (viewMode === "band") {
        groupedData = (bandQuery.data ?? []).map((group) => ({
            ...group,
            positions: sortCareerPaths(filterPaths(group.positions ?? [])),
        }));
    }

    const handleReset = () => {
        setSearchValue("");
        setActiveFilter(true);
        deptQuery.refetch();
        bandQuery.refetch();
    };

    const handleDelete = (record: ICareerPath) => {
        Modal.confirm({
            title: "Xác nhận xóa",
            content: `Bạn có chắc chắn muốn xóa lộ trình "${record.jobTitleName}" không?`,
            okText: "Xóa",
            okType: "danger",
            cancelText: "Hủy",
            onOk: () => {
                // TODO: Gọi API xóa
                message.success("Xóa lộ trình thành công!");
                deptQuery.refetch();
                bandQuery.refetch();
            },
        });
    };

    const columns: ProColumns<ICareerPath>[] = [
        {
            title: "STT",
            width: 60,
            align: "center",
            render: (_: React.ReactNode, __: ICareerPath, index: number) => index + 1,
        },
        {
            title: "Chức danh",
            dataIndex: "jobTitleName",
            render: (dom: React.ReactNode, record: ICareerPath) => record.jobTitleName || "—",
        },
        {
            title: "Cấp bậc",
            dataIndex: "positionLevelCode",
            render: (dom: React.ReactNode, record: ICareerPath) => (
                <Tag color="blue" className="font-medium">
                    {record.positionLevelCode ?? "—"}
                </Tag>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "active",
            render: (_: React.ReactNode, record: ICareerPath) =>
                record.active ? (
                    <Badge status="success" text="Hoạt động" />
                ) : (
                    <Badge status="error" text="Vô hiệu hóa" />
                ),
        },
        {
            title: "Hành động",
            width: 180,
            align: "center",
            render: (_: React.ReactNode, row: ICareerPath) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => {
                            setDataInit(row);
                            setOpenViewDetail(true);
                        }}
                        style={{ color: "#1890ff" }}
                        className="hover:bg-blue-50"
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setDataInit(row);
                            setOpenModal(true);
                        }}
                        style={{ color: "#1890ff" }}
                        className="hover:bg-blue-50"
                    />
                    <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(row)}
                        danger
                        className="hover:bg-red-50"
                    />
                </Space>
            ),
        },
    ];

    const modeLabel = viewMode === "department" ? "phòng ban" : "cấp bậc (band)";

    const pageTitle = `Lộ trình thăng tiến theo ${modeLabel} - ${departmentName}`;

    const renderContent = () => {
        if (isFetching) {
            return <Skeleton active paragraph={{ rows: 8 }} />;
        }

        if (viewMode !== "band") {
            return (
                <Card className="shadow-md rounded-xl border-gray-200 bg-white">
                    <DataTable<ICareerPath>
                        rowKey="id"
                        loading={isFetching}
                        columns={columns}
                        dataSource={filteredData}
                        toolBarRender={false}
                        options={false}
                        search={false}
                        pagination={false}
                    />
                </Card>
            );
        }

        const grouped = groupedData;

        if (grouped.length === 0) {
            return (
                <Card className="text-center py-12 bg-gray-50 rounded-xl shadow-md border-gray-200">
                    <Text className="text-lg text-gray-600">
                        Không có dữ liệu lộ trình theo band
                    </Text>
                </Card>
            );
        }

        return (
            <Collapse
                accordion
                expandIconPosition="end"
                className="border-0 bg-transparent"
                expandIcon={({ isActive }) => (
                    <DownOutlined
                        className="text-blue-600 transition-transform"
                        style={{ fontSize: 18, transform: isActive ? "rotate(180deg)" : "rotate(0deg)" }}
                    />
                )}
            >
                {grouped.map((group: IResCareerPathBandGroup) => {
                    const filteredPositions = group.positions;
                    return (
                        <Collapse.Panel
                            key={group.band}
                            header={
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-4">
                                        <Tag
                                            color="blue"
                                            className="text-xl font-bold px-6 py-2 rounded-full shadow-sm"
                                        >
                                            {group.band} (Thứ tự: {group.bandOrder})
                                        </Tag>
                                        <Text className="text-gray-700 text-base font-medium">
                                            {filteredPositions.length} lộ trình thăng tiến
                                        </Text>
                                    </div>
                                </div>
                            }
                            className="mb-6 bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 border-gray-200"
                        >
                            <DataTable<ICareerPath>
                                rowKey="id"
                                loading={isFetching}
                                columns={columns}
                                dataSource={filteredPositions}
                                pagination={false}
                                toolBarRender={false}
                            />
                        </Collapse.Panel>
                    );
                })}
            </Collapse>
        );
    };

    return (
        <div>
            <PageContainer
                title={pageTitle}
                extra={
                    <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={handleReset}
                    >
                        Làm mới dữ liệu
                    </Button>
                }
            >
                <div className="flex flex-col gap-4 mb-6 bg-white p-6 rounded-xl shadow-md border border-gray-200">
                    <SearchFilter
                        searchPlaceholder="Tìm theo chức danh hoặc cấp bậc…"
                        addLabel="Thêm lộ trình mới"
                        showFilterButton={false}
                        onSearch={setSearchValue}
                        onReset={handleReset}
                        onAddClick={() => {
                            setDataInit(null);
                            setOpenModal(true);
                        }}
                    />

                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Nút toggle chế độ xem */}
                        <Button
                            icon={<FilterOutlined />}
                            onClick={() => setShowViewMode(!showViewMode)}
                            type={showViewMode ? "primary" : "default"}
                        >
                            {showViewMode ? "Ẩn tùy chọn xem" : "Tùy chọn xem"}
                        </Button>

                        {/* Bộ lọc trạng thái */}
                        <div className="min-w-[200px]">
                            <AdvancedFilterSelect
                                fields={[
                                    {
                                        key: "active",
                                        label: "Trạng thái",
                                        options: [
                                            { label: "Hoạt động", value: true },
                                            { label: "Vô hiệu hóa", value: false },
                                        ],
                                    },
                                ]}
                                onChange={(filters) => setActiveFilter(filters.active ?? null)}
                            />
                        </div>
                    </div>

                    {/* Phần chế độ xem - chỉ hiện khi toggle */}
                    {showViewMode && (
                        <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Chế độ xem lộ trình
                            </label>
                            <Segmented
                                options={[
                                    { label: "Theo Phòng ban", value: "department" },
                                    { label: "Theo Band (S1-S4...)", value: "band" },
                                ]}
                                value={viewMode}
                                onChange={(value) => setViewMode(value as ViewMode)}
                                block
                                size="middle"
                            />
                        </div>
                    )}
                </div>

                {renderContent()}

                <ModalCareerPath
                    openModal={openModal}
                    setOpenModal={setOpenModal}
                    dataInit={dataInit}
                    setDataInit={setDataInit}
                />

                <ViewCareerPath
                    open={openViewDetail}
                    onClose={() => setOpenViewDetail(false)}
                    dataInit={dataInit}
                    setDataInit={setDataInit}
                />
            </PageContainer>
        </div>
    );
};

export default CareerPathTab;