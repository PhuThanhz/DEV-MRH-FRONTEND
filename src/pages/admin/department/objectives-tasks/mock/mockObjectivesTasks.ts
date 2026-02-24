// src/pages/admin/department/objectives-tasks/mock/mockObjectivesTasks.ts

export const MOCK_OBJECTIVES = [
    "Đảm bảo việc phát triển và tối ưu hóa nguồn nhân lực phù hợp với chiến lược phát triển của công ty",
    "Nâng cao mức độ gắn kết và trải nghiệm của người lao động nhằm thu hút, giữ chân nhân tài",
    "Đảm bảo hệ thống hành chính – nhân sự vận hành hiệu quả, minh bạch và tuân thủ pháp luật",
];

export const MOCK_TASK_GROUPS = [
    {
        key: "ADMIN",
        name: "Hành chính",
        tasks: [
            "Vận hành dịch vụ hành chính – văn phòng thông suốt, hỗ trợ hoạt động kinh doanh",
            "Tối ưu nguồn lực hành chính nhằm gia tăng hiệu quả kinh doanh",
        ],
    },
    {
        key: "CB",
        name: "C&B",
        tasks: [
            "Xây dựng hệ thống lương, thưởng, phúc lợi cạnh tranh & công bằng",
            "Triển khai thủ tục nhân sự theo quy định công ty và pháp luật",
            "Thanh toán lương, thưởng và phúc lợi cho người lao động",
        ],
    },
    {
        key: "RECRUITMENT",
        name: "Tuyển dụng",
        tasks: [
            "Xây dựng và triển khai chiến lược thương hiệu nhà tuyển dụng",
            "Lập kế hoạch và triển khai công tác tuyển dụng",
        ],
    },
    {
        key: "TRAINING",
        name: "Đào tạo & Phát triển",
        tasks: [
            "Chuẩn hóa tiêu chuẩn năng lực cho từng vị trí",
            "Xây dựng hệ thống đào tạo và phát triển nguồn lực kế thừa",
        ],
    },
];
