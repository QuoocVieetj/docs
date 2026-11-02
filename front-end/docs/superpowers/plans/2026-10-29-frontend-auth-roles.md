# Frontend Auth & Role Navigation Implementation Plan

> **Trạng thái tài liệu:** Kế hoạch lịch sử lập ngày 29/10/2026. Phần FE foundation
> dùng mock đã được triển khai; các mục tích hợp BE thật thuộc giai đoạn sau. Một số
> đường dẫn và checkbox bên dưới phản ánh kế hoạch tại thời điểm lập, không phải
> cấu trúc source hiện tại. Xem README mục Source structure và docs/auth-acceptance.md.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thành FE foundation độc lập với mock: điều hướng, đăng nhập theo role, bảo vệ route và refresh có giới hạn, theo hợp đồng API đề xuất do FE tự soạn; không chờ BE xác nhận.

**Cập nhật ngày 29/10/2026:** Người dùng cho phép FE tự chốt proposal và hoàn
thành giai đoạn mock. Tích hợp BE thật là công việc tiếp theo, không phải điều
kiện nghiệm thu lần này. Chưa bắt đầu viết code ứng dụng trong bước sửa plan.

**Architecture:** Phát triển tiếp ứng dụng hiện tại. Dùng React Router cho route,
Context cho phiên đăng nhập, Axios cho HTTP/interceptor và MSW chặn request HTTP
khi chạy mock. UI gọi một lớp auth API dùng chung cho cả mock và BE thật.

**Tech Stack:** React + JavaScript + Vite + Tailwind hiện có; bổ sung React Router,
Axios, MSW, ESLint và Prettier. Giữ Vitest + Testing Library. Không thêm Redux,
TypeScript hoặc thư viện UI mới cho phạm vi này. Chốt phiên bản tương thích khi cài
và lưu package-lock.json.

**Spec:** `docs/superpowers/specs/2026-10-29-auth-role-scope.md`.
**Business analysis:** `docs/superpowers/specs/2026-10-29-document-records-business-analysis.md`.

## Global Constraints

- Role nghiệp vụ: Admin, Manager, Employee; mã nội bộ đề xuất: ADMIN, MANAGER, EMPLOYEE.
- Chưa đăng nhập về login; sai role về 403; URL không tồn tại về 404.
- Request được bảo vệ chỉ được gửi lại tối đa một lần sau 401.
- Refresh lỗi phải kết thúc phiên; refresh không được tự gọi lại chính nó.
- Mock phải theo OpenAPI proposal FE v0.1; không yêu cầu BE cung cấp hay xác nhận tài liệu.
- Không đưa mật khẩu/token thật vào log, URL, Git hoặc tài liệu demo.
- Access token giữ trong bộ nhớ; mô phỏng refresh session trong mock và ghi rõ
  HttpOnly cookie là thiết kế đề xuất cho BE tương lai, không phải tính năng MSW đã chứng minh.
- Giữ responsive, hiệu ứng hiện có và hỗ trợ reduced-motion/focus/bàn phím.
- Kế hoạch này chưa cho phép triển khai nghiệp vụ hồ sơ/công văn ngoài trang khung.

## Review Focus

1. Nhiều request 401 đồng thời: dùng chung một lần refresh, không tạo bão request (Task 3).
2. Logout trong lúc refresh đang chờ: kết quả cũ không được khôi phục phiên (Task 3, 4).
3. Mở trực tiếp URL hoặc reload: đợi khôi phục phiên rồi mới quyết định điều hướng (Task 4, 5).
4. Role lạ/null hoặc returnTo bên ngoài website: từ chối quyền, không chuyển hướng ra ngoài (Task 5).
5. Mock lệch proposal hoặc lẫn dữ liệu phòng ban: kiểm tra schema/status và phạm vi,
   không suy ra tích hợp BE thật đã đạt từ mock (Task 2, 5, 9).

## Quyết định nghiệp vụ và hợp đồng do FE chủ động soạn

### Hợp đồng FE v0.1 — không có bước chờ BE xác nhận

