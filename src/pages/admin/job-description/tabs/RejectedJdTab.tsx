import JobDescriptionTable from "../components/JobDescriptionTable";
import { useJobDescriptionsQuery } from "@/hooks/useJobDescriptions";

const RejectedJdTab = () => {

    const { data, isFetching } = useJobDescriptionsQuery(
        "filter=status='REJECTED'&page=1&pageSize=20&sort=updatedAt,desc"
    );

    return (
        <JobDescriptionTable
            records={data?.result ?? []}
            loading={isFetching}
            mode="MY"
        />
    );
};

export default RejectedJdTab;