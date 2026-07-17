# Kế hoạch đồng bộ nút hành động (ActionButton)

Mục tiêu: thay toàn bộ nút hành động trong bảng (icon xem/sửa/xóa/khóa...) bằng
component chung `ActionButton`, để cả project có cùng một kiểu nút đẹp như trang
Kỳ đánh giá (`PeriodPage`).

## Component chung

`src/components/common/ui/ActionButton.tsx`

Nút icon vuông 30px, bo góc 6px, màu theo ngữ nghĩa, hover/active mượt. CSS được
nhúng vào `<head>` một lần duy nhất (không lặp lại ở từng file).

### Variant có sẵn

| variant     | màu        | dùng cho          |
| ----------- | ---------- | ----------------- |
| `view`      | xanh dương | xem chi tiết      |
| `edit`      | vàng       | chỉnh sửa         |
| `settings`  | hồng       | quản trị/cấu hình |
| `progress`  | cyan       | xem tiến độ       |
| `success`   | xanh lá    | kích hoạt/khôi phục |
| `danger`    | đỏ         | xóa/đóng/khóa     |
| `default`   | xám        | thao tác khác (More…) |

### Cách dùng

```tsx
import ActionButton from "@/components/common/ui/ActionButton";

// Nút thường
<ActionButton
    variant="view"
    tooltip="Xem chi tiết"
    icon={<EyeOutlined />}
    onClick={handleView}
/>

// Nút trong Popconfirm — KHÔNG bọc thêm Tooltip lồng nhau,
// truyền tooltip qua prop luôn
<Popconfirm title="Xoá?" onConfirm={handleDelete}>
    <ActionButton variant="danger" tooltip="Xoá" icon={<DeleteOutlined />} />
</Popconfirm>

// Nút disabled
<ActionButton tooltip="Không khả dụng" icon={<StopOutlined />} disabled />
```

## Quy tắc refactor (áp cho mỗi file)

1. Thêm import: `import ActionButton from "@/components/common/ui/ActionButton";`
2. Thay mỗi `<Button type="text" size="small" icon={...} />` trong cột hành động
   bằng `<ActionButton variant="..." tooltip="..." icon={...} onClick={...} />`.
3. Chọn `variant` theo ngữ nghĩa nút (bảng trên), không theo màu cũ.
4. Nếu nút đang bọc trong `<Tooltip><Button/></Tooltip>` → bỏ `Tooltip`, chuyển
   nội dung vào prop `tooltip` của `ActionButton`.
5. Nếu nút nằm trong `Popconfirm` → giữ `Popconfirm`, chỉ thay `Button` bên trong.
6. Gỡ CSS local trùng lặp (khối `<style>`, hằng `*_ACTION_BUTTON_STYLES`, class
   `.xxx-action-button`) nếu có.
7. Gỡ import thừa (`Tooltip`, `Button`) nếu sau khi sửa không còn dùng — nhớ
   kiểm tra cả file vì `Button` thường vẫn dùng ở nút "Thêm"/"Lọc".
8. Giữ nguyên nút có CHỮ (vd "Bậc lương", "Tiêu chí", "Thêm mới") — `ActionButton`
   chỉ dành cho nút icon trong cột hành động.
9. Chạy `npx tsc --noEmit` sau mỗi cụm để xác nhận không lỗi.

## Đã hoàn thành (làm mẫu)

- [x] `src/components/common/ui/ActionButton.tsx` (tạo mới)
- [x] `src/pages/admin/evaluation/periods/PeriodPage.tsx` (bản gốc mẫu, đã gỡ CSS local)
- [x] `src/pages/admin/department/tab.department-job-title.tsx`
- [x] `src/pages/admin/company/company-job-title/company-job-title.tab.tsx`
- [x] `src/pages/admin/section/tab.section-job-title.tsx`

## Danh sách file còn lại (~32)

### Cụm 1 — Quản trị nhân sự / tổ chức (ưu tiên cao)
- [ ] `src/pages/admin/user/user.tsx`
- [ ] `src/pages/admin/employees/employee.tsx`
- [ ] `src/pages/admin/company/company.tsx`
- [ ] `src/pages/admin/department/department.tsx`
- [ ] `src/pages/admin/section/section.tsx`
- [ ] `src/pages/admin/role/role.tsx`
- [ ] `src/pages/admin/permission/permission.tsx`
- [ ] `src/pages/admin/permission-category/index.tsx`
- [ ] `src/pages/admin/permission-category/content/drawer.permission-content.tsx`

### Cụm 2 — Chức danh / cấp bậc / lộ trình
- [ ] `src/pages/admin/job-title/job-title.page.tsx`
- [ ] `src/pages/admin/position-levels/position-levels.tsx`
- [ ] `src/pages/admin/department/career-path/EmployeeCareerPathTab.tsx`
- [ ] `src/pages/admin/department/career-path/ModalCareerPath.tsx`
- [ ] `src/pages/admin/company/org-chart/OrgNodeCard.tsx`
- [ ] `src/pages/admin/job-description/components/JobDescriptionTable.tsx`

### Cụm 3 — Đánh giá (evaluation)
- [ ] `src/pages/admin/evaluation/periods/PeriodDetailDrawer.tsx`
- [ ] `src/pages/admin/evaluation/templates/TemplatePage.tsx`
- [ ] `src/pages/admin/evaluation-criteria/page.evaluation-criteria.tsx`
- [ ] `src/pages/evaluation/manager/PendingManagerEvaluationPage.tsx`
- [ ] `src/pages/evaluation/summary/CompletedEvaluationsPage.tsx`
- [ ] `src/pages/evaluation/my-records/MyEvaluationPage.tsx`
- [ ] `src/pages/evaluation/process/PendingEvaluationPage.tsx`
- [ ] `src/pages/evaluation/approval/PendingApprovalPage.tsx`

### Cụm 4 — Tài liệu / kế toán / quy trình
- [ ] `src/pages/admin/document/index.tsx`
- [ ] `src/pages/admin/document-category/index.tsx`
- [ ] `src/pages/admin/personal-drive/index.tsx`
- [ ] `src/pages/admin/accounting/index.tsx`
- [ ] `src/pages/admin/accounting-document-category/index.tsx`
- [ ] `src/pages/admin/accounting-workflows/index.tsx`
- [ ] `src/pages/admin/accounting-delegations/index.tsx`
- [ ] `src/pages/admin/process-action/index.tsx`
- [ ] `src/pages/admin/procedures/components/table/procedureColumns.tsx`
- [ ] `src/pages/admin/procedures/components/table/ShareLogTable.tsx`
- [ ] `src/pages/admin/department/mission-console/index.tsx`
- [ ] `src/pages/admin/dashboard/department-profile.tsx`

## Lưu ý

- Danh sách trên lấy từ grep các file có cột "Hành động"/nút icon. Khi mở từng
  file cần kiểm tra thực tế: có file chỉ có 1 nút, có file 3-4 nút.
- Một số file dùng `Dropdown` menu cho nút "More" — nút trigger của Dropdown
  dùng `<ActionButton variant="default" icon={<MoreOutlined />} />` (xem mẫu ở
  `PeriodPage.tsx`).
- Sau khi refactor hết, có thể tìm lại `type="text"` + `icon=` trong cột hành
  động để chắc không sót.
