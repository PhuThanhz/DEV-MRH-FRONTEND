import React, { useEffect, useMemo, useState } from "react";
import { Card, Col, Row, Typography, Space, Button, Select, Tooltip, Empty, Table, Tag, Input, Dropdown } from "antd";
import {
    useAccountingDossierStorageSummaryQuery,
    useAccountingDossierPendingByRoleQuery,
    useAccountingDossierReportByStatusQuery,
    useAccountingDossierReportByDepartmentQuery,
    useRefreshExpiredAccountingDossierStorageMutation,
    useAccountingDossiersQuery,
    useAccountingDossierCategoryActiveQuery,
    useAccountingDossierDashboardMetricsQuery
} from "@/hooks/useAccountingDossiers";
import { useCompaniesQuery } from "@/hooks/useCompanies";
import { useDepartmentsByCompanyQuery } from "@/hooks/useDepartments";
import { useSectionsByDepartmentQuery } from "@/hooks/useSections";
import { callFetchAccountingDossiers } from "@/config/api";
import { Pie, Column, Bar } from "@/components/common/chart/LazyChart";
import { 
    FileProtectOutlined, 
    ClockCircleOutlined, 
    SyncOutlined, 
    CloudServerOutlined,
    InfoCircleOutlined,
    BankOutlined,
    SearchOutlined,
    FolderOpenOutlined,
    FilterOutlined,
    FileExcelOutlined,
    DownOutlined,
    EyeOutlined
} from "@ant-design/icons";
import useAccess from "@/hooks/useAccess";
import { notify } from "@/components/common/notification/notify";
import { ALL_PERMISSIONS } from "@/config/permissions";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const mapRoleName = (role: string) => {
    const mapping: Record<string, string> = {
        "DEPARTMENT_MANAGER": "Trưởng Bộ Phận",
        "ACCOUNTANT": "Nhân viên Kế toán",
        "DIRECTOR": "Ban Giám đốc",
        "CHIEF_ACCOUNTANT": "Kế toán Trưởng",
    };
    return mapping[role.toUpperCase()] || role;
};

const mapStatusName = (status: string) => {
    const mapping: Record<string, string> = {
        "DRAFT": "Nháp",
        "ACTIVE": "Đang hoạt động",
        "SUBMITTED": "Đã gửi duyệt",
        "IN_REVIEW": "Đang xét duyệt",
        "APPROVED": "Đã phê duyệt",
        "REJECTED": "Bị từ chối",
        "TERMINATED": "Đã chấm dứt",
        "ARCHIVED": "Đã lưu kho",
        "RETURN_REQUESTED": "Yêu cầu hoàn trả",
    };
    return mapping[status.toUpperCase()] || status;
};

const PIE_COLOR_SCALE = {
    color: {
        domain: ['Nháp', 'Đã gửi duyệt', 'Đang xét duyệt', 'Đã phê duyệt', 'Bị từ chối', 'Đã chấm dứt', 'Đã lưu kho', 'Yêu cầu hoàn trả'],
        range: ['#94a3b8', '#06b6d4', '#3b82f6', '#f59e0b', '#ff4d4f', '#7c2d12', '#10b981', '#e11d48']
    }
};

// Giá trị đi qua tooltip + chú giải thay vì vẽ trực tiếp lên lát nhỏ,
// tránh va chạm label và giảm layout work của biểu đồ.
const PIE_LABEL_CONFIG = false;

const PIE_LEGEND_CONFIG = {
    color: {
        title: false,
        position: 'bottom' as const,
        rowPadding: 5,
    }
};

const CHART_TOOLTIP_CONFIG = {
    title: false,
    formatter: (datum: { type?: string; role?: string; department?: string; value?: number; count?: number }) => ({
        name: datum.type || datum.role || datum.department || "Số lượng",
        value: `${datum.value ?? datum.count ?? 0} hồ sơ`,
    }),
};

const BAR_LABEL_CONFIG = false;

const BAR_STYLE_CONFIG = {
    maxWidth: 32,
    fill: "#3b82f6", // Slate-blue uniform color
    radiusTopRight: 6,
    radiusBottomRight: 6
};

const COLUMN_STYLE_CONFIG = {
    radiusTopLeft: 6,
    radiusTopRight: 6,
    maxWidth: 40,
    fill: "#6366f1", // Uniform Indigo color
};

const COLUMN_LABEL_CONFIG = false;

const excelBorder = {
    top: { style: "thin", color: { rgb: "E2E8F0" } },
    bottom: { style: "thin", color: { rgb: "E2E8F0" } },
    left: { style: "thin", color: { rgb: "E2E8F0" } },
    right: { style: "thin", color: { rgb: "E2E8F0" } },
};

let XLSXStyle: any;
const ensureXlsxStyle = async () => {
    if (!XLSXStyle) {
        const mod = await import("xlsx-js-style") as any;
        XLSXStyle = mod.default ?? mod;
    }
    return XLSXStyle;
};