FE viết `docs/api/openapi-auth.proposal.yaml`, ghi version 0.1.0 và nguồn là FE;
`docs/api/auth-contract.md` giải thích quyết định, giả định và ví dụ. Task 2 tự
đặc tả đầy đủ các mục dưới rồi triển khai ngay:

- Endpoint, method, tên trường request/response của login, me, refresh, logout,
  forgot-password và change-password; mã lỗi và status 400/401/403/422/429/5xx.
- User có đúng một role trong mảng roles; mã ADMIN/MANAGER/EMPLOYEE đến từ login/me.
- TTL access/refresh, rotation/revocation, hết phiên và hành vi sau đổi mật khẩu.
- Cookie: tên, Path, Domain, Secure, HttpOnly, SameSite; cấu hình credentials/CORS
  theo origin FE thực tế; biện pháp CSRF cho request dùng cookie.
- Luồng quên mật khẩu, chính sách mật khẩu và schema lỗi validation.

TTL mock: access 5 phút, refresh session 8 giờ; đổi mật khẩu thành công thu hồi
phiên và yêu cầu login lại. Mật khẩu mới 8–128 ký tự và confirm khớp. FE không tự
đăng ký user nghiệp vụ. Đây là quy ước cho mock, không phải chính sách BE đã chốt.

Không có bước gửi proposal để chờ duyệt. Khi thiếu chi tiết nhỏ, FE chọn mặc định
nhất quán, ghi vào contract và tiếp tục. Sau này BE có API khác thì cập nhật adapter.

### Route và quyền theo nghiệp vụ đề xuất

| Route | Mục đích | Admin | Manager | Employee |
|---|---|---|---|---|
| `/` | Khung public hiện có | Public | Public | Public |
| `/login` | Đăng nhập | Public | Public | Public |
| `/forgot-password` | Gửi yêu cầu khôi phục | Public | Public | Public |
| `/dashboard` | Trang tổng quan khung | Có | Có | Có |
| `/documents/incoming` | Công văn đến | Không | Phòng mình | Được giao/tự tạo |
| `/documents/outgoing` | Công văn đi | Không | Phòng mình | Được giao/tự tạo |
| `/records` | Hồ sơ | Không | Phòng mình | Được giao/cho phép |
| `/tasks` | Công việc của tôi | Không | Có | Có |
| `/approvals` | Chờ duyệt | Không | Có | Không |
| `/admin/users` | Trang khung khu vực quản trị | Có | Không | Không |
| `/admin/departments` | Phòng ban | Có | Không | Không |
| `/admin/categories` | Danh mục | Có | Không | Không |
| `/change-password` | Đổi mật khẩu | Có | Có | Có |
| `/403` | Không đủ quyền | Public | Public | Public |
| `*` | Không tìm thấy | Public | Public | Public |

Admin quản trị hệ thống, không tự kế thừa quyền duyệt hoặc quyền xem nội dung
công văn. Manager có phạm vi phòng ban; Employee theo dữ liệu tự tạo/được giao.
Các trang nghiệp vụ chỉ là khung, chưa triển khai CRUD. Tạo các fixture hai phòng
ban và ít nhất hai Employee để chứng minh cùng role không đồng nghĩa cùng dữ liệu.
Giữ một nguồn quyền cho menu/guard; mock kiểm tra phạm vi đối tượng riêng. Khi
BE thật được tích hợp, BE phải thực thi quyền độc lập với giao diện FE.

### API đề xuất, chưa phải contract BE

| Method/path dự kiến | Request | Kết quả FE cần |
|---|---|---|
| POST `/auth/login` | email, password | 200: accessToken, expiresIn, user |
| GET `/auth/me` | Bearer access token | 200: id, email, displayName, roles, departmentId |
| POST `/auth/refresh` | credentials cookie theo thiết kế đề xuất | 200: accessToken, expiresIn |
| POST `/auth/logout` | credentials cookie theo thiết kế đề xuất | 204, không có response body |
| POST `/auth/forgot-password` | email | 202: message trung tính |
| POST `/auth/change-password` | currentPassword, newPassword; Bearer | 204, thu hồi phiên mock |

