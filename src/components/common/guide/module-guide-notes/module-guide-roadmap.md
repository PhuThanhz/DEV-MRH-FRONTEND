# Lotus Guide Module Roadmap

File nay dung de quan ly cac huong dan tuong tac cho Lotus-chan. Guide content hien dang hard-code trong `src/components/common/guide/guideRegistry.tsx`.

## Quy Uoc Quan Ly

- Moi tac vu nen la mot guide rieng, ngan gon 2-5 buoc.
- Moi guide phai co `routePrefix` de tu dieu huong den dung trang truoc khi chay.
- Moi element can chi dan phai co `data-guide-id` on dinh.
- Khong bam theo class CSS, text button, hoac thu tu cot bang vi UI se doi.
- Khi update UI, uu tien giu nguyen `data-guide-id`; neu doi thi cap nhat guide cung luc.
- Guide nao can mo modal/drawer thi tach buoc: mo modal truoc, sau do moi chi field trong modal.

## Trang Tong Quan

- [x] Xem dashboard tong quan
- [x] Doc cac chi so cong ty/phong ban/bo phan
- [x] Xem tinh trang ho so phong ban
- [x] Xu ly thong bao tu chuong notification

## Cong Ty

- [x] Xem danh sach cong ty
- [x] Tim kiem cong ty
- [x] Xem chi tiet cong ty
- [x] Tao cong ty moi
- [x] Cap nhat cong ty
- [x] Xem so do to chuc cong ty
- [x] Them phong ban/vi tri tren so do to chuc cong ty

Guide nen tach rieng:

- `company-list-view`: Xem danh sach cong ty
- `company-detail-view`: Xem chi tiet cong ty
- `company-org-chart-view`: Xem so do to chuc cong ty

## Phong Ban

- [x] Tao phong ban moi
- [x] Xem danh sach phong ban
- [ ] Tim kiem/loc phong ban
- [x] Xem chi tiet phong ban
- [ ] Cap nhat phong ban
- [ ] Gan chuc danh vao phong ban
- [ ] Xem so do to chuc phong ban
- [ ] Xem quy trinh phong ban
- [ ] Xem muc tieu - nhiem vu
- [ ] Xem lo trinh thang tien
- [ ] Xem khung luong phong ban

## Bo Phan

- [x] Xem danh sach bo phan
- [x] Tao bo phan moi
- [ ] Cap nhat bo phan
- [ ] Gan chuc danh vao bo phan

## Nhan Vien

- [x] Them nhan vien moi
- [x] Xem danh sach nhan vien
- [ ] Tim kiem/loc nhan vien
- [x] Xem chi tiet nhan vien
- [ ] Cap nhat nhan vien
- [ ] Gan tai khoan/vi tri cho nhan vien
- [ ] Xem lo trinh nghe nghiep cua nhan vien

## Nguoi Dung Va Phan Quyen

- [ ] Xem danh sach nguoi dung
- [ ] Tao nguoi dung moi
- [ ] Cap nhat nguoi dung
- [ ] Gan vai tro/quyen cho nguoi dung
- [ ] Tao vai tro moi
- [ ] Cap nhat vai tro
- [ ] Xem ma tran phan quyen

## Van Ban Va Tai Lieu

- [x] Them van ban
- [x] Xem danh sach van ban
- [ ] Tim kiem/loc van ban
- [x] Xem chi tiet van ban
- [ ] Tai xuong van ban
- [ ] Chia se cong khai van ban
- [ ] Them van ban vao kho ca nhan
- [ ] Tao danh muc van ban
- [ ] Quan ly kho luu tru ca nhan

## Quy Trinh

- [x] Xem danh sach quy trinh
- [x] Tao quy trinh moi
- [ ] Cap nhat quy trinh
- [x] Xem chi tiet quy trinh
- [ ] Tai file quy trinh
- [ ] Chia se quy trinh bang link/QR
- [ ] Quet quy trinh bang QR
- [ ] Xem lich su phien ban quy trinh

## Mo Ta Cong Viec / JD

- [x] Xem danh sach JD
- [x] Tao JD moi
- [ ] Cap nhat JD
- [ ] Gui JD duyet
- [ ] Duyet JD trong inbox
- [ ] Xem chi tiet JD
- [ ] Gan JD vao chuc danh/phong ban

## Chuc Danh Va Danh Muc

- [x] Xem danh sach chuc danh
- [x] Tao chuc danh moi
- [ ] Cap nhat chuc danh
- [ ] Tao bac chuc danh
- [ ] Quan ly noi dung nang luc/KPI theo chuc danh
- [ ] Quan ly danh muc he thong

## Nghiep Vu Danh Gia

- [ ] Xem quy trinh danh gia
- [ ] Tao mau danh gia
- [ ] Cap nhat mau danh gia
- [ ] Tao ky danh gia
- [ ] Gan nguoi danh gia
- [ ] Nhan vien tu danh gia
- [ ] Quan ly duyet danh gia
- [ ] Xem tong hop ket qua danh gia

## Ke Toan Va Tai Chinh

- [x] Xem danh sach chung tu ke toan
- [x] Tao chung tu ke toan
- [ ] Cap nhat chung tu ke toan
- [x] Tao bo chung tu ke toan
- [ ] Gan tai lieu vao bo chung tu
- [ ] Tra cuu cong khai chung tu
- [ ] Quan ly loai chung tu

## Cong Cu

- [ ] Bat/tat nut quet quy trinh
- [ ] Quet QR quy trinh
- [x] Mo command palette bang Cmd/Ctrl + K
- [x] Ghim nhanh va xem gan day
- [ ] Mo trung tam huong dan tu Lotus-chan
- [ ] Gui gop y qua Lotus-chan

## Uu Tien Lam Truoc

1. Cong ty: xem danh sach, xem chi tiet, xem so do to chuc.
2. Phong ban: xem danh sach, tao phong ban, xem chi tiet.
3. Nhan vien: xem danh sach, them nhan vien, xem chi tiet.
4. Van ban: xem danh sach, them van ban, xem chi tiet/tai xuong.
5. Quy trinh: xem danh sach, tao quy trinh, quet QR.

## Mau Dat Ten `data-guide-id`

- `company-search-input`
- `company-detail-button`
- `company-org-chart-button`
- `company-add-button`
- `department-search-input`
- `department-add-button`
- `employee-search-input`
- `employee-add-button`
- `document-search-input`
- `document-add-button`
- `procedure-search-input`
- `procedure-add-button`
- `notification-bell`
- `lotus-assistant-entry`
