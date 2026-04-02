import { useState } from "react";
import SearchFilter from "@/components/common/filter/SearchFilter";

import JobDescriptionTable from "../components/JobDescriptionTable";
import ModalJobDescription from "../modal.job-description";

import { useMyJobDescriptionsQuery } from "@/hooks/useJobDescriptions";
import { PAGINATION_CONFIG } from "@/config/pagination";
import { ALL_PERMISSIONS } from "@/config/permissions";
import useAccess from "@/hooks/useAccess";

const MyJobDescriptionsTab = () => {

    const canAdd = useAccess(ALL_PERMISSIONS.JOB_DESCRIPTIONS.CREATE);
    console.log("=== canAddJD:", canAdd);

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
                addPermission={ALL_PERMISSIONS.JOB_DESCRIPTIONS.CREATE}
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