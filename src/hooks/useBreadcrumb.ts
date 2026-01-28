import { useLocation } from "react-router-dom";
import { breadcrumbNameMap } from "@/config/breadcrumb";

export const useBreadcrumb = () => {
    const location = useLocation();
    const pathnames = location.pathname.split("/").filter(Boolean);

    const items = pathnames.map((_, index) => {
        const path = "/" + pathnames.slice(0, index + 1).join("/");
        return {
            path,
            label: breadcrumbNameMap[path] || pathnames[index],
            isLast: index === pathnames.length - 1,
        };
    });

    return items;
};
