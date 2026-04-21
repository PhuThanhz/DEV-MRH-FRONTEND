import { useState, useEffect } from "react";
import queryString from "query-string";
import JobDescriptionTable from "../components/JobDescriptionTable";
import { useRejectedJobDescriptionsQuery } from "@/hooks/useJobDescriptions"; // ← ĐỔI
import { PAGINATION_CONFIG } from "@/config/pagination";

const RejectedJdTab = () => {
    const [searchValue, setSearchValue] = useState("");
    const [dateFilter, setDateFilter] = useState<string | null>(null);
    const [resetSignal, setResetSignal] = useState(0);

    const [query, setQuery] = useState( // ← BỎ filter=status='REJECTED'
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=updatedAt,desc`
    );

    const { data, isFetching, refetch } = useRejectedJobDescriptionsQuery(query); // ← ĐỔI

    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "updatedAt,desc",
        };
        const filters: string[] = []; // ← BỎ status='REJECTED'
        if (searchValue) filters.push(`code~'${searchValue}'`);
        if (dateFilter) filters.push(dateFilter);
        if (filters.length) q.filter = filters.join(" and ");
        setQuery(queryString.stringify(q, { encode: false }));
    }, [searchValue, dateFilter]);

    return (
        <JobDescriptionTable
            records={data?.result ?? []}
            loading={isFetching}
            meta={data?.meta}
            onQueryChange={setQuery}
            onSearch={setSearchValue}
            onReset={() => {
                setSearchValue("");
                setDateFilter(null);
                setResetSignal(s => s + 1);
                refetch();
            }}
            onDateChange={setDateFilter}
            resetSignal={resetSignal}
            hideStatusFilter={true}
            mode="ALL"
        />
    );
};

export default RejectedJdTab;