Base URL `/api/v1`; bảng ghi path tương đối. JSON lỗi dùng
`{ code, message, fieldErrors? }`. 401 dành cho token/phiên/credentials login;
403 cho thiếu quyền; 422 cho validation và sai mật khẩu hiện tại khi đổi mật khẩu;
429 cho giới hạn thử; 5xx cho lỗi hệ thống. Task 2 ghi example cho mỗi trường hợp.
Thêm một endpoint fixture chỉ phục vụ mock/test ở `/demo/documents/:id` để chứng
minh chặn khác phòng/người nhận; không coi đó là API CRUD đã hoàn thành.

Lớp adapter chuẩn hóa response về model FE, để UI không phụ thuộc tên trường BE.
Không giả định response luôn là 200/JSON; phải hỗ trợ 204 nếu contract quy định.

## Bản đồ file

| File/nhóm | Trách nhiệm |
|---|---|
| `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `package.json` | lint, format và lệnh chạy/kiểm tra |
| `.env.example`, `src/config/env.js` | base URL và cờ mock; không chứa bí mật |
| `src/router/AppRouter.jsx`, `src/router/access.js`, `src/router/RequireAuth.jsx` | route, quyền dùng chung, guard |
| `src/api/http.js`, `src/api/session.js` | Axios client, refresh có giới hạn và bộ nhớ phiên |
| `src/features/auth/authApi.js`, `AuthProvider.jsx`, `useAuth.js` | adapter auth và state phiên |
| `src/features/auth/LoginPage.jsx`, `ForgotPasswordPage.jsx`, `ChangePasswordPage.jsx` | ba màn hình yêu cầu |
| `src/pages/DashboardPage.jsx`, `WorkspacePage.jsx`, `AdminUsersPage.jsx`, `ForbiddenPage.jsx`, `NotFoundPage.jsx` | trang khung/403/404; WorkspacePage nhận title/description để dùng cho route nghiệp vụ còn trống |
| `src/mocks/handlers.js`, `fixtures.js`, `session.js`, `browser.js`, `server.js` | mock HTTP và các tình huống kiểm tra |
| `public/mockServiceWorker.js` | worker được tạo bằng CLI của MSW |
| `src/components/AppLayout.jsx`, `Header.jsx`, `Sidebar.jsx`, `AuthForm.jsx` | tích hợp Outlet, thông tin user, menu và tái sử dụng giao diện |
| `src/main.jsx`, `src/App.jsx`, `src/test/setup.js`, `src/App.test.jsx` | bootstrap mock/provider/router và cập nhật test hiện có |
| `docs/api/auth-contract.md`, `docs/api/openapi-auth.proposal.yaml`, `docs/auth-acceptance.md`, `README.md` | hợp đồng FE, bằng chứng và hướng dẫn |

Đặt file test cạnh module tương ứng; chỉ tách thêm helper khi có nhiều nơi dùng.

## Task 1 — Nền tảng chạy và chất lượng code

**Files:** package.json/lock, eslint.config.js, .prettierrc.json, .prettierignore,
.env.example, src/config/env.js, README.md; test `src/config/env.test.js`.

**Interfaces:** `env = { apiBaseUrl: string, mockEnabled: boolean }`.
`npm run dev` chạy FE kèm mock mặc định ở development; production tắt mock.

- [ ] Xác nhận trạng thái Git, giữ mọi thay đổi người dùng; không khởi tạo lại project.
- [ ] Thêm ESLint cho JS/JSX, React Hooks và React Refresh; Prettier thống nhất định dạng.
  Bỏ qua dist/node_modules/output/worker sinh tự động; không tắt rule chỉ để qua lint.
- [ ] Thêm scripts: `lint` (không warning), `format`, `format:check`, `check`
  (`lint && format:check && test && build`), `start` (tương đương dev).
- [ ] Viết test env: development mặc định mock=true; production mock=false;
  cờ tắt mock được tôn trọng. Chạy test thấy thất bại trước khi viết env.js.
- [ ] Cấu hình env; script không được yêu cầu nhập lệnh chạy mock riêng.
- [ ] Kiểm tra `npm run lint`, `npm run format:check`, `npm test`, `npm run build`:
  exit 0. Chỉ format source cần thiết; ghi riêng các thay đổi định dạng nếu nhiều.
- [ ] Commit nền tảng khi các kiểm tra qua.

## Task 2 — FE tự soạn hợp đồng auth và dựng mock API

**Files:** docs/api/*; src/mocks/{handlers,fixtures,session,browser,server}.js;
src/main.jsx, src/test/setup.js; test `src/mocks/handlers.test.js`.

**Interfaces:** `handlers` dùng chung cho `setupWorker` và `setupServer`.
Model chuẩn FE: `User = { id, email, displayName, roles: string[], departmentId: string|null }`;
`AuthResult = { accessToken: string, expiresIn: number, user: User }`.

- [ ] FE viết OpenAPI proposal v0.1.0 và ví dụ theo các quyết định trên; kiểm tra
  cú pháp, schema bắt buộc, success/error và mapping role. Không chờ BE xác nhận.
- [ ] Thêm test đối chiếu request/response mock với schema proposal; kiểm tra cả
  field bắt buộc, 204 không body, status và error code; không chỉ test response 200.
- [ ] Tạo ba tài khoản demo Admin/Manager/Employee trong fixtures, dùng mật khẩu
  giả ghi trong README. Role đến từ response mock, không có dropdown tự cấp quyền.
- [ ] Viết test login đúng/sai; me thiếu token/expired trả 401; refresh hợp lệ,
  hết phiên; logout; forgot; đổi mật khẩu sai/đúng. Xác minh test đỏ rồi triển khai.
- [ ] Mock có kịch bản xác định: access expired, refresh expired, refresh 500,
  replay vẫn 401, API 403, delay/network error; không dựa vào chờ TTL thật.
- [ ] Dùng phiên giả trong module mock, không đưa refresh token vào localStorage.
  MSW chỉ mô phỏng phiên; không chứng minh thuộc tính HttpOnly/Secure của cookie thật.
- [ ] Phiên giả cần hỗ trợ reload theo tiêu chí bootstrap; được lưu metadata phiên
  tổng hợp trong storage riêng của mock để khôi phục state, không lưu credential/token
  thật trong app. Reset fixtures giữa test; namespace demo và ghi rõ giới hạn mô phỏng.
- [ ] Fixture riêng cho đúng phòng/khác phòng và Employee được giao/không được giao:
  truy cập đúng trả200, truy cập trực tiếp trái phạm vi trả403 dù biết id tài liệu.
- [ ] Chờ worker start xong mới render ứng dụng. Test dùng server.listen,
  resetHandlers/reset mock session sau mỗi test và server.close khi kết thúc.
- [ ] `npm test -- src/mocks/handlers.test.js`: toàn bộ pass; request auth chưa
  được khai báo phải làm test fail, tránh vô tình gọi BE thật.
- [ ] Commit mock và hợp đồng do FE sở hữu; không gắn nhãn OpenAPI chính thức của BE.

## Task 3 — HTTP client và refresh không lặp vô hạn

**Files:** src/api/{http,session}.js; test `src/api/http.test.js`.

**Interfaces:** `api` là Axios instance được bảo vệ; `authHttp` không có refresh
interceptor để gọi auth endpoints. `getAccessToken()`, `setAccessToken(token)`,
`clearSession()`, `subscribeSession(listener)`; listener nhận sự kiện hết phiên.

- [ ] Viết test theo bảng tình huống dưới; xác nhận thất bại trước triển khai.
- [ ] Gắn Bearer access token trong bộ nhớ. Auth cookie requests dùng credentials
  theo contract. Đặt timeout hữu hạn để pending refresh không treo toàn bộ app.
- [ ] Khi protected API trả 401: đánh dấu request đã thử lại trước khi await;
  dùng một refresh Promise chung; cập nhật token, ghi đè Authorization và replay.
- [ ] Request đã retry vẫn 401: xóa phiên và reject. Refresh fail: xóa phiên,
  reject tất cả request đang chờ, phát sự kiện hết phiên đúng một lần.
- [ ] Login/forgot/logout/refresh dùng authHttp không có refresh interceptor.
  Change-password dùng api được bảo vệ: token hết hạn được refresh một lần;
  sai mật khẩu hiện tại là422, không kích hoạt refresh. Bootstrap me có cờ bỏ
  auto-refresh vì vừa gọi refresh trước đó; không tạo vòng bootstrap.
- [ ] Refresh Promise luôn dọn trong finally; xét token đã được thay mới bởi
  request khác trước khi tạo refresh mới để xử lý cả 401 đến muộn.
- [ ] Tăng session generation khi logout/login mới; kết quả thuộc phiên cũ phải
  bị bỏ qua, kể cả refresh hoặc replay cũ trả về sau khi đã đăng xuất.
- [ ] `npm test -- src/api/http.test.js`: pass; không log token/request password.
- [ ] Commit HTTP client.

| Tình huống | Kết quả/counter phải đạt |
|---|---|
| API 200 | 1 API, 0 refresh |
| API 401 → refresh 200 → API 200 | 2 API, 1 refresh; token mới trên replay |
| Replay tiếp tục 401 | 2 API, 1 refresh; logout, không gọi lần 3 |
| Refresh 401/500/timeout | 1 API, 1 refresh; logout, không replay |
| 5 API cùng 401 | 1 refresh chung; mỗi API replay tối đa 1 lần |
| 401 cũ đến sau refresh vừa hoàn tất | dùng token mới, không refresh thừa |
| Login sai mật khẩu hoặc API 403 | 0 refresh; trả lỗi đúng ngữ cảnh |
| Logout khi refresh đang chờ | phiên vẫn rỗng khi response cũ về |

## Task 4 — Auth API và vòng đời phiên

**Files:** src/features/auth/authApi.js, src/features/auth/AuthProvider.jsx,
src/features/auth/useAuth.js;
src/main.jsx; test `src/features/auth/AuthProvider.test.jsx`.

**Interfaces:** authApi.js xuất `login({email,password})`, `getMe()`,
`refreshSession()`, `logout()`, `forgotPassword({email})`,
`changePassword({currentPassword,newPassword})`.
`useAuth()` trả `{ status, user, login, logout, retryBootstrap }`;
status là loading/authenticated/unauthenticated/error.

- [ ] Viết test bootstrap loading, refresh/me thành công, không có phiên,
  lỗi mạng bootstrap, logout offline và response cũ; xác nhận đỏ trước triển khai.
- [ ] Khởi động: chưa có access token thì gọi refresh, sau đó me để có user/role;
  me 401 sau bước này kết thúc phiên, không tự tạo chu kỳ bootstrap mới.
- [ ] Refresh 401 lúc bootstrap là khách chưa đăng nhập; lỗi mạng có trạng thái
  lỗi/retry rõ ràng. Chỉ retry theo thao tác người dùng, không tự lặp.
- [ ] Login thành công mới cập nhật user/token; chuẩn hóa roles từ schema proposal FE.
  Logout xóa local state ngay cả khi request logout thất bại.
- [ ] Đảm bảo StrictMode không nhân đôi bootstrap/refresh hoặc gắn interceptor
  nhiều lần; đăng ký listener phải có cleanup.
- [ ] `npm test -- src/features/auth/AuthProvider.test.jsx`: pass.
- [ ] Commit auth provider.

## Task 5 — Router, guard, 403 và 404

**Files:** src/router/*, src/pages/*, src/App.jsx, src/components/AppLayout.jsx;
test `src/router/access.test.js`, `src/router/AppRouter.test.jsx`.

**Interfaces:** `accessRules` là nguồn role/route/menu chung;
`canAccess(user, allowedRoles): boolean`; `RequireAuth({allowedRoles})`
render Outlet sau khi bootstrap hoàn tất. AppLayout có Outlet cho nội dung con.

- [ ] Viết test guest→login, Employee→admin URL bị403, Manager→approvals được,
  role null/lạ bị403, URL lạ→404, reload/loading không chớp nội dung bị cấm.
- [ ] Dùng ma trận ở trên cho cấu hình route; không dựa vào ẩn menu để bảo vệ URL.
- [ ] Lưu đường dẫn nội bộ người dùng định đến (path+search+hash); login xong
  trả lại nếu có quyền. Loại bỏ returnTo là URL ngoài hoặc `//host`; tránh vòng
  lặp về login/forgot/403. Không có đích phù hợp thì về dashboard.
