# Quy chuẩn thông báo Lotus HRM

Thông báo phải giúp người dùng hiểu ngay: việc gì vừa xảy ra, dữ liệu có được lưu hay không và họ cần làm gì tiếp theo.

## Cấu trúc

- **Tiêu đề:** kết quả cụ thể của hành động, tối đa khoảng 72 ký tự.
- **Nội dung:** nguyên nhân, ảnh hưởng hoặc bước tiếp theo. Không lặp lại tiêu đề.
- Dùng câu ngắn, tiếng Việt phổ thông và thuật ngữ nghiệp vụ của màn hình.
- Không dùng dấu chấm than, “Có lỗi xảy ra”, “Thành công”, “Oops” hoặc thông báo kỹ thuật chung chung.

## Bốn trạng thái

| Trạng thái | Cách viết tiêu đề | Nội dung | Thời gian mặc định |
|---|---|---|---:|
| Thành công | “Đã tạo nhân viên”, “Đã cập nhật kỳ đánh giá” | Xác nhận dữ liệu đã được lưu hoặc trạng thái đã được áp dụng | 2,6 giây |
| Lỗi | “Không thể cập nhật nhân viên” | Nêu nguyên nhân; nếu chưa rõ, hướng dẫn thử lại hoặc liên hệ quản trị viên | 5 giây |
| Cảnh báo | “Cần bổ sung thông tin”, “Tệp chưa hợp lệ” | Nói rõ dữ liệu hoặc thao tác cần sửa | 4 giây |
| Thông tin | “Thông tin cập nhật” hoặc trạng thái cụ thể | Nêu thay đổi không yêu cầu xử lý ngay | 3,2 giây |

Xoá dữ liệu thành công vẫn là trạng thái **thành công**, không dùng biểu tượng lỗi màu đỏ.

## Ví dụ chuẩn

| Tình huống | Tiêu đề | Nội dung |
|---|---|---|
| Sai tài khoản hoặc mật khẩu | Đăng nhập không thành công | Email hoặc mật khẩu không đúng. Vui lòng kiểm tra và thử lại. |
| Đăng nhập thành công | Đăng nhập thành công | Bạn đang được chuyển đến trang làm việc. |
| Thiếu email | Thông tin đăng nhập chưa đầy đủ | Vui lòng nhập email. |
| Tạo nhân viên | Đã tạo nhân viên | Thông tin mới đã được lưu trên hệ thống. |
| Cập nhật dữ liệu | Đã cập nhật nhân viên | Các thay đổi đã được lưu. |
| Xoá dữ liệu | Đã xoá nhân viên | Thay đổi đã được cập nhật trên hệ thống. |
| Mất kết nối | Không thể kết nối hệ thống | Vui lòng kiểm tra kết nối mạng và thử lại. |
| Không đủ quyền | Bạn không có quyền thực hiện | Liên hệ quản trị viên nếu bạn cần quyền cho thao tác này. |

## Cách gọi trong code

```tsx
notify.success("Tạo nhân viên thành công");
notify.error(apiMessage || "Không thể cập nhật nhân viên. Vui lòng thử lại.");
notify.warning("Vui lòng chọn phòng ban trước khi tiếp tục.");
```

Component trung tâm tự chuẩn hoá tiêu đề, dấu câu, màu sắc và thời gian hiển thị. Chỉ truyền `title` khi ngữ cảnh cần tiêu đề riêng, chẳng hạn đăng nhập hoặc hết hạn phiên.

## Từ vựng thống nhất

| Không dùng | Dùng |
|---|---|
| file | tệp |
| link | liên kết |
| upload | tải tệp lên |
| template | mẫu |
| role | vai trò |
| node | vị trí trên sơ đồ |
| preview | xem trước |
| bulk create | tạo hàng loạt |
| Process Action | hành động quy trình |
| deadline | hạn chót |
| Job Description | mô tả công việc |

Các tên định dạng và tên sản phẩm như PDF, Word, Excel được giữ nguyên.

Chạy `npm run lint:notifications` trước khi hoàn tất thay đổi giao diện. Lệnh này kiểm tra toàn bộ điểm gọi `notify`, chặn câu lỗi chung chung, dấu chấm than và thuật ngữ pha Anh–Việt trong nội dung tĩnh. Thông báo động từ API vẫn được chuẩn hoá tại component trung tâm trước khi hiển thị.
