import { useState, useEffect } from "react";
import queryString from "query-string";
import JobDescriptionTable from "../components/JobDescriptionTable";
import { useMyJobDescriptionsQuery } from "@/hooks/useJobDescriptions";
import { PAGINATION_CONFIG } from "@/config/pagination";

const MyJobDescriptionsTab = () => {
    const [searchValue, setSearchValue] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState<string | null>(null);
    const [resetSignal, setResetSignal] = useState(0);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const { data, isFetching, refetch } = useMyJobDescriptionsQuery(query);

    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };
        const filters: string[] = [];
        if (searchValue) filters.push(`code~'${searchValue}'`);
        if (statusFilter) filters.push(`status='${statusFilter}'`);
        if (dateFilter) filters.push(dateFilter);
        if (filters.length) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, statusFilter, dateFilter]);

    return (
        <JobDescriptionTable
            records={data?.result ?? []}
            loading={isFetching}
            meta={data?.meta}
            onQueryChange={setQuery}
            onSearch={setSearchValue}
            onReset={() => {
                setSearchValue("");
                setStatusFilter(null);
                setDateFilter(null);
                setResetSignal(s => s + 1);
                refetch();
            }}
            onFilterChange={(filters) => setStatusFilter(filters.status ?? null)}
            onDateChange={setDateFilter}
            resetSignal={resetSignal}
            showAdd={true}
            mode="MY"
        />
    );
};

export default MyJobDescriptionsTab;