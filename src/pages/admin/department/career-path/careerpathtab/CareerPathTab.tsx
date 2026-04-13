import { useState } from "react";
import { Typography, Modal, message, Skeleton } from "antd";
import { FilterOutlined } from "@ant-design/icons";
import { useParams } from "react-router-dom";

import SearchFilter from "@/components/common/filter/SearchFilter";
import {
    useCareerPathsByDepartmentQuery,
    useCareerPathsGroupedByBandQuery,
} from "@/hooks/useCareerPaths";
import type { ICareerPath, IResCareerPathBandGroup } from "@/types/backend";
import ModalCareerPath from "../ModalCareerPath";
import ViewCareerPath from "../ViewCareerPath";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { T, compareLevelCode, parseBandNumber } from "./constants";
import CareerLadderFlat from "./components/CareerLadderFlat";
import CareerLadderBand from "./components/CareerLadderBand";
import SegmentedControl from "./components/SegmentedControl";

const { Text } = Typography;
type ViewMode = "department" | "band";

// ── Hook detect mobile ────────────────────────────────────────────
const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
    useState(() => {
        const handler = () => setIsMobile(window.innerWidth < 640);
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    });
    return isMobile;
};

const CareerPathTab = () => {
    const { departmentId } = useParams();
    const isMobile = useIsMobile();

    const [openModal, setOpenModal] = useState(false);
    const [openViewDetail, setOpenViewDetail] = useState(false);
    const [dataInit, setDataInit] = useState<ICareerPath | null>(null);
    const [searchValue, setSearchValue] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("department");
    const [showFilter, setShowFilter] = useState(false);

    const deptQuery = useCareerPathsByDepartmentQuery(
        viewMode === "department" ? Number(departmentId) : undefined
    );
    const bandQuery = useCareerPathsGroupedByBandQuery(
        viewMode === "band" ? Number(departmentId) : undefined
    );
    const isFetching = deptQuery.isFetching || bandQuery.isFetching;

    const sortPaths = (paths: ICareerPath[]) =>
        [...paths].sort((a, b) =>
            compareLevelCode(a.positionLevelCode, b.positionLevelCode)
        );

    const sortBands = (groups: IResCareerPathBandGroup[]): IResCareerPathBandGroup[] =>
        [...groups].sort((a, b) => {
            const pA = a.band?.replace(/\d+/g, "").toUpperCase() ?? "";
            const pB = b.band?.replace(/\d+/g, "").toUpperCase() ?? "";
            if (pA !== pB) return pA.localeCompare(pB);
            return parseBandNumber(a.band) - parseBandNumber(b.band);
        });

    const filterPaths = (paths: ICareerPath[]) =>
        paths.filter((p) =>
            !searchValue || p.jobTitleName?.toLowerCase().includes(searchValue.toLowerCase())
        );

    let filteredData: ICareerPath[] = [];
    let groupedData: IResCareerPathBandGroup[] = [];

    if (viewMode === "department") {
        filteredData = sortPaths(filterPaths(deptQuery.data ?? []));
    } else {
        groupedData = sortBands(
            (bandQuery.data ?? []).map((g) => ({
                ...g,
                positions: sortPaths(filterPaths(g.positions ?? [])),
            }))
        );
    }

    const handleReset = () => {
        setSearchValue("");
        deptQuery.refetch();
        bandQuery.refetch();
    };

    const handleDelete = (r: ICareerPath) => {
        Modal.confirm({
            title: "Xác nhận xóa",
            content: `Xóa lộ trình "${r.jobTitleName}"?`,
            okText: "Xóa", okType: "danger", cancelText: "Hủy",
            onOk: () => {
                message.success("Đã xóa thành công");
                deptQuery.refetch();
                bandQuery.refetch();
            },
        });
    };

    const handleView = (r: ICareerPath) => { setDataInit(r); setOpenViewDetail(true); };
    const handleEdit = (r: ICareerPath) => { setDataInit(r); setOpenModal(true); };

    const renderContent = () => {
        if (isFetching) return <Skeleton active paragraph={{ rows: 10 }} />;
        if (viewMode === "department") {
            return (
                <div style={{
                    background: T.white,
                    border: `1px solid ${T.line}`,
                    borderRadius: isMobile ? 10 : 14,
                    // Padding nhỏ hơn trên mobile
                    padding: isMobile ? "12px 10px 10px" : "20px 20px 16px",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
                }}>
                    <CareerLadderFlat
                        paths={filteredData}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </div>
            );
        }
        return (
            <CareerLadderBand
                groups={groupedData}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        );
    };

    return (
        <div>
            {/* Toolbar */}
            <div style={{ marginBottom: 12 }}>
                <SearchFilter
                    searchPlaceholder="Tìm chức danh, cấp bậc…"
                    addLabel="Thêm mới"
                    showFilterButton={false}
                    onSearch={setSearchValue}
                    onReset={handleReset}
                    onAddClick={() => { setDataInit(null); setOpenModal(true); }}
                    addPermission={ALL_PERMISSIONS.CAREER_PATHS.CREATE}
                />

                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 10,
                    // Trên mobile cho wrap nếu cần
                    flexWrap: "wrap",
                }}>
                    <button
                        onClick={() => setShowFilter(!showFilter)}
                        style={{
                            display: "flex", alignItems: "center", gap: 5,
                            // Trên mobile padding dọc lớn hơn cho dễ tap
                            padding: isMobile ? "7px 13px" : "5px 11px",
                            borderRadius: 7,
                            border: `1px solid ${showFilter ? T.lineMed : T.line}`,
                            background: showFilter ? T.s2 : "transparent",
                            color: showFilter ? T.ink2 : T.ink4,
                            fontSize: 12.5, fontWeight: showFilter ? 600 : 400,
                            cursor: "pointer",
                            transition: "all 0.14s",
                        }}
                    >
                        <FilterOutlined style={{ fontSize: 11 }} />
                        Chế độ xem
                    </button>
                </div>

                {showFilter && (
                    <div style={{
                        marginTop: 10,
                        padding: "10px 12px",
                        background: T.s1,
                        borderRadius: 9,
                        border: `1px solid ${T.line}`,
                    }}>
                        <Text style={{
                            display: "block",
                            fontSize: 10, fontWeight: 700,
                            color: T.ink5, letterSpacing: 0.9,
                            textTransform: "uppercase", marginBottom: 8,
                        }}>
                            Hiển thị theo
                        </Text>
                        {/* SegmentedControl tự co giãn theo container */}
                        <div style={{ overflowX: "auto" }}>
                            <SegmentedControl value={viewMode} onChange={setViewMode} />
                        </div>
                    </div>
                )}
            </div>

            {renderContent()}

            <ModalCareerPath
                openModal={openModal} setOpenModal={setOpenModal}
                dataInit={dataInit} setDataInit={setDataInit}
            />
            <ViewCareerPath
                open={openViewDetail} onClose={() => setOpenViewDetail(false)}
                dataInit={dataInit} setDataInit={setDataInit}
            />
        </div>
    );
};

export default CareerPathTab;