- [ ] Đã đăng nhập vào login thì về đích hợp lệ; 403 và 404 có nút về trang phù hợp.
- [ ] Test mọi cặp 3 roles × mọi route được bảo vệ từ ma trận; thêm Admin→approvals
  bị403 và mock object-scope tests; dùng MemoryRouter trong test,
  không kiểm tra riêng constant thay cho hành vi điều hướng.
- [ ] `npm test -- src/router`: pass. Mở trực tiếp URL hoạt động qua Vite.
- [ ] Commit router và guard.

## Task 6 — Header và menu theo role

**Files:** src/components/{Header,Sidebar,AppLayout}.jsx, src/styles.css;
test `src/components/Sidebar.test.jsx`, cập nhật src/App.test.jsx.

**Interfaces:** Header nhận user/onLogout; Sidebar dùng accessRules và user từ
auth context, NavLink thể hiện route active; cả sidebar desktop/mobile cùng dữ liệu.

- [ ] Viết test từng role nhìn đúng menu; bấm menu đến đúng trang; logout xóa
  menu riêng; đóng/mở sidebar và focus vẫn hoạt động.
- [ ] Header sau login hiển thị tên/role và logout; menu thêm đổi mật khẩu.
  Không đặt login/signup vào sidebar đã đăng nhập.
