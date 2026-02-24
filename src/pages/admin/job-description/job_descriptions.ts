// src/pages/admin/job-description/job_descriptions.ts

export interface JobDescription {
    id: number | string;
    companyName: string;          // ← thêm
    title: string;
    levelCode: string;            // ← thêm
    department: string;
    reportTo: string;             // ← thêm
    coordinateWith: string;       // ← thêm
    effectiveDate: string;        // ← thêm
    version: string;              // ← thêm
    pages: string;                // ← thêm
    code: string;                 // ← thêm
    source: string;               // ← thêm
    status: "DRAFT" | "IN_REVIEW" | "PUBLIC";
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
                "Tham mưu cho CEO/Ban Lãnh đạo về chiến lược nhân sự trung và dài hạn phù hợp với chiến lược kinh doanh.",
                "Định hướng mô hình quản trị nhân sự, cơ cấu tổ chức và nguyên tắc phân quyền nhân sự trong toàn Công ty.",
                "Bảo đảm tính nhất quán giữa chiến lược nhân sự và văn hóa doanh nghiệp.",
                "Định hướng chiến lược thu hút nhân tài và thương hiệu nhà tuyển dụng phù hợp với đặc thù FnB.",
                "Dẫn dắt các chính sách phát triển nhân sự trọng yếu."
            ],
            knowledge: [
                "Am hiểu quản trị nhân sự chiến lược",
                "Nắm vững luật lao động",
                "Hiểu biết sâu về văn hóa doanh nghiệp"
            ],
            experience: [
                "Tối thiểu 7–10 năm kinh nghiệm trong lĩnh vực nhân sự",
                "Có kinh nghiệm quản lý cấp cao",
                "Đã tham gia xây dựng hoặc tái cấu trúc hệ thống nhân sự cấp công ty"
            ],
            skills: [
                "Tư duy chiến lược",
                "Khả năng ra quyết định",
                "Kỹ năng giao tiếp và xử lý vấn đề phức tạp"
            ],
            qualities: [
                "Liêm chính, bản lĩnh, bảo mật thông tin",
                "Tư duy hệ thống, tầm nhìn dài hạn",
                "Tinh thần trách nhiệm cao"
            ],
            others: [
                "Có uy tín chuyên môn làm việc cùng CEO",
                "Sẵn sàng đảm nhận vai trò kiến trúc sư nhân sự",
                "Phù hợp văn hóa doanh nghiệp chuỗi, tăng trưởng nhanh"
            ]
        },
        assigner: {
            name: "admin@gmail.com"
        },
        receiver: {
            title: "",
            name: ""
        }
    }
];