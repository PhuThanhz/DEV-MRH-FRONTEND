import {
    AccountBookOutlined,
    AppstoreOutlined,
    BankOutlined,
    FileDoneOutlined,
    FileTextOutlined,
    FolderOpenOutlined,
    IdcardOutlined,
    NodeIndexOutlined,
    SolutionOutlined,
    TeamOutlined,
    UserOutlined,
} from "@ant-design/icons";
import type React from "react";

export type QuickAccessItem = {
    id: string;
    title: string;
    subtitle: string;
    path: string;
    module: string;
    keywords: string[];
    icon: React.ReactNode;
};

export const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
    {
        id: "dashboard",
        title: "Tổng quan",
        subtitle: "Dashboard quản trị",
        path: "/admin",
        module: "Tổng quan",
        keywords: ["dashboard", "tong quan", "home"],
        icon: <AppstoreOutlined />,
    },
    {
        id: "employees",
        title: "Nhân viên",
        subtitle: "Hồ sơ nhân sự",
        path: "/admin/employees",
        module: "Nhân sự",
        keywords: ["nhan su", "nhan vien", "employee", "hr"],
        icon: <TeamOutlined />,
    },
    {
        id: "users",
        title: "Người dùng",
        subtitle: "Tài khoản và quyền truy cập",
        path: "/admin/user",
        module: "Người dùng",
        keywords: ["user", "nguoi dung", "tai khoan"],
        icon: <UserOutlined />,
    },
    {
        id: "companies",
        title: "Công ty",
        subtitle: "Cấu trúc công ty",
        path: "/admin/company",
        module: "Tổ chức",
        keywords: ["cong ty", "company", "doanh nghiep"],
        icon: <BankOutlined />,
    },
    {
        id: "departments",
        title: "Phòng ban",
        subtitle: "Sơ đồ và hồ sơ phòng ban",
        path: "/admin/departments",
        module: "Tổ chức",
        keywords: ["phong ban", "department", "org"],
        icon: <NodeIndexOutlined />,
    },
    {
        id: "job-titles",
        title: "Chức danh",
        subtitle: "Danh mục chức danh",
        path: "/admin/job-titles",
        module: "Danh mục",
        keywords: ["chuc danh", "job title", "vi tri"],
        icon: <IdcardOutlined />,
    },
    {
        id: "procedures",
        title: "Quy trình",
        subtitle: "Quy trình làm việc",
        path: "/admin/procedures",
        module: "Tài liệu",
        keywords: ["quy trinh", "procedure", "workflow"],
        icon: <FolderOpenOutlined />,
    },
    {
        id: "documents",
        title: "Văn bản",
        subtitle: "Kho văn bản nội bộ",
        path: "/admin/documents",
        module: "Tài liệu",
        keywords: ["van ban", "document", "tai lieu"],
        icon: <FileTextOutlined />,
    },
    {
        id: "personal-drive",
        title: "Ổ đĩa cá nhân",
        subtitle: "Lưu trữ và thư mục cá nhân",
        path: "/admin/personal-drive",
        module: "Tài liệu",
        keywords: ["drive", "o dia", "kho luu tru"],
        icon: <FileDoneOutlined />,
    },
    {
        id: "job-descriptions",
        title: "Mô tả công việc",
        subtitle: "JD và luồng phê duyệt",
        path: "/admin/job-descriptions",
        module: "Tài liệu",
        keywords: ["jd", "mo ta cong viec", "job description"],
        icon: <SolutionOutlined />,
    },
    {
        id: "accounting-documents",
        title: "Chứng từ kế toán",
        subtitle: "Danh sách chứng từ kế toán",
        path: "/admin/accounting-documents",
        module: "Kế toán",
        keywords: ["ke toan", "chung tu", "accounting"],
        icon: <AccountBookOutlined />,
    },
    {
        id: "accounting-dossiers",
        title: "Bộ chứng từ kế toán",
        subtitle: "Hồ sơ/bộ chứng từ",
        path: "/admin/accounting-dossiers",
        module: "Kế toán",
        keywords: ["bo chung tu", "dossier", "ke toan"],
        icon: <AccountBookOutlined />,
    },
    {
        id: "evaluation-process",
        title: "Đánh giá & KPI",
        subtitle: "Quy trình đánh giá",
        path: "/admin/evaluation/process",
        module: "Đánh giá",
        keywords: ["danh gia", "kpi", "evaluation"],
        icon: <SolutionOutlined />,
    },
];

export const findQuickAccessByPath = (path: string) => {
    return QUICK_ACCESS_ITEMS.find((item) => item.path === path);
};