const StorageDashboard = () => {
    const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined);
    const [chartsReady, setChartsReady] = useState(false);
    const navigate = useNavigate();
    
    // Advanced search and filters states
    const [searchText, setSearchText] = useState("");
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | undefined>(undefined);
    const [selectedSectionId, setSelectedSectionId] = useState<number | undefined>(undefined);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
    const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
    const [selectedStorageStatus, setSelectedStorageStatus] = useState<string | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [exportLoading, setExportLoading] = useState(false);

    // Fetch lists
    const { data: companyData } = useCompaniesQuery("page=1&size=100&sort=name,asc&filter=status:1");
    const companies = companyData?.result || [];

    const { data: departments = [] } = useDepartmentsByCompanyQuery(selectedCompanyId as number);
    const { data: sections = [] } = useSectionsByDepartmentQuery(selectedDepartmentId as number);

    const canRefreshExpiredStorage = useAccess(ALL_PERMISSIONS.ACCOUNTING_DOSSIERS.REFRESH_EXPIRED_STORAGE);
    const { data: metrics, isLoading: isLoadingMetrics, refetch: refetchMetrics } = useAccountingDossierDashboardMetricsQuery(selectedCompanyId);
    const summary = metrics?.summary;
    const pendingByRole = metrics?.pendingByRole || [];
    const byStatus = metrics?.byStatus || [];
    const byDept = metrics?.byDepartment || [];
    const categories = metrics?.categories || [];

    const isLoadingSummary = isLoadingMetrics;
    const isLoadingPending = isLoadingMetrics;
    const isLoadingStatus = isLoadingMetrics;
    const isLoadingDept = isLoadingMetrics;

    const refreshMutation = useRefreshExpiredAccountingDossierStorageMutation();

    useEffect(() => {
        const renderCharts = () => setChartsReady(true);
        const idleCallback = window.requestIdleCallback?.(renderCharts, { timeout: 1400 });
        const timeoutId = idleCallback === undefined
            ? window.setTimeout(renderCharts, 650)
            : undefined;

        return () => {
            if (idleCallback !== undefined) {
                window.cancelIdleCallback?.(idleCallback);
            }
            if (timeoutId !== undefined) {
                window.clearTimeout(timeoutId);
            }
        };
    }, []);

    const handleRefresh = async () => {
        await refreshMutation.mutateAsync();
        refetchMetrics();
    };

    const statusData = useMemo(() => (byStatus || [])
        .map(item => ({
            type: mapStatusName(item.label || item.key),
            value: item.count,
        }))
        .filter(item => item.value > 0), [byStatus]);

    const pendingByRoleData = useMemo(() => (pendingByRole || [])
        .map(item => ({
            role: mapRoleName(item.label || item.key),
            count: item.count,
        }))
        .filter(item => item.count > 0), [pendingByRole]);

    const deptData = useMemo(() => (byDept || [])
        .map(item => ({
            department: item.label || item.key,
            count: item.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10), [byDept]);

    const dossiersQuery = useMemo(() => {
        const filters: string[] = [];
        
        if (searchText.trim()) {
            const keyword = searchText.trim().replace(/'/g, "\\'");
            filters.push(`(dossierCode~'${keyword}' or content~'${keyword}' or customCategoryName~'${keyword}')`);
        }
        if (selectedCompanyId) {
            filters.push(`company.id:${selectedCompanyId}`);
        }
        if (selectedDepartmentId) {
            filters.push(`departmentId:${selectedDepartmentId}`);
        }
        if (selectedSectionId) {
            filters.push(`sectionId:${selectedSectionId}`);
        }
        if (selectedCategoryId) {
            filters.push(`dossierCategory.id:${selectedCategoryId}`);
        }
        if (selectedStatus) {
            filters.push(`status:'${selectedStatus}'`);
        }
        
        const filterQuery = filters.length > 0 ? `&filter=${filters.join(" and ")}` : "";
        let queryStr = `page=${page}&size=${pageSize}&sort=createdAt,desc&sort=id,desc${filterQuery}`;
        if (selectedStorageStatus) {
            queryStr += `&storageStatus=${selectedStorageStatus}`;
        }
        return queryStr;
    }, [searchText, selectedCompanyId, selectedDepartmentId, selectedSectionId, selectedCategoryId, selectedStatus, selectedStorageStatus, page, pageSize]);

    const { data: dossiersData, isFetching: isFetchingDossiers } = useAccountingDossiersQuery(dossiersQuery);
    const dossiersList = dossiersData?.result || [];
    const totalDossiers = dossiersData?.meta?.total || 0;

    const handleExportExcel = async (type: "ALL" | "BY_DEPT") => {
        setExportLoading(true);
        try {
            const filters: string[] = [];
            if (searchText.trim()) {
                const keyword = searchText.trim().replace(/'/g, "\\'");
                filters.push(`(dossierCode~'${keyword}' or content~'${keyword}' or customCategoryName~'${keyword}')`);
            }
            if (selectedCompanyId) {
                filters.push(`company.id:${selectedCompanyId}`);
            }
            if (selectedDepartmentId) {
                filters.push(`departmentId:${selectedDepartmentId}`);
            }
            if (selectedSectionId) {
                filters.push(`sectionId:${selectedSectionId}`);
            }
            if (selectedCategoryId) {
                filters.push(`dossierCategory.id:${selectedCategoryId}`);
            }
            if (selectedStatus) {
                filters.push(`status:'${selectedStatus}'`);
            }
            
            const filterQuery = filters.length > 0 ? `&filter=${filters.join(" and ")}` : "";
            const storageQuery = selectedStorageStatus
                ? `&storageStatus=${selectedStorageStatus}`
                : "";
            const items: any[] = [];
            const exportPageSize = 100;
            let exportPage = 1;
            let totalPages = 1;

            do {
                const queryStr = `page=${exportPage}&size=${exportPageSize}&sort=createdAt,desc&sort=id,desc${filterQuery}${storageQuery}`;
                const res = await callFetchAccountingDossiers(queryStr);
                items.push(...(res?.data?.result || []));
                totalPages = Math.max(1, Number(res?.data?.meta?.pages || 1));
                exportPage += 1;
            } while (exportPage <= totalPages);
            
            if (items.length === 0) {
                notify.warning("Không có dữ liệu phù hợp để xuất Excel");
                return;
            }

            const XLSXStyle = await ensureXlsxStyle();
            const wb = XLSXStyle.utils.book_new();

            const columns = [
                { title: "STT", key: "index", width: 8 },
                { title: "Mã bộ chứng từ", key: "dossierCode", width: 22 },
                { title: "Nội dung bộ chứng từ", key: "content", width: 45 },
                { title: "Danh mục", key: "category", width: 25 },
                { title: "Công ty", key: "company", width: 30 },
                { title: "Phòng ban", key: "department", width: 25 },
                { title: "Bộ phận", key: "section", width: 20 },
                { title: "Trạng thái phê duyệt", key: "status", width: 22 },
                { title: "Tình trạng lưu trữ", key: "storageStatus", width: 20 },
                { title: "Ngày tạo", key: "createdAt", width: 22 }
            ];

            const getExportValue = (record: any, index: number, key: string) => {
                switch (key) {
                    case "index":
                        return index + 1;
                    case "dossierCode":
                        return record.dossierCode || "Chưa cấp mã";
                    case "content":
                        return record.content || "";
                    case "category":
                        return record.categoryMode === "UNSTRUCTURED"
                            ? record.customCategoryName || "Phi cấu trúc"
                            : record.dossierCategory?.name || "Theo mẫu";
                    case "company":
                        return record.company?.name || "";
                    case "department":
                        return record.department?.name || "";
                    case "section":
                        return record.section?.name || "";
                    case "status":
                        return mapStatusName(record.status);
                    case "storageStatus":
                        return record.storageStatus === "EXPIRED"
                            ? "Hết hạn"
                            : record.storageStatus === "ARCHIVED" || record.status === "ARCHIVED"
                                ? "Lưu kho"
                                : "Trong hạn";
                    case "createdAt":
                        return record.createdAt ? dayjs(record.createdAt).format("DD/MM/YYYY HH:mm") : "";
                    default:
                        return "";
                }
            };

            const buildExportRows = (recordsList: any[]) => {
                return recordsList.map((record, index) =>
                    columns.map(col => getExportValue(record, index, col.key))
                );
            };

            const styleWorksheet = (ws: any, rowCount: number) => {
                const range = XLSXStyle.utils.decode_range(ws["!ref"] || "A1:A1");
                ws["!cols"] = columns.map(c => ({ wch: c.width }));
                
                const headerRow = 7;
                for (let c = range.s.c; c <= range.e.c; c++) {
                    const ref = XLSXStyle.utils.encode_cell({ r: headerRow, c });
                    if (ws[ref]) {
                        ws[ref].s = {
                            font: { name: "Arial", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
                            fill: { fgColor: { rgb: "BE185D" } },
                            alignment: { horizontal: "center", vertical: "center", wrapText: true },
                            border: excelBorder
                        };
                    }
                }

                for (let r = 8; r < 8 + rowCount; r++) {
                    for (let c = range.s.c; c <= range.e.c; c++) {
                        const ref = XLSXStyle.utils.encode_cell({ r, c });
                        if (ws[ref]) {
                            ws[ref].s = {
                                font: { name: "Arial", sz: 10 },
                                alignment: { 
                                    horizontal: c === 0 || c === 1 || c === 7 || c === 8 || c === 9 ? "center" : "left", 
                                    vertical: "center",
                                    wrapText: true
                                },
                                border: excelBorder
                            };
                        }
                    }
                }
            };

            const createDossierWorksheet = (sheetTitle: string, recordsList: any[]) => {
                const rows = buildExportRows(recordsList);
                const makeRow = (values: Record<number, string | number>) => {
                    const row = Array(columns.length).fill("");
                    Object.entries(values).forEach(([col, value]) => {
                        row[Number(col)] = value;
                    });
                    return row;
                };

                const companyName = selectedCompanyId ? companies.find(c => c.id === selectedCompanyId)?.name || "LOTUS GROUP" : "LOTUS GROUP";
                const departmentName = selectedDepartmentId ? departments.find(d => d.id === selectedDepartmentId)?.name || "Tất cả phòng ban" : "Tất cả phòng ban";

                const aoa = [
                    makeRow({ 0: "LOTUS GROUP", 3: "BÁO CÁO HỒ SƠ CHỨNG TỪ KẾ TOÁN", 7: "Mẫu: HRM-ACC-01" }),
                    makeRow({ 0: "Make your life blossom", 3: sheetTitle, 7: "Lần ban hành: 01" }),
                    makeRow({ 3: `Đơn vị: ${companyName} · ${departmentName}`, 7: `Ngày xuất: ${dayjs().format("DD/MM/YYYY HH:mm")}` }),
                    [],
                    ["Phạm vi tìm kiếm:", searchText || "Tất cả", "", "", "Tổng số bộ hồ sơ:", recordsList.length],
                    ["Người xuất báo cáo:", "", "", "", "Thời điểm xuất:", dayjs().format("DD/MM/YYYY HH:mm"), "", ""],
                    [],
                    columns.map(c => c.title),
                    ...rows,
                    [],
                    [`Tổng số hồ sơ: ${recordsList.length} bộ chứng từ`],
                    [],
                    makeRow({ 7: dayjs().format("[Ngày] DD [tháng] MM [năm] YYYY") }),
                    makeRow({ 0: "Người lập báo cáo", 7: "Người phê duyệt" }),
                    [],
                    [],
                    [],
                    makeRow({ 0: "(Ký, ghi rõ họ tên)", 7: "(Ký, ghi rõ họ tên)" })
                ];

                const ws = XLSXStyle.utils.aoa_to_sheet(aoa);
                ws["!merges"] = [
                    { s: { r: 0, c: 0 }, e: { r: 2, c: 2 } },
                    { s: { r: 0, c: 3 }, e: { r: 0, c: 6 } },
                    { s: { r: 1, c: 3 }, e: { r: 1, c: 6 } },
                    { s: { r: 2, c: 3 }, e: { r: 2, c: 6 } },
                    { s: { r: 0, c: 7 }, e: { r: 0, c: 9 } },
                    { s: { r: 1, c: 7 }, e: { r: 1, c: 9 } },
                    { s: { r: 2, c: 7 }, e: { r: 2, c: 9 } },
                    { s: { r: 4, c: 1 }, e: { r: 4, c: 3 } },
                    { s: { r: 4, c: 5 }, e: { r: 4, c: 7 } },
                    { s: { r: 5, c: 1 }, e: { r: 5, c: 3 } },
                ];

                styleWorksheet(ws, rows.length);
                
                const logoCell = ws["A1"];
                if (logoCell) {
                    logoCell.s = {
                        font: { name: "Arial", sz: 16, bold: true, color: { rgb: "BE185D" } },
                        alignment: { horizontal: "center", vertical: "center", wrapText: true },
                        border: excelBorder,
                    };
                }
                const sloganCell = ws["A2"];
                if (sloganCell) {
                    sloganCell.s = {
                        font: { name: "Arial", sz: 8, italic: true, color: { rgb: "64748B" } },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: excelBorder,
                    };
                }
                [0, 1, 2].forEach((row) => {
                    const cell = ws[XLSXStyle.utils.encode_cell({ r: row, c: 3 })];
                    if (cell) {
                        cell.s = {
                            font: { name: "Arial", sz: row === 0 ? 14 : 11, bold: true, color: { rgb: "111827" } },
                            alignment: { horizontal: "center", vertical: "center" },
                            border: excelBorder,
                        };
                    }
                });

                return ws;
            };

            const appendExportFilterSheet = (appendSheet: any) => {
                const companyName = selectedCompanyId ? companies.find(c => c.id === selectedCompanyId)?.name || "Tất cả" : "Tất cả";
                const departmentName = selectedDepartmentId ? departments.find(d => d.id === selectedDepartmentId)?.name || "Tất cả" : "Tất cả";
                const sectionName = selectedSectionId ? sections.find(s => s.id === selectedSectionId)?.name || "Tất cả" : "Tất cả";
                const categoryName = selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.categoryName || "Tất cả" : "Tất cả";
                const statusName = selectedStatus ? mapStatusName(selectedStatus) : "Tất cả";
                const storageStatusName = selectedStorageStatus === "EFFECTIVE" ? "Trong hạn" : selectedStorageStatus === "EXPIRED" ? "Hết hạn" : selectedStorageStatus === "ARCHIVED" ? "Lưu kho" : "Tất cả";

                const filterRows = [
                    ["Bộ lọc báo cáo", "Giá trị lọc"],
                    ["Công ty", companyName],
                    ["Phòng ban", departmentName],
                    ["Bộ phận", sectionName],
                    ["Danh mục", categoryName],
                    ["Trạng thái phê duyệt", statusName],
                    ["Tình trạng lưu trữ", storageStatusName],
                    ["Từ khóa tìm kiếm", searchText || "Không"],
                    ["Tổng số lượng bộ hồ sơ", items.length],
                    ["Kỳ xuất báo cáo", dayjs().format("DD/MM/YYYY HH:mm")]
                ];
                const filterWs = XLSXStyle.utils.aoa_to_sheet(filterRows);
                
                const range = XLSXStyle.utils.decode_range(filterWs["!ref"] || "A1:A1");
                filterWs["!cols"] = [{ wch: 25 }, { wch: 40 }];
                for (let r = range.s.r; r <= range.e.r; r++) {
                    for (let c = range.s.c; c <= range.e.c; c++) {
                        const cell = filterWs[XLSXStyle.utils.encode_cell({ r, c })];
                        if (cell) {
                            cell.s = {
                                font: { name: "Arial", sz: 10, bold: r === 0 || c === 0 },
                                fill: r === 0 ? { fgColor: { rgb: "F1F5F9" } } : undefined,
                                alignment: { horizontal: "left", vertical: "center" },
                                border: excelBorder
                            };
                        }
                    }
                }
                appendSheet(filterWs, "Bộ lọc cấu hình");
            };

            const appendSheet = (worksheet: any, name: string) => {
                XLSXStyle.utils.book_append_sheet(wb, worksheet, name);
            };

            if (type === "ALL") {
                const ws = createDossierWorksheet("TỔNG HỢP DANH SÁCH BỘ CHỨNG TỪ KẾ TOÁN", items);
                appendSheet(ws, "Danh sách bộ chứng từ");
                appendExportFilterSheet(appendSheet);
            } else {
                const deptsMap = new Map<string, any[]>();
                items.forEach((item: any) => {
                    const deptName = item.department?.name || "Chưa phân phòng ban";
                    if (!deptsMap.has(deptName)) {
                        deptsMap.set(deptName, []);
                    }
                    deptsMap.get(deptName)!.push(item);
                });

                deptsMap.forEach((deptItems, deptName) => {
                    const sheetName = deptName.length > 30 ? deptName.substring(0, 27) + "..." : deptName;
                    const ws = createDossierWorksheet(`DANH SÁCH CHỨNG TỪ - PHÒNG: ${deptName.toUpperCase()}`, deptItems);
                    appendSheet(ws, sheetName);
                });
                appendExportFilterSheet(appendSheet);
            }

            const excelBuffer = XLSXStyle.write(wb, { bookType: "xlsx", type: "array" });
            const blob = new Blob([excelBuffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
            });
            saveAs(blob, `Bao_cao_chung_tu_ke_toan_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`);
            notify.success("Đã xuất tệp báo cáo Excel thành công.");

        } catch (err) {
            console.error(err);
            notify.error("Không thể xuất tệp Excel báo cáo.");
        } finally {
            setExportLoading(false);
        }
    };

    const tableColumns = [
        {
            title: "STT",
            key: "stt",
            width: 60,
            align: "center" as const,
            render: (_: any, __: any, index: number) => (
                <span style={{ fontWeight: 600, color: "#94a3b8", fontSize: 12 }}>
                    {(page - 1) * pageSize + index + 1}
                </span>
            ),
        },
        {
            title: "Mã bộ chứng từ",
            dataIndex: "dossierCode",
            width: 150,
            render: (val?: string) => val ? <span style={{ fontWeight: 600, color: "#1e293b" }}>{val}</span> : <Tag>Chưa cấp mã</Tag>,
        },
        {
            title: "Nội dung bộ chứng từ",
            dataIndex: "content",
            render: (val: string) => (
                <Tooltip title={val}>
                    <div style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxHeight: "42px",
                        lineHeight: "21px",
                        whiteSpace: "normal"
                    }}>
                        {val}
                    </div>
                </Tooltip>
            ),
        },
        {
            title: "Danh mục",
            width: 180,
            render: (_: any, record: any) =>
                record.categoryMode === "UNSTRUCTURED"
                    ? record.customCategoryName || "Phi cấu trúc"
                    : record.dossierCategory?.name || "Theo mẫu",
        },
        {
            title: "Đơn vị",
            width: 220,
            render: (_: any, record: any) => (
                <Space direction="vertical" size={0}>
                    <span style={{ fontSize: 13, color: "#334155" }}>{record.company?.name || "-"}</span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                        {record.department?.name || "-"} {record.section?.name ? `· ${record.section.name}` : ""}
                    </span>
                </Space>
            ),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 140,
            render: (status: string) => {
                const colors: Record<string, string> = {
                    DRAFT: "default",
                    SUBMITTED: "blue",
                    IN_REVIEW: "processing",
                    APPROVED: "success",
                    REJECTED: "error",
                    TERMINATED: "error",
                    ARCHIVED: "purple",
                    RETURN_REQUESTED: "warning",
                    RETURNED: "default",
                };
                return (
                    <Tag color={colors[status] || "default"} style={{ minWidth: 100, textAlign: "center", margin: 0 }}>
                        {mapStatusName(status)}
                    </Tag>
                );
            },
        },
        {
            title: "Lưu trữ",
            width: 120,
            render: (_: any, record: any) =>
                record.storageStatus === "EXPIRED" ? (
                    <Tag color="red" style={{ minWidth: 80, textAlign: "center", margin: 0 }}>Hết hạn</Tag>
                ) : record.storageStatus === "ARCHIVED" || record.status === "ARCHIVED" ? (
                    <Tag color="purple" style={{ minWidth: 80, textAlign: "center", margin: 0 }}>Lưu kho</Tag>
                ) : (
                    <Tag color="green" style={{ minWidth: 80, textAlign: "center", margin: 0 }}>Trong hạn</Tag>
                ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            width: 140,
            render: (val: string) => val ? dayjs(val).format("DD/MM/YYYY") : "-",
        },
        {
            title: "Thao tác",
            key: "action",
            width: 95,
            fixed: "right" as const,
            render: (_: any, record: any) => (
                <Button 
                    type="link" 
                    icon={<EyeOutlined />} 
                    onClick={() => navigate(`/admin/accounting-dossiers?dossierId=${record.id}`)}
                >
                    Chi tiết
                </Button>
            ),
        },
    ];

    return (
        <div className="accounting-dashboard" aria-busy={isLoadingSummary}>
            <style>{`
                .accounting-dashboard {
                    --lotus: #e8356d;
                    --ink: #172033;
                    --muted: #697386;
                    padding: 12px 0 24px;
                }
                .accounting-dashboard .premium-card {
                    background: #ffffff !important;
                    border-radius: 16px !important;
                    box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.06), 0 2px 8px -1px rgba(148, 163, 184, 0.03) !important;
                    border: 1px solid #e2e8f0 !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    position: relative !important;
                    overflow: hidden !important;
                }
                .accounting-dashboard .premium-card:hover {
                    box-shadow: 0 16px 28px -4px rgba(148, 163, 184, 0.1), 0 4px 12px -2px rgba(148, 163, 184, 0.04) !important;
                    transform: translateY(-4px);
                }
                .accounting-dashboard .premium-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    transition: all 0.3s ease;
                }
                .accounting-dashboard .kpi-title {
                    color: #64748b !important;
                    font-weight: 600 !important;
                    font-size: 11px !important;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    display: block;
                    margin-bottom: 8px;
                }
                .accounting-dashboard .kpi-value {
                    font-weight: 800 !important;
                    font-size: 28px !important;
                    color: #0f172a !important;
                    line-height: 1.2;
                    letter-spacing: -0.5px;
                    display: inline-block;
                }
                .accounting-dashboard .kpi-icon-wrapper {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .accounting-dashboard .premium-card:hover .kpi-icon-wrapper {
                    transform: scale(1.08) translateY(-2px);
                }
                
                /* Subtle colored themes for cards with radial glows and top gradient borders */
                .accounting-dashboard .kpi-pending {
                    background: radial-gradient(circle at top right, rgba(37, 99, 235, 0.03), transparent 60%) #ffffff !important;
                }
                .accounting-dashboard .kpi-pending::before {
                    background: linear-gradient(90deg, #2563eb, #60a5fa);
                }
                .accounting-dashboard .kpi-pending .kpi-icon-wrapper {
                    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
                    color: #2563eb !important;
                    border: 1px solid #dbeafe !important;
                }
                .accounting-dashboard .kpi-pending:hover {
                    border-color: #bfdbfe !important;
                }
                .accounting-dashboard .kpi-pending:hover .kpi-icon-wrapper {
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15) !important;
                }
                
                .accounting-dashboard .kpi-expiring {
                    background: radial-gradient(circle at top right, rgba(217, 119, 6, 0.03), transparent 60%) #ffffff !important;
                }
                .accounting-dashboard .kpi-expiring::before {
                    background: linear-gradient(90deg, #d97706, #fbbf24);
                }
                .accounting-dashboard .kpi-expiring .kpi-icon-wrapper {
                    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%) !important;
                    color: #d97706 !important;
                    border: 1px solid #fef3c7 !important;
                }
                .accounting-dashboard .kpi-expiring:hover {
                    border-color: #fde047 !important;
                }
                .accounting-dashboard .kpi-expiring:hover .kpi-icon-wrapper {
                    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.15) !important;
                }
                
                .accounting-dashboard .kpi-expired {
                    background: radial-gradient(circle at top right, rgba(220, 38, 38, 0.03), transparent 60%) #ffffff !important;
                }
                .accounting-dashboard .kpi-expired::before {
                    background: linear-gradient(90deg, #dc2626, #f87171);
                }
                .accounting-dashboard .kpi-expired .kpi-icon-wrapper {
                    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%) !important;
                    color: #dc2626 !important;
                    border: 1px solid #fee2e2 !important;
                }
                .accounting-dashboard .kpi-expired:hover {
                    border-color: #fca5a5 !important;
                }
                .accounting-dashboard .kpi-expired:hover .kpi-icon-wrapper {
                    box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15) !important;
                }
                
                .accounting-dashboard .kpi-archived {
                    background: radial-gradient(circle at top right, rgba(124, 58, 237, 0.03), transparent 60%) #ffffff !important;
                }
                .accounting-dashboard .kpi-archived::before {
                    background: linear-gradient(90deg, #7c3aed, #a78bfa);
                }
                .accounting-dashboard .kpi-archived .kpi-icon-wrapper {
                    background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%) !important;
                    color: #7c3aed !important;
                    border: 1px solid #ede9fe !important;
                }
                .accounting-dashboard .kpi-archived:hover {
                    border-color: #ddd6fe !important;
                }
                .accounting-dashboard .kpi-archived:hover .kpi-icon-wrapper {
                    box-shadow: 0 4px 12px rgba(124, 58, 237, 0.15) !important;
                }
                
                .accounting-dashboard .chart-card {
                    border-radius: 16px !important;
                    border: 1px solid #e2e8f0 !important;
                    box-shadow: 0 4px 18px -4px rgba(50, 50, 93, 0.03), 0 2px 6px -2px rgba(0, 0, 0, 0.02) !important;
                    background: #ffffff !important;
                    overflow: hidden !important;
                }
                .accounting-dashboard .chart-card .ant-card-head {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 0 24px !important;
                    min-height: 56px !important;
                }
                .accounting-dashboard .chart-card .ant-card-head-title {
                    font-size: 15px !important;
                    font-weight: 700 !important;
                    color: #1e293b !important;
                }
                .accounting-dashboard .chart-card .ant-card-body {
                    padding: 24px !important;
                }
                .accounting-dashboard .chart-card canvas {
                    touch-action: pan-y;
                }
                .accounting-dashboard .chart-card .g2-legend {
                    padding-top: 6px;
                }
                .accounting-dashboard .accounting-report-header {
                    position: relative;
                    overflow: hidden;
                    background: linear-gradient(112deg, #ffffff 0%, #fff8fb 100%);
                    border-radius: 18px;
                    padding: 22px 24px;
                    border: 1px solid #f2dfe6;
                    box-shadow: 0 8px 24px rgba(167, 40, 91, 0.055);
                    margin-bottom: 24px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 20px;
                }
                .accounting-dashboard .accounting-report-header::after {
                    content: "";
                    position: absolute;
                    width: 230px;
                    height: 230px;
                    right: -112px;
                    top: -160px;
                    border: 1px solid rgba(232, 53, 109, 0.12);
                    border-radius: 50%;
                    box-shadow: 0 0 0 34px rgba(232, 53, 109, 0.035), 0 0 0 68px rgba(232, 53, 109, 0.018);
                    pointer-events: none;
                }
                .accounting-dashboard .accounting-report-header > * {
                    position: relative;
                    z-index: 1;
                }
                .accounting-dashboard .report-kicker {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    margin-bottom: 8px;
                    color: var(--lotus);
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.8px;
                    text-transform: uppercase;
                }
                .accounting-dashboard .report-title-row {
                    display: flex;
                    align-items: center;
                    gap: 9px;
                }
                .accounting-dashboard .report-title-accent {
                    width: 4px;
                    height: 22px;
                    border-radius: 999px;
                    background: var(--lotus);
                }
                .accounting-dashboard .accounting-report-header .ant-select-selector,
                .accounting-dashboard .accounting-report-header .ant-btn {
                    border-radius: 9px !important;
                }
                .accounting-dashboard .accounting-report-header .ant-select-selector {
                    border-color: #e4e7ed !important;
                }
                .accounting-dashboard .accounting-report-header .ant-btn:not(.ant-btn-primary) {
                    border-color: #e1e5eb;
                    color: #475467;
                    background: rgba(255, 255, 255, 0.88);
                }
                .accounting-dashboard .accounting-report-header .ant-btn-primary {
                    background: var(--lotus);
                    border-color: var(--lotus);
                    box-shadow: 0 4px 10px rgba(232, 53, 109, 0.18);
                }
                @media (max-width: 575px) {
                    .accounting-dashboard .accounting-report-header { padding: 18px; }
                    .accounting-dashboard .accounting-report-header .ant-space { width: 100%; }
                    .accounting-dashboard .accounting-report-header .ant-select { width: 100% !important; }
                .accounting-dashboard .kpi-card {
                    cursor: pointer !important;
                }
            `}</style>

            {/* KPI CARDS (Now at the top) */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="borderless" className="premium-card kpi-card kpi-pending" styles={{ body: { padding: "20px 24px" } }} onClick={() => navigate("/admin/accounting-dossiers?viewMode=ALL_DOSSIERS&tab=PENDING")}>
                        <StatisticCard
                            title="Đang chờ phê duyệt"
                            value={summary?.pendingApproval || 0}
                            icon={<FileProtectOutlined />}
                            badgeText="Cần xử lý"
                            badgeColor="#2563eb"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="borderless" className="premium-card kpi-card kpi-expiring" styles={{ body: { padding: "20px 24px" } }} onClick={() => navigate("/admin/accounting-dossiers?viewMode=ALL_DOSSIERS&storageStatus=EXPIRING_SOON")}>
                        <StatisticCard
                            title="Sắp hết hạn lưu"
                            value={summary?.expiringSoon || 0}
                            icon={<ClockCircleOutlined />}
                            badgeText="30 ngày tới"
                            badgeColor="#d97706"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="borderless" className="premium-card kpi-card kpi-expired" styles={{ body: { padding: "20px 24px" } }} onClick={() => navigate("/admin/accounting-dossiers?viewMode=ALL_DOSSIERS&storageStatus=EXPIRED")}>
                        <StatisticCard
                            title="Đã hết hạn lưu"
                            value={summary?.expired || 0}
                            icon={<ClockCircleOutlined />}
                            badgeText="Cần rà soát"
                            badgeColor="#dc2626"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card variant="borderless" className="premium-card kpi-card kpi-archived" styles={{ body: { padding: "20px 24px" } }} onClick={() => navigate("/admin/accounting-dossiers?viewMode=ALL_DOSSIERS&tab=APPROVED")}>
                        <StatisticCard
                            title="Đã đưa vào kho"
                            value={summary?.archived || 0}
                            icon={<CloudServerOutlined />}
                            badgeText="Đã khóa chỉnh sửa"
                            badgeColor="#7c3aed"
                        />
                    </Card>
                </Col>
            </Row>

            {/* FILTERS & OPERATIONS (Replicated CompletedEvaluationsPage grid layout) */}
            <Card variant="borderless" className="premium-card chart-card" styles={{ body: { padding: "20px 24px" } }} style={{ marginBottom: 24 }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={4}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Công ty</span>
                            <Select
                                placeholder="Tất cả công ty"
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                value={selectedCompanyId}
                                onChange={(val) => {
                                    setSelectedCompanyId(val);
                                    setSelectedDepartmentId(undefined);
                                    setSelectedSectionId(undefined);
                                    setPage(1);
                                }}
                                style={{ width: "100%", height: 40 }}
                                popupMatchSelectWidth={false}
                                dropdownStyle={{ borderRadius: 8 }}
                                options={[
                                    { label: "Tất cả công ty", value: undefined },
                                    ...companies.map(c => ({ label: c.name, value: c.id }))
                                ]}
                            />
                        </div>
                    </Col>
                    
                    <Col xs={24} sm={12} md={4}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Phòng ban</span>
                            <Select
                                placeholder="Tất cả phòng ban"
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                value={selectedDepartmentId}
                                onChange={(val) => {
                                    setSelectedDepartmentId(val);
                                    setSelectedSectionId(undefined);
                                    setPage(1);
                                }}
                                disabled={!selectedCompanyId}
                                style={{ width: "100%", height: 40 }}
                                popupMatchSelectWidth={false}
                                dropdownStyle={{ borderRadius: 8 }}
                                options={departments.map(d => ({ label: d.name, value: d.id }))}
                            />
                        </div>
                    </Col>
                    
                    <Col xs={24} sm={12} md={4}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Bộ phận</span>
                            <Select
                                placeholder="Tất cả bộ phận"
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                value={selectedSectionId}
                                onChange={(val) => {
                                    setSelectedSectionId(val);
                                    setPage(1);
                                }}
                                disabled={!selectedDepartmentId}
                                style={{ width: "100%", height: 40 }}
                                popupMatchSelectWidth={false}
                                dropdownStyle={{ borderRadius: 8 }}
                                options={sections.map(s => ({ label: s.name, value: s.id }))}
                            />
                        </div>
                    </Col>
                    
                    <Col xs={24} sm={12} md={4}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Danh mục hồ sơ</span>
                            <Select
                                placeholder="Tất cả danh mục"
                                allowClear
                                showSearch
                                optionFilterProp="label"
                                value={selectedCategoryId}
                                onChange={(val) => {
                                    setSelectedCategoryId(val);
                                    setPage(1);
                                }}
                                style={{ width: "100%", height: 40 }}
                                popupMatchSelectWidth={false}
                                dropdownStyle={{ borderRadius: 8 }}
                                options={categories.map(c => ({ label: c.categoryName, value: c.id }))}
                            />
                        </div>
                    </Col>
                    
                    <Col xs={24} sm={12} md={4}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Trạng thái phê duyệt</span>
                            <Select
                                placeholder="Tất cả trạng thái"
                                allowClear
                                value={selectedStatus}
                                onChange={(val) => {
                                    setSelectedStatus(val);
                                    setPage(1);
                                }}
                                style={{ width: "100%", height: 40 }}
                                dropdownStyle={{ borderRadius: 8 }}
                                options={[
                                    { label: "Tất cả trạng thái", value: undefined },
                                    { label: "Nháp", value: "DRAFT" },
                                    { label: "Đã gửi duyệt", value: "SUBMITTED" },
                                    { label: "Đang xét duyệt", value: "IN_REVIEW" },
                                    { label: "Đã phê duyệt", value: "APPROVED" },
                                    { label: "Bị từ chối", value: "REJECTED" },
                                    { label: "Đã chấm dứt", value: "TERMINATED" },
                                    { label: "Đã lưu kho", value: "ARCHIVED" },
                                    { label: "Yêu cầu hoàn trả", value: "RETURN_REQUESTED" },
                                    { label: "Returned", value: "RETURNED" }
                                ]}
                            />
                        </div>
                    </Col>
                    
                    <Col xs={24} sm={12} md={4}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Tình trạng lưu trữ</span>
                            <Select
                                placeholder="Tất cả tình trạng"
                                allowClear
                                value={selectedStorageStatus}
                                onChange={(val) => {
                                    setSelectedStorageStatus(val);
                                    setPage(1);
                                }}
                                style={{ width: "100%", height: 40 }}
                                dropdownStyle={{ borderRadius: 8 }}
                                options={[
                                    { label: "Tất cả tình trạng", value: undefined },
                                    { label: "Trong hạn", value: "EFFECTIVE" },
                                    { label: "Hết hạn", value: "EXPIRED" },
                                    { label: "Lưu kho", value: "ARCHIVED" }
                                ]}
                            />
                        </div>
                    </Col>
                </Row>
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginTop: 20, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                    <div style={{ flex: 1, minWidth: 260, maxWidth: 400 }}>
                        <Input
                            placeholder="Tìm kiếm theo mã, nội dung bộ chứng từ..."
                            value={searchText}
                            onChange={(e) => {
                                setSearchText(e.target.value);
                                setPage(1);
                            }}
                            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                            allowClear
                            size="middle"
                            style={{ height: 40, borderRadius: 8 }}
                        />
                    </div>
                    
                    <Space size={12} wrap>
                        <Dropdown
                            menu={{
                                items: [
                                    { key: "all", label: "Xuất dữ liệu đang lọc", onClick: () => handleExportExcel("ALL") },
                                    { key: "dept", label: "Xuất tách theo phòng ban", onClick: () => handleExportExcel("BY_DEPT") }
                                ]
                            }}
                            trigger={["click"]}
                            disabled={exportLoading}
                        >
                            <Button icon={<FileExcelOutlined />} loading={exportLoading} style={{ color: "#16a34a", borderColor: "#16a34a", height: 40, borderRadius: 8, fontWeight: 600 }}>
                                Xuất Excel <DownOutlined style={{ fontSize: 10 }} />
                            </Button>
                        </Dropdown>
                        
                        {canRefreshExpiredStorage && (
                            <Button
                                type="primary"
                                icon={<SyncOutlined />}
                                onClick={handleRefresh}
                                loading={refreshMutation.isPending}
                                style={{ 
                                    background: "#E8356D",
                                    borderColor: "#E8356D",
                                    height: 40,
                                    borderRadius: 8,
                                    fontWeight: 600,
                                    fontSize: 13,
                                    boxShadow: "0 2px 6px rgba(232, 53, 109, 0.15)"
                                }}
                            >
                                Cập nhật hạn lưu
                            </Button>
                        )}
                        
                        <Button icon={<SearchOutlined />} onClick={() => navigate("/admin/accounting-documents")} style={{ height: 40, borderRadius: 8 }}>
                            Tra cứu chứng từ
                        </Button>
                        <Button icon={<FolderOpenOutlined />} onClick={() => navigate("/admin/accounting-dossiers")} style={{ height: 40, borderRadius: 8 }}>
                            Bộ chứng từ
                        </Button>
                    </Space>
                </div>
            </Card>

            {/* Bento Grid Charts Section */}
            <Row className="chart-section" gutter={[20, 20]}>
                <Col xs={24} md={12}>
                    <Card 
                        title="Tình trạng xử lý hồ sơ" 
                        bordered={false} 
                        loading={isLoadingStatus}
                        className="premium-card chart-card"
                    >
                        {statusData.length > 0 && chartsReady && !isLoadingStatus ? (
                            <Pie
                                data={statusData}
                                angleField="value"
                                colorField="type"
                                radius={0.8}
                                innerRadius={0.6}
                                scale={PIE_COLOR_SCALE}
                                label={PIE_LABEL_CONFIG}
                                legend={PIE_LEGEND_CONFIG}
                                tooltip={CHART_TOOLTIP_CONFIG}
                                height={280}
                                animate={false}
                            />
                        ) : statusData.length > 0 ? (
                            <ChartPlaceholder height={280} />
                        ) : (
                            <div style={{ height: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                                <Empty description="Chưa có dữ liệu thống kê trạng thái" />
                            </div>
                        )}
                    </Card>
                </Col>
                
                <Col xs={24} md={12}>
                    <Card 
                        title="Hàng đợi phê duyệt theo vai trò" 
                        bordered={false} 
                        loading={isLoadingPending}
                        className="premium-card chart-card"
                    >
                        {pendingByRoleData.length > 0 && chartsReady && !isLoadingPending ? (
                            <Bar
                                data={pendingByRoleData}
                                xField="role"
                                yField="count"
                                legend={false}
                                height={280}
                                label={BAR_LABEL_CONFIG}
                                style={BAR_STYLE_CONFIG}
                                tooltip={CHART_TOOLTIP_CONFIG}
                                animate={false}
                            />
                        ) : pendingByRoleData.length > 0 ? (
                            <ChartPlaceholder height={280} />
                        ) : (
                            <div style={{ height: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                                <Empty description="Không có hồ sơ nào đang chờ duyệt" />
                            </div>
                        )}
                    </Card>
                </Col>

                <Col xs={24}>
                    <Card 
                        title="Phòng ban có nhiều chứng từ nhất"
                        bordered={false} 
                        loading={isLoadingDept}
                        className="premium-card chart-card department-chart-card"
                    >
                        {deptData.length > 0 && chartsReady && !isLoadingDept ? (
                            <Column
                                data={deptData}
                                xField="department"
                                yField="count"
                                legend={false}
                                height={320}
                                label={COLUMN_LABEL_CONFIG}
                                style={COLUMN_STYLE_CONFIG}
                                tooltip={CHART_TOOLTIP_CONFIG}
                                animate={false}
                            />
                        ) : deptData.length > 0 ? (
                            <ChartPlaceholder height={320} />
                        ) : (
                            <div style={{ padding: "40px 0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                                <Empty description="Chưa có dữ liệu thống kê phòng ban" />
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* DOSSIERS LIST TABLE */}
            <div style={{ marginTop: 24 }}>
                <Card 
                    title={
                        <Space size={8}>
                            <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 16 }}>Danh sách bộ chứng từ kế toán</span>
                            <span style={{ fontSize: 13, color: "#64748b", fontWeight: 400 }}>({totalDossiers} kết quả)</span>
                        </Space>
                    }
                    variant="borderless"
                    className="premium-card chart-card"
                    styles={{ body: { padding: 0 } }}
                >
                    <Table
                        columns={tableColumns}
                        dataSource={dossiersList}
                        rowKey="id"
                        loading={isFetchingDossiers}
                        pagination={{
                            current: page,
                            pageSize: pageSize,
                            total: totalDossiers,
                            showSizeChanger: true,
                            pageSizeOptions: ["10", "20", "50", "100"],
                            onChange: (p, ps) => {
                                setPage(p);
                                setPageSize(ps);
                            },
                            style: { padding: "16px 24px", margin: 0 }
                        }}
                        scroll={{ x: "max-content" }}
                    />
                </Card>
            </div>
        </div>
    );
};

const ChartPlaceholder = ({ height }: { height: number }) => (
    <div
        aria-label="Đang chuẩn bị biểu đồ"
        style={{
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#98a2b3",
            fontSize: 13,
            background: "linear-gradient(110deg, #f8fafc 8%, #f1f5f9 18%, #f8fafc 33%)",
            backgroundSize: "200% 100%",
        }}
    >
        Đang chuẩn bị biểu đồ…
    </div>
);

const StatisticCard = ({ 
    title, 
    value, 
    icon, 
    badgeText, 
    badgeColor 
}: { 
    title: string, 
    value: number, 
    icon: React.ReactNode, 
    badgeText?: string,
    badgeColor?: string
}) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span className="kpi-title" style={{ margin: 0 }}>{title}</span>
                {badgeText && (
                    <span className="metric-badge" style={{ 
                        fontSize: 9.5, 
                        fontWeight: 700, 
                        color: badgeColor, 
                        background: `${badgeColor}0f`, 
                        padding: "1px 6px", 
                        borderRadius: "999px",
                        border: `1px solid ${badgeColor}22`,
                        whiteSpace: "nowrap",
                        textTransform: "uppercase",
                        letterSpacing: "0.2px"
                    }}>
                        {badgeText}
                    </span>
                )}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span className="kpi-value">{value}</span>
                <span style={{ fontSize: 12, color: "#8e8e93", fontWeight: 600 }}>hồ sơ</span>
            </div>
        </div>
        <div className="kpi-icon-wrapper">
            {icon}
        </div>
    </div>
);

export default StorageDashboard;
