import { useState, useEffect } from "react";
import queryString from "query-string";
import JobDescriptionTable from "../components/JobDescriptionTable";
import { useJobDescriptionsQuery } from "@/hooks/useJobDescriptions";
import { PAGINATION_CONFIG } from "@/config/pagination";

const PublishedJdTab = () => {
    const [searchValue, setSearchValue] = useState("");
    const [dateFilter, setDateFilter] = useState<string | null>(null);
    const [resetSignal, setResetSignal] = useState(0);

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc&filter=status='PUBLISHED'`
    );

    const { data, isFetching, refetch } = useJobDescriptionsQuery(query);

    useEffect(() => {
        const q: any = {
            page: PAGINATION_CONFIG.DEFAULT_PAGE,
            size: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE,
            sort: "createdAt,desc",
        };
        const filters: string[] = [`status='PUBLISHED'`];
        if (searchValue) filters.push(`code~'${searchValue}'`);
        if (dateFilter) filters.push(dateFilter);
        q.filter = filters.join(" and ");
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
            mode="PUBLISHED"
        />
    );
};

export default PublishedJdTab;