- [ ] Giữ shell public hiện có tại `/`; nút Log in điều hướng `/login`.
  Popup signup demo cũ không cấp token hay quyền; không đưa vào phạm vi API mới.
- [ ] Bấm menu mobile đóng drawer; giữ nút đóng và focus restoration hợp lý,
  không trả focus vào phần tử đã unmount khi chuyển route.
- [ ] Kiểm tra 320/375/768/1440px, reduced-motion, keyboard; không tràn ngang.
- [ ] `npm test`: pass, gồm các regression test hiện có đã cập nhật theo router.
- [ ] Commit layout/menu.

## Task 7 — Ba màn hình tài khoản

**Files:** src/features/auth/{LoginPage,ForgotPasswordPage,ChangePasswordPage}.jsx;
src/components/AuthForm.jsx nếu tái sử dụng được; test mỗi page cạnh source.

**Interfaces:** Các page dùng authApi/useAuth ở Task 4; component field chỉ tách
  khi cần tái sử dụng thực sự. Policy mật khẩu theo proposal FE v0.1: 8–128 ký tự.

- [ ] Login: label email/password, quên mật khẩu, loading chống submit trùng,
  lỗi inline; thành công có phiên thật trong mock và điều hướng qua guard.
- [ ] Forgot password: email, validation, loading, thông báo trung tính cả email
  tồn tại/không tồn tại; không giả vờ đã gửi email thật trong chế độ mock.
