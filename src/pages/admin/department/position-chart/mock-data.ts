// src/pages/admin/department/position-chart/mock-data.ts
// Dữ liệu giả cho Bản đồ chức danh - Phòng Hành chính Nhân sự
// Công ty Cổ phần V Lotus Holdings
// Chỉ giữ các trường cần thiết cho sơ đồ chức danh: id, stt, rank, tên VN, tên EN

export interface JobTitle {
    id: number;
    stt: number;
    rank: string;              // Bậc chức danh (M1, M3, S1, S2, ...)
    vietnameseTitle: string;   // Chức danh Tiếng Việt
    englishTitle: string;      // Chức danh Tiếng Anh
}

export const mockHRJobTitles: JobTitle[] = [
    { id: 1, stt: 1, rank: "M1", vietnameseTitle: "Giám đốc Nhân sự", englishTitle: "HR Director" },
    { id: 2, stt: 2, rank: "M3", vietnameseTitle: "Trưởng phòng Hành chính nhân sự", englishTitle: "HR Administration Manager" },
    { id: 3, stt: 3, rank: "M4", vietnameseTitle: "Phó phòng Hành chính nhân sự", englishTitle: "Deputy HR Administration Manager" },
    { id: 4, stt: 4, rank: "S2", vietnameseTitle: "Trợ lý Trưởng phòng Hành chính nhân sự", englishTitle: "Assistant HR Administration Manager" },
    { id: 5, stt: 5, rank: "S1", vietnameseTitle: "Trưởng nhóm Hành chính", englishTitle: "Admin Leader" },
    { id: 6, stt: 6, rank: "S2", vietnameseTitle: "Chuyên viên Cấp cao Hành chính", englishTitle: "Senior Admin Specialist" },
    { id: 7, stt: 7, rank: "S3", vietnameseTitle: "Chuyên viên Hành chính", englishTitle: "Admin Specialist" },
    { id: 8, stt: 8, rank: "S4", vietnameseTitle: "Nhân viên Hành chính", englishTitle: "Admin Executive" },
    { id: 9, stt: 9, rank: "S4", vietnameseTitle: "Nhân viên Lễ tân hành chính", englishTitle: "Receptionist - Admin Executive" },
    { id: 10, stt: 10, rank: "S5", vietnameseTitle: "Nhân viên tạp vụ", englishTitle: "Janitorial Staff" },
    { id: 11, stt: 11, rank: "S1", vietnameseTitle: "Trưởng nhóm Tuyển dụng", englishTitle: "Recruitment Leader" },
    { id: 12, stt: 12, rank: "S2", vietnameseTitle: "Chuyên viên Cấp cao Tuyển dụng", englishTitle: "Senior Recruitment Specialist" },
    { id: 13, stt: 13, rank: "S3", vietnameseTitle: "Chuyên viên Tuyển dụng", englishTitle: "Recruitment Specialist" },
    { id: 14, stt: 14, rank: "S4", vietnameseTitle: "Nhân viên Tuyển dụng", englishTitle: "Recruitment Executive" },
    { id: 15, stt: 15, rank: "S1", vietnameseTitle: "Trưởng nhóm Đào tạo và Phát triển", englishTitle: "Training and Development Leader" },
    { id: 16, stt: 16, rank: "S2", vietnameseTitle: "Chuyên viên Cấp cao Đào tạo và Phát triển", englishTitle: "Senior Training and Development Specialist" },
    { id: 17, stt: 17, rank: "S3", vietnameseTitle: "Chuyên viên Đào tạo và Phát triển", englishTitle: "Training and Development Specialist" },
    { id: 18, stt: 18, rank: "S4", vietnameseTitle: "Nhân viên Đào tạo và phát triển", englishTitle: "Training and Development Executive" },
    { id: 19, stt: 19, rank: "S1", vietnameseTitle: "Trưởng nhóm Tiền lương và Phúc lợi", englishTitle: "Compensation and Benefits Leader" },
    { id: 20, stt: 20, rank: "S2", vietnameseTitle: "Chuyên viên Cấp cao Tiền lương và Phúc lợi", englishTitle: "Senior Compensation and Benefits Specialist" },
    { id: 21, stt: 21, rank: "S3", vietnameseTitle: "Chuyên viên Tiền lương và Phúc lợi", englishTitle: "Compensation and Benefits Specialist" },
    { id: 22, stt: 22, rank: "S4", vietnameseTitle: "Nhân viên Tiền lương và Phúc lợi", englishTitle: "Compensation and Benefits Executive" },
    { id: 23, stt: 23, rank: "S4", vietnameseTitle: "Admin Tiền lương và Phúc lợi", englishTitle: "Compensation and Benefits Admin" },
    { id: 24, stt: 24, rank: "S1", vietnameseTitle: "Trưởng nhóm Kế hoạch & Hiệu suất", englishTitle: "Planning & Performance Leader" },
    { id: 25, stt: 25, rank: "S2", vietnameseTitle: "Chuyên viên Cấp cao Kế hoạch & Hiệu suất", englishTitle: "Senior Planning & Performance Specialist" },
    { id: 26, stt: 26, rank: "S3", vietnameseTitle: "Chuyên viên Kế hoạch & Hiệu suất", englishTitle: "Planning & Performance Specialist" },
    { id: 27, stt: 27, rank: "S4", vietnameseTitle: "Nhân viên Kế hoạch & Hiệu suất", englishTitle: "Planning & Performance Executive" },
    { id: 28, stt: 28, rank: "S4", vietnameseTitle: "Admin Nhân sự", englishTitle: "HR Admin" },
    { id: 29, stt: 29, rank: "S6", vietnameseTitle: "Thực tập sinh Nhân sự", englishTitle: "HR Intern" },
];

// Export default (nếu PositionChartModal dùng default import)
export default mockHRJobTitles;