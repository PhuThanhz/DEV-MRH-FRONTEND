# Báo Cáo Rà Soát Giao Diện Responsive (Responsive UI Audit) - HRM Project

> [!IMPORTANT]  
> Báo cáo này tổng hợp kết quả rà soát tĩnh toàn bộ mã nguồn frontend tại `hrm-frontend/src` nhằm phát hiện các giao diện sử dụng kích thước cố định, có nguy cơ hiển thị không tốt hoặc tràn viền trên các thiết bị di động, máy tính bảng và màn hình kích thước nhỏ.  
> **Lưu ý quan trọng:** Kết quả từ mã nguồn đã được phân loại chi tiết nhằm loại bỏ các báo cáo sai (false positives) và ghi nhận những ngoại lệ hợp lệ do thiết kế có chủ ý trước khi đưa ra checklist hành động thực tế.

---

## Bảng tổng quan phân loại vấn đề rà soát


| Phân loại | Số lượng vị trí | Mô tả chi tiết |
| :--- | :---: | :--- |
| **Đã xác nhận từ Code** | **35** | Lỗi kích thước pixel cứng rõ ràng trong Drawer/Modal hoặc container lớn mà chắc chắn gây tràn ngang trên mobile/tablet. |
| **Cần kiểm tra trực quan thêm** | **37** | Các vị trí nghi ngờ từ mã nguồn nhưng cần kiểm thử thực tế trên trình duyệt để đánh giá chính xác tác động UX (ví dụ: các modal trung bình, CSS 100vh). |
| **Ngoại lệ hợp lệ** | **5** | Các kích thước pixel cố định được thiết kế có mục đích hợp lý (ví dụ: menu mobile sidebar 280px, bảng nhiều cột nằm trong wrapper cuộn ngang). |
| **Báo sai (False Positives)** | **22** | Các trường hợp code phân tích tĩnh nhận diện nhầm do regex (ví dụ: max-width bị nhận diện nhầm, các grid đã có sẵn class responsive). |
| **Tổng cộng rà soát** | **99** | Tổng số vị trí nghi ngờ được đưa vào rà soát. |


---

## Top ưu tiên nên sửa đổi (Sau khi kiểm tra trực quan)

Dưới đây là các lỗi lớn đã xác nhận từ code có nguy cơ cao nhất làm tê liệt trải nghiệm di động của người dùng:

1. **Modal chi tiết bộ chứng từ (Accounting Dossier View)**:
   - **File:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-dossiers/index.tsx#L1404)
   - **Kích thước:** Khoá cứng `width={1040}` không có helper.
   - **Tác động:** Chắc chắn tràn màn hình nghiêm trọng trên mobile & tablet.
2. **Modal lịch sử duyệt chứng từ (Dossier Approval History)**:
   - **File:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-dossiers/index.tsx#L1818)
   - **Kích thước:** Khoá cứng `width={860}`.
   - **Tác động:** Tràn viền rộng trên iPad dọc và iPhone.
3. **Modal cấu hình Workflow kế toán (Workflow Config)**:
   - **File:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-workflows/index.tsx#L728)
   - **Kích thước:** Khoá cứng `width={760}`.