- [ ] Change password: mật khẩu hiện tại, mật khẩu mới, xác nhận; kiểm tra khớp,
  policy FE, lỗi mật khẩu hiện tại và phản hồi thành công. Sau đổi thành công
  logout/relogin theo proposal FE v0.1, không chờ BE quyết định.
- [ ] Test trước code: login sai→sửa→đúng; forgot invalid/network/neutral success;
  change mismatch/sai mật khẩu/đúng; gửi nhanh hai lần chỉ có 1 request pending.
- [ ] Khi rời trang/đổi tài khoản, bỏ phản hồi lỗi/thành công cũ; xóa password;
  không chặn paste/password manager; focus lỗi đầu tiên và thông báo truy cập được.
- [ ] Chạy các test page và toàn suite: pass. Kiểm tra Tab, Enter, zoom/màn hình nhỏ.
- [ ] Commit các màn hình.

Forgot-password ở đây là gửi yêu cầu khôi phục; màn hình đặt lại mật khẩu từ link
email không thuộc checklist hiện tại. Không cần BE xác nhận để hoàn thành luồng mock này.

## Task 8 — Chuẩn bị chuyển API thật; tích hợp thật để giai đoạn sau

**Files:** src/config/env.js, src/features/auth/authApi.js, docs/api/auth-contract.md,
.env.example, README.md; mở rộng test adapter khi schema BE khác proposal.

