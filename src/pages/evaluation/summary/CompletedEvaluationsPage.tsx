import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { Table, Tag, Tooltip, Empty, Card, Select, Button, Row, Col, Input, Dropdown } from "antd";
import {
    StopOutlined,
    SyncOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    EyeOutlined,
    SearchOutlined,
    TeamOutlined,
    CheckSquareOutlined,
    StarOutlined,
    TrophyOutlined,
    FileExcelOutlined,
    FilterOutlined,
    DownOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import { notify } from "@/components/common/notification/notify";
import {
    callFetchCompletedSummary,
    callFetchEvaluationPeriods,
    callFetchCompany,
    callFetchDepartmentsByCompany,
    callFetchSectionsByDepartment
} from "@/config/api";
import PageContainer from "@/components/common/data-table/PageContainer";
import dayjs from "dayjs";
import { Pie, Column } from "@ant-design/charts";

let XLSXStyle: any;
const ensureXlsxStyle = async () => {
    if (!XLSXStyle) {
        const mod = await import("xlsx-js-style") as any;
        XLSXStyle = mod.default ?? mod;
    }
    return XLSXStyle;
};

const GRADE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    A: { color: "#389e0d", bg: "#f6ffed", label: "Xuất sắc" },
    B: { color: "#1677ff", bg: "#e6f4ff", label: "Tốt" },
    C: { color: "#d46b08", bg: "#fff7e6", label: "Khá" },
    D: { color: "#cf1322", bg: "#fff1f0", label: "Trung bình" },
    E: { color: "#8c8c8c", bg: "#f5f5f5", label: "Yếu" },
};

const STATUS_CONFIG: Record<string, { text: string; color: string; icon: React.ReactNode; tagColor: string }> = {
    NOT_STARTED: { text: "Chưa bắt đầu", color: "#8c8c8c", icon: <StopOutlined />, tagColor: "default" },
    EMPLOYEE_DRAFTING: { text: "NV đang đánh giá", color: "#1677ff", icon: <SyncOutlined spin />, tagColor: "processing" },
    PENDING_MANAGER_REVIEW: { text: "Chờ QL chấm", color: "#fa8c16", icon: <ClockCircleOutlined />, tagColor: "warning" },
    MANAGER_REVIEWING: { text: "QL đang chấm", color: "#722ed1", icon: <SyncOutlined spin />, tagColor: "purple" },
    PENDING_APPROVAL: { text: "Chờ phê duyệt", color: "#13c2c2", icon: <ClockCircleOutlined />, tagColor: "cyan" },
    REVISION_NEEDED: { text: "Yêu cầu sửa đổi", color: "#f5222d", icon: <CloseCircleOutlined />, tagColor: "error" },
    COMPLETED: { text: "Hoàn tất", color: "#52c41a", icon: <CheckCircleOutlined />, tagColor: "success" },
};

const getChartDatum = (event: any) =>
    event?.data?.data ?? event?.data ?? event?.datum ?? event?.target?.__data__?.data ?? null;

const bindChartClick = (plot: any, onDatumClick: (datum: any) => void) => {
    const chart = plot?.chart ?? plot;
    if (!chart?.on) return;
    const handler = (event: any) => {
        const datum = getChartDatum(event);
        if (datum) onDatumClick(datum);
    };
    chart.on("element:click", handler);
    chart.on("interval:click", handler);
    chart.on("sector:click", handler);
};

const EXPORT_COLUMNS = [
    { key: "index", title: "STT", width: 18, align: "center" },
    { key: "employeeCode", title: "Mã nhân viên", width: 16, align: "center" },
    { key: "employee", title: "Nhân sự", width: 26, align: "left" },
    { key: "jobTitle", title: "Chức danh", width: 24, align: "left" },
    { key: "company", title: "Công ty", width: 26, align: "left" },
    { key: "department", title: "Phòng ban", width: 28, align: "left" },
    { key: "period", title: "Kỳ đánh giá", width: 24, align: "left" },
    { key: "employeeScore", title: "Điểm NV đánh giá", width: 26, align: "center" },
    { key: "finalScore", title: "Điểm kết quả", width: 14, align: "center" },
    { key: "grade", title: "Xếp loại", width: 12, align: "center" },
];

const excelBorder = {
    top: { style: "thin", color: { rgb: "CBD5E1" } },
    bottom: { style: "thin", color: { rgb: "CBD5E1" } },
    left: { style: "thin", color: { rgb: "CBD5E1" } },
    right: { style: "thin", color: { rgb: "CBD5E1" } },
};

const noBorder = {
    top: { style: "thin", color: { rgb: "FFFFFF" } },
    bottom: { style: "thin", color: { rgb: "FFFFFF" } },
    left: { style: "thin", color: { rgb: "FFFFFF" } },
    right: { style: "thin", color: { rgb: "FFFFFF" } },
};

const formatExcelDate = (value?: string | null) => value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "";
const formatExcelScore = (value?: number | null) => value != null ? Number(value.toFixed(2)) : "";

const safeSheetName = (name: string) => {
    const normalized = (name || "Sheet").replace(/[\[\]:*?/\\]/g, " ").replace(/\s+/g, " ").trim();
    return (normalized || "Sheet").slice(0, 31);
};

const getUniqueSheetName = (name: string, usedNames: Set<string>) => {
    const base = safeSheetName(name);
    let candidate = base;
    let index = 2;
    while (usedNames.has(candidate)) {
        const suffix = ` ${index}`;
        candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
        index += 1;
    }
    usedNames.add(candidate);
    return candidate;
};

