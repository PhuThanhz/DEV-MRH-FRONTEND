import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CloseOutlined } from "@ant-design/icons";

interface DeptPage {
    label: string;
    pathTemplate: string;
    visible?: boolean;
}

const DEFAULT_PAGES: DeptPage[] = [
    {
        label: "Sơ đồ tổ chức",
        pathTemplate: "/admin/departments/:departmentId/org-chart",
    },
    {
        label: "Mục tiêu - Nhiệm vụ",
        pathTemplate: "/admin/departments/:departmentId/objectives-tasks",
    },
    {
        label: "Quy trình phòng ban",
        pathTemplate: "/admin/departments/:departmentId/procedures",
    },
    {
        label: "Phân quyền",
        pathTemplate: "/admin/departments/:departmentId/permissions",
    },
    {
        label: "Lộ trình thăng tiến",
        pathTemplate: "/admin/departments/:departmentId/career-paths",
    },
    {
        label: "Khung lương",
        pathTemplate: "/admin/departments/:departmentId/salary-range",
    },
    {
        label: "Bản đồ chức danh",
        pathTemplate: "/admin/departments/:departmentId/position-chart",
    },
];

function toRegex(template: string) {
    const escaped = template.replace(/:[^/]+/g, "([^/]+)");
    return new RegExp(`^${escaped}(/.*)?$`);
}

function extractDepartmentId(pathname: string): string | null {
    const match = pathname.match(/\/departments\/([^/]+)/);
    return match ? match[1] : null;
}

function resolvePath(template: string, departmentId: string): string {
    return template.replace(":departmentId", departmentId);
}

interface DeptPageNavProps {
    pages?: DeptPage[];
}

const ACCENT = "#e8637a";

const DeptPageNav = ({ pages = DEFAULT_PAGES }: DeptPageNavProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const departmentId = extractDepartmentId(location.pathname);
    if (!departmentId) return null;

    const visiblePages = pages.filter((p) => p.visible !== false);
    if (visiblePages.length === 0) return null;

    const currentIndex = visiblePages.findIndex(({ pathTemplate }) =>
        toRegex(pathTemplate).test(location.pathname)
    );
    if (currentIndex === -1) return null;

    const handleNavigate = (page: DeptPage) => {
        setOpen(false);
        navigate({
            pathname: resolvePath(page.pathTemplate, departmentId),
            search: location.search,
        });
    };

    // Tên trang hiện tại để hiện trên badge linh vật
    const currentLabel = visiblePages[currentIndex]?.label ?? "";

    return null;
};

export default DeptPageNav;
