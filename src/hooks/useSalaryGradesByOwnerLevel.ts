// src/hooks/useSalaryGradesByOwnerLevel.ts

import { useCompanySalaryGradesQuery } from "@/hooks/useCompanySalaryGrades";
import { useDepartmentSalaryGradesQuery } from "@/hooks/useDepartmentSalaryGrades";
import { useSectionSalaryGradesQuery } from "@/hooks/useSectionSalaryGrades";

type OwnerLevel = "COMPANY" | "DEPARTMENT" | "SECTION";

export const useSalaryGradesByOwnerLevel = (
    ownerLevel: OwnerLevel,
    ownerJobTitleId: number
) => {
    const companyResult = useCompanySalaryGradesQuery(ownerLevel === "COMPANY" ? ownerJobTitleId : undefined);
    const departmentResult = useDepartmentSalaryGradesQuery(ownerLevel === "DEPARTMENT" ? ownerJobTitleId : undefined);
    const sectionResult = useSectionSalaryGradesQuery(ownerLevel === "SECTION" ? ownerJobTitleId : undefined);

    const result =
        ownerLevel === "COMPANY" ? companyResult :
        ownerLevel === "DEPARTMENT" ? departmentResult :
        sectionResult;

    // ⭐ LỌC ACTIVE + chuẩn hóa data
    const normalized =
        (result.data ?? [])
            .filter((g: any) => g.active) // <<<<< QUAN TRỌNG
            .map((g: any) => ({
                id: g.id,
                gradeLevel: g.gradeLevel,
            }));

    return {
        data: normalized,
        isLoading: result.isLoading,
        isFetching: result.isFetching,
        refetch: result.refetch,
    };
};
