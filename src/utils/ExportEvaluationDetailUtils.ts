import * as XLSXStyle from "xlsx-js-style";
import dayjs from "dayjs";

export const exportDetailedEvaluation = (record: any) => {
    const data: any[] = [];
    const merges: any[] = [];
    
    // Thống nhất viền cho toàn bảng
    const borderAll = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } }
    };

    const headerStyle = {
        font: { name: "Times New Roman", sz: 11, bold: true },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: borderAll,
        fill: { patternType: "solid", fgColor: { rgb: "D9D9D9" } } // Xám nhạt
    };
    
    const sectionStyle = {
        font: { name: "Times New Roman", sz: 12, bold: true, color: { rgb: "000000" } },
        alignment: { horizontal: "left", vertical: "center" },
        border: borderAll,
        fill: { patternType: "solid", fgColor: { rgb: "8FAADC" } } // Xanh dương nhạt như mẫu
    };

    const cellStyle = {
        font: { name: "Times New Roman", sz: 11 },
        alignment: { horizontal: "left", vertical: "top", wrapText: true },
        border: borderAll
    };
    
    const centerCellStyle = {
        ...cellStyle,
        alignment: { horizontal: "center", vertical: "center", wrapText: true }
    };

    const boldCenterStyle = {
        ...centerCellStyle,
        font: { name: "Times New Roman", sz: 11, bold: true }
    };

    const redBoldCenterStyle = {
        ...boldCenterStyle,
        font: { name: "Times New Roman", sz: 11, bold: true, color: { rgb: "FF0000" } }
    };

    // Hàm phụ trợ tạo ô có style
    const createCell = (value: any, style: any = cellStyle) => ({
        v: value ?? "",
        t: typeof value === "number" ? "n" : "s",
        s: style
    });

    // 1. TẠO HEADER THÔNG TIN NHÂN VIÊN
    data.push([
        createCell(`PHIẾU ĐÁNH GIÁ KẾT QUẢ CÔNG VIỆC`, { font: { name: "Times New Roman", sz: 16, bold: true }, alignment: { horizontal: "center" } })
    ]);
    merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 13 } });
    data.push([]); // Empty row
    
    const emp = record.employee || {};
    data.push([createCell("Nhân viên được đánh giá:"), createCell(emp.fullName, { font: { name: "Times New Roman", sz: 11, bold: true } })]);
    data.push([createCell("Chức danh:"), createCell(emp.jobTitle)]);
    data.push([createCell("Phòng ban:"), createCell(emp.departmentName)]);
    data.push([createCell("Kỳ đánh giá:"), createCell(record.period?.name)]);
    data.push([]); // Empty row
    
    let currentRow = data.length;

    // 2. DÒNG TIÊU ĐỀ BẢNG (14 cột)
    // Cột: 0:STT, 1:Tiêu chí, 2:Phương pháp, 3:Mức 1, 4:Mức 2, 5:Mức 3, 6:Mức 4, 7:Mức 5, 8:Trọng số, 9:Điểm chuẩn, 10:Điểm NV, 11:Kết quả NV, 12:Điểm QL, 13:Kết quả QL
    const tableHeader = [
        "STT", "Tiêu chí đánh giá", "Ghi nhận / Phương pháp đo lường", 
        "Mức 1", "Mức 2", "Mức 3", "Mức 4", "Mức 5", 
        "Trọng số", "Điểm chuẩn", "Điểm NV", "Kết quả NV", "Điểm QL", "Kết quả QL"
    ];
    data.push(tableHeader.map(h => createCell(h, headerStyle)));
    currentRow++;

    // 3. VÒNG LẶP QUA CÁC PHẦN (SECTIONS) VÀ TIÊU CHÍ (CRITERIA)
    const sections = record.template?.sections || [];
    
        sections.forEach((section: any) => {
        // Dòng Tiêu đề Phần
        const secRow = new Array(14).fill(createCell("", sectionStyle));
        secRow[0] = createCell(`PHẦN ${section.code} - ${section.name.toUpperCase()}`, sectionStyle);
        data.push(secRow);
        merges.push({ s: { r: currentRow, c: 0 }, e: { r: currentRow, c: 13 } });
        currentRow++;

        const criteriaList = section.criteria || [];
        
        criteriaList.forEach((crit: any) => {
            const empScoreRecord = record.scores?.find((s: any) => s.criteriaId === crit.id && s.scoredBy === "EMPLOYEE");
            const mgrScoreRecord = record.scores?.find((s: any) => s.criteriaId === crit.id && s.scoredBy === "MANAGER"); // Update to MANAGER as per DB
            
            const empScore = empScoreRecord?.score != null ? empScoreRecord.score : "";
            const mgrScore = mgrScoreRecord?.score != null ? mgrScoreRecord.score : "";
            
            const getLevelDesc = (c: any, lvl: number) => {
                const l = c.levels?.find((x: any) => x.level === lvl);
                return l ? l.description : "";
            };

            const weightStr = crit.weight ? `${Math.round(crit.weight * 100)}%` : "";

            if (crit.subCriteria && crit.subCriteria.length > 0) {
                // TÍNH TOÁN ĐIỂM CHO TIÊU CHÍ CHA
                let sumEmp = 0; let countEmp = 0;
                let sumMgr = 0; let countMgr = 0;
                crit.subCriteria.forEach((sub: any) => {
                    const e = record.scores?.find((s: any) => s.criteriaId === sub.id && s.scoredBy === "EMPLOYEE")?.score;
                    const m = record.scores?.find((s: any) => s.criteriaId === sub.id && s.scoredBy === "MANAGER")?.score;
                    if (e != null) { sumEmp += e; countEmp++; }
                    if (m != null) { sumMgr += m; countMgr++; }
                });
                const avgEmp = countEmp > 0 ? (sumEmp / crit.subCriteria.length) : null;
                const avgMgr = countMgr > 0 ? (sumMgr / crit.subCriteria.length) : null;
                
                const resEmp = avgEmp != null ? (avgEmp * crit.weight) : "";
                const resMgr = avgMgr != null ? (avgMgr * crit.weight) : "";

                // TIÊU CHÍ GỐC (CÓ MỤC CON)
                const parentRow = new Array(14).fill(createCell(""));
                parentRow[0] = createCell(crit.displayOrder, boldCenterStyle);
                parentRow[1] = createCell(crit.description ? `${crit.name}\n${crit.description}\nĐiểm đánh giá = Tổng điểm các yếu tố/${crit.subCriteria.length}` : `${crit.name}\nĐiểm đánh giá = Tổng điểm các yếu tố/${crit.subCriteria.length}`, boldCenterStyle);
                parentRow[2] = createCell("", cellStyle);
                
                // Mức 1-5 để trống
                // Trọng số
                parentRow[8] = createCell(weightStr, redBoldCenterStyle);
                parentRow[9] = createCell(5, redBoldCenterStyle); // Điểm chuẩn mặc định = 5
                
                // Điểm NV
                parentRow[10] = createCell(avgEmp != null ? Number(avgEmp.toFixed(2)) : "", redBoldCenterStyle);
                parentRow[11] = createCell(resEmp !== "" ? Number(resEmp.toFixed(2)) : "", redBoldCenterStyle);
                
                // Điểm QL
                parentRow[12] = createCell(avgMgr != null ? Number(avgMgr.toFixed(2)) : "", redBoldCenterStyle);
                parentRow[13] = createCell(resMgr !== "" ? Number(resMgr.toFixed(2)) : "", redBoldCenterStyle);
                
                data.push(parentRow);
                
                // Gộp các cột mức 1-5 thành 1 ô
                merges.push({ s: { r: currentRow, c: 3 }, e: { r: currentRow, c: 7 } });
                
                currentRow++;

                // TIÊU CHÍ CON
                crit.subCriteria.forEach((sub: any) => {
                    const subEmpScoreRec = record.scores?.find((s: any) => s.criteriaId === sub.id && s.scoredBy === "EMPLOYEE");
                    const subMgrScoreRec = record.scores?.find((s: any) => s.criteriaId === sub.id && s.scoredBy === "MANAGER");
                    
                    const subRow = new Array(14).fill(createCell(""));
                    subRow[0] = createCell(`${crit.displayOrder}.${sub.displayOrder}`, centerCellStyle);
                    subRow[1] = createCell(sub.description ? `${sub.name}\n${sub.description}` : sub.name, cellStyle);
                    subRow[2] = createCell(sub.measurementMethod, cellStyle);
                    
                    const getSubLevelDesc = (lvl: number) => {
                        const l = sub.levels?.find((x: any) => x.level === lvl);
                        return l ? l.description : "";
                    };
                    
                    subRow[3] = createCell(getSubLevelDesc(1), cellStyle);
                    subRow[4] = createCell(getSubLevelDesc(2), cellStyle);
                    subRow[5] = createCell(getSubLevelDesc(3), cellStyle);
                    subRow[6] = createCell(getSubLevelDesc(4), cellStyle);
                    subRow[7] = createCell(getSubLevelDesc(5), cellStyle);
                    
                    subRow[8] = createCell("", centerCellStyle); // Con ko có trọng số
                    subRow[9] = createCell("", centerCellStyle); // Con ko có điểm chuẩn -> FIX: "nhập mức điểm hoài ạ"
                    
                    subRow[10] = createCell(subEmpScoreRec?.score != null ? subEmpScoreRec.score : "", centerCellStyle);
                    subRow[11] = createCell("", centerCellStyle); // Kết quả NV trống
                    
                    subRow[12] = createCell(subMgrScoreRec?.score != null ? subMgrScoreRec.score : "", centerCellStyle);
                    subRow[13] = createCell("", centerCellStyle); // Kết quả QL trống
                    
                    data.push(subRow);
                    currentRow++;
                });

            } else {
                // TIÊU CHÍ KHÔNG CÓ MỤC CON
                const resEmp = empScore !== "" ? (empScore * crit.weight) : "";
                const resMgr = mgrScore !== "" ? (mgrScore * crit.weight) : "";

                const singleRow = new Array(14).fill(createCell(""));
                singleRow[0] = createCell(crit.displayOrder, boldCenterStyle);
                singleRow[1] = createCell(crit.description ? `${crit.name}\n${crit.description}` : crit.name, boldCenterStyle);
                singleRow[2] = createCell(crit.measurementMethod || "", cellStyle);
                
                singleRow[3] = createCell(getLevelDesc(crit, 1), cellStyle);
                singleRow[4] = createCell(getLevelDesc(crit, 2), cellStyle);
                singleRow[5] = createCell(getLevelDesc(crit, 3), cellStyle);
                singleRow[6] = createCell(getLevelDesc(crit, 4), cellStyle);
                singleRow[7] = createCell(getLevelDesc(crit, 5), cellStyle);
                singleRow[8] = createCell(weightStr, redBoldCenterStyle);
                singleRow[9] = createCell(5, redBoldCenterStyle); // Điểm chuẩn mặc định = 5
                
                singleRow[10] = createCell(empScore, redBoldCenterStyle);
                singleRow[11] = createCell(resEmp !== "" ? Number(resEmp.toFixed(2)) : "", redBoldCenterStyle);
                
                singleRow[12] = createCell(mgrScore, redBoldCenterStyle);
                singleRow[13] = createCell(resMgr !== "" ? Number(resMgr.toFixed(2)) : "", redBoldCenterStyle);
                
                data.push(singleRow);
                currentRow++;
            }
        });
    });

    // 4. KẾT XUẤT VÀ LƯU FILE
    const ws = XLSXStyle.utils.aoa_to_sheet(data);
    ws["!merges"] = merges;
    
    // Set độ rộng cột
    ws["!cols"] = [
        { wch: 6 },   // STT
        { wch: 25 },  // Tiêu chí
        { wch: 20 },  // Phương pháp
        { wch: 20 },  // Mức 1
        { wch: 20 },  // Mức 2
        { wch: 20 },  // Mức 3
        { wch: 20 },  // Mức 4
        { wch: 20 },  // Mức 5
        { wch: 10 },  // Trọng số
        { wch: 10 },  // Điểm chuẩn
        { wch: 12 },  // Điểm NV
        { wch: 12 },  // Kết quả NV
        { wch: 12 },  // Điểm QL
        { wch: 12 }   // Kết quả QL
    ];

    const wb = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(wb, ws, "Chi_Tiet_Danh_Gia");
    
    const fileName = `PhieuDanhGia_${emp.employeeCode || ""}_${dayjs().format("YYYYMMDD")}.xlsx`;
    XLSXStyle.writeFile(wb, fileName);
};
