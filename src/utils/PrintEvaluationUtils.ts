import dayjs from "dayjs";

export const printEvaluationDetail = (record: any) => {
    const emp = record.employee || {};
    const mgr = record.directManager || {};
    const app = record.indirectManager || {};
    const period = record.period || {};
    const template = record.template || {};

    const getScore = (criteriaId: number, by: "EMPLOYEE" | "MANAGER" | "APPROVER") =>
        record.scores?.find((s: any) => s.criteriaId === criteriaId && s.scoredBy === by)?.score ?? null;

    const getComment = (type: string) =>
        record.comments?.find((c: any) => c.commentType === type)?.content ?? "";

    // Generate table rows
    let tableRowsHtml = "";
    let criteriaIndex = 1;

    template.sections?.forEach((section: any) => {
        // Section Header Row
        tableRowsHtml += `
            <tr class="section-row">
                <td colspan="7">PHẦN ${section.code}: ${section.name.toUpperCase()}</td>
            </tr>
        `;

        section.criteria?.forEach((crit: any) => {
            const empScore = getScore(crit.id, "EMPLOYEE");
            const mgrScore = getScore(crit.id, "MANAGER");
            const appScore = getScore(crit.id, "APPROVER");

            tableRowsHtml += `
                <tr>
                    <td class="center">${criteriaIndex++}</td>
                    <td><strong>${crit.name}</strong>${crit.description ? `<br/><span style="font-size:11px;color:#555;font-style:italic;">${crit.description}</span>` : ""}</td>
                    <td>${crit.measurementMethod || "—"}</td>
                    <td class="center">${Math.round(crit.weight * 100)}%</td>
                    <td class="center font-weight-bold">${empScore != null ? empScore.toFixed(2) : "—"}</td>
                    <td class="center font-weight-bold">${mgrScore != null ? mgrScore.toFixed(2) : "—"}</td>
                    <td class="center font-weight-bold">${appScore != null ? appScore.toFixed(2) : "—"}</td>
                </tr>
            `;
        });
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        alert("Vui lòng cho phép mở popup trên trình duyệt để in phiếu.");
        return;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Phiếu đánh giá - ${emp.fullName || "Nhân viên"}</title>
            <style>
                body {
                    font-family: "Times New Roman", Times, serif;
                    font-size: 13px;
                    line-height: 1.6;
                    color: #000;
                    margin: 20px;
                    padding: 0;
                }
                .title {
                    text-align: center;
                    font-size: 18px;
                    font-weight: bold;
                    margin-bottom: 5px;
                    text-transform: uppercase;
                }
                .subtitle {
                    text-align: center;
                    font-size: 13px;
                    font-style: italic;
                    margin-bottom: 25px;
                }
                .info-table {
                    width: 100%;
                    margin-bottom: 20px;
                    border-collapse: collapse;
                }
                .info-table td {
                    padding: 4px 8px;
                    vertical-align: top;
                }
                .info-table td.label {
                    font-weight: bold;
                    width: 180px;
                }
                .data-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                }
                .data-table th, .data-table td {
                    border: 1px solid #000;
                    padding: 6px 8px;
                    vertical-align: top;
                }
                .data-table th {
                    background-color: #f2f2f2;
                    text-align: center;
                    font-weight: bold;
                    font-size: 12px;
                }
                .data-table td.center {
                    text-align: center;
                }
                .data-table tr.section-row td {
                    background-color: #f2f2f2;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .section-title {
                    font-size: 14px;
                    font-weight: bold;
                    margin-top: 25px;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    border-bottom: 1px dashed #000;
                    padding-bottom: 4px;
                }
                .comment-box {
                    border: 1px solid #000;
                    padding: 8px 12px;
                    min-height: 50px;
                    margin-bottom: 15px;
                    white-space: pre-wrap;
                    background-color: #fafafa;
                }
                .summary-box {
                    border: 1px solid #000;
                    padding: 12px;
                    margin-bottom: 20px;
                    background-color: #fafafa;
                }
                .summary-title {
                    font-weight: bold;
                    font-size: 13px;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    border-bottom: 1px solid #000;
                    padding-bottom: 4px;
                }
                .summary-grid {
                    display: table;
                    width: 100%;
                }
                .summary-col {
                    display: table-cell;
                    width: 33.33%;
                }
                .sign-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 30px;
                }
                .sign-table td {
                    text-align: center;
                    width: 33.33%;
                    padding-bottom: 80px;
                    vertical-align: top;
                }
                .sign-title {
                    font-weight: bold;
                    margin-bottom: 4px;
                }
                .sign-sub {
                    font-size: 11px;
                    color: #555;
                    font-style: italic;
                }
                @media print {
                    body {
                        margin: 10mm 15mm;
                    }
                    .no-print {
                        display: none;
                    }
                    .page-break {
                        page-break-before: always;
                    }
                    .avoid-break {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="no-print" style="margin-bottom: 20px; padding: 10px; background-color: #e6f7ff; border: 1px solid #91caff; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold; color: #0958d9;">Xem trước bản in phiếu đánh giá</span>
                <button onclick="window.print()" style="padding: 6px 15px; background-color: #1677ff; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer;">
                    In phiếu (PDF)
                </button>
            </div>

            <div class="title">PHIẾU ĐÁNH GIÁ KẾT QUẢ CÔNG VIỆC</div>
            <div class="subtitle">Kỳ đánh giá: ${period.name || "—"}</div>

            <table class="info-table">
                <tr>
                    <td class="label">Họ và tên nhân viên:</td>
                    <td><strong>${emp.fullName || "—"}</strong></td>
                    <td class="label">Mã nhân viên:</td>
                    <td>${emp.employeeCode || "—"}</td>
                </tr>
                <tr>
                    <td class="label">Chức danh công việc:</td>
                    <td>${emp.jobTitle || "—"}</td>
                    <td class="label">Cấp bậc:</td>
                    <td>${emp.positionLevel || "—"}</td>
                </tr>
                <tr>
                    <td class="label">Bộ phận / Phòng ban:</td>
                    <td>${emp.departmentName || "—"}</td>
                    <td class="label">Đơn vị / Công ty:</td>
                    <td>${emp.companyName || "—"}</td>
                </tr>
                <tr>
                    <td class="label">Quản lý trực tiếp:</td>
                    <td>${mgr.fullName || "—"} (${mgr.email || ""})</td>
                    <td class="label">Người duyệt:</td>
                    <td>${app.fullName || "—"} (${app.email || ""})</td>
                </tr>
            </table>

            <table class="data-table">
                <thead>
                    <tr>
                        <th style="width: 40px;">STT</th>
                        <th>Tiêu chí đánh giá</th>
                        <th style="width: 200px;">Phương pháp đo lường</th>
                        <th style="width: 70px;">Trọng số</th>
                        <th style="width: 80px;">Điểm NV tự chấm</th>
                        <th style="width: 80px;">Điểm QL chấm</th>
                        <th style="width: 80px;">Điểm duyệt</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHtml}
                </tbody>
            </table>

            <div class="avoid-break">
                <div class="summary-box">
                    <div class="summary-title">Kết quả tổng hợp</div>
                    <div class="summary-grid">
                        <div class="summary-col">
                            <strong>Tổng điểm tự chấm:</strong> ${record.employeeTotalScore != null ? record.employeeTotalScore.toFixed(2) : "—"}
                        </div>
                        <div class="summary-col">
                            <strong>Tổng điểm quản lý:</strong> ${record.managerTotalScore != null ? record.managerTotalScore.toFixed(2) : "—"}
                        </div>
                        <div class="summary-col">
                            <strong>Tổng điểm duyệt cuối:</strong> ${record.approverTotalScore != null ? record.approverTotalScore.toFixed(2) : "—"}
                        </div>
                    </div>
                    <div style="margin-top: 10px;">
                        <strong>Xếp loại cuối cùng:</strong> 
                        <span style="font-size: 14px; font-weight: bold; color: #1677ff;">
                            ${record.finalGrade || "—"}
                        </span>
                    </div>
                </div>
            </div>

            <div class="avoid-break">
                <div class="section-title">Nhận xét & Ý kiến đánh giá</div>
                
                <strong>1. Ý kiến tự đánh giá của Nhân viên:</strong>
                <div class="comment-box">${getComment("SELF_REVIEW") || "—"}</div>

                <strong>2. Ý kiến nhận xét của Quản lý trực tiếp:</strong>
                <div class="comment-box">${getComment("MANAGER_FEEDBACK") || "—"}</div>

                <strong>3. Ý kiến chỉ đạo của Ban lãnh đạo / Người phê duyệt:</strong>
                <div class="comment-box">${getComment("APPROVER_OVERRIDE_NOTE") || "—"}</div>
            </div>

            <div class="avoid-break">
                <div class="section-title">Kế hoạch đào tạo & phát triển đề xuất</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 50px;">STT</th>
                            <th>Nội dung đào tạo / Phát triển nâng cao năng lực</th>
                            <th style="width: 150px;">Thời gian dự kiến</th>
                            <th style="width: 250px;">Ghi chú / Cam kết</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${
                            record.trainingPlans && record.trainingPlans.length > 0
                                ? record.trainingPlans.map((p: any, idx: number) => `
                                    <tr>
                                        <td class="center">${idx + 1}</td>
                                        <td><strong>${p.content || "—"}</strong></td>
                                        <td class="center">${p.expectedTime || "—"}</td>
                                        <td>${p.note || "—"}</td>
                                    </tr>
                                `).join("")
                                : `<tr><td colspan="4" class="center" style="color:#777;padding:15px 0;">Không đề xuất kế hoạch nào</td></tr>`
                        }
                    </tbody>
                </table>
            </div>

            <table class="sign-table">
                <tr>
                    <td>
                        <div class="sign-title">Nhân viên tự đánh giá</div>
                        <div class="sign-sub">(Ký và ghi rõ họ tên)</div>
                    </td>
                    <td>
                        <div class="sign-title">Quản lý trực tiếp chấm</div>
                        <div class="sign-sub">(Ký và ghi rõ họ tên)</div>
                    </td>
                    <td>
                        <div class="sign-title">Người duyệt cuối cùng</div>
                        <div class="sign-sub">(Ký và ghi rõ họ tên)</div>
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
};
