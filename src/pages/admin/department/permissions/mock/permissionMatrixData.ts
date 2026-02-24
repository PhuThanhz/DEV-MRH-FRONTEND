// mock/permissionMatrixData.ts
import { JOB_TITLES } from "./permissionRoles";

export const PERMISSION_CODES = [
    "XD", "RS", "TĐ", "PD", "TH", "KS", "TB",
] as const;

// Danh sách các hành động (có thể thêm/xóa/sửa thứ tự thoải mái)
export const ACTIONS = [
    "Thu thập nhu cầu nhân sự từ các phòng ban",
    "Phân tích cơ cấu nhân sự và định biên vị trí",
    "Đánh giá biến động nhân sự và dự báo nhu cầu",
    "Lập kế hoạch nhân lực theo quý và năm",
    "Xác định ngân sách nhân sự sơ bộ",
    "Rà soát và phê duyệt điều chỉnh định biên",
    "Chuẩn hóa mô tả công việc (JD)",
    "Xây dựng khung năng lực cho vai trò chủ chốt",
    "Hoạch định nguồn tuyển nội bộ và bên ngoài",
    "Báo cáo kế hoạch nhân sự lên BGĐ",
    "Xây dựng kế hoạch tuyển dụng chi tiết theo vị trí",
] as const;

// Config quyền chi tiết theo từng action
const PERMISSION_CONFIG: Record<
    typeof ACTIONS[number],
    Partial<Record<typeof JOB_TITLES[number], string>>
> = {
    // 1. Thu thập nhu cầu → nhiều phòng ban phối hợp + HR hỗ trợ
    "Thu thập nhu cầu nhân sự từ các phòng ban": {
        DEPARTMENT_HEAD: "TH",
        HR_MANAGER: "XD",
        HR_STAFF: "TH",
        "Nhân viên Tuyển dụng": "TH",
        "Thực tập sinh Nhân sự": "TH",
        "Nhân viên Hành chính": "TB",
    },

    // 2. Phân tích cơ cấu → chủ yếu HR Manager + Staff
    "Phân tích cơ cấu nhân sự và định biên vị trí": {
        HR_MANAGER: "XD",
        HR_STAFF: "TH",
        "Chuyên viên Kế hoạch & Hiệu suất": "TH",
        "Nhân viên Kế hoạch & Hiệu suất": "TH",
    },

    // 3. Đánh giá biến động → phối hợp + HR thực hiện
    "Đánh giá biến động nhân sự và dự báo nhu cầu": {
        DEPARTMENT_HEAD: "TH",
        HR_MANAGER: "XD",
        HR_STAFF: "TH",
        "Chuyên viên Kế hoạch & Hiệu suất": "TH",
    },

    // 4. Lập kế hoạch nhân lực → HR Manager dẫn dắt
    "Lập kế hoạch nhân lực theo quý và năm": {
        HR_MANAGER: "XD",
        HR_STAFF: "TH",
        "Chuyên viên Kế hoạch & Hiệu suất": "TH",
    },

    // 5. Xác định ngân sách sơ bộ → HR Manager
    "Xác định ngân sách nhân sự sơ bộ": {
        HR_MANAGER: "XD",
        HR_STAFF: "TH",
        "Chuyên viên Tiền lương và Phúc lợi": "TH",
    },

    // 6. Rà soát & phê duyệt định biên → cấp cao duyệt
    "Rà soát và phê duyệt điều chỉnh định biên": {
        HR_MANAGER: "RS",
        COO: "KS",
        CEO: "PD",
        HR_STAFF: "TB",
    },

    // 7. Chuẩn hóa JD → HR thực hiện nhiều
    "Chuẩn hóa mô tả công việc (JD)": {
        HR_MANAGER: "XD",
        HR_STAFF: "TH",
        "Nhân viên Tuyển dụng": "TH",
        "Thực tập sinh Nhân sự": "TH",
        "Chuyên viên Tuyển dụng": "TH",
    },

    // 8. Xây dựng khung năng lực → HR + chuyên viên
    "Xây dựng khung năng lực cho vai trò chủ chốt": {
        HR_MANAGER: "XD",
        HR_STAFF: "TH",
        "Chuyên viên Đào tạo và Phát triển": "TH",
        "Nhân viên Đào tạo và Phát triển": "TH",
    },

    // 9. Hoạch định nguồn tuyển → phối hợp nội bộ/ngoại bộ
    "Hoạch định nguồn tuyển nội bộ và bên ngoài": {
        DEPARTMENT_HEAD: "TH",
        HR_MANAGER: "XD",
        HR_STAFF: "TH",
        "Nhân viên Tuyển dụng": "TH",
        "Thực tập sinh Nhân sự": "TH",
    },

    // 10. Báo cáo lên BGĐ → HR thực hiện, cấp cao duyệt
    "Báo cáo kế hoạch nhân sự lên BGĐ": {
        HR_MANAGER: "TH",
        CEO: "PD",
        COO: "PD",
        HR_STAFF: "TB",
    },

    // 11. Xây dựng kế hoạch tuyển dụng chi tiết → HR + Tuyển dụng
    "Xây dựng kế hoạch tuyển dụng chi tiết theo vị trí": {
        HR_MANAGER: "XD",
        HR_STAFF: "TH",
        "Nhân viên Tuyển dụng": "TH",
        "Chuyên viên Tuyển dụng": "TH",
        "Thực tập sinh Nhân sự": "TH",
    },
};

// Quyền mặc định cho các vị trí không được chỉ định cụ thể trong action nào
const DEFAULT_PERMISSIONS: Partial<Record<typeof JOB_TITLES[number], string>> = {
    CEO: "TB",
    COO: "TB",
    HR_MANAGER: "TB",
    HR_STAFF: "TB",
    DEPARTMENT_HEAD: "TB",

    // Các vị trí cấp thấp / chuyên viên mặc định TB (trừ khi config cụ thể)
    "Thực tập sinh Nhân sự": "TB",
    "Nhân viên tạp vụ": "TB",
    "Nhân viên Lễ tân hành chính": "TB",
    "Nhân viên Hành chính": "TB",
    "Nhân viên Tuyển dụng": "TB",
    "Nhân viên Đào tạo và Phát triển": "TB",
    "Nhân viên Tiền lương và Phúc lợi": "TB",
    "Nhân viên Kế hoạch & Hiệu suất": "TB",

    // Chuyên viên / Trưởng nhóm mặc định TB, nhưng có thể config TH ở một số bước
    "Chuyên viên Tuyển dụng": "TB",
    "Chuyên viên Đào tạo và Phát triển": "TB",
    "Chuyên viên Tiền lương và Phúc lợi": "TB",
    "Chuyên viên Kế hoạch & Hiệu suất": "TB",
};

export const PERMISSION_MATRIX = ACTIONS.map((action, index) => {
    const row: Record<string, any> = {
        id: index + 1,
        category: "HOẠCH ĐỊNH NHÂN SỰ",
        action,
    };

    JOB_TITLES.forEach((title) => {
        // Ưu tiên quyền cụ thể theo action
        const specificRight = PERMISSION_CONFIG[action]?.[title as keyof typeof PERMISSION_CONFIG[typeof ACTIONS[number]]];

        // Nếu có quyền cụ thể → dùng nó
        // Không có → dùng default của vị trí đó
        row[title] = specificRight ?? DEFAULT_PERMISSIONS[title] ?? "TB";
    });

    return row;
});