// Dữ liệu giả cho danh mục quy trình
export const mockProcessCategories = [
    {
        id: 1,
        code: "PROC-001",
        name: "Quy trình tuyển dụng nhân sự",
        description: "Từ đăng tin → phỏng vấn → offer",
        status: "active",
        updatedAt: "2025-02-15",
    },
    {
        id: 2,
        code: "PROC-002",
        name: "Quy trình nghỉ phép",
        description: "Đăng ký → phê duyệt trưởng phòng → HR xác nhận",
        status: "active",
        updatedAt: "2025-01-20",
    },
    {
        id: 3,
        code: "PROC-003",
        name: "Quy trình đánh giá hiệu suất hàng quý",
        description: "Tự đánh giá → trưởng bộ phận chấm → họp 1-1",
        status: "draft",
        updatedAt: "2025-03-01",
    },
];

export const mockProcessDetail = {
    id: 1,
    code: "PROC-001",
    name: "Quy trình tuyển dụng nhân sự",
    steps: [
        { step: 1, title: "Đăng tin tuyển dụng", responsible: "HR" },
        { step: 2, title: "Sàng lọc CV", responsible: "HR + Trưởng phòng" },
        { step: 3, title: "Phỏng vấn vòng 1", responsible: "Trưởng phòng" },
        { step: 4, title: "Offer letter", responsible: "HR" },
    ],
};