import { useState } from "react";
import SearchFilter from "@/components/common/filter/SearchFilter";

import JobDescriptionTable from "../components/JobDescriptionTable";
import ModalJobDescription from "../modal.job-description";

import { useMyJobDescriptionsQuery } from "@/hooks/useJobDescriptions";
import { PAGINATION_CONFIG } from "@/config/pagination";

const MyJobDescriptionsTab = () => {

    const [query, setQuery] = useState(
        `page=${PAGINATION_CONFIG.DEFAULT_PAGE}&size=${PAGINATION_CONFIG.DEFAULT_PAGE_SIZE}&sort=createdAt,desc`
    );

    const { data, isFetching } = useMyJobDescriptionsQuery(query);

    const [openModal, setOpenModal] = useState(false);

    return (
        <>
            <SearchFilter
                searchPlaceholder="Tìm theo mã JD..."
                addLabel="Thêm JD"
                showFilterButton={false}
                onSearch={() => { }}
                onReset={() => { }}
                onAddClick={() => {
                    setOpenModal(true);
                }}
            />

            <JobDescriptionTable
                records={data?.result ?? []}
                loading={isFetching}
                meta={data?.meta}
                onQueryChange={setQuery}
                mode="MY"
            />

            <ModalJobDescription
                open={openModal}
                onClose={() => setOpenModal(false)}
                editRecord={null}
            />
        </>
    );
};

export default MyJobDescriptionsTab;