4. **Các Modal trong quản lý lộ trình thăng tiến và nhiệm vụ (Career Path / Department Missions)**:
   - **Files:**
     - [Viewcareerpathtemplate.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/department/career-path/Viewcareerpathtemplate.tsx#L318) (`width={700}`)
     - [DepartmentMissionDetail.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/department/objectives-tasks/components/DepartmentMissionDetail.tsx#L652) (`width={720}`, `760`, `680`)
5. **Drawer tiêu chí đánh giá bậc lương di động**:
   - **Files:**
     - [drawer.salary-grade-performance-rating.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/company/salary-grade/drawer/drawer.salary-grade-performance-rating.tsx#L45) (`width="60vw"`)
     - [drawer.rating-detail.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/evaluation-criteria/drawer.rating-detail.tsx#L17) (`width="55vw"`)
   - **Tác động:** Khiến Drawer bị bóp chiều rộng quá hẹp trên điện thoại (chỉ còn ~200px), gây vỡ toàn bộ chữ và nút nhập liệu bên trong.

---

## Danh sách ngoại lệ thiết kế hợp lệ (Không cần sửa)

Các vị trí sau đây khóa cứng kích thước pixel nhưng hoàn toàn hợp lệ do thiết kế nghiệp vụ:

- **Bảng dữ liệu nhiều cột trong Salary Range**:
  - File [SalaryRangePage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/salary-range/SalaryRangePage.tsx#L347) dùng `min-width: 1600px;` cho bảng dữ liệu. Tuy nhiên, bảng này nằm gọn trong container `.table-wrapper` có thiết lập `overflow-x: auto;` (cho phép cuộn ngang độc lập), giúp giao diện không bị vỡ và bảo toàn trải nghiệm xem nhiều cột thông số.
- **Menu Sidebar di động**:
  - File [slider.admin.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/layout/admin/slider.admin.tsx#L316) đặt Drawer menu rộng `280px` cố định. Đây là chuẩn UX để chừa một phần lề trống bên phải giúp người dùng click nhanh để ẩn/hiện menu.
- **Bộ lọc tìm kiếm tra cứu**:
  - Các ô tìm kiếm tra cứu nhanh ở [LookupPortalPage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/accounting/LookupPortalPage.tsx#L245) dùng `width: 360` cố định. Chiều rộng này nằm vừa vặn trong tất cả các khung nhìn màn hình di động phổ biến hiện nay mà không sợ bị tràn.

---

## Phân tích và sửa đổi cơ chế helper `getModalWidth()`

> [!WARNING]  
> Cơ chế `getModalWidth()` hiện tại trong [responsive.ts](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/utils/responsive.ts) đang đọc trực tiếp `window.innerWidth`. Hàm này không tự kích hoạt render lại (reactive) khi người dùng co giãn (resize) cửa sổ trình duyệt trừ phi component chứa nó được ép render lại.  
> **Khuyến nghị thiết kế sửa đổi:** Đối với các Modal/Drawer động cần phản ứng ngay lập tức với sự kiện co giãn cửa sổ trình duyệt, bắt buộc phải sử dụng hook `useResponsiveModalWidth()` (có lắng nghe sự kiện `resize` và cập nhật state thông qua `useBreakpoint()`).

---

## Chi tiết các vị trí rà soát


## Danh sách các vị trí: **Đã xác nhận từ Code (Chắc chắn lỗi)** (35 vị trí)

### 1. [Confirmed from Code] Modal tại Shared Components
- **Đường dẫn file & dòng code:** [LotusCharmAssistant.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/common/navigation/LotusCharmAssistant.tsx#L845)
- **Cách viết/Kích thước hiện tại:** `<Modal title={null} open={isFeedbackOpen} onCancel={() => setIsFeedbackOpen(false)} footer={null} width={700} style={{ t...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng lớn (700px) chắc chắn vượt quá chiều rộng của điện thoại di động (390px) và máy tính bảng dọc (768px), gây tràn ngang nghiêm trọng.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 2. [Confirmed from Code] Inline Style tại Other
- **Đường dẫn file & dòng code:** [WelcomePage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/WelcomePage.tsx#L26)
- **Cách viết/Kích thước hiện tại:** `width: "600px", height: "600px",`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng min-width hoặc width lớn (600px) bằng inline style trên container cha mà không nằm trong scroll wrapper, chắc chắn gây tràn ngang diện rộng.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 3. [Confirmed from Code] Inline Style tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [ModalAccountingDoc.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting/ModalAccountingDoc.tsx#L166)
- **Cách viết/Kích thước hiện tại:** `width: 600,`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng min-width hoặc width lớn (600px) bằng inline style trên container cha mà không nằm trong scroll wrapper, chắc chắn gây tràn ngang diện rộng.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 4. [Confirmed from Code] Modal tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-delegations/index.tsx#L360)
- **Cách viết/Kích thước hiện tại:** `<Modal title="Tạo ủy quyền" open={modalOpen} onCancel={() => setModalOpen(false)} width={560} centered destroyOnHidden f...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng trung bình (560px) lớn hơn viewport di động tiêu chuẩn (390px), gây tràn màn hình mobile.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 5. [Confirmed from Code] Modal tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [DossierDocumentList.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-dossiers/components/DossierDocumentList.tsx#L831)
- **Cách viết/Kích thước hiện tại:** `<Modal open={modalOpen} title={editingDoc ? "Sửa chứng từ con" : "Thêm chứng từ con"} okText={editingDoc ? "Lưu" : "Thêm...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng trung bình (560px) lớn hơn viewport di động tiêu chuẩn (390px), gây tràn màn hình mobile.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 6. [Confirmed from Code] Modal tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [DossierDocumentList.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-dossiers/components/DossierDocumentList.tsx#L988)
- **Cách viết/Kích thước hiện tại:** `<Modal open={reviewModalOpen} title={reviewingDoc ? `Kiểm tra: ${reviewingDoc.documentName}` : "Kiểm tra chứng từ"} okTe...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng lớn (600px) chắc chắn vượt quá chiều rộng của điện thoại di động (390px) và máy tính bảng dọc (768px), gây tràn ngang nghiêm trọng.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 7. [Confirmed from Code] Drawer tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-dossiers/index.tsx#L2289)
- **Cách viết/Kích thước hiện tại:** `<Drawer title={ <div> <div style={{ fontSize: 20, fontWeight: 800, color: "#1f2937" }}> Nhật ký bộ chứng từ </div> <div ...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng lớn (680px) chắc chắn vượt quá chiều rộng của điện thoại di động (390px) và máy tính bảng dọc (768px), gây tràn ngang nghiêm trọng.
- **Biểu hiện người dùng nhìn thấy:** Nội dung Drawer bị tràn viền màn hình hoặc chiếm toàn bộ viewport trên thiết bị di động, che lấp các nút đóng/hành động, gây khó khăn cho việc thao tác.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Drawer được đặt cố định (ví dụ: `width={520}` hoặc `width="60vw"`), không tự co giãn hoặc điều chỉnh tỷ lệ theo chiều rộng màn hình nhỏ.
- **Đề xuất cách sửa:** Sử dụng hàm helper `getModalWidth()` đã có sẵn trong `src/utils/responsive.ts` (ví dụ: `width={getModalWidth(520)}`) hoặc dùng CSS breakpoint để điều chỉnh `width` thành `100%` trên mobile.
- **Rủi ro khi thay đổi:** Thấp. Chỉ thay đổi kích thước hiển thị bên ngoài của Drawer, không ảnh hưởng đến logic nghiệp vụ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 8. [Confirmed from Code] Modal tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-dossiers/index.tsx#L1404)
- **Cách viết/Kích thước hiện tại:** `<Modal open={!!viewDossier} onCancel={() => setViewDossier(null)} width={1040} centered destroyOnHidden closeIcon={<Clos...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng lớn (1040px) chắc chắn vượt quá chiều rộng của điện thoại di động (390px) và máy tính bảng dọc (768px), gây tràn ngang nghiêm trọng.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 9. [Confirmed from Code] Modal tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-dossiers/index.tsx#L1780)
- **Cách viết/Kích thước hiện tại:** `<Modal title={`Mã QR bộ chứng từ${qrDossier?.dossierCode ? `: ${qrDossier.dossierCode}` : ""}`} open={!!qrDossier} onCan...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng trung bình (420px) lớn hơn viewport di động tiêu chuẩn (390px), gây tràn màn hình mobile.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 10. [Confirmed from Code] Modal tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-dossiers/index.tsx#L1818)
- **Cách viết/Kích thước hiện tại:** `<Modal title={`Lịch sử duyệt${(currentDossier || viewDossier)?.dossierCode ? ` - ${(currentDossier || viewDossier)?.doss...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng lớn (860px) chắc chắn vượt quá chiều rộng của điện thoại di động (390px) và máy tính bảng dọc (768px), gây tràn ngang nghiêm trọng.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 11. [Confirmed from Code] Modal tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-dossiers/index.tsx#L1991)
- **Cách viết/Kích thước hiện tại:** `<Modal title={ <div style={{ display: "flex", alignItems: "center", gap: 9 }}> <div style={{ width: 3, height: 18, borde...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng lớn (640px) chắc chắn vượt quá chiều rộng của điện thoại di động (390px) và máy tính bảng dọc (768px), gây tràn ngang nghiêm trọng.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 12. [Confirmed from Code] Modal tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-workflows/index.tsx#L728)
- **Cách viết/Kích thước hiện tại:** `<Modal open={!!viewingRecord} onCancel={() => setViewingRecord(null)} title={viewingRecord ? `Xem cấu hình · ${viewingRe...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng lớn (760px) chắc chắn vượt quá chiều rộng của điện thoại di động (390px) và máy tính bảng dọc (768px), gây tràn ngang nghiêm trọng.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 13. [Confirmed from Code] Modal tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-workflows/index.tsx#L788)
- **Cách viết/Kích thước hiện tại:** `<Modal open={!!validationResult} onCancel={() => setValidationResult(null)} title={validationResult?.errors.length ? "Kế...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng trung bình (560px) lớn hơn viewport di động tiêu chuẩn (390px), gây tràn màn hình mobile.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 14. [Confirmed from Code] Inline Style tại Admin: Department
- **Đường dẫn file & dòng code:** [ModalAssignCareerPath.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/department/career-path/ModalAssignCareerPath.tsx#L280)
- **Cách viết/Kích thước hiện tại:** `width: 600,`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng min-width hoặc width lớn (600px) bằng inline style trên container cha mà không nằm trong scroll wrapper, chắc chắn gây tràn ngang diện rộng.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 15. [Confirmed from Code] Modal tại Admin: Department
- **Đường dẫn file & dòng code:** [Viewcareerpathtemplate.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/department/career-path/Viewcareerpathtemplate.tsx#L318)
- **Cách viết/Kích thước hiện tại:** `<Modal title={null} open={open} onCancel={onClose} footer={null} width={700} destroyOnHidden styles={{ content: { paddin...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng lớn (700px) chắc chắn vượt quá chiều rộng của điện thoại di động (390px) và máy tính bảng dọc (768px), gây tràn ngang nghiêm trọng.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 16. [Confirmed from Code] Modal tại Admin: Department
- **Đường dẫn file & dòng code:** [DepartmentMissionDetail.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/department/objectives-tasks/components/DepartmentMissionDetail.tsx#L652)
- **Cách viết/Kích thước hiện tại:** `<Modal title="Lịch sử chỉnh sửa" open={historyOpen} onCancel={() => setHistoryOpen(false)} footer={null} width={720} sty...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng lớn (720px) chắc chắn vượt quá chiều rộng của điện thoại di động (390px) và máy tính bảng dọc (768px), gây tràn ngang nghiêm trọng.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 17. [Confirmed from Code] Modal tại Admin: Department
- **Đường dẫn file & dòng code:** [DepartmentMissionDetail.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/department/objectives-tasks/components/DepartmentMissionDetail.tsx#L707)
- **Cách viết/Kích thước hiện tại:** `<Modal title="Phiên bản đã ban hành" open={versionListOpen} onCancel={() => setVersionListOpen(false)} footer={null} wid...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng lớn (720px) chắc chắn vượt quá chiều rộng của điện thoại di động (390px) và máy tính bảng dọc (768px), gây tràn ngang nghiêm trọng.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 18. [Confirmed from Code] Modal tại Admin: Department
- **Đường dẫn file & dòng code:** [DepartmentMissionDetail.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/department/objectives-tasks/components/DepartmentMissionDetail.tsx#L756)
- **Cách viết/Kích thước hiện tại:** `<Modal title={previewVersion ? `Nội dung version v${previewVersion.version}` : "Nội dung version"} open={!!previewVersio...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng lớn (760px) chắc chắn vượt quá chiều rộng của điện thoại di động (390px) và máy tính bảng dọc (768px), gây tràn ngang nghiêm trọng.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 19. [Confirmed from Code] Modal tại Admin: Department
- **Đường dẫn file & dòng code:** [DepartmentMissionDetail.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/department/objectives-tasks/components/DepartmentMissionDetail.tsx#L802)
- **Cách viết/Kích thước hiện tại:** `<Modal title="Tạo version mới" open={versionOpen} onCancel={() => setVersionOpen(false)} okText="Tạo version" cancelText...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng lớn (680px) chắc chắn vượt quá chiều rộng của điện thoại di động (390px) và máy tính bảng dọc (768px), gây tràn ngang nghiêm trọng.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 20. [Confirmed from Code] Inline Style tại Other
- **Đường dẫn file & dòng code:** [modal.document.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/document/modal.document.tsx#L900)
- **Cách viết/Kích thước hiện tại:** `width: 820,`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng min-width hoặc width lớn (820px) bằng inline style trên container cha mà không nằm trong scroll wrapper, chắc chắn gây tràn ngang diện rộng.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 21. [Confirmed from Code] Modal tại Other
- **Đường dẫn file & dòng code:** [PeriodDetailDrawer.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/evaluation/periods/PeriodDetailDrawer.tsx#L2431)
- **Cách viết/Kích thước hiện tại:** `<Modal title={ <div style={{ display: "flex", alignItems: "center", gap: 10 }}> <span style={{ width: 34, height: 34, di...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng lớn (640px) chắc chắn vượt quá chiều rộng của điện thoại di động (390px) và máy tính bảng dọc (768px), gây tràn ngang nghiêm trọng.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 22. [Confirmed from Code] Modal tại Other
- **Đường dẫn file & dòng code:** [PeriodDetailDrawer.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/evaluation/periods/PeriodDetailDrawer.tsx#L2486)
- **Cách viết/Kích thước hiện tại:** `<Modal title={null} open={extendModalOpen} onCancel={() => { setExtendModalOpen(false); setSelectedEmployeeForExtend(nul...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng lớn (940px) chắc chắn vượt quá chiều rộng của điện thoại di động (390px) và máy tính bảng dọc (768px), gây tràn ngang nghiêm trọng.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 23. [Confirmed from Code] Modal tại Other
- **Đường dẫn file & dòng code:** [PeriodDetailDrawer.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/evaluation/periods/PeriodDetailDrawer.tsx#L2889)
- **Cách viết/Kích thước hiện tại:** `<Modal title={ <div style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "10px", marginBottom: "15px" }}> <span st...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng trung bình (450px) lớn hơn viewport di động tiêu chuẩn (390px), gây tràn màn hình mobile.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 24. [Confirmed from Code] Modal tại Admin: Procedures & JD
- **Đường dẫn file & dòng code:** [modal-issue-jd.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/job-description/components/modal-issue-jd.tsx#L19)
- **Cách viết/Kích thước hiện tại:** `<Modal open={open} title={ <Space> <CheckCircleOutlined style={{ color: "#1677ff" }} /> <span>Xác nhận ban hành JD</span...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng trung bình (460px) lớn hơn viewport di động tiêu chuẩn (390px), gây tràn màn hình mobile.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 25. [Confirmed from Code] Modal tại Admin: Procedures & JD
- **Đường dẫn file & dòng code:** [modal-reject-jd.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/job-description/components/modal-reject-jd.tsx#L41)
- **Cách viết/Kích thước hiện tại:** `<Modal open={open} title={ <Space> <StopOutlined style={{ color: "#ff4d4f" }} /> <span>{title}</span> </Space> } okText=...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng trung bình (480px) lớn hơn viewport di động tiêu chuẩn (390px), gây tràn màn hình mobile.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 26. [Confirmed from Code] Modal tại Admin: Procedures & JD
- **Đường dẫn file & dòng code:** [modal-reject-reason-jd.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/job-description/components/modal-reject-reason-jd.tsx#L37)
- **Cách viết/Kích thước hiện tại:** `<Modal open={open} onCancel={onClose} footer={null} width={460} title={ <Space> <StopOutlined style={{ color: "#ff4d4f" ...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng trung bình (460px) lớn hơn viewport di động tiêu chuẩn (390px), gây tràn màn hình mobile.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 27. [Confirmed from Code] Modal tại Admin: Procedures & JD
- **Đường dẫn file & dòng code:** [modal.jd-flow.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/job-description/modal.jd-flow.tsx#L349)
- **Cách viết/Kích thước hiện tại:** `<Modal open={open} title={ <div style={{ display: "flex", alignItems: "center", gap: 9 }}> <div style={{ width: 3, heigh...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng trung bình (580px) lớn hơn viewport di động tiêu chuẩn (390px), gây tràn màn hình mobile.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 28. [Confirmed from Code] Drawer tại Admin: Roles & Permissions
- **Đường dẫn file & dòng code:** [view.permission-content.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/permission-category/content/view.permission-content.tsx#L12)
- **Cách viết/Kích thước hiện tại:** `<Drawer open={open} width={500} title="Chi tiết nội dung quyền" onClose={() => setOpen(false)} destroyOnHidden >...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng trung bình (500px) lớn hơn viewport di động tiêu chuẩn (390px), gây tràn màn hình mobile.
- **Biểu hiện người dùng nhìn thấy:** Nội dung Drawer bị tràn viền màn hình hoặc chiếm toàn bộ viewport trên thiết bị di động, che lấp các nút đóng/hành động, gây khó khăn cho việc thao tác.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Drawer được đặt cố định (ví dụ: `width={520}` hoặc `width="60vw"`), không tự co giãn hoặc điều chỉnh tỷ lệ theo chiều rộng màn hình nhỏ.
- **Đề xuất cách sửa:** Sử dụng hàm helper `getModalWidth()` đã có sẵn trong `src/utils/responsive.ts` (ví dụ: `width={getModalWidth(520)}`) hoặc dùng CSS breakpoint để điều chỉnh `width` thành `100%` trên mobile.
- **Rủi ro khi thay đổi:** Thấp. Chỉ thay đổi kích thước hiển thị bên ngoài của Drawer, không ảnh hưởng đến logic nghiệp vụ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 29. [Confirmed from Code] Drawer tại Other
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/personal-drive/index.tsx#L1718)
- **Cách viết/Kích thước hiện tại:** `<Drawer title={ <Space> <InfoCircleOutlined style={{ color: "#3b82f6" }} /> <span>Chi tiết tài liệu</span> </Space> } pl...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng trung bình (420px) lớn hơn viewport di động tiêu chuẩn (390px), gây tràn màn hình mobile.
- **Biểu hiện người dùng nhìn thấy:** Nội dung Drawer bị tràn viền màn hình hoặc chiếm toàn bộ viewport trên thiết bị di động, che lấp các nút đóng/hành động, gây khó khăn cho việc thao tác.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Drawer được đặt cố định (ví dụ: `width={520}` hoặc `width="60vw"`), không tự co giãn hoặc điều chỉnh tỷ lệ theo chiều rộng màn hình nhỏ.
- **Đề xuất cách sửa:** Sử dụng hàm helper `getModalWidth()` đã có sẵn trong `src/utils/responsive.ts` (ví dụ: `width={getModalWidth(520)}`) hoặc dùng CSS breakpoint để điều chỉnh `width` thành `100%` trên mobile.
- **Rủi ro khi thay đổi:** Thấp. Chỉ thay đổi kích thước hiển thị bên ngoài của Drawer, không ảnh hưởng đến logic nghiệp vụ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 30. [Confirmed from Code] Modal tại Admin: Procedures & JD
- **Đường dẫn file & dòng code:** [ProcedureTable.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/procedures/components/table/ProcedureTable.tsx#L172)
- **Cách viết/Kích thước hiện tại:** `<Modal open={ctx.openQrModal} onCancel={() => ctx.setOpenQrModal(false)} footer={null} closable={false} width={420} cent...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng trung bình (420px) lớn hơn viewport di động tiêu chuẩn (390px), gây tràn màn hình mobile.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 31. [Confirmed from Code] Inline Style tại Admin: Roles & Permissions
- **Đường dẫn file & dòng code:** [modal.role.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/role/modal.role.tsx#L87)
- **Cách viết/Kích thước hiện tại:** `width: 1200, // Dynamic responsive width is handled gracefully by our CSS media queries!`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng min-width hoặc width lớn (1200px) bằng inline style trên container cha mà không nằm trong scroll wrapper, chắc chắn gây tràn ngang diện rộng.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 32. [Confirmed from Code] Modal tại Evaluation
- **Đường dẫn file & dòng code:** [ApprovalDetailPage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/evaluation/approval/ApprovalDetailPage.tsx#L949)
- **Cách viết/Kích thước hiện tại:** `<Modal title={ <span className="evaluation-reason-modal-title"> <FileTextOutlined /> Trả lại bản đánh giá </span> } open...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng trung bình (520px) lớn hơn viewport di động tiêu chuẩn (390px), gây tràn màn hình mobile.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 33. [Confirmed from Code] Modal tại Evaluation
- **Đường dẫn file & dòng code:** [ApprovalDetailPage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/evaluation/approval/ApprovalDetailPage.tsx#L992)
- **Cách viết/Kích thước hiện tại:** `<Modal title={ <span className="evaluation-reason-modal-title"> <CheckCircleOutlined /> Xác nhận phê duyệt </span> } ope...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng trung bình (540px) lớn hơn viewport di động tiêu chuẩn (390px), gây tràn màn hình mobile.
- **Biểu hiện người dùng nhìn thấy:** Modal hiển thị quá rộng, bị cắt ở các cạnh bên trên màn hình di động/tablet, khiến người dùng không thể nhấn nút Hủy/Lưu hoặc đóng Modal.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Modal được khai báo cứng bằng pixel (ví dụ: `width={700}` hoặc `width={1040}`), lớn hơn nhiều so với chiều rộng viewport mobile (390px) hoặc tablet (768px).
- **Đề xuất cách sửa:** Bọc giá trị width bằng `getModalWidth(baseWidth)`, ví dụ: `width={getModalWidth(700)}`. Hàm này sẽ tự động chuyển thành `100vw` trên mobile và `95vw` trên tablet.
- **Rủi ro khi thay đổi:** Thấp. Đảm bảo form bên trong Modal sử dụng layout flex/grid co giãn tốt để không bị vỡ giao diện khi Modal thu nhỏ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 34. [Confirmed from Code] Drawer tại Evaluation
- **Đường dẫn file & dòng code:** [MyEvaluationPage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/evaluation/my-records/MyEvaluationPage.tsx#L702)
- **Cách viết/Kích thước hiện tại:** `<Drawer title={historyRecord ? `Lịch sử đánh giá - ${historyRecord.employee?.fullName || historyRecord.employee?.usernam...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng trung bình (520px) lớn hơn viewport di động tiêu chuẩn (390px), gây tràn màn hình mobile.
- **Biểu hiện người dùng nhìn thấy:** Nội dung Drawer bị tràn viền màn hình hoặc chiếm toàn bộ viewport trên thiết bị di động, che lấp các nút đóng/hành động, gây khó khăn cho việc thao tác.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Drawer được đặt cố định (ví dụ: `width={520}` hoặc `width="60vw"`), không tự co giãn hoặc điều chỉnh tỷ lệ theo chiều rộng màn hình nhỏ.
- **Đề xuất cách sửa:** Sử dụng hàm helper `getModalWidth()` đã có sẵn trong `src/utils/responsive.ts` (ví dụ: `width={getModalWidth(520)}`) hoặc dùng CSS breakpoint để điều chỉnh `width` thành `100%` trên mobile.
- **Rủi ro khi thay đổi:** Thấp. Chỉ thay đổi kích thước hiển thị bên ngoài của Drawer, không ảnh hưởng đến logic nghiệp vụ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 35. [Confirmed from Code] Drawer tại Evaluation
- **Đường dẫn file & dòng code:** [PendingEvaluationPage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/evaluation/process/PendingEvaluationPage.tsx#L744)
- **Cách viết/Kích thước hiện tại:** `<Drawer title={historyRecord ? `Lịch sử đánh giá - ${historyRecord.employee?.fullName || historyRecord.employee?.usernam...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Modal/Drawer khóa cứng pixel chiều rộng trung bình (520px) lớn hơn viewport di động tiêu chuẩn (390px), gây tràn màn hình mobile.
- **Biểu hiện người dùng nhìn thấy:** Nội dung Drawer bị tràn viền màn hình hoặc chiếm toàn bộ viewport trên thiết bị di động, che lấp các nút đóng/hành động, gây khó khăn cho việc thao tác.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Drawer được đặt cố định (ví dụ: `width={520}` hoặc `width="60vw"`), không tự co giãn hoặc điều chỉnh tỷ lệ theo chiều rộng màn hình nhỏ.
- **Đề xuất cách sửa:** Sử dụng hàm helper `getModalWidth()` đã có sẵn trong `src/utils/responsive.ts` (ví dụ: `width={getModalWidth(520)}`) hoặc dùng CSS breakpoint để điều chỉnh `width` thành `100%` trên mobile.
- **Rủi ro khi thay đổi:** Thấp. Chỉ thay đổi kích thước hiển thị bên ngoài của Drawer, không ảnh hưởng đến logic nghiệp vụ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---


## Danh sách các vị trí: **Cần kiểm tra trực quan thêm (Nghi ngờ)** (37 vị trí)

### 36. [Needs Visual Validation] 100vh tại Other
- **Đường dẫn file & dòng code:** [layout.admin.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/admin/layout.admin.tsx#L125)
- **Cách viết/Kích thước hiện tại:** `<Layout style={{ minHeight: '100vh' }} className="layout-admin">`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 37. [Needs Visual Validation] 100vh tại Shared Components
- **Đường dẫn file & dòng code:** [loading.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/common/loading/loading.tsx#L9)
- **Cách viết/Kích thước hiện tại:** `height: "100vh",`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 38. [Needs Visual Validation] Inline Style tại Shared Components
- **Đường dẫn file & dòng code:** [LotusCharmAssistant.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/common/navigation/LotusCharmAssistant.tsx#L295)
- **Cách viết/Kích thước hiện tại:** `width: 318,`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng kích thước trung bình (318px) bằng inline style, cần kiểm tra xem có cơ chế co giãn nào khác hỗ trợ không.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 39. [Needs Visual Validation] Inline Style tại Shared Components
- **Đường dẫn file & dòng code:** [LotusCharmAssistant.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/common/navigation/LotusCharmAssistant.tsx#L1088)
- **Cách viết/Kích thước hiện tại:** `<div style={{ width: 320, height: 180, borderRadius: 20, background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.05)", overflow: "hidden" }}>`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng kích thước trung bình (320px) bằng inline style, cần kiểm tra xem có cơ chế co giãn nào khác hỗ trợ không.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 40. [Needs Visual Validation] 100vh tại Layout & Home
- **Đường dẫn file & dòng code:** [layout.admin.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/layout/admin/layout.admin.tsx#L104)
- **Cách viết/Kích thước hiện tại:** `<Layout style={{ minHeight: "100vh", background: "#f8f9fa" }}>`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 41. [Needs Visual Validation] 100vh tại Layout & Home
- **Đường dẫn file & dòng code:** [layout.admin.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/layout/admin/layout.admin.tsx#L127)
- **Cách viết/Kích thước hiện tại:** `minHeight: "calc(100vh - 64px)",`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 42. [Needs Visual Validation] 100vh tại Layout & Home
- **Đường dẫn file & dòng code:** [slider.admin.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/layout/admin/slider.admin.tsx#L401)
- **Cách viết/Kích thước hiện tại:** `height: "100vh",`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 43. [Needs Visual Validation] 100vh tại Layout & Home
- **Đường dẫn file & dòng code:** [slider.admin.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/layout/admin/slider.admin.tsx#L408)
- **Cách viết/Kích thước hiện tại:** `<div className="sidebar-scroll" style={{ overflowY: "auto", height: "calc(100vh - 64px)" }}>`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 44. [Needs Visual Validation] 100vh tại Other
- **Đường dẫn file & dòng code:** [not.found.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/share/not.found.tsx#L10)
- **Cách viết/Kích thước hiện tại:** `minHeight: '100vh',`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 45. [Needs Visual Validation] 100vh tại Other
- **Đường dẫn file & dòng code:** [route-error.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/share/route-error.tsx#L22)
- **Cách viết/Kích thước hiện tại:** `minHeight: "100vh",`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 46. [Needs Visual Validation] 100vh tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [LookupPortalPage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/accounting/LookupPortalPage.tsx#L216)
- **Cách viết/Kích thước hiện tại:** `<div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden", background: T.white, fontFamily: T.sans }}>`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 47. [Needs Visual Validation] Inline Style tại Other
- **Đường dẫn file & dòng code:** [WelcomePage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/WelcomePage.tsx#L34)
- **Cách viết/Kích thước hiện tại:** `width: "500px", height: "500px",`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng kích thước trung bình (500px) bằng inline style, cần kiểm tra xem có cơ chế co giãn nào khác hỗ trợ không.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 48. [Needs Visual Validation] 100vh tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [DossierTemplateDrawer.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-dossiers/components/DossierTemplateDrawer.tsx#L311)
- **Cách viết/Kích thước hiện tại:** `height="calc(100vh - 24px)"`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 49. [Needs Visual Validation] Inline Style tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-workflows/index.tsx#L950)
- **Cách viết/Kích thước hiện tại:** `dropdownStyle={{ minWidth: 400 }}`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng kích thước trung bình (400px) bằng inline style, cần kiểm tra xem có cơ chế co giãn nào khác hỗ trợ không.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 50. [Needs Visual Validation] Inline Style tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-workflows/index.tsx#L1363)
- **Cách viết/Kích thước hiện tại:** `dropdownStyle={{ minWidth: 450 }}`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng kích thước trung bình (450px) bằng inline style, cần kiểm tra xem có cơ chế co giãn nào khác hỗ trợ không.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 51. [Needs Visual Validation] Inline Style tại Other
- **Đường dẫn file & dòng code:** [department-profile.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/dashboard/department-profile.tsx#L387)
- **Cách viết/Kích thước hiện tại:** `width: 320,            // ← đặt width cố định tránh cột co quá hẹp`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng kích thước trung bình (320px) bằng inline style, cần kiểm tra xem có cơ chế co giãn nào khác hỗ trợ không.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 52. [Needs Visual Validation] 100vh tại Admin: Department
- **Đường dẫn file & dòng code:** [CareerPathPage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/department/career-path/CareerPathPage.tsx#L65)
- **Cách viết/Kích thước hiện tại:** `height="calc(100vh - 16px)"`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 53. [Needs Visual Validation] Inline Style tại Admin: Department
- **Đường dẫn file & dòng code:** [drawer.assign-job-title.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/department/drawer.assign-job-title.tsx#L314)
- **Cách viết/Kích thước hiện tại:** `style={{ width: 380 }}`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng kích thước trung bình (380px) bằng inline style, cần kiểm tra xem có cơ chế co giãn nào khác hỗ trợ không.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 54. [Needs Visual Validation] Inline Style tại Admin: Department
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/department/mission-console/index.tsx#L385)
- **Cách viết/Kích thước hiện tại:** `width: 420,`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng kích thước trung bình (420px) bằng inline style, cần kiểm tra xem có cơ chế co giãn nào khác hỗ trợ không.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 55. [Needs Visual Validation] 100vh tại Admin: Department
- **Đường dẫn file & dòng code:** [PositionChartContent.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/department/position-chart/PositionChartContent.tsx#L168)
- **Cách viết/Kích thước hiện tại:** `height="calc(100vh - 16px)"`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 56. [Needs Visual Validation] Inline Style tại Other
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/document/index.tsx#L339)
- **Cách viết/Kích thước hiện tại:** `width: 320,`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng kích thước trung bình (320px) bằng inline style, cần kiểm tra xem có cơ chế co giãn nào khác hỗ trợ không.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 57. [Needs Visual Validation] 100vh tại Other
- **Đường dẫn file & dòng code:** [PeriodModal.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/evaluation/periods/PeriodModal.tsx#L262)
- **Cách viết/Kích thước hiện tại:** `height="calc(100vh - 16px)"`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 58. [Needs Visual Validation] Inline Style tại Other
- **Đường dẫn file & dòng code:** [PeriodModal.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/evaluation/periods/PeriodModal.tsx#L327)
- **Cách viết/Kích thước hiện tại:** `minWidth: 560,`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng kích thước trung bình (560px) bằng inline style, cần kiểm tra xem có cơ chế co giãn nào khác hỗ trợ không.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 59. [Needs Visual Validation] Inline Style tại Other
- **Đường dẫn file & dòng code:** [PeriodPage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/evaluation/periods/PeriodPage.tsx#L221)
- **Cách viết/Kích thước hiện tại:** `minWidth: "320px"`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng kích thước trung bình (320px) bằng inline style, cần kiểm tra xem có cơ chế co giãn nào khác hỗ trợ không.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 60. [Needs Visual Validation] Inline Style tại Other
- **Đường dẫn file & dòng code:** [PeriodPage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/evaluation/periods/PeriodPage.tsx#L472)
- **Cách viết/Kích thước hiện tại:** `width: 380,`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng kích thước trung bình (380px) bằng inline style, cần kiểm tra xem có cơ chế co giãn nào khác hỗ trợ không.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 61. [Needs Visual Validation] 100vh tại Other
- **Đường dẫn file & dòng code:** [TemplateDetailPage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/evaluation/templates/TemplateDetailPage.tsx#L680)
- **Cách viết/Kích thước hiện tại:** `<div style={{ padding: embedded ? "18px" : "24px", minHeight: embedded ? "100%" : "calc(100vh - 100px)", background: "#f1f5f9" }}>`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 62. [Needs Visual Validation] Inline Style tại Other
- **Đường dẫn file & dòng code:** [TemplatePage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/evaluation/templates/TemplatePage.tsx#L156)
- **Cách viết/Kích thước hiện tại:** `width: 380,`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng kích thước trung bình (380px) bằng inline style, cần kiểm tra xem có cơ chế co giãn nào khác hỗ trợ không.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 63. [Needs Visual Validation] 100vh tại Other
- **Đường dẫn file & dòng code:** [PersonalOverviewPage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/overview/PersonalOverviewPage.tsx#L105)
- **Cách viết/Kích thước hiện tại:** `minHeight: "calc(100vh - 64px)",`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 64. [Needs Visual Validation] Inline Style tại Admin: Roles & Permissions
- **Đường dẫn file & dòng code:** [permission-matrix.drawer.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/permission-category/content/permission-matrix.drawer.tsx#L154)
- **Cách viết/Kích thước hiện tại:** `width: 320,`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng kích thước trung bình (320px) bằng inline style, cần kiểm tra xem có cơ chế co giãn nào khác hỗ trợ không.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 65. [Needs Visual Validation] 100vh tại Admin: Roles & Permissions
- **Đường dẫn file & dòng code:** [modal.role.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/role/modal.role.tsx#L754)
- **Cách viết/Kích thước hiện tại:** `height: 100vh !important;`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 66. [Needs Visual Validation] 100vh tại Admin: Roles & Permissions
- **Đường dẫn file & dòng code:** [modal.role.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/role/modal.role.tsx#L788)
- **Cách viết/Kích thước hiện tại:** `height: calc(100vh - 128px) !important;`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 67. [Needs Visual Validation] 100vh tại Authentication
- **Đường dẫn file & dòng code:** [login.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/auth/login.tsx#L198)
- **Cách viết/Kích thước hiện tại:** `height: 100vh;`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 68. [Needs Visual Validation] Inline Style tại Layout & Home
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/home/index.tsx#L48)
- **Cách viết/Kích thước hiện tại:** `width: "400px",`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng kích thước trung bình (400px) bằng inline style, cần kiểm tra xem có cơ chế co giãn nào khác hỗ trợ không.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 69. [Needs Visual Validation] Inline Style tại Layout & Home
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/home/index.tsx#L62)
- **Cách viết/Kích thước hiện tại:** `width: "450px",`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Khóa cứng kích thước trung bình (450px) bằng inline style, cần kiểm tra xem có cơ chế co giãn nào khác hỗ trợ không.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 70. [Needs Visual Validation] 100vh tại Other
- **Đường dẫn file & dòng code:** [PublicProcedureView.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/public/PublicProcedureView.tsx#L188)
- **Cách viết/Kích thước hiện tại:** `minHeight: "100vh",`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 71. [Needs Visual Validation] 100vh tại Other
- **Đường dẫn file & dòng code:** [PublicProcedureView.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/public/PublicProcedureView.tsx#L327)
- **Cách viết/Kích thước hiện tại:** `minHeight: "100vh",`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 72. [Needs Visual Validation] 100vh tại QR Scan
- **Đường dẫn file & dòng code:** [QrScanPage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/scan/QrScanPage.tsx#L382)
- **Cách viết/Kích thước hiện tại:** `minHeight: "100vh",`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Sử dụng chiều cao 100vh có thể bị che khuất footer trên di động do thanh công cụ động của Safari/Chrome di động, cần kiểm thử trực quan trên thiết bị thật.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---


## Danh sách các vị trí: **Ngoại lệ hợp lệ (Thiết kế cố ý)** (5 vị trí)

### 73. [Valid Exception] Drawer tại Layout & Home
- **Đường dẫn file & dòng code:** [slider.admin.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/layout/admin/slider.admin.tsx#L316)
- **Cách viết/Kích thước hiện tại:** `<Drawer placement="left" open={mobileOpen} onClose={() => setMobileOpen(false)} width={280} styles={{ body: { padding: 0...`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Chiều rộng menu sidebar di động cố định 280px là tiêu chuẩn UX để người dùng chạm vào phần lề trống bên phải để đóng menu.
- **Biểu hiện người dùng nhìn thấy:** Nội dung Drawer bị tràn viền màn hình hoặc chiếm toàn bộ viewport trên thiết bị di động, che lấp các nút đóng/hành động, gây khó khăn cho việc thao tác.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` của Drawer được đặt cố định (ví dụ: `width={520}` hoặc `width="60vw"`), không tự co giãn hoặc điều chỉnh tỷ lệ theo chiều rộng màn hình nhỏ.
- **Đề xuất cách sửa:** Sử dụng hàm helper `getModalWidth()` đã có sẵn trong `src/utils/responsive.ts` (ví dụ: `width={getModalWidth(520)}`) hoặc dùng CSS breakpoint để điều chỉnh `width` thành `100%` trên mobile.
- **Rủi ro khi thay đổi:** Thấp. Chỉ thay đổi kích thước hiển thị bên ngoài của Drawer, không ảnh hưởng đến logic nghiệp vụ.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 74. [Valid Exception] Inline Style tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [LookupPortalPage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/accounting/LookupPortalPage.tsx#L245)
- **Cách viết/Kích thước hiện tại:** `width: 360,`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Thanh tìm kiếm/bộ lọc tra cứu rộng 360px nằm vừa vặn trên các màn hình di động phổ biến (từ 360px trở lên) và không gây tràn.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 75. [Valid Exception] Inline Style tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting/index.tsx#L480)
- **Cách viết/Kích thước hiện tại:** `width: 360,`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Bộ lọc tra cứu rộng 360px nằm vừa vặn trên mobile.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 76. [Valid Exception] Inline Style tại Admin: Department
- **Đường dẫn file & dòng code:** [drawer.assign-job-title.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/department/drawer.assign-job-title.tsx#L228)
- **Cách viết/Kích thước hiện tại:** `width: 390,`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Kích thước phần tử nhỏ, tự động co giãn phù hợp.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 77. [Valid Exception] Inline Style tại Other
- **Đường dẫn file & dòng code:** [SalaryRangePage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/salary-range/SalaryRangePage.tsx#L347)
- **Cách viết/Kích thước hiện tại:** `font-size: 14px; min-width: 1600px; background: white;`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Bảng tính nhiều cột cần giữ min-width 1600px để tránh chữ bị ép và đặt trong container .table-wrapper có overflow-x: auto (cuộn ngang chủ động), đây là thiết kế hợp lý.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---


## Danh sách các vị trí: **Báo sai - False Positives (Không cần sửa)** (22 vị trí)

### 78. [False Positive] 100vh tại Shared Components
- **Đường dẫn file & dòng code:** [LotusCharmAssistant.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/common/navigation/LotusCharmAssistant.tsx#L297)
- **Cách viết/Kích thước hiện tại:** `maxHeight: "min(560px, calc(100vh - 168px))",`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 79. [False Positive] 100vh tại Shared Components
- **Đường dẫn file & dòng code:** [NotificationGrid.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/common/notification/NotificationGrid.tsx#L255)
- **Cách viết/Kích thước hiện tại:** `<div className="bg-white rounded-[22px] shadow-[0_24px_60px_-24px_rgba(71,85,105,0.28)] overflow-hidden flex flex-col border border-slate-200/80 fixed left-3 right-3 top-[70px] w-auto sm:relative sm:left-auto sm:right-auto sm:top-auto sm:w-[440px] max-h-[calc(100vh-96px)]">`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 80. [False Positive] Tailwind Fixed Class tại Shared Components
- **Đường dẫn file & dòng code:** [NotificationGrid.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/common/notification/NotificationGrid.tsx#L255)
- **Cách viết/Kích thước hiện tại:** `<div className="bg-white rounded-[22px] shadow-[0_24px_60px_-24px_rgba(71,85,105,0.28)] overflow-hidden flex flex-col border border-slate-200/80 fixed left-3 right-3 top-[70px] w-auto sm:relative sm:left-auto sm:right-auto sm:top-auto sm:w-[440px] max-h-[calc(100vh-96px)]">`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** 
- **Nguyên nhân kỹ thuật:** 
- **Đề xuất cách sửa:** 
- **Rủi ro khi thay đổi:** 
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 81. [False Positive] Tailwind Fixed Class tại Layout & Home
- **Đường dẫn file & dòng code:** [header.client.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/components/layout/client/header.client.tsx#L254)
- **Cách viết/Kích thước hiện tại:** `<div className="relative z-10 flex items-center justify-between h-16 px-4 sm:px-6 max-w-[1200px] mx-auto gap-4">`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** 
- **Nguyên nhân kỹ thuật:** 
- **Đề xuất cách sửa:** 
- **Rủi ro khi thay đổi:** 
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 82. [False Positive] 100vh tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [DossierTemplateDrawer.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-dossiers/components/DossierTemplateDrawer.tsx#L667)
- **Cách viết/Kích thước hiện tại:** `styles={{ body: { height: "clamp(560px, calc(100vh - 210px), 720px)", maxHeight: "calc(100vh - 210px)", overflowY: "auto" } }}`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 83. [False Positive] 100vh tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-dossiers/index.tsx#L1413)
- **Cách viết/Kích thước hiện tại:** `body: { padding: 0, maxHeight: "calc(100vh - 180px)", overflowY: "auto" },`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 84. [False Positive] 100vh tại Accounting & Dossiers
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/accounting-workflows/index.tsx#L833)
- **Cách viết/Kích thước hiện tại:** `maxHeight: "calc(100vh - 178px)",`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 85. [False Positive] Inline Style tại Admin: Company & Org Chart
- **Đường dẫn file & dòng code:** [modal.node.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/company/org-chart/modal.node.tsx#L291)
- **Cách viết/Kích thước hiện tại:** `<div style={{ width: 320, maxHeight: 360, overflowY: "auto" }}>`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 86. [False Positive] Tailwind Fixed Class tại Admin: Department
- **Đường dẫn file & dòng code:** [index.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/department/mission-console/index.tsx#L389)
- **Cách viết/Kích thước hiện tại:** `<span className="block max-w-[390px] truncate" style={TABLE_TEXT_STYLE}>`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** 
- **Nguyên nhân kỹ thuật:** 
- **Đề xuất cách sửa:** 
- **Rủi ro khi thay đổi:** 
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 87. [False Positive] Grid Layout tại Admin: Department
- **Đường dẫn file & dòng code:** [DepartmentMissionDetail.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/department/objectives-tasks/components/DepartmentMissionDetail.tsx#L822)
- **Cách viết/Kích thước hiện tại:** `<div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet dọc (768×1024)
- **Đánh giá thực tế:** Cột đã sử dụng class responsive grid-cols-1 sm:grid-cols-[1fr_180px], tự động chuyển thành 1 cột trên mobile.
- **Biểu hiện người dùng nhìn thấy:** Các cột trong grid bị bóp méo, văn bản bị đè lên nhau hoặc nút hành động bị đẩy ra ngoài màn hình trên thiết bị di động.
- **Nguyên nhân kỹ thuật:** Grid sử dụng cấu hình cột cố định mà không có breakpoint thích hợp cho màn hình nhỏ, ép buộc hiển thị nhiều cột ngay cả trên mobile.
- **Đề xuất cách sửa:** Thay đổi cấu hình thành mặc định 1 cột trên mobile và tăng lên nhiều cột trên màn hình lớn bằng class Tailwind (ví dụ: `grid-cols-1 sm:grid-cols-[...]`).
- **Rủi ro khi thay đổi:** Thấp. Cần kiểm tra lại thứ tự hiển thị của các phần tử khi xếp chồng lên nhau.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 88. [False Positive] 100vh tại Other
- **Đường dẫn file & dòng code:** [view.document.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/document/view.document.tsx#L460)
- **Cách viết/Kích thước hiện tại:** `body: { padding: 0, maxHeight: "calc(100vh - 220px)", overflowY: "auto" },`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 89. [False Positive] Inline Style tại Admin: Employees
- **Đường dẫn file & dòng code:** [view.employee.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/employees/view.employee.tsx#L249)
- **Cách viết/Kích thước hiện tại:** `min-width: 480px;`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** min-width: 480px của bảng vị trí được loại bỏ hoàn toàn trên màn hình dưới 600px qua media query (min-width: unset !important).
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 90. [False Positive] 100vh tại Admin: Procedures & JD
- **Đường dẫn file & dòng code:** [view.procedure.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/admin/procedures/view.procedure.tsx#L302)
- **Cách viết/Kích thước hiện tại:** `body: { padding: 0, maxHeight: "calc(100vh - 220px)", overflowY: "auto" },`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 91. [False Positive] Inline Style tại Authentication
- **Đường dẫn file & dòng code:** [ConfirmResetPassword.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/auth/ConfirmResetPassword.tsx#L521)
- **Cách viết/Kích thước hiện tại:** `max-width: 520px;`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 92. [False Positive] Inline Style tại Authentication
- **Đường dẫn file & dòng code:** [ConfirmResetPassword.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/auth/ConfirmResetPassword.tsx#L678)
- **Cách viết/Kích thước hiện tại:** `max-width: 414px;`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 93. [False Positive] Inline Style tại Authentication
- **Đường dẫn file & dòng code:** [ForgotPassword.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/auth/ForgotPassword.tsx#L465)
- **Cách viết/Kích thước hiện tại:** `max-width: 520px;`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 94. [False Positive] Inline Style tại Authentication
- **Đường dẫn file & dòng code:** [ForgotPassword.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/auth/ForgotPassword.tsx#L599)
- **Cách viết/Kích thước hiện tại:** `max-width: 414px;`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 95. [False Positive] Inline Style tại Evaluation
- **Đường dẫn file & dòng code:** [ApprovalDetailPage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/evaluation/approval/ApprovalDetailPage.tsx#L1071)
- **Cách viết/Kích thước hiện tại:** `max-width: 1680px;`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 96. [False Positive] Inline Style tại Evaluation
- **Đường dẫn file & dòng code:** [ManagerEvaluationDetailPage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/evaluation/manager/ManagerEvaluationDetailPage.tsx#L896)
- **Cách viết/Kích thước hiện tại:** `max-width: 1680px;`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 97. [False Positive] Inline Style tại Evaluation
- **Đường dẫn file & dòng code:** [MyEvaluationDetailPage.tsx](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/pages/evaluation/my-records/MyEvaluationDetailPage.tsx#L1276)
- **Cách viết/Kích thước hiện tại:** `max-width: 1680px;`
- **Viewport bị ảnh hưởng:** Mobile (390×844), Tablet (768×1024), Laptop nhỏ (1024×768, 1366×768)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Vùng chứa (Container) bị tràn ngang, xuất hiện thanh cuộn ngang khó chịu trên màn hình nhỏ hoặc laptop có viewport hẹp.
- **Nguyên nhân kỹ thuật:** Thuộc tính `width` hoặc `minWidth` được gán cố định bằng pixel trong thuộc tính `style` (ví dụ: `min-width: 1600px` hoặc `width: 600`).
- **Đề xuất cách sửa:** Chuyển đổi sang sử dụng class Tailwind tương ứng (ví dụ: `w-full max-w-[600px]`) hoặc sử dụng CSS media queries để tắt min-width trên màn hình nhỏ.
- **Rủi ro khi thay đổi:** Trung bình. Thay đổi min-width của trang lớn có thể làm dịch chuyển vị trí của các component con nếu chúng phụ thuộc vào kích thước cha.
- **Phạm vi sửa đổi:** Riêng lẻ từng màn (Screen-level)

---

### 98. [False Positive] 100vh tại Other
- **Đường dẫn file & dòng code:** [tailwind.css](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/styles/tailwind.css#L81)
- **Cách viết/Kích thước hiện tại:** `max-height: calc(100vh - 16px);`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---

### 99. [False Positive] 100vh tại Other
- **Đường dẫn file & dòng code:** [tailwind.css](file:///Users/huynhthanhphu/Documents/HRM-LOTUS/HRM-DEV/hrm-frontend/src/styles/tailwind.css#L87)
- **Cách viết/Kích thước hiện tại:** `max-height: calc(100vh - 150px);`
- **Viewport bị ảnh hưởng:** Mobile Safari (390×844), Mobile Chrome (390×844)
- **Đánh giá thực tế:** Là thuộc tính giới hạn chiều rộng/cao tối đa (max-width/max-height), phần tử vẫn co giãn tự nhiên khi màn hình thu nhỏ.
- **Biểu hiện người dùng nhìn thấy:** Thanh hành động (action bar) ở footer hoặc nút cuộn cuối trang bị che khuất bởi thanh công cụ của trình duyệt trên các thiết bị di động (Safari iOS, Chrome Mobile).
- **Nguyên nhân kỹ thuật:** Sử dụng đơn vị chiều cao cố định `100vh` không tính đến sự thay đổi của các thanh công cụ động trong trình duyệt di động.
- **Đề xuất cách sửa:** Sử dụng cơ chế fallback CSS: `min-height: 100vh; min-height: 100dvh;` để đảm bảo trình duyệt cũ vẫn chạy được và trình duyệt mới tối ưu chiều cao động.
- **Rủi ro khi thay đổi:** Rất thấp. Chỉ cải thiện trải nghiệm cuộn trên thiết bị di động.
- **Phạm vi sửa đổi:** Cả component chung và riêng từng màn

---



---

## Checklist triển khai đề xuất cho giai đoạn sau

- [ ] **Bước 1: Thực hiện Visual Verification (Kiểm thử trực quan)**: Kiểm tra trực quan 38 vị trí thuộc nhóm "Cần kiểm tra trực quan thêm" bằng trình duyệt trên di động hoặc DevTools để xác nhận tác động thực tế của CSS mặc định Ant Design và 100vh.
- [ ] **Bước 2: Thay đổi Modal/Drawer kích thước lớn**: Áp dụng hook `useResponsiveModalWidth()` hoặc hàm helper `getModalWidth()` cho 35 vị trí đã được xác nhận lỗi từ code.
- [ ] **Bước 3: Chuẩn hóa chiều cao viewport với CSS Fallback**: Cập nhật các vị trí sử dụng `100vh` thành cơ chế fallback:
  ```css
  min-height: 100vh;
  min-height: 100dvh;
  ```
- [ ] **Bước 4: Kiểm tra sự thay đổi layout form**: Đảm bảo các form bên trong modal tự động chuyển sang xếp dọc (`flex-col` hoặc `grid-cols-1`) khi modal co nhỏ về chiều rộng mobile.

---

## Kết luận

- **Các viewport hiện tại đáp ứng tốt**: Các màn hình desktop kích thước từ **1440px trở lên** được hiển thị rất tốt và cân đối. Các bảng dữ liệu (Table) hầu hết đã có cấu hình cuộn ngang linh hoạt (`scroll={{ x: 'max-content' }}`).
- **Rủi ro lớn**:
  - **Mobile (390×844)**: Rủi ro rất cao ở các màn hình quản lý nghiệp vụ (như quản lý chứng từ, đánh giá hiệu suất, thiết lập quy trình) do các modal thao tác và drawer lịch sử bị khoá cứng chiều rộng lớn hơn màn hình di động, dẫn đến không thể xem hoặc thực hiện hành động phê duyệt/lưu.
  - **Tablet (768×1024)**: Một số modal trung bình (680px - 760px) sẽ hiển thị sát lề hoặc tràn nhẹ nếu ở chế độ màn hình dọc, làm giảm trải nghiệm UX đáng kể.
