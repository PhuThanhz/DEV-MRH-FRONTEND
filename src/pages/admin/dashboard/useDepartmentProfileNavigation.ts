import { useNavigate } from "react-router-dom";
import { useDeptNavPages } from "@/hooks/useDeptNavPages";
import type { IDepartmentCompleteness } from "@/types/backend";
import { CRITERIA_MAP } from "./departmentProfileCriteria";

export const useDepartmentProfileNavigation = () => {
    const navigate = useNavigate();
    const navPages = useDeptNavPages();

    const getNavPage = (key: keyof IDepartmentCompleteness) => {
        const config = CRITERIA_MAP[key];
        if (!config) return null;
        return navPages.find(p => p.pathTemplate === config.pathTemplate) || null;
    };

    const hasPermission = (key: keyof IDepartmentCompleteness) => {
        const page = getNavPage(key);
        return page ? page.visible !== false : false;
    };

    const navigateToCriterion = (key: keyof IDepartmentCompleteness, departmentId: number, departmentName?: string) => {
        const config = CRITERIA_MAP[key];
        if (!config) return;
        const path = config.pathTemplate.replace(":departmentId", String(departmentId));
        navigate(path + (departmentName ? `?departmentName=${encodeURIComponent(departmentName)}` : ""), {
            state: {
                from: window.location.pathname + window.location.search,
                departmentId,
                departmentName
            }
        });
    };

    return {
        hasPermission,
        navigateToCriterion,
        getNavPage,
    };
};
