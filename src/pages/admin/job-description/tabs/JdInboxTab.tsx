import JobDescriptionTable from "../components/JobDescriptionTable";
import { useJdFlowInboxQuery } from "@/hooks/useJdFlow";

const JdInboxTab = () => {

    const { data, isFetching } = useJdFlowInboxQuery();

    return (
        <JobDescriptionTable
            records={data ?? []}
            loading={isFetching}
            mode="INBOX"
        />
    );
};

export default JdInboxTab;