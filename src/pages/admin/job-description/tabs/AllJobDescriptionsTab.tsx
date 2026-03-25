import { useState } from "react";
import JobDescriptionTable from "../components/JobDescriptionTable";
import { useJobDescriptionsQuery } from "@/hooks/useJobDescriptions";
import { PAGINATION_CONFIG } from "@/config/pagination";

const AllJobDescriptionsTab = () => {
    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const { data, isFetching } = useJobDescriptionsQuery(query);

    return (
        <JobDescriptionTable
            records={data?.result ?? []}
            loading={isFetching}
            meta={data?.meta}
            onQueryChange={setQuery}
            mode="ALL"
        />
    );
};

export default AllJobDescriptionsTab;