- [ ] Hoàn tất ngay: cờ `VITE_ENABLE_MOCKS=false`, cấu hình `VITE_API_BASE_URL`,
  auth adapter và hướng dẫn chuyển đổi; dùng test kiểm tra cờ tắt mock không khởi
  động worker, cùng UI/provider/guard gọi HTTP client chung.
- [ ] Hoàn tất ngay: tài liệu khoảng khác biệt có thể gặp về endpoint, schema,
  role, cookie và lỗi; production tắt MSW; hướng dẫn SPA fallback.
- [ ] Commit phần chuẩn bị trong lần này; ghi kết quả tích hợp thật riêng khi thực hiện sau.

**Các bước sau không nằm trong điều kiện hoàn thành FE mock:**

- [ ] Sau này có BE: đối chiếu payload/status/error/roles với OpenAPI, cập nhật mock và test adapter
  cùng lúc. Không đổi route quyền dựa trên suy đoán tên role.
- [ ] Browser DevTools xác nhận cookie refresh thật do BE đặt HttpOnly, có Secure/
  SameSite/Path đúng môi trường; credentials/CORS/CSRF hoạt động như hợp đồng.
- [ ] Thử login, reload, refresh access expired, refresh expired và logout với BE.
  Nếu BE chưa chạy thì ghi "Chưa thực hiện — giai đoạn tích hợp sau"; không chặn
  đóng ticket FE mock và không dùng kết quả mock thay bằng bằng chứng BE.
- [ ] README ghi cách bật/tắt mock; bản production không khởi động MSW và không
  gửi cookie/token đến origin khác do cấu hình sai.
- [ ] Khi deploy SPA, cấu hình fallback về index.html cho route FE, không rewrite
  API hoặc asset; kiểm tra URL trực tiếp/refresh thay vì chỉ điều hướng từ trang chủ.
- [ ] Chỉ đánh dấu các mục tích hợp thật hoàn thành khi đã kiểm tra trên BE thật.

## Task 9 — Nghiệm thu và bàn giao

**Files:** docs/auth-acceptance.md, README.md; bổ sung regression test vào module
chủ sở hữu nếu gặp lỗi. Không tạo test chỉ kiểm tra source có một chuỗi ký tự.

- [ ] Chạy `npm run check`: lint 0 warning/error, format đúng, test pass, build exit 0.
- [ ] Máy vừa clone: `npm ci` một lần; sau đó chỉ `npm run dev` để chạy app/mock.
  Không cần BE hay terminal thứ hai trong chế độ mock.
- [ ] Ghi tài khoản demo và các cách kích hoạt access/refresh expired; dùng kịch bản
  mock xác định, không yêu cầu đợi vài phút hay sửa code thủ công mỗi lần demo.
- [ ] Ghi counter request/refresh từ test cho các tình huống Task 3.
- [ ] Kiểm tra trình duyệt: login 3 roles; menu; nhập URL bị cấm; reload protected
  route; 403/404; forgot/change-password; logout; responsive/focus/hiệu ứng.
- [ ] Ghi rõ mock đạt proposal FE v0.1.0, kết quả schema/role/refresh và các giả định.
  Được đánh dấu FE foundation hoàn thành khi test/checklist đạt; mục BE thật ghi
  giai đoạn sau, không yêu cầu xác nhận BE để nghiệm thu.
