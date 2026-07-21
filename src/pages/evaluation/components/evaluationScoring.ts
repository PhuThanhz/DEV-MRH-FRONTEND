export const SCORE_VALUES = [1, 2, 3, 4, 5] as const;

export const SCORE_DESCRIPTIONS: Record<number, string> = {
    1: "Yếu",
    2: "Trung bình",
    3: "Khá",
    4: "Tốt",
    5: "Xuất sắc",
};

export type EvaluationScoreRole = "EMPLOYEE" | "MANAGER" | "APPROVER";

const scoreLookupCache = new WeakMap<any[], Map<EvaluationScoreRole, Map<number, any>>>();
const sectionLookupCache = new WeakMap<any, Map<number, any>>();

export const formatWeight = (weight: number | null | undefined): string => {
    if (weight == null || !Number.isFinite(weight)) return "—";
    const pct = weight * 100;
    // Giữ tối đa 1 chữ số thập phân, bỏ số 0 dư (7.50 → "7.5%", 15.0 → "15%")
    const formatted = parseFloat(pct.toFixed(1));
    return `${formatted}%`;
};

export const formatScoreResult = (val: number | null | undefined): string => {
    if (val == null) return "—";
    const rounded = Math.round((val + Number.EPSILON) * 1000) / 1000;
    const str = rounded.toString();
    const parts = str.split(".");
    if (parts.length === 1) return str + ".00";
    if (parts[1].length === 1) return str + "0";
    return str;
};

const getScoreLookup = (scores: any[], by: EvaluationScoreRole) => {
    if (!Array.isArray(scores) || scores.length === 0) return new Map<number, any>();

    let roleLookup = scoreLookupCache.get(scores);
    if (!roleLookup) {
        roleLookup = new Map();
        scoreLookupCache.set(scores, roleLookup);
    }

    const cached = roleLookup.get(by);
    if (cached) return cached;

    const lookup = new Map<number, any>();
    scores.forEach(score => {
        if (score?.scoredBy === by) {
            lookup.set(score.criteriaId, score);
        }
    });
    roleLookup.set(by, lookup);
    return lookup;
};

export const getScore = (scores: any[], criteriaId: number, by: EvaluationScoreRole) =>
    getScoreLookup(scores, by).get(criteriaId)?.score ?? null;

export const getWeightedScore = (scores: any[], criteriaId: number, by: EvaluationScoreRole) =>
    getScoreLookup(scores, by).get(criteriaId)?.weightedScore ?? null;

export const getSectionScore = (summary: any, sectionId: number, by: EvaluationScoreRole) => {
    if (!summary?.sections?.length) return null;

    let lookup = sectionLookupCache.get(summary);
    if (!lookup) {
        const next = new Map<number, any>();
        summary.sections.forEach((item: any) => {
            next.set(item.sectionId, item);
        });
        sectionLookupCache.set(summary, next);
        lookup = next;
    }

    const section = lookup.get(sectionId);
    if (!section) return null;
    if (by === "EMPLOYEE") return section.employeeScore ?? null;
    if (by === "MANAGER") return section.managerScore ?? null;
    return section.approverScore ?? null;
};

export const getTotalScore = (summary: any, by: EvaluationScoreRole) => {
    if (by === "EMPLOYEE") return summary?.employeeTotalScore ?? null;
    if (by === "MANAGER") return summary?.managerTotalScore ?? null;
    return summary?.approverTotalScore ?? null;
};

export const getLeafCriteria = (templateSections?: any[]) => {
    if (!templateSections?.length) return [];
    return templateSections.flatMap(section =>
        (section.criteria ?? []).flatMap((criteria: any) =>
            !criteria.subCriteria?.length ? [criteria] : criteria.subCriteria,
        ),
    );
};

export const getTemplateStructureIssues = (sections?: any[]) => {
    if (!sections?.length) {
        return [{ message: "Mẫu đánh giá chưa có phần đánh giá nào." }];
    }

    const issues: { sectionId?: number; message: string }[] = [];
    let totalSectionWeight = 0;

    sections.forEach(section => {
        const sectionWeight = Number(section.weight);
        if (!Number.isFinite(sectionWeight) || sectionWeight <= 0 || sectionWeight > 1) {
            issues.push({ sectionId: section.id, message: `Phần "${section.name}" có trọng số không hợp lệ.` });
            return;
        }
        totalSectionWeight += sectionWeight;

        const criteria = section.criteria ?? [];
        if (!criteria.length) {
            issues.push({
                sectionId: section.id,
                message: `Phần "${section.name}" có trọng số ${(sectionWeight * 100).toFixed(0)}% nhưng chưa được cấu hình tiêu chí.`,
            });
            return;
        }

        criteria.forEach((criterion: any) => {
            const scorableCriteria = criterion.subCriteria?.length ? criterion.subCriteria : [criterion];
            scorableCriteria.forEach((scorable: any) => {
                const levels = scorable.levels ?? [];
                const validLevels = new Set(
                    levels
                        .filter((level: any) => level.description?.trim() && SCORE_VALUES.includes(level.level))
                        .map((level: any) => level.level),
                );
                if (levels.length !== 5 || validLevels.size !== 5) {
                    issues.push({
                        sectionId: section.id,
                        message: `Tiêu chí "${scorable.name}" chưa có đầy đủ mô tả cho 5 mức điểm.`,
                    });
                }
            });
        });
    });

    if (Math.abs(totalSectionWeight - 1) > 0.001) {
        issues.push({ message: `Tổng trọng số các phần phải bằng 100% (hiện tại ${(totalSectionWeight * 100).toFixed(1)}%).` });
    }
    return issues;
};
