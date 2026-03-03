// src/pages/admin/job-description/job_descriptions.ts

export interface JobDescription {
    id: number | string;
    companyName: string;
    title: string;
    levelCode: string;
    department: string;
    reportTo: string;
    coordinateWith: string;
    effectiveDate: string;
    version: string;
    pages: string;
    code: string;
    source: string;

    // Chỉ còn 2 trạng thái
    status: "DRAFT" | "PUBLIC";

    // Ngày ban hành (PUBLIC bắt buộc có, DRAFT = null)
    issuedDate: string | null;

    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;

    content: {
        desc: string[];
        knowledge: string[];
        experience: string[];
        skills: string[];
        qualities: string[];
        others: string[];
    };

    assigner: {
        name: string;
    };

    receiver: {
        title: string;
        name: string;
    };
}

export const jobDescriptions: JobDescription[] = [
    // ===============================
    // 1. DRAFT (Nháp)
    // ===============================
    {
        id: 1,
        companyName: "CÔNG TY CỔ PHẦN V LOTUS HOLDINGS",
        title: "Giám đốc Nhân sự",
        levelCode: "M1",
        department: "Hành chính Nhân sự",
        reportTo: "Giám đốc Điều Hành",
        coordinateWith: "Bộ phận/Phòng ban",
        effectiveDate: "2024-12-01",
        version: "01",
        pages: "01/01",
        code: "JD-M1-HR-01",
        source: "FnB",
        status: "DRAFT",
        issuedDate: null,
        createdAt: "2026-01-01T09:00:00Z",
        updatedAt: "2026-01-10T10:00:00Z",
        createdBy: "admin@gmail.com",
        updatedBy: "admin@gmail.com",
        content: {
            desc: [
                "Tham mưu cho CEO về chiến lược nhân sự trung và dài hạn.",
                "Định hướng cơ cấu tổ chức và hệ thống quản trị nhân sự.",
                "Bảo đảm chiến lược nhân sự phù hợp với văn hóa doanh nghiệp."
            ],
            knowledge: [
                "Quản trị nhân sự chiến lược",
                "Luật lao động",
                "Văn hóa doanh nghiệp"
            ],
            experience: [
                "7–10 năm kinh nghiệm nhân sự",
                "Kinh nghiệm quản lý cấp cao"
            ],
            skills: [
                "Tư duy chiến lược",
                "Ra quyết định",
                "Giao tiếp cấp cao"
            ],
            qualities: [
                "Liêm chính",
                "Tầm nhìn dài hạn",
                "Trách nhiệm cao"
            ],
            others: []
        },
        assigner: { name: "admin@gmail.com" },
        receiver: { title: "", name: "" }
    },

    // ===============================
    // 2. DRAFT
    // ===============================
    {
        id: 2,
        companyName: "CÔNG TY CỔ PHẦN V LOTUS HOLDINGS",
        title: "Trưởng phòng Tuyển dụng",
        levelCode: "M3",
        department: "Tuyển dụng",
        reportTo: "Giám đốc Nhân sự",
        coordinateWith: "Các trưởng phòng",
        effectiveDate: "2025-03-01",
        version: "01",
        pages: "02/02",
        code: "JD-M3-REC-01",
        source: "FnB",
        status: "DRAFT",
        issuedDate: null,
        createdAt: "2026-02-15T14:30:00Z",
        updatedAt: "2026-02-20T09:15:00Z",
        createdBy: "hr_manager@gmail.com",
        updatedBy: "hr_manager@gmail.com",
        content: {
            desc: [
                "Xây dựng chiến lược tuyển dụng",
                "Quản lý đội ngũ tuyển dụng"
            ],
            knowledge: ["Quy trình tuyển dụng hiện đại"],
            experience: ["5 năm kinh nghiệm tuyển dụng"],
            skills: ["Đàm phán", "Phân tích dữ liệu"],
            qualities: ["Chủ động", "Trách nhiệm"],
            others: []
        },
        assigner: { name: "hr_manager@gmail.com" },
        receiver: { title: "", name: "" }
    },

    // ===============================
    // 3. PUBLIC (Đã ban hành)
    // ===============================
    {
        id: 3,
        companyName: "CÔNG TY CỔ PHẦN V LOTUS HOLDINGS",
        title: "Nhân viên Kinh doanh FnB",
        levelCode: "E2",
        department: "Kinh doanh & Bán hàng",
        reportTo: "Trưởng phòng Kinh doanh",
        coordinateWith: "Marketing, Vận hành",
        effectiveDate: "2025-01-01",
        version: "01",
        pages: "01/01",
        code: "JD-E2-SALES-01",
        source: "FnB",
        status: "PUBLIC",
        issuedDate: "2025-12-20T15:30:00Z",
        createdAt: "2025-11-10T08:00:00Z",
        updatedAt: "2025-12-19T14:00:00Z",
        createdBy: "sales_hr@gmail.com",
        updatedBy: "ceo@gmail.com",
        content: {
            desc: [
                "Tư vấn và bán sản phẩm FnB",
                "Chăm sóc khách hàng",
                "Đạt chỉ tiêu doanh số"
            ],
            knowledge: ["Sản phẩm công ty"],
            experience: ["1-3 năm kinh doanh"],
            skills: ["Giao tiếp", "Thuyết phục"],
            qualities: ["Năng động", "Chịu áp lực"],
            others: []
        },
        assigner: { name: "sales_hr@gmail.com" },
        receiver: {
            title: "CEO",
            name: "Lê Văn A"
        }
    }
];