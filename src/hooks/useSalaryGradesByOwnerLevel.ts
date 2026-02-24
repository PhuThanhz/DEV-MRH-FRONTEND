// src/hooks/useSalaryGradesByOwnerLevel.ts

import { useCompanySalaryGradesQuery } from "@/hooks/useCompanySalaryGrades";
import { useDepartmentSalaryGradesQuery } from "@/hooks/useDepartmentSalaryGrades";
import { useSectionSalaryGradesQuery } from "@/hooks/useSectionSalaryGrades";

type OwnerLevel = "COMPANY" | "DEPARTMENT" | "SECTION";

export const useSalaryGradesByOwnerLevel = (
    ownerLevel: OwnerLevel,
    ownerJobTitleId: number
) => {
    let result:
        | ReturnType<typeof useCompanySalaryGradesQuery>
        | ReturnType<typeof useDepartmentSalaryGradesQuery>
        | ReturnType<typeof useSectionSalaryGradesQuery>;

    if (ownerLevel === "COMPANY") {
        result = useCompanySalaryGradesQuery(ownerJobTitleId);
    } else if (ownerLevel === "DEPARTMENT") {
        result = useDepartmentSalaryGradesQuery(ownerJobTitleId);
    } else {
        result = useSectionSalaryGradesQuery(ownerJobTitleId);
    }

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
