import JobDescriptionTable from "../components/JobDescriptionTable";
import { useJobDescriptionsQuery } from "@/hooks/useJobDescriptions";

const PublishedJdTab = () => {

    const { data, isFetching } = useJobDescriptionsQuery(
        "page=1&pageSize=20&filter=status='PUBLISHED'"
    );

    return (
        <JobDescriptionTable
            records={data?.result || []}
            loading={isFetching}
            mode="PUBLISHED"
        />
    );
};

export default PublishedJdTab;