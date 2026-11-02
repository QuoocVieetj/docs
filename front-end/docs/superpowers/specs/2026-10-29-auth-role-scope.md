# Phạm vi FE: khung giao diện, điều hướng và đăng nhập theo role

## Yêu cầu gốc

**Mô tả:** Dựng khung giao diện, điều hướng và đăng nhập theo role. Làm trên mock
API trước, khi BE xong thì đổi sang API thật. Phụ thuộc: OpenAPI auth của BE.

**Tiêu chí hoàn thành:** Đăng nhập mock thành công, menu đúng theo role. Vào trang
không đủ quyền bị chặn. Token hết hạn tự refresh và không lặp vô hạn. Qua lint,
chạy được bằng một lệnh.

**Checklist:**
- Khởi tạo project FE, cấu hình router, lint, format.
- Tạo layout chung: header, sidebar, vùng nội dung.
- Menu sidebar thay đổi theo role Admin, Manager, Employee.
- Màn hình đăng nhập, quên mật khẩu, đổi mật khẩu.
- Thống nhất với BE nơi lưu token (khuyến nghị refresh token ở httpOnly cookie).
- Route guard: chưa đăng nhập về trang login, sai role vào trang 403.
- HTTP interceptor: gặp 401 tự refresh một lần rồi gọi lại request, refresh lỗi thì đăng xuất.
- Dựng mock API theo OpenAPI của BE.
- Trang 403 và 404.

## Hiện trạng xác nhận ngày 29/10/2026

Đã có React/JavaScript, Vite, Tailwind, Vitest, Testing Library; layout và popup
login/signup minh họa; hiệu ứng và hỗ trợ mobile. Chưa có router, lint/format,
phiên đăng nhập, phân quyền hoặc mock API. Chưa tìm thấy OpenAPI auth trong repo.
Repo hiện đã có Git. Không khởi tạo lại ứng dụng.

## Ranh giới

Giai đoạn này dựng nền tảng và các trang chứng minh quyền truy cập, chưa triển
khai CRUD hồ sơ/công văn. Signup hiện có không nằm trong checklist mới: giữ demo
hiện có ở trang public nếu còn cần, không tự tạo API đăng ký hay coi đó là đăng
nhập thành công.

## Điều chỉnh theo yêu cầu mới ngày 29/10/2026

Phần yêu cầu gốc bên trên được giữ làm lịch sử. Quyết định mới này thay thế các
điều kiện phụ thuộc BE của giai đoạn hiện tại:

- FE tự phân tích nghiệp vụ, soạn hợp đồng API đề xuất v0.1 và dùng làm nguồn chuẩn
  để xây mock. Không có bước bắt buộc chờ BE xác nhận, ký duyệt hoặc cung cấp OpenAPI.
- Thay tiêu chí "mock theo OpenAPI BE" bằng "mock khớp OpenAPI proposal do FE soạn".
- Thay việc phải thống nhất token với BE ngay bằng tài liệu quyết định token/cookie
  FE đề xuất, mô phỏng phiên và kiểm thử. Kiểm tra cookie/API BE thật thuộc giai đoạn sau.
- Được nghiệm thu toàn bộ FE foundation với mock độc lập khi checklist và test đạt.
- Phạm vi nghiệp vụ và ma trận role/menu theo
  `2026-10-29-document-records-business-analysis.md`; đây là giả định FE công khai,
  không phải yêu cầu BE đã xác nhận. Không tự mở rộng sang CRUD đầy đủ.