- [ ] Commit kết quả kiểm tra và hướng dẫn; không push/merge tự động trong bước lập plan.

## Ma trận truy vết tiêu chí hoàn thành

| Tiêu chí/checklist | Task | Bằng chứng nghiệm thu |
|---|---|---|
| Khởi tạo, router, lint, format | 1, 5 | không khởi tạo lại; lint/format/build qua; điều hướng được |
| Header/sidebar/nội dung chung | 6 | ảnh desktop/mobile, regression layout |
| Login mock thành công | 2, 4, 7 | 3 tài khoản vào đúng phiên/role; không chỉ thông báo demo |
| Menu theo Admin/Manager/Employee | 5, 6 | kiểm tra menu cả desktop/mobile theo ma trận FE nghiệp vụ |
| Login/forgot/change password | 7 | test validation, pending, success và error |
| Quyết định lưu token FE đề xuất (thay bước chờ BE) | 2, 8 | contract FE có chiến lược token/cookie, mock và test; cookie thật thuộc giai đoạn sau |
| Guest về login, sai role403 | 5 | mở URL trực tiếp, test ma trận quyền và đích trở lại |
| Hết hạn refresh; không lặp | 3, 4 | các counter request/refresh; kiểm tra logout khi refresh lỗi |
| Mock theo OpenAPI proposal FE (thay OpenAPI BE) | 2 | proposal v0.1.0 có schema test, handler/payload đối chiếu |
| Trang403/404 | 5 | URL bị cấm và không tồn tại ra đúng trang |
| Qua lint, chạy một lệnh | 1, 9 | npm run check; npm run dev chạy độc lập ở mock mode |

## Thứ tự và trạng thái bàn giao

1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 (phần chuẩn bị) → 9: hoàn thành FE foundation/mock.
Không có điểm dừng bắt buộc chờ tài liệu hoặc xác nhận BE. Giai đoạn tích hợp thật
thực hiện phần còn lại Task 8 và chạy lại nghiệm thu khi có API BE, không chặn lần này.

Đề xuất thực hiện trực tiếp trong chat này theo từng task vì các bước phụ thuộc
nhau, quy mô nền tảng còn nhỏ. Đây là ghi chú tại thời điểm trước khi triển khai;
trạng thái sau triển khai được ghi ở mục kết quả bên dưới.

## Kết quả thực hiện 29/10/2026

Task 1–7, phần chuẩn bị Task 8 và nghiệm thu mock Task 9 đã được thực hiện.
Các checkbox phía trên giữ làm danh sách yêu cầu gốc; bằng chứng tổng hợp ở
`docs/auth-acceptance.md`. BE thật vẫn nằm ngoài giai đoạn này.

Điều chỉnh để giảm abstraction:
- Ba page login/forgot/change dùng một AccountPage theo mode, không tạo wrapper file.
- Trang khung dùng Workspace trong AppRouter, không tạo nhiều page giống nhau.
- Trạng thái token và HTTP client cùng ở src/api/http.js, không thêm event-bus module.
- Mock handlers/session/fixtures cùng module nhỏ; chỉ tách browser adapter cho MSW.

Kết quả: npm run check qua;21 tests pass. Chrome kiểm tra3 roles, reload,403,
refresh/scope và4 kích thước. Review độc lập phát hiện pending login khi rời trang;
test tái hiện thất bại trước sửa; AbortController hủy request và suite đã qua lại.

Giới hạn: mật khẩu demo thay đổi chỉ tồn tại đến reload; hợp đồng và README ghi rõ.
HttpOnly cookie/BE thật và CRUD nghiệp vụ chưa triển khai. Sau khi reorganize,
Workspace ở src/pages/Workspace.jsx và HTTP client ở src/shared/api/http.js.

## Tài liệu tham khảo kỹ thuật

- React Router: https://reactrouter.com/start/declarative/routing
- Axios interceptors: https://axios-http.com/docs/interceptors
- MSW browser integration: https://mswjs.io/docs/integrations/browser/
- ESLint configuration: https://eslint.org/docs/latest/use/configure/configuration-files
