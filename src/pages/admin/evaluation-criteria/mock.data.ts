export const MOCK_EVALUATION_CRITERIA = [
    {
        jobTitle: "Nhân viên tuyển dụng",
        positionLevel: "S4",
        grades: [
            {
                gradeLevel: 1,
                ratingA: `
- Tỷ lệ sàng lọc hồ sơ đúng yêu cầu ≥80%
- Tỷ lệ ứng viên phù hợp vòng PV đầu ≥50%
- Hoàn thành kế hoạch ≥85%
- Phản hồi ≤48h
- Nghỉ việc ≤15%
        `,
                ratingB: `
- Sàng lọc ≥70%
- Phù hợp PV ≥40%
- Hoàn thành ≥80%
- Phản hồi ≤72h
        `,
                ratingC: `
- Sàng lọc ≥60%
- Phù hợp PV ≥30%
- Hoàn thành ≥60%
        `,
                ratingD: `
- Không đạt các tiêu chí C
        `,
            },
            {
                gradeLevel: 2,
                ratingA: "Mock A – Bậc 2",
                ratingB: "Mock B – Bậc 2",
                ratingC: "Mock C – Bậc 2",
                ratingD: "Mock D – Bậc 2",
            },
        ],
    },
];
