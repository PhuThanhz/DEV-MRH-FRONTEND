import { useEffect, useRef, useState } from "react";
import type { ActionType } from "@ant-design/pro-components";
import queryString from "query-string";
import { useSearchParams } from "react-router-dom";

import {
    useCompanyProceduresWithFilterQuery,
    useDepartmentProceduresWithFilterQuery,
    useConfidentialProceduresWithFilterQuery,
    useDeleteProcedureMutation,
} from "@/hooks/useProcedure";
import useAccess from "@/hooks/useAccess";
import type { IProcedure, ProcedureType } from "@/types/backend";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { ALL_PERMISSIONS } from "@/config/permissions";

interface UseProcedureTableProps {
    type: ProcedureType;
    companyId?: number;
    departmentId?: number;
}

export const useProcedureTable = ({ type, companyId, departmentId }: UseProcedureTableProps) => {
    const tableRef = useRef<ActionType>(null);
    const isAdmin = useAccess(ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.SHARE_LOG_ALL);
    const canShare = useAccess(ALL_PERMISSIONS.PROCEDURES.CREATE_SHARE_TOKEN); // 👈 thêm

    // ── Modal states ──
    const [openQrModal, setOpenQrModal] = useState(false);
    const [openShareModal, setOpenShareModal] = useState(false);
    const [openPrintModal, setOpenPrintModal] = useState(false);
    const [selectedProcedure, setSelectedProcedure] = useState<IProcedure | null>(null);
    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [openRevise, setOpenRevise] = useState(false);
    const [dataInit, setDataInit] = useState<IProcedure | null>(null);

    // ── Print mode & selection ──
    const [printMode, setPrintMode] = useState(false);
    const [selectedRows, setSelectedRows] = useState<IProcedure[]>([]);

    // ── Handle Auto-Open View Modal from URL ──
    const [searchParams, setSearchParams] = useSearchParams();
    useEffect(() => {
        const viewIdStr = searchParams.get("viewId");
        const tab = searchParams.get("tab")?.toLowerCase();
        
        // If tab=confidential, let ConfidentialProcedureView handle auto-opening
        if (tab === "confidential") {
            return;
        }

        if (viewIdStr) {
            const viewId = Number(viewIdStr);
            if (!isNaN(viewId) && !openView) {
                setDataInit({ id: viewId } as IProcedure);
                setOpenView(true);
                // Xóa param khỏi URL sau khi mở
                searchParams.delete("viewId");
                setSearchParams(searchParams, { replace: true });
            }
        }
    }, [searchParams, setSearchParams, openView]);

    // ── Filter states ──
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [createdAtFilter, setCreatedAtFilter] = useState<string | null>(null);
    const [searchValue, setSearchValue] = useState("");
    const [companyIdFilter, setCompanyIdFilter] = useState<number | null>(companyId ?? null);
    const [departmentIdFilter, setDepartmentIdFilter] = useState<number | null>(departmentId ?? null);
    const [sectionIdFilter, setSectionIdFilter] = useState<number | null>(null);
    const [planYearFilter, setPlanYearFilter] = useState<number | null>(null);
    const [resetSignal, setResetSignal] = useState(0);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    // ── Queries ──
    const companyQuery = useCompanyProceduresWithFilterQuery(
        type === "COMPANY" ? query : "",
        type === "COMPANY"
    );
    const departmentQuery = useDepartmentProceduresWithFilterQuery(
        type === "DEPARTMENT" ? query : "",
        type === "DEPARTMENT"
    );
    const confidentialQuery = useConfidentialProceduresWithFilterQuery(
        type === "CONFIDENTIAL" ? query : "",
        type === "CONFIDENTIAL"
    );

    const { data, isFetching, refetch } =
        type === "COMPANY" ? companyQuery
            : type === "DEPARTMENT" ? departmentQuery
                : confidentialQuery;

    const deleteMutation = useDeleteProcedureMutation(type);

    const meta = data?.meta ?? {
        page: PAGINATION_CONFIG.DEFAULT_PAGE,
        pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        total: 0,
    };
    const procedures = data?.result ?? [];

    // ── Permissions ──
    const permission = {
        view: type === "COMPANY" ? ALL_PERMISSIONS.PROCEDURE_COMPANY.GET_BY_ID
            : type === "DEPARTMENT" ? ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.GET_BY_ID
                : ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.GET_BY_ID,
        update: type === "COMPANY" ? ALL_PERMISSIONS.PROCEDURE_COMPANY.UPDATE
            : type === "DEPARTMENT" ? ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.UPDATE
                : ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.UPDATE,
        revise: type === "COMPANY" ? ALL_PERMISSIONS.PROCEDURE_COMPANY.REVISE
            : type === "DEPARTMENT" ? ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.REVISE
                : ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.REVISE,
        delete: type === "COMPANY" ? ALL_PERMISSIONS.PROCEDURE_COMPANY.DELETE
            : type === "DEPARTMENT" ? ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.DELETE
                : ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.DELETE,
        create: type === "COMPANY" ? ALL_PERMISSIONS.PROCEDURE_COMPANY.CREATE
            : type === "DEPARTMENT" ? ALL_PERMISSIONS.PROCEDURE_DEPARTMENT.CREATE
                : ALL_PERMISSIONS.PROCEDURE_CONFIDENTIAL.CREATE,
        shareToken: ALL_PERMISSIONS.PROCEDURES.CREATE_SHARE_TOKEN,
    };

    const canView = useAccess(permission.view);
    const canUpdate = useAccess(permission.update);
    const canRevise = useAccess(permission.revise);
    const canDelete = useAccess(permission.delete);

    // ── Filter builder ──
    const buildFilters = (
        search: string,
        status: string | null,
        createdAt: string | null,
        cmpId: number | null,
        deptId: number | null,
        sectId: number | null,
        planYear: number | null,
    ) => {
        const parts: string[] = [];
        const companyPath = type === "DEPARTMENT" ? "departments.company.id" : "department.company.id";
        const deptPath = type === "DEPARTMENT" ? "departments.id" : "department.id";

        if (companyId) parts.push(`${companyPath}:${companyId}`);
        if (departmentId) parts.push(`${deptPath}:${departmentId}`);
        if (search) parts.push(`procedureName~'${search}'`);
        if (status) parts.push(`status='${status}'`);
        if (createdAt) parts.push(createdAt);
        if (!companyId && cmpId) parts.push(`${companyPath}:${cmpId}`);
        if (!departmentId && deptId) parts.push(`${deptPath}:${deptId}`);
        if (sectId) parts.push(`section.id:${sectId}`);
        if (planYear) parts.push(`planYear=${planYear}`);
        return parts;
    };

    // ── Sync query on filter change ──
    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };
        const filters = buildFilters(
            searchValue, statusFilter, createdAtFilter,
            companyIdFilter, departmentIdFilter, sectionIdFilter, planYearFilter
        );
        if (filters.length > 0) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [
        searchValue, statusFilter, createdAtFilter,
        companyIdFilter, departmentIdFilter, sectionIdFilter, planYearFilter,
        type, companyId, departmentId,
    ]);

    const buildQuery = (params: any, sort: any) => {
        const q: any = {
            page: params.current,
            size: params.pageSize || PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
        };
        const filters = buildFilters(
            searchValue, statusFilter, createdAtFilter,
            companyIdFilter, departmentIdFilter, sectionIdFilter, planYearFilter
        );
        if (filters.length > 0) q.filter = filters.join(" and ");
        let sortBy = "sort=createdAt,desc";
        if (sort?.procedureName)
            sortBy = sort.procedureName === "ascend" ? "sort=procedureName,asc" : "sort=procedureName,desc";
        return `${queryString.stringify(q, { encode: false })}&${sortBy}`;
    };

    const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
        const nextQuery = buildQuery(
            {
                current: pagination?.current ?? PAGINATION_CONFIG.DEFAULT_PAGE,
                pageSize: pagination?.pageSize ?? PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            },
            sorter,
        );
        setQuery(nextQuery);
    };

    // ── Handlers ──
    const handleReset = () => {
        setSearchValue("");
        setStatusFilter(null);
        setCreatedAtFilter(null);
        setCompanyIdFilter(null);
        setSectionIdFilter(null);
        setPlanYearFilter(null);
        setSelectedRows([]);
        setPrintMode(false);
        setResetSignal((s) => s + 1);
        refetch();
    };

    const handleExitPrintMode = () => {
        setPrintMode(false);
        setSelectedRows([]);
    };

    const handlePrintButtonClick = () => {
        if (!printMode) {
            setPrintMode(true);
        } else if (selectedRows.length > 0) {
            setOpenPrintModal(true);
        }
    };

    return {
        tableRef,
        procedures, meta, isFetching, refetch, deleteMutation,
        permission, isAdmin,
        canShare, // 👈 thêm
        canView, canUpdate, canRevise, canDelete,
        openQrModal, setOpenQrModal,
        openShareModal, setOpenShareModal,
        openPrintModal, setOpenPrintModal,
        selectedProcedure, setSelectedProcedure,
        openModal, setOpenModal,
        openView, setOpenView,
        openRevise, setOpenRevise,
        dataInit, setDataInit,
        printMode, selectedRows, setSelectedRows,
        resetSignal,
        setSearchValue,
        setStatusFilter,
        setCreatedAtFilter,
        setCompanyIdFilter,
        setDepartmentIdFilter,
        setSectionIdFilter,
        setPlanYearFilter,
        buildQuery,
        handleTableChange,
        handleReset,
        handleExitPrintMode,
        handlePrintButtonClick,
    };
};
