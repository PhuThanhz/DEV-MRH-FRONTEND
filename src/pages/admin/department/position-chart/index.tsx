import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useDepartmentByIdQuery } from "@/hooks/useDepartments";
import PageContainer from "@/components/common/data-table/PageContainer";
import DeptPageNav from "@/components/common/navigation/DeptPageNav";
import { useDeptNavPages } from "@/hooks/useDeptNavPages";
import PositionChartContent from "./PositionChartContent";

import { useState } from "react";
const PositionChartPage = () => {
    const { departmentId } = useParams<{ departmentId: string }>();
    const { data: department } = useDepartmentByIdQuery(Number(departmentId));
    const [searchParams] = useSearchParams();
    const departmentName = searchParams.get("departmentName") || department?.name || "";
    const deptNavPages = useDeptNavPages();
    const navigate = useNavigate();

    const [open, setOpen] = useState(true);

    const handleClose = () => {
        setOpen(false);
        setTimeout(() => navigate(-1), 300);
    };

    return (
        <PageContainer title="">
            <PositionChartContent
                open={open}
                onClose={handleClose}
                departmentId={Number(departmentId)}
                departmentName={departmentName}
            />
            <DeptPageNav pages={deptNavPages} />
        </PageContainer>
    );
};

export default PositionChartPage;