const styleWorksheet = (ws: any, rowCount: number, columns: typeof EXPORT_COLUMNS, tableHeaderRow: number) => {
    const colCount = columns.length;
    ws["!cols"] = columns.map(column => ({ wch: column.width }));
    ws["!rows"] = [
        { hpt: 30 },
        { hpt: 24 },
        { hpt: 24 },
        { hpt: 8 },
        { hpt: 22 },
        { hpt: 22 },
        { hpt: 8 },
        { hpt: 30 },
    ];
    ws["!freeze"] = { xSplit: 0, ySplit: tableHeaderRow + 1 };
    ws["!sheetViews"] = [{ showGridLines: false }];

    const titleCell = ws["A1"];
    if (titleCell) {
        titleCell.s = {
            font: { name: "Arial", sz: 16, bold: true, color: { rgb: "BE185D" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: excelBorder,
        };
    }
    const subtitleCell = ws["A2"];
    if (subtitleCell) {
        subtitleCell.s = {
            font: { name: "Arial", sz: 16, bold: true, color: { rgb: "111827" } },
            alignment: { horizontal: "center", vertical: "center" },
            border: excelBorder,
        };
    }

    for (let row = 0; row < tableHeaderRow; row += 1) {
        for (let col = 0; col < colCount; col += 1) {
            const cell = ws[XLSXStyle.utils.encode_cell({ r: row, c: col })];
            if (!cell) continue;
            cell.s = cell.s || {};
            cell.s.font = cell.s.font || { name: "Arial", sz: 10, color: { rgb: "111827" } };
            cell.s.alignment = cell.s.alignment || { horizontal: "left", vertical: "center", wrapText: true };
            cell.s.border = excelBorder;
        }
    }

    for (let col = 0; col < colCount; col += 1) {
        const headerCell = ws[XLSXStyle.utils.encode_cell({ r: tableHeaderRow, c: col })];
        if (headerCell) {
            headerCell.s = {
                font: { name: "Arial", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
                fill: { patternType: "solid", fgColor: { rgb: "BE185D" } },
                alignment: { horizontal: "center", vertical: "center", wrapText: true },
                border: excelBorder,
            };
        }
    }

    for (let row = tableHeaderRow + 1; row < rowCount; row += 1) {
        for (let col = 0; col < colCount; col += 1) {
            const cellRef = XLSXStyle.utils.encode_cell({ r: row, c: col });
            const cell = ws[cellRef];
            if (!cell) continue;
            cell.s = {
                font: { name: "Arial", sz: 10, color: { rgb: "1F2937" } },
                alignment: {
                    horizontal: columns[col]?.align || "left",
                    vertical: "center",
                    wrapText: true,
                },
                border: excelBorder,
                fill: (row - tableHeaderRow) % 2 === 0 ? { patternType: "solid", fgColor: { rgb: "FFF7FB" } } : { patternType: "solid", fgColor: { rgb: "FFFFFF" } },
            };
        }
    }
};

const styleFilterWorksheet = (ws: any, rowCount: number) => {
    ws["!cols"] = [{ wch: 24 }, { wch: 48 }];
    for (let row = 0; row < rowCount; row += 1) {
        for (let col = 0; col < 2; col += 1) {
            const cell = ws[XLSXStyle.utils.encode_cell({ r: row, c: col })];
            if (!cell) continue;
            cell.s = {
                font: { name: "Arial", sz: 10, bold: col === 0, color: { rgb: col === 0 ? "334155" : "111827" } },
                alignment: { horizontal: "left", vertical: "center", wrapText: true },
                border: excelBorder,
            };
        }
    }
};

const CompletedEvaluationsPage = () => {
    const navigate = useNavigate();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [periodLoading, setPeriodLoading] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [periods, setPeriods] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [companies, setCompanies] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [departments, setDepartments] = useState<any[]>([]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [sections, setSections] = useState<any[]>([]);

    const [selectedPeriod, setSelectedPeriod] = useState<number | undefined>();
    const [selectedCompany, setSelectedCompany] = useState<number | undefined>();
    const [selectedDepartment, setSelectedDepartment] = useState<number | undefined>();
    const [selectedSection, setSelectedSection] = useState<number | undefined>();

    const [searchText, setSearchText] = useState("");
    const [filterStatus, setFilterStatus] = useState<string | undefined>();
    const [filterGrade, setFilterGrade] = useState<string | undefined>();
    const [periodSearch, setPeriodSearch] = useState("");

    const handleCompanyChange = (companyId?: number) => {
        setSelectedCompany(companyId);
        setSelectedPeriod(undefined);
        setSelectedDepartment(undefined);
        setSelectedSection(undefined);
        setRecords([]);
        setSections([]);
    };

    const handleDepartmentChange = (departmentId?: number) => {
        setSelectedDepartment(departmentId);
        setSelectedSection(undefined);
    };

    const buildPeriodQuery = (searchValue = "", companyId?: number) => {
        const params = new URLSearchParams({
            page: "1",
            size: "20",
            sort: "createdAt,desc",
        });
        const filters: string[] = [];
        const keyword = searchValue.trim().replace(/'/g, "\\'");
        if (keyword) filters.push(`name~'${keyword}'`);
        if (companyId) filters.push(`company.id:'${companyId}'`);
        if (filters.length) params.set("filter", filters.join(" and "));
        return params.toString();
    };

    const fetchPeriods = async (searchValue = periodSearch, companyId = selectedCompany, autoSelect = false) => {
        setPeriodLoading(true);
        try {
            const res = await callFetchEvaluationPeriods(buildPeriodQuery(searchValue, companyId));
            if (res?.data?.result) {
                setPeriods(res.data.result);
                if (autoSelect && res.data.result.length > 0) {
                    setSelectedPeriod(res.data.result[0].id);
                } else if (autoSelect) {
                    setSelectedPeriod(undefined);
                    setRecords([]);
                }
            }
        } catch (error: any) {
            if (error?.response?.status !== 403) {
                notify.error("Lỗi tải danh sách kỳ đánh giá");
            }
        } finally {
            setPeriodLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await callFetchCompany("page=1&size=100");
            if (res?.data?.result) {
                setCompanies(res.data.result);
            }
        } catch {
            notify.error("Lỗi tải danh sách công ty");
        }
    };

    const fetchDepartments = async (companyId: number) => {
        try {
            const res = await callFetchDepartmentsByCompany(companyId);
            if (res?.data) {
                setDepartments(res.data);
            }
        } catch {
            notify.error("Lỗi tải danh sách phòng ban");
        }
    };

    const fetchSections = async (departmentId: number) => {
        try {
            const res = await callFetchSectionsByDepartment(departmentId);
            if (res?.data) {
                setSections(res.data);
            }
        } catch {
            notify.error("Lỗi tải danh sách bộ phận");
        }
    };

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await callFetchCompletedSummary(selectedPeriod, selectedDepartment, selectedCompany, selectedSection);
            if (res?.data) {
                setRecords(res.data);
            }
        } catch {
            notify.error("Lỗi tải báo cáo tổng hợp");
        } finally {
            setLoading(false);
        }
    };

    const searchRef = useRef(false);

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        // Prevent running on mount for search, but run for selectedCompany changes
        if (searchRef.current) {
            const timer = window.setTimeout(() => {
                fetchPeriods(periodSearch, selectedCompany, false);
            }, 300);
            return () => window.clearTimeout(timer);
        } else if (periodSearch !== "") {
            searchRef.current = true;
        } else {
            fetchPeriods("", selectedCompany, true);
        }
    }, [periodSearch, selectedCompany]);

    useEffect(() => {
        if (selectedCompany) {
            fetchDepartments(selectedCompany);
            setSelectedDepartment(undefined);
            setSelectedSection(undefined);
            setSections([]);
        } else {
            setDepartments([]);
            setSelectedDepartment(undefined);
            setSelectedSection(undefined);
            setSections([]);
        }
    }, [selectedCompany]);

    useEffect(() => {
        if (selectedPeriod) {
            fetchSummary();
        } else {
            setRecords([]);
        }
    }, [selectedPeriod, selectedCompany, selectedDepartment, selectedSection]);

    useEffect(() => {
        if (selectedDepartment) {
            fetchSections(selectedDepartment);
            setSelectedSection(undefined);
        } else {
            setSections([]);
            setSelectedSection(undefined);
        }
    }, [selectedDepartment]);

    const matchesSearch = useCallback((record: any) => {
        if (!searchText) return true;
        const keyword = searchText.toLowerCase();
        const empName = record.employee?.username || record.employee?.fullName || "";
        const empEmail = record.employee?.email || "";
        return empName.toLowerCase().includes(keyword) || empEmail.toLowerCase().includes(keyword);
    }, [searchText]);

    // FILTER LOGIC
    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const nameMatch = matchesSearch(r);
            const statusMatch = !filterStatus || r.status === filterStatus;
            const gradeMatch = !filterGrade || r.finalGrade === filterGrade;
            return nameMatch && statusMatch && gradeMatch;
        });
    }, [records, matchesSearch, filterStatus, filterGrade]);

    const statusChartRecords = useMemo(() => {
        return records.filter(r => matchesSearch(r) && (!filterGrade || r.finalGrade === filterGrade));
    }, [records, matchesSearch, filterGrade]);

    const gradeChartRecords = useMemo(() => {
        return records.filter(r => matchesSearch(r) && (!filterStatus || r.status === filterStatus));
    }, [records, matchesSearch, filterStatus]);

    // KPI CALCULATIONS
    const totalRecordsCount = filteredRecords.length;
    const completedRecordsCount = filteredRecords.filter(r => r.status === 'COMPLETED').length;
    const completionRate = totalRecordsCount > 0 ? ((completedRecordsCount / totalRecordsCount) * 100).toFixed(1) : "0.0";

    const completedWithScores = filteredRecords.filter(r => r.status === 'COMPLETED' && r.finalGrade);
    const totalScoreSum = completedWithScores.reduce((sum, r) => sum + (r.approverTotalScore ?? r.managerTotalScore ?? 0), 0);
    const averageScore = completedWithScores.length > 0 ? (totalScoreSum / completedWithScores.length).toFixed(2) : "0.00";

    const excellentCount = completedWithScores.filter(r => r.finalGrade === 'A').length;
    const excellentRate = completedWithScores.length > 0 ? ((excellentCount / completedWithScores.length) * 100).toFixed(1) : "0.0";

    // CHARTS DATA
    const statusData = useMemo(() => {
        const counts: Record<string, number> = {};
        statusChartRecords.forEach(r => {
            counts[r.status] = (counts[r.status] || 0) + 1;
        });
        return Object.entries(counts).map(([status, count]) => ({
            status,
            type: STATUS_CONFIG[status]?.text || status,
            value: count
        }));
    }, [statusChartRecords]);

    const gradeData = useMemo(() => {
        const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
        gradeChartRecords.filter(r => r.status === 'COMPLETED').forEach(r => {
            if (r.finalGrade) {
                counts[r.finalGrade] = (counts[r.finalGrade] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .filter(([, count]) => count > 0)
            .map(([grade, count]) => ({
                grade,
                count,
                color: GRADE_CONFIG[grade]?.color || '#1677ff'
            }));
    }, [gradeChartRecords]);

    const handleStatusDrilldown = useCallback((datum: any) => {
        const nextStatus = datum?.status;
        if (!nextStatus) return;
        setFilterStatus(prev => prev === nextStatus ? undefined : nextStatus);
    }, []);

    const handleGradeDrilldown = useCallback((datum: any) => {
        const nextGrade = datum?.grade;
        if (!nextGrade || Number(datum?.count ?? 0) <= 0) return;
        setFilterGrade(prev => prev === nextGrade ? undefined : nextGrade);
    }, []);

    const getExportColumns = useCallback((items: any[]) => {
        return EXPORT_COLUMNS;
    }, []);

    const getExportValue = useCallback((record: any, index: number, key: string) => {
        const finalScore = record.approverTotalScore ?? record.managerTotalScore;
        const gradeLabel = record.finalGrade
            ? `${record.finalGrade} - ${GRADE_CONFIG[record.finalGrade]?.label || ""}`.trim()
            : "";

        const values: Record<string, string | number> = {
            index: index + 1,
            employeeCode: record.employee?.employeeCode || "",
            employee: record.employee?.username || record.employee?.fullName || "",
            jobTitle: record.employee?.jobTitle || "",
            company: record.employee?.companyName || "",
            department: record.employee?.departmentName || "Chưa xác định phòng ban",
            period: record.period?.name || "",
            employeeScore: formatExcelScore(record.employeeTotalScore),
            finalScore: formatExcelScore(finalScore),
            grade: gradeLabel,
        };

        return values[key] ?? "";
    }, []);

    const buildExportRows = useCallback((items: any[], columns: typeof EXPORT_COLUMNS) => {
        return items.map((record, index) => {
            return columns.map(column => getExportValue(record, index, column.key));
        });
    }, [getExportValue]);

    const createEvaluationWorksheet = useCallback((title: string, items: any[], signatureLeftLabel: string) => {
        const columns = getExportColumns(items);
        const rows = buildExportRows(items, columns);
        const tableHeaderRow = 7;
        const signStart = tableHeaderRow + rows.length + 4;
        const lastCol = columns.length - 1;
        const titleEnd = Math.max(5, lastCol - 3);
        const rightInfoStart = titleEnd + 1;
        const rightSignStart = Math.max(0, lastCol - 2);
        const colCount = columns.length;
        const firstSignEnd = Math.max(0, Math.floor(colCount / 2) - 1);
        const secondSignStart = firstSignEnd + 1;
        const companyName = items[0]?.employee?.companyName || companies.find(c => c.id === selectedCompany)?.name || "LOTUS GROUP";
        const departmentName = items[0]?.employee?.departmentName || (selectedDepartment ? departments.find(d => d.id === selectedDepartment)?.name : "") || "";
        const periodName = items[0]?.period?.name || periods.find(p => p.id === selectedPeriod)?.name || "";
        const makeRow = (values: Record<number, string | number>) => {
            const row = Array(columns.length).fill("");
            Object.entries(values).forEach(([col, value]) => {
                row[Number(col)] = value;
            });
            return row;
        };
        const aoa = [
            makeRow({ 0: "LOTUS GROUP", 3: "KẾT QUẢ ĐÁNH GIÁ NĂNG LỰC", [rightInfoStart]: "Mẫu: HRM-EVAL-01" }),
            makeRow({ 0: "Make your life blossom", 3: title, [rightInfoStart]: "Lần ban hành: 01" }),
            makeRow({ 3: periodName ? `Kỳ đánh giá: ${periodName}` : "Kỳ đánh giá: Tất cả", [rightInfoStart]: `Ngày xuất: ${dayjs().format("DD/MM/YYYY HH:mm")}` }),
            [],
            ["Công ty:", companyName, "", "", "Phòng ban:", departmentName || "Tất cả", "", "", "Số hồ sơ:", items.length],
            ["Người lập báo cáo:", "", "", "", "Ngày lập:", dayjs().format("DD/MM/YYYY"), "", "", "", ""],
            [],
            columns.map(column => column.title),
            ...rows,
            [],
            [`Tổng số hồ sơ: ${items.length}`],
            [],
            makeRow({ [rightSignStart]: dayjs().format("[Ngày] DD [tháng] MM [năm] YYYY") }),
            makeRow({ 0: signatureLeftLabel, [secondSignStart]: "Phê duyệt của BOD" }),
            [],
            [],
            [],
            [],
            [],
            makeRow({ 0: "(Ký, ghi rõ họ tên)", [secondSignStart]: "(Ký, ghi rõ họ tên)" }),
        ];
        const ws = XLSXStyle.utils.aoa_to_sheet(aoa);
        const signatureHeaderRow = signStart + 1;
        const signatureBodyStart = signatureHeaderRow + 1;
        const signatureBodyEnd = signatureHeaderRow + 5;
        const signatureNoteRow = signatureHeaderRow + 6;
        const signatureSegments = [
            { start: 0, end: firstSignEnd },
            { start: secondSignStart, end: lastCol },
        ].filter(segment => segment.start <= segment.end);
        ws["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 2, c: 2 } },
            { s: { r: 0, c: 3 }, e: { r: 0, c: titleEnd } },
            { s: { r: 1, c: 3 }, e: { r: 1, c: titleEnd } },
            { s: { r: 2, c: 3 }, e: { r: 2, c: titleEnd } },
            { s: { r: 0, c: rightInfoStart }, e: { r: 0, c: lastCol } },
            { s: { r: 1, c: rightInfoStart }, e: { r: 1, c: lastCol } },
            { s: { r: 2, c: rightInfoStart }, e: { r: 2, c: lastCol } },
            { s: { r: 4, c: 1 }, e: { r: 4, c: 3 } },
            { s: { r: 4, c: 5 }, e: { r: 4, c: 7 } },
            { s: { r: 5, c: 1 }, e: { r: 5, c: 3 } },
            ...signatureSegments.flatMap(segment => [
                { s: { r: signatureHeaderRow, c: segment.start }, e: { r: signatureHeaderRow, c: segment.end } },
                { s: { r: signatureBodyStart, c: segment.start }, e: { r: signatureBodyEnd, c: segment.end } },
                { s: { r: signatureNoteRow, c: segment.start }, e: { r: signatureNoteRow, c: segment.end } },
            ]),
        ];

        styleWorksheet(ws, aoa.length, columns, tableHeaderRow);
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
            const titleCellRef = XLSXStyle.utils.encode_cell({ r: row, c: 3 });
            const cell = ws[titleCellRef];
            if (cell) {
                cell.s = {
                    font: { name: "Arial", sz: row === 0 ? 15 : 12, bold: true, color: { rgb: "111827" } },
                    alignment: { horizontal: "center", vertical: "center", wrapText: true },
                    border: excelBorder,
                };
            }
        });
        [0, 1, 2].forEach(row => {
            const cell = ws[XLSXStyle.utils.encode_cell({ r: row, c: rightInfoStart })];
            if (cell) {
                cell.s = {
                    font: { name: "Arial", sz: 10, bold: row !== 2, color: { rgb: "111827" } },
                    alignment: { horizontal: "left", vertical: "center", wrapText: true },
                    border: excelBorder,
                };
            }
        });
        [4, 5].forEach(row => {
            [0, 4, 8].forEach(col => {
                const cell = ws[XLSXStyle.utils.encode_cell({ r: row, c: col })];
                if (cell) {
                    cell.s = {
                        font: { name: "Arial", sz: 10, bold: true, color: { rgb: "111827" } },
                        alignment: { horizontal: "left", vertical: "center" },
                        border: excelBorder,
                        fill: { patternType: "solid", fgColor: { rgb: "FFF7FB" } },
                    };
                }
            });
        });
        const totalCell = ws[XLSXStyle.utils.encode_cell({ r: tableHeaderRow + rows.length + 1, c: 0 })];
        if (totalCell) {
            totalCell.s = {
                font: { name: "Arial", sz: 10, bold: true, color: { rgb: "334155" } },
                alignment: { horizontal: "left", vertical: "center" },
                fill: { patternType: "solid", fgColor: { rgb: "FFF1F8" } },
                border: excelBorder,
            };
        }
        const dateCell = ws[XLSXStyle.utils.encode_cell({ r: signStart, c: rightSignStart })];
        if (dateCell) {
            dateCell.s = {
                font: { name: "Arial", sz: 10, italic: true, color: { rgb: "334155" } },
                alignment: { horizontal: "center", vertical: "center" },
                border: noBorder,
            };
        }
        const signatureCellStyle = (row: number) => ({
            font: {
                name: "Arial",
                sz: row === signatureHeaderRow ? 10 : 10,
                bold: row === signatureHeaderRow,
                italic: row === signatureNoteRow,
                color: { rgb: row === signatureNoteRow ? "64748B" : "111827" },
            },
            alignment: { horizontal: "center", vertical: "center", wrapText: true },
            border: excelBorder,
            fill: row === signatureHeaderRow ? { patternType: "solid", fgColor: { rgb: "FFF1F8" } } : { patternType: "solid", fgColor: { rgb: "FFFFFF" } },
        });
        signatureSegments.forEach(segment => {
            for (let row = signatureHeaderRow; row <= signatureNoteRow; row += 1) {
                for (let col = segment.start; col <= segment.end; col += 1) {
                    const cellRef = XLSXStyle.utils.encode_cell({ r: row, c: col });
                    if (!ws[cellRef]) ws[cellRef] = { v: "", t: "s" };
                    ws[cellRef].s = signatureCellStyle(row);
                }
            }
        });
        for (let row = signatureBodyStart; row <= signatureBodyEnd; row += 1) {
            if (!ws["!rows"]) ws["!rows"] = [];
            ws["!rows"][row] = { hpt: 22 };
        }
        if (!ws["!rows"]) ws["!rows"] = [];
        ws["!rows"][signatureHeaderRow] = { hpt: 24 };
        ws["!rows"][signatureNoteRow] = { hpt: 24 };

        signatureSegments.forEach(segment => {
            const headerCell = ws[XLSXStyle.utils.encode_cell({ r: signatureHeaderRow, c: segment.start })];
            if (headerCell) {
                headerCell.s = {
                    ...headerCell.s,
                    font: { name: "Arial", sz: 10, bold: true, color: { rgb: "111827" } },
                    fill: { patternType: "solid", fgColor: { rgb: "FFF1F8" } },
                };
            }
            const noteCell = ws[XLSXStyle.utils.encode_cell({ r: signatureNoteRow, c: segment.start })];
            if (noteCell) {
                noteCell.s = {
                    ...noteCell.s,
                    font: { name: "Arial", sz: 10, italic: true, color: { rgb: "64748B" } },
                };
            }
        });

        return ws;
    }, [buildExportRows, companies, departments, getExportColumns, periods, selectedCompany, selectedDepartment, selectedPeriod]);

    const appendExportFilterSheet = useCallback((appendSheet: (worksheet: any, name: string) => void) => {
        const selectedPeriodName = periods.find(p => p.id === selectedPeriod)?.name || "Tất cả";
        const selectedCompanyName = companies.find(c => c.id === selectedCompany)?.name || "Tất cả";
        const selectedDepartmentName = departments.find(d => d.id === selectedDepartment)?.name || "Tất cả";
        const selectedSectionName = sections.find(s => s.id === selectedSection)?.name || "Tất cả";
        const filterRows = [
            ["Bộ lọc", "Giá trị"],
            ["Kỳ đánh giá", selectedPeriodName],
            ["Công ty", selectedCompanyName],
            ["Phòng ban", selectedDepartmentName],
            ["Bộ phận", selectedSectionName],
            ["Trạng thái", filterStatus ? STATUS_CONFIG[filterStatus]?.text || filterStatus : "Tất cả"],
            ["Xếp loại", filterGrade ? `${filterGrade} - ${GRADE_CONFIG[filterGrade]?.label || ""}` : "Tất cả"],
            ["Từ khóa", searchText || "Không"],
            ["Số hồ sơ xuất", filteredRecords.length],
            ["Thời gian xuất", dayjs().format("DD/MM/YYYY HH:mm")],
        ];
        const filterWs = XLSXStyle.utils.aoa_to_sheet(filterRows);
        styleFilterWorksheet(filterWs, filterRows.length);
        appendSheet(filterWs, "Bộ lọc");
    }, [
        companies,
        departments,
        filterGrade,
        filterStatus,
        filteredRecords.length,
        periods,
        searchText,
        sections,
        selectedCompany,
        selectedDepartment,
        selectedPeriod,
        selectedSection,
    ]);

    const saveWorkbook = useCallback((workbook: any, filename: string) => {
        const excelBuffer = XLSXStyle.write(workbook, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], {
            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
        });
        saveAs(blob, filename);
    }, []);

    const createWorkbookAppender = useCallback((workbook: any) => {
        const usedSheetNames = new Set<string>();
        return (worksheet: any, name: string) => {
            XLSXStyle.utils.book_append_sheet(workbook, worksheet, getUniqueSheetName(name, usedSheetNames));
        };
    }, []);

    const handleExportCurrentScope = useCallback(async () => {
        if (!filteredRecords.length) {
            notify.warning("Không có dữ liệu để xuất Excel");
            return;
        }

        await ensureXlsxStyle();
        const workbook = XLSXStyle.utils.book_new();
        const appendSheet = createWorkbookAppender(workbook);
        appendSheet(
            createEvaluationWorksheet("TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ", filteredRecords, "Xác nhận của phòng ban"),
            "Dữ liệu đang lọc"
        );
        appendExportFilterSheet(appendSheet);
        saveWorkbook(workbook, `ket-qua-danh-gia_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`);
        notify.success("Đã xuất Excel theo dữ liệu đang lọc");
    }, [appendExportFilterSheet, createEvaluationWorksheet, createWorkbookAppender, filteredRecords, saveWorkbook]);

    const handleExportSingleEmployee = useCallback(async () => {
        if (filteredRecords.length !== 1) {
            notify.warning("Vui lòng lọc còn đúng 1 nhân viên để xuất riêng");
            return;
        }

        await ensureXlsxStyle();
        const employeeName = filteredRecords[0]?.employee?.username || filteredRecords[0]?.employee?.fullName || "nhan-vien";
        const workbook = XLSXStyle.utils.book_new();
        const appendSheet = createWorkbookAppender(workbook);
        appendSheet(
            createEvaluationWorksheet(`KẾT QUẢ ĐÁNH GIÁ - ${employeeName.toUpperCase()}`, filteredRecords, "Xác nhận của phòng ban"),
            "Nhân viên"
        );
        appendExportFilterSheet(appendSheet);
        saveWorkbook(workbook, `ket-qua-danh-gia_${safeSheetName(employeeName).replace(/\s+/g, "-")}_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`);
        notify.success("Đã xuất Excel cho nhân viên");
    }, [appendExportFilterSheet, createEvaluationWorksheet, createWorkbookAppender, filteredRecords, saveWorkbook]);

    const handleExportByDepartment = useCallback(async () => {
        if (!filteredRecords.length) {
            notify.warning("Không có dữ liệu để xuất Excel");
            return;
        }

        await ensureXlsxStyle();
        const workbook = XLSXStyle.utils.book_new();
        const appendSheet = createWorkbookAppender(workbook);

        appendSheet(
            createEvaluationWorksheet("TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ THEO PHÒNG BAN", filteredRecords, "Xác nhận của phòng ban"),
            "Tổng hợp"
        );

        const groupedByDepartment = filteredRecords.reduce<Record<string, any[]>>((groups, record) => {
            const departmentName = record.employee?.departmentName || "Chưa xác định phòng ban";
            if (!groups[departmentName]) groups[departmentName] = [];
            groups[departmentName].push(record);
            return groups;
        }, {});

        Object.entries(groupedByDepartment)
            .sort(([a], [b]) => a.localeCompare(b, "vi"))
            .forEach(([departmentName, departmentRecords]) => {
                appendSheet(
                    createEvaluationWorksheet(`PHÒNG BAN: ${departmentName.toUpperCase()}`, departmentRecords, "Xác nhận của phòng ban"),
                    departmentName
                );
            });

        appendExportFilterSheet(appendSheet);
        saveWorkbook(workbook, `tong-hop-danh-gia-theo-phong-ban_${dayjs().format("YYYYMMDD_HHmm")}.xlsx`);
        notify.success("Đã xuất Excel theo phòng ban");
    }, [
        appendExportFilterSheet,
        createEvaluationWorksheet,
        createWorkbookAppender,
        filteredRecords,
        saveWorkbook,
    ]);

    const exportMenuItems = useMemo(() => ([
        {
            key: "current",
            label: "Xuất dữ liệu đang lọc",
            onClick: handleExportCurrentScope,
        },
        {
            key: "department",
            label: "Xuất tách theo phòng ban",
            onClick: handleExportByDepartment,
        },
        {
            key: "employee",
            label: "Xuất 1 nhân viên đang lọc",
            disabled: filteredRecords.length !== 1,
            onClick: handleExportSingleEmployee,
        },
    ]), [filteredRecords.length, handleExportByDepartment, handleExportCurrentScope, handleExportSingleEmployee]);

    const renderUserAvatar = (name: string, email: string, jobTitle?: string, positionLevel?: string) => {
        const initial = name ? name.trim().charAt(0).toUpperCase() : "?";
        const colors = ["#3b82f6", "#06b6d4", "#f97316", "#ef4444", "#8b5cf6", "#ec4899"];
        const index = (email || name || "").charCodeAt(0) % colors.length;
        const color = colors[index];
        const subText = [jobTitle, positionLevel].filter(Boolean).join(" - ");

        return (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                    width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${color}dd 0%, ${color} 100%)`, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0
                }}>
                    {initial}
                </div>
                <div>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}>{name || "Chưa cập nhật"}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{subText || email || "—"}</div>
                </div>
            </div>
        );
    };

    const columns = [
        {
            title: "STT",
            key: "stt",
            width: 50,
            align: "center" as const,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: any, __: any, idx: number) => (
                <span style={{ fontWeight: 600, color: "#94a3b8", fontSize: 12 }}>{idx + 1}</span>
            ),
        },
        {
            title: "Nhân sự",
            key: "employee",
            width: 250,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: any, record: any) => {
                const name = record.employee?.username || record.employee?.fullName || "Chưa cập nhật";
                const email = record.employee?.email || "";
                const job = record.employee?.jobTitle || "";
                return renderUserAvatar(name, email, job, record.employee?.positionLevel);
            },
        },
        {
            title: "Kỳ đánh giá",
            key: "period",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: any, record: any) => <span style={{ fontWeight: 600, color: "#334155" }}>{record.period?.name || "—"}</span>,
        },
        {
            title: "Điểm NV đánh giá",
            dataIndex: "employeeTotalScore",
            key: "employeeTotalScore",
            align: "center" as const,
            render: (val: number | null) => (
                <span style={{ fontWeight: 700, color: val ? "#94a3b8" : "#e2e8f0", fontSize: 14 }}>
                    {val != null ? val.toFixed(2) : "—"}
                </span>
            ),
        },
        {
            title: "Kết quả đánh giá",
            key: "finalScore",
            align: "center" as const,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: any, record: any) => {
                const finalScore = record.approverTotalScore ?? record.managerTotalScore;
                return (
                    <span style={{ fontWeight: 800, color: finalScore ? "#1677ff" : "#e2e8f0", fontSize: 15 }}>
                        {finalScore != null ? finalScore.toFixed(2) : "—"}
                    </span>
                );
            }
        },
        {
            title: "Xếp loại",
            dataIndex: "finalGrade",
            key: "finalGrade",
            align: "center" as const,
            render: (val: string | null) => {
                if (!val) return <span style={{ color: "#d9d9d9" }}>—</span>;
                const cfg = GRADE_CONFIG[val] ?? { color: "#8c8c8c", bg: "#f5f5f5", label: val };
                return (
                    <Tooltip title={cfg.label}>
                        <span style={{
                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                            width: 32, height: 32, borderRadius: "50%",
                            background: cfg.bg, border: `2px solid ${cfg.color}`,
                            color: cfg.color, fontWeight: 800, fontSize: 15
                        }}>
                            {val}
                        </span>
                    </Tooltip>
                );
            },
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            align: "center" as const,
            width: 140,
            render: (val: string, record: any) => {
                const empDeadline = record.effectiveEmployeeDeadline ?? record.employeeDeadlineOverride ?? record.period?.employeeDeadline;
                const isEmpPending = record.status === "EMPLOYEE_DRAFTING" || record.status === "REVISION_NEEDED";
                const isEmpOverdue = isEmpPending && empDeadline && dayjs().isAfter(dayjs(empDeadline));

                const mgrDeadline = record.effectiveManagerDeadline ?? record.managerDeadlineOverride ?? record.period?.managerDeadline;
                const isMgrPending = record.status === "PENDING_MANAGER_REVIEW" || record.status === "MANAGER_REVIEWING";
                const isMgrOverdue = isMgrPending && mgrDeadline && dayjs().isAfter(dayjs(mgrDeadline));

                const appDeadline = record.effectiveApprovalDeadline ?? record.approvalDeadlineOverride ?? record.period?.approvalDeadline;
                const isAppPending = record.status === "PENDING_APPROVAL";
                const isAppOverdue = isAppPending && appDeadline && dayjs().isAfter(dayjs(appDeadline));

                if (isEmpOverdue) {
                    return (
                        <Tag color="error" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600, borderRadius: 12, padding: "2px 8px" }}>
                            <ClockCircleOutlined />
                            Trễ hạn tự đánh giá
                        </Tag>
                    );
                }

                if (isMgrOverdue) {
                    return (
                        <Tag color="error" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600, borderRadius: 12, padding: "2px 8px" }}>
                            <ClockCircleOutlined />
                            Trễ hạn chấm điểm
                        </Tag>
                    );
                }

                if (isAppOverdue) {
                    return (
                        <Tag color="error" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600, borderRadius: 12, padding: "2px 8px" }}>
                            <ClockCircleOutlined />
                            Trễ hạn phê duyệt
                        </Tag>
                    );
                }

                const cfg = STATUS_CONFIG[val] ?? STATUS_CONFIG.NOT_STARTED;
                return (
                    <Tag color={cfg.tagColor} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600, borderRadius: 12, padding: "2px 8px" }}>
                        {cfg.icon}
                        {cfg.text}
                    </Tag>
                );
            },
        },
        {
            title: "Hành động",
            key: "actions",
            align: "center" as const,
            width: 100,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            render: (_: any, record: any) => (
                <Button
                    type="primary"
                    ghost
                    icon={<EyeOutlined />}
                    onClick={() => navigate(`/admin/evaluation/my-records/${record.id}?readonly=true&from=summary`)}
                    style={{ fontWeight: 600, borderRadius: 6 }}
                    size="small"
                >
                    Chi tiết
                </Button>
            ),
        },
    ];

    return (
        <PageContainer title="Tổng hợp Kết quả đánh giá">
            <style>{`
                .my-eval-table .ant-table-thead > tr > th {
                    background: rgba(241, 245, 249, 0.7) !important;
                    color: #475569 !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.5px !important;
                    border-bottom: 1px solid #e2e8f0 !important;
                }
                .my-eval-table .ant-table-tbody > tr > td {
                    border-bottom: 1px solid #f8fafc !important;
                    padding: 12px 16px !important;
                }
                .kpi-card {
                    border-radius: 16px !important;
                    background: #ffffff !important;
                    box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.06), 0 2px 8px -1px rgba(148, 163, 184, 0.03) !important;
                    border: 1px solid #e2e8f0 !important;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    position: relative !important;
                    overflow: hidden !important;
                }
                .kpi-card:hover {
                    box-shadow: 0 16px 28px -4px rgba(148, 163, 184, 0.1), 0 4px 12px -2px rgba(148, 163, 184, 0.04) !important;
                    transform: translateY(-4px);
                }
                .kpi-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    transition: all 0.3s ease;
                }
                .kpi-title {
                    color: #64748b !important;
                    font-weight: 600 !important;
                    font-size: 11px !important;
                    text-transform: uppercase;
                    letter-spacing: 0.8px;
                    display: block;
                    margin-bottom: 8px;
                }
                .kpi-value {
                    font-weight: 800 !important;
                    font-size: 28px !important;
                    color: #0f172a !important; /* Deep Slate - Premium Neutral Dark */
                    line-height: 1.2;
                    letter-spacing: -0.5px;
                    display: inline-block;
                }
                .kpi-icon-wrapper {
                    width: 48px;
                    height: 48px;
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .kpi-card:hover .kpi-icon-wrapper {
                    transform: scale(1.08) translateY(-2px);
                }
                
                /* Subtle colored themes for cards with radial glows and top gradient borders */
                .kpi-improvement {
                    background: radial-gradient(circle at top right, rgba(244, 63, 94, 0.03), transparent 60%) #ffffff !important;
                }
                .kpi-improvement::before {
                    background: linear-gradient(90deg, #f43f5e, #fda4af);
                }
                .kpi-improvement .kpi-icon-wrapper {
                    background: linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%) !important;
                    color: #e11d48 !important;
                    border: 1px solid #ffe4e6 !important;
                }
                .kpi-improvement:hover {
                    border-color: #fca5a5 !important;
                }
                .kpi-improvement:hover .kpi-icon-wrapper {
                    box-shadow: 0 4px 12px rgba(225, 29, 72, 0.15) !important;
                }
                
                .kpi-completion {
                    background: radial-gradient(circle at top right, rgba(16, 185, 129, 0.03), transparent 60%) #ffffff !important;
                }
                .kpi-completion::before {
                    background: linear-gradient(90deg, #10b981, #34d399);
                }
                .kpi-completion .kpi-icon-wrapper {
                    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%) !important;
                    color: #059669 !important;
                    border: 1px solid #d1fae5 !important;
                }
                .kpi-completion:hover {
                    border-color: #a7f3d0 !important;
                }
                .kpi-completion:hover .kpi-icon-wrapper {
                    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.15) !important;
                }
                
                .kpi-average {
                    background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.03), transparent 60%) #ffffff !important;
                }
                .kpi-average::before {
                    background: linear-gradient(90deg, #3b82f6, #93c5fd);
                }
                .kpi-average .kpi-icon-wrapper {
                    background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
                    color: #2563eb !important;
                    border: 1px solid #dbeafe !important;
                }
                .kpi-average:hover {
                    border-color: #bfdbfe !important;
                }
                .kpi-average:hover .kpi-icon-wrapper {
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15) !important;
                }
                
                .kpi-excellent {
                    background: radial-gradient(circle at top right, rgba(245, 158, 11, 0.03), transparent 60%) #ffffff !important;
                }
                .kpi-excellent::before {
                    background: linear-gradient(90deg, #d97706, #fcd34d);
                }
                .kpi-excellent .kpi-icon-wrapper {
                    background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%) !important;
                    color: #d97706 !important;
                    border: 1px solid #fef3c7 !important;
                }
                .kpi-excellent:hover {
                    border-color: #fde047 !important;
                }
                .kpi-excellent:hover .kpi-icon-wrapper {
                    box-shadow: 0 4px 12px rgba(217, 119, 6, 0.15) !important;
                }

                .filter-card {
                    border-radius: 16px !important;
                    border: 1px solid #e2e8f0 !important;
                    margin-bottom: 24px !important;
                    box-shadow: 0 4px 18px -4px rgba(50, 50, 93, 0.03), 0 2px 6px -2px rgba(0, 0, 0, 0.02) !important;
                    background: #ffffff !important;
                }
                .chart-card {
                    border-radius: 16px !important;
                    border: 1px solid #e2e8f0 !important;
                    box-shadow: 0 4px 18px -4px rgba(50, 50, 93, 0.03), 0 2px 6px -2px rgba(0, 0, 0, 0.02) !important;
                    background: #ffffff !important;
                    overflow: hidden !important;
                }
                .chart-card .ant-card-head {
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding: 0 24px !important;
                    min-height: 56px !important;
                }
                .chart-card .ant-card-head-title {
                    font-size: 15px !important;
                    font-weight: 700 !important;
                    color: #1e293b !important;
                }
                .chart-card .ant-card-body {
                    padding: 24px !important;
                }
            `}</style>

            {/* KPI CARDS */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card className="kpi-card kpi-completion" variant="borderless" styles={{ body: { padding: "20px 24px" } }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <span className="kpi-title">Tỷ lệ hoàn thành</span>
                                <span className="kpi-value">{completionRate}%</span>
                            </div>
                            <div className="kpi-icon-wrapper">
                                <CheckSquareOutlined />
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card className="kpi-card kpi-average" variant="borderless" styles={{ body: { padding: "20px 24px" } }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <span className="kpi-title">Điểm trung bình</span>
                                <span className="kpi-value">{averageScore}</span>
                            </div>
                            <div className="kpi-icon-wrapper">
                                <StarOutlined />
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card className="kpi-card kpi-excellent" variant="borderless" styles={{ body: { padding: "20px 24px" } }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <span className="kpi-title">Tỷ lệ Xuất sắc</span>
                                <span className="kpi-value">{excellentRate}%</span>
                            </div>
                            <div className="kpi-icon-wrapper">
                                <TrophyOutlined />
                            </div>
                        </div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card className="kpi-card kpi-improvement" variant="borderless" styles={{ body: { padding: "20px 24px" } }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <span className="kpi-title">Cần cải thiện</span>
                                <span className="kpi-value">
                                    {completedWithScores.length > 0 ? (((completedWithScores.filter(r => r.finalGrade === 'D' || r.finalGrade === 'E').length) / completedWithScores.length) * 100).toFixed(1) : "0.0"}%
                                </span>
                            </div>
                            <div className="kpi-icon-wrapper">
                                <StopOutlined />
                            </div>
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* FILTERS */}
            <Card className="filter-card" styles={{ body: { padding: 24 } }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20, borderBottom: "1px solid #f1f5f9", paddingBottom: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <FilterOutlined style={{ color: "#722ed1", fontSize: 16 }} />
                        <span style={{ fontWeight: 700, color: "#1e293b", fontSize: 15 }}>Bộ lọc dữ liệu</span>
                    </div>
                    <Dropdown menu={{ items: exportMenuItems }} trigger={["click"]} disabled={!filteredRecords.length}>
                        <Button
                            type="primary"
                            icon={<FileExcelOutlined />}
                            style={{ borderRadius: 8, fontWeight: 600 }}
                        >
                            Xuất Excel <DownOutlined />
                        </Button>
                    </Dropdown>
                </div>
                <Row gutter={[24, 16]}>
                    <Col xs={24} md={8} lg={6}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontWeight: 600, color: "#475569", fontSize: 12 }}>Kỳ đánh giá:</span>
                            <Select
                                style={{ width: "100%" }}
                                value={selectedPeriod}
                                onChange={setSelectedPeriod}
                                options={periods.map(p => ({
                                    label: `${p.name}${p.company?.name ? ` - ${p.company.name}` : ""}`,
                                    value: p.id,
                                }))}
                                placeholder={selectedCompany ? "Tìm kỳ theo công ty đã chọn" : "Tìm kỳ đánh giá"}
                                loading={periodLoading}
                                showSearch
                                filterOption={false}
                                onSearch={setPeriodSearch}
                                onOpenChange={(open) => {
                                    if (open) fetchPeriods(periodSearch, selectedCompany, false);
                                }}
                                notFoundContent={periodLoading ? "Đang tải..." : "Không tìm thấy kỳ đánh giá"}
                                allowClear
                                popupMatchSelectWidth={false}
                            />
                        </div>
                    </Col>
                    <Col xs={24} md={8} lg={6}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontWeight: 600, color: "#475569", fontSize: 12 }}>Công ty:</span>
                            <Select
                                style={{ width: "100%" }}
                                value={selectedCompany}
                                onChange={handleCompanyChange}
                                options={companies.map(c => ({ label: c.name, value: c.id }))}
                                placeholder="Tất cả công ty"
                                allowClear
                                popupMatchSelectWidth={false}
                            />
                        </div>
                    </Col>
                    <Col xs={24} md={8} lg={6}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontWeight: 600, color: "#475569", fontSize: 12 }}>Phòng ban:</span>
                            <Select
                                style={{ width: "100%" }}
                                value={selectedDepartment}
                                onChange={handleDepartmentChange}
                                options={departments.map(d => ({ label: d.name, value: d.id }))}
                                placeholder="Tất cả phòng ban"
                                disabled={!selectedCompany}
                                allowClear
                                popupMatchSelectWidth={false}
                            />
                        </div>
                    </Col>
                    <Col xs={24} md={8} lg={6}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontWeight: 600, color: "#475569", fontSize: 12 }}>Bộ phận:</span>
                            <Select
                                style={{ width: "100%" }}
                                value={selectedSection}
                                onChange={setSelectedSection}
                                options={sections.map(s => ({ label: s.name, value: s.id }))}
                                placeholder="Tất cả bộ phận"
                                disabled={!selectedDepartment}
                                allowClear
                                popupMatchSelectWidth={false}
                            />
                        </div>
                    </Col>
                    <Col xs={24} md={8} lg={6}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontWeight: 600, color: "#475569", fontSize: 12 }}>Tìm kiếm nhân sự:</span>
                            <Input
                                placeholder="Tên hoặc email..."
                                prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                allowClear
                            />
                        </div>
                    </Col>
                    <Col xs={24} md={8} lg={6}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontWeight: 600, color: "#475569", fontSize: 12 }}>Trạng thái:</span>
                            <Select
                                style={{ width: "100%" }}
                                value={filterStatus}
                                onChange={setFilterStatus}
                                options={Object.entries(STATUS_CONFIG).map(([key, val]) => ({ label: val.text, value: key }))}
                                placeholder="Tất cả trạng thái"
                                allowClear
                            />
                        </div>
                    </Col>
                    <Col xs={24} md={8} lg={6}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            <span style={{ fontWeight: 600, color: "#475569", fontSize: 12 }}>Xếp loại:</span>
                            <Select
                                style={{ width: "100%" }}
                                value={filterGrade}
                                onChange={setFilterGrade}
                                options={Object.entries(GRADE_CONFIG).map(([key, val]) => ({ label: `${key} - ${val.label}`, value: key }))}
                                placeholder="Tất cả xếp loại"
                                allowClear
                            />
                        </div>
                    </Col>
                </Row>
            </Card>

            {/* CHARTS */}
            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={9}>
                    <Card title={<span style={{ fontWeight: 700, color: "#1e293b" }}>Tổng quan trạng thái</span>} className="chart-card">
                        {filterStatus && (
                            <Tag
                                closable
                                onClose={() => setFilterStatus(undefined)}
                                color={STATUS_CONFIG[filterStatus]?.tagColor}
                                style={{ marginBottom: 12, fontWeight: 600 }}
                            >
                                Đang lọc: {STATUS_CONFIG[filterStatus]?.text || filterStatus}
                            </Tag>
                        )}
                        {statusData.length > 0 ? (
                            <Pie
                                data={statusData}
                                angleField="value"
                                colorField="type"
                                radius={0.8}
                                innerRadius={0.65}
                                scale={{
                                    color: {
                                        domain: ['Chưa bắt đầu', 'NV đang đánh giá', 'Chờ QL chấm', 'QL đang chấm', 'Chờ phê duyệt', 'Yêu cầu sửa đổi', 'Hoàn tất'],
                                        range: ['#94a3b8', '#3b82f6', '#f59e0b', '#722ed1', '#06b6d4', '#ff4d4f', '#52c41a']
                                    }
                                }}
                                label={{
                                    type: 'inner',
                                    offset: '-50%',
                                    content: '{value}',
                                    style: {
                                        textAlign: 'center',
                                        fontSize: 14,
                                        fill: '#fff',
                                        fontWeight: 'bold',
                                    },
                                }}
                                legend={{
                                    color: {
                                        title: false,
                                        position: 'bottom',
                                        rowPadding: 5,
                                    },
                                }}
                                interactions={[
                                    { type: 'element-selected' },
                                    { type: 'element-active' }
                                ]}
                                onReady={(plot: any) => bindChartClick(plot, handleStatusDrilldown)}
                                height={280}
                            />
                        ) : (
                            <div style={{ display: "flex", height: 280, alignItems: "center", justifyContent: "center" }}>
                                <Empty description="Không có dữ liệu" />
                            </div>
                        )}
                    </Card>
                </Col>
                <Col xs={24} md={15}>
                    <Card title={<span style={{ fontWeight: 700, color: "#1e293b" }}>Phân bổ Xếp loại</span>} className="chart-card">
                        {filterGrade && (
                            <Tag
                                closable
                                onClose={() => setFilterGrade(undefined)}
                                color={GRADE_CONFIG[filterGrade]?.color}
                                style={{ marginBottom: 12, fontWeight: 600 }}
                            >
                                Đang lọc: {filterGrade} - {GRADE_CONFIG[filterGrade]?.label}
                            </Tag>
                        )}
                        {gradeData.length > 0 ? (
                            <Column
                                data={gradeData}
                                xField="grade"
                                yField="count"
                                colorField="grade"
                                scale={{
                                    color: {
                                        domain: gradeData.map(g => g.grade),
                                        range: gradeData.map(g => GRADE_CONFIG[g.grade]?.color || "#1677ff")
                                    }
                                }}
                                axis={{
                                    y: {
                                        title: false,
                                        tickCount: Math.max(2, Math.min(5, Math.max(...gradeData.map(g => g.count)) + 1)),
                                        labelFormatter: (value: string) => `${Math.round(Number(value))}`,
                                    },
                                    x: { title: false },
                                }}
                                label={{
                                    text: (d: any) => d.count,
                                    position: 'top',
                                    style: { fill: '#1e293b', fontWeight: 800, fontSize: 16 }
                                }}
                                tooltip={{
                                    formatter: (datum: any) => ({ name: 'Số lượng', value: datum.count })
                                }}
                                legend={false}
                                height={240}
                                style={{
                                    radiusTopLeft: 8,
                                    radiusTopRight: 8,
                                    maxWidth: 64,
                                }}
                                onReady={(plot: any) => bindChartClick(plot, handleGradeDrilldown)}
                            />
                        ) : (
                            <div style={{ display: "flex", height: 280, alignItems: "center", justifyContent: "center" }}>
                                <Empty description="Chưa có hồ sơ nào được xếp loại" />
                            </div>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* DATA TABLE */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 700, color: "#1e293b", fontSize: 16 }}>Danh sách Kết quả Đánh giá</div>
                </div>
                <Table
                    className="my-eval-table"
                    columns={columns}
                    dataSource={filteredRecords}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 15, showTotal: (total) => `Tổng số ${total} bản ghi` }}
                    scroll={{ x: 1000 }}
                    size="middle"
                    locale={{ emptyText: <Empty description="Không tìm thấy kết quả phù hợp" /> }}
                />
            </div>
        </PageContainer>
    );
};

export default CompletedEvaluationsPage;
