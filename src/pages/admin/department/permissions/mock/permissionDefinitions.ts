// src/mock/permissionDefinitions.ts
export const PERMISSION_DEFINITIONS = [
    {
        code: "XD",
        name: "Xây dựng",
        short: "Quyền đề xuất, soạn thảo tài liệu, quy trình, kế hoạch hoặc giải pháp mới.",
        detail:
            "- Được phép chủ động khởi tạo nội dung ban đầu cho tài liệu, quy trình, biểu mẫu, kế hoạch hoặc giải pháp.\n" +
            "- Chịu trách nhiệm thu thập thông tin, xây dựng cấu trúc nội dung, đảm bảo logic và đầy đủ thành phần theo yêu cầu.\n" +
            "- Đảm bảo tính chính xác của dữ liệu gốc, tuân thủ tiêu chuẩn nội bộ và pháp lý liên quan.\n" +
            "- Là đầu mối chính tạo ra phiên bản đầu tiên trước khi chuyển sang Rà soát.",
    },
    {
        code: "RS",
        name: "Rà soát",
        short: "Quyền kiểm tra nội dung, đánh giá rủi ro, tính phù hợp.",
        detail:
            "- Kiểm tra độ chính xác, đầy đủ và hợp lệ của nội dung do người xây dựng cung cấp.\n" +
            "- Đánh giá rủi ro, tính khả thi, sự nhất quán và mức độ tuân thủ quy định công ty.\n" +
            "- Đề xuất chỉnh sửa, bổ sung, nhưng không có quyền phê duyệt cuối cùng.\n" +
            "- Đảm bảo tài liệu đạt chất lượng trước khi chuyển qua Thẩm định.",
    },
    {
        code: "TĐ",
        name: "Thẩm định",
        short: "Đánh giá tính chính xác, năng lực, dữ liệu – trước khi phê duyệt.",
        detail:
            "- Kiểm định tính chính xác, tính hợp lý về mặt nghiệp vụ và tính tuân thủ quy trình.\n" +
            "- Đánh giá năng lực thực thi, tác động rủi ro, mức độ phù hợp của dữ liệu hoặc phương án.\n" +
            "- Đưa ra kết luận: đồng thuận / yêu cầu chỉnh sửa / không đồng thuận.\n" +
            "- Là tầng lọc trung gian nhằm giảm sai sót trước khi đưa lên cấp Phê duyệt.",
    },
    {
        code: "PD",
        name: "Phê duyệt",
        short: "Quyền ra quyết định cuối cùng (có hiệu lực pháp lý trong nội bộ).",
        detail:
            "- Là cấp có thẩm quyền ban hành, ký duyệt tài liệu, quy trình, kế hoạch hoặc quyết định.\n" +
            "- Chịu trách nhiệm pháp lý nội bộ và giải trình với Ban Tổng Giám đốc nếu có sai lệch.\n" +
            "- Có quyền yêu cầu cập nhật, sửa đổi, bổ sung trước khi ban hành.",
    },
    {
        code: "TH",
        name: "Thực hiện",
        short: "Quyền tiến hành công việc, triển khai nhiệm vụ đã được phê duyệt.",
        detail:
            "- Là người trực tiếp thực thi công việc theo đúng quy trình, hướng dẫn hoặc kế hoạch đã được phê duyệt.\n" +
            "- Chịu trách nhiệm về kết quả đầu ra, thời gian và chất lượng thực hiện.\n" +
            "- Phản hồi các vấn đề phát sinh cho cấp Kiểm soát hoặc Trưởng bộ phận.",
    },
    {
        code: "KS",
        name: "Kiểm soát",
        short: "Quyền kiểm tra, đánh giá mức độ tuân thủ, cảnh báo sai lệch.",
        detail:
            "- Theo dõi mức độ tuân thủ, chất lượng thực thi, rủi ro và sai lệch.\n" +
            "- Có quyền yêu cầu khắc phục hoặc báo cáo cấp cao hơn nếu phát hiện sai phạm.\n" +
            "- Đảm bảo công việc thực hiện đúng tiêu chuẩn, quy định, KPI đã phê duyệt.",
    },
    {
        code: "TB",
        name: "Thông báo - phối hợp",
        short: "Nhận thông tin hoặc phối hợp khi có yêu cầu.",
        detail:
            "- Được cập nhật thông tin liên quan để nắm tình hình và phối hợp đúng thời điểm.\n" +
            "- Không tham gia vào việc xây dựng – rà soát – thẩm định – phê duyệt.\n" +
            "- Vai trò nhằm đảm bảo luồng thông tin xuyên suốt giữa các phòng ban, tránh đứt gãy quy trình.",
    },
] as const;