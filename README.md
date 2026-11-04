# Document Management System

Hệ thống quản lý hồ sơ, công văn theo kiến trúc microservice, gom trong một repo (monorepo).

```
docs/
├── back-end/
│   ├── auth-service/        Spring Boot: đăng nhập, JWT, gRPC       (REST :8081, gRPC :9091)
│   └── category-service/    Spring Boot: quản lý danh mục           (REST :8080)
├── front-end/               React + Vite + TypeScript                (:3000 khi chạy Docker, :5173 khi dev)
├── docker/postgres/init/    Script tạo database cho từng service
├── docker-compose.yml       Chạy toàn bộ hệ thống
├── .env.example             Mẫu cấu hình (copy thành .env)
└── .github/                 CI (GitHub Actions) và ruleset bảo vệ nhánh main
```

| Thành phần | Công nghệ |
|---|---|
| Backend | Java 21, Spring Boot 4, Spring Security, JPA, Flyway |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS |
| Database | PostgreSQL 16 (mỗi service một database: `auth_db`, `category_db`) |
| Lưu tệp đính kèm | MinIO (tương thích S3), bucket `attachments` |

## Yêu cầu

- **Docker Desktop**: bắt buộc.
- Chỉ khi chạy từng service bằng IDE (cách 2): **Java 21** và **Node.js 22**.

## Cách 1: Chạy toàn bộ bằng Docker Compose

Cách nhanh nhất, không cần cài Java hay Node.

```bash
git clone https://github.com/ZhugeB1ao/docs.git
cd docs
cp .env.example .env
docker compose up -d --build
```

Lần đầu mất vài phút để tải image và build. Kiểm tra trạng thái:

```bash
docker compose ps
```

Mọi container ở trạng thái `Up` là được. Riêng `docs-minio-init` chạy xong sẽ `Exited (0)`, đó là bình thường.

| Thành phần | Địa chỉ |
|---|---|
| Front-end | http://localhost:3000 |
| auth-service | http://localhost:8081/api/auth |
| category-service | http://localhost:8080/api/categories |
| Health check auth-service | http://localhost:8081/actuator/health |
| MinIO (trang quản trị) | http://localhost:9001 (`minioadmin` / `minioadmin`) |
| PostgreSQL | `localhost:5432` (`postgres` / `postgres`) |

### Tài khoản mẫu

auth-service tự tạo sẵn các tài khoản sau khi `AUTH_SEED_ENABLED=true` (mặc định trong `.env.example`):

| Username | Mật khẩu | Vai trò |
|---|---|---|
| `admin` | `Admin@123` | ADMIN |
| `manager` | `Manager@123` | MANAGER |
| `employee1` | `Employee@123` | EMPLOYEE |
| `employee2` | `Employee@123` | EMPLOYEE |
| `demo_hsu` | `Password@123` | EMPLOYEE |

Thử đăng nhập:

```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"Admin@123"}'
```

### Database và migration

- Lần đầu khởi động, Postgres tạo `category_db` (qua `POSTGRES_DB`) và `auth_db` (qua [docker/postgres/init/01-create-databases.sql](docker/postgres/init/01-create-databases.sql)).
- Mỗi service tự chạy **Flyway migration** khi khởi động để tạo hoặc cập nhật bảng. File migration nằm ở `src/main/resources/db/migration/` của từng service.
- Dữ liệu lưu trong Docker volume nên không mất khi tắt container.

## Cách 2: Chạy từng service bằng IDE (khi dev)

Dùng khi cần debug hoặc sửa code thường xuyên. Docker chỉ chạy hạ tầng (Postgres, MinIO), còn code chạy trực tiếp trên máy.

**1. Bật hạ tầng:**

```bash
docker compose up -d postgres minio minio-init
```

**2. Chạy auth-service** (cổng 8081). Service này bắt buộc phải có `JWT_SECRET`:

```bash
cd back-end/auth-service
JWT_SECRET=change-me-dev-only-secret-at-least-32-chars APP_SEED_ENABLED=true ./mvnw spring-boot:run
```

Chạy từ IntelliJ thì thêm 2 biến này trong *Run Configuration → Environment variables*.

**3. Chạy category-service** (cổng 8080), ở một terminal khác:

```bash
cd back-end/category-service
./mvnw spring-boot:run
```

**4. Chạy front-end** (cổng 5173), ở một terminal khác:

```bash
cd front-end
cp .env.example .env
npm ci
npm run dev
```

Mở http://localhost:5173. Ở chế độ dev, front-end dùng **mock API** (`VITE_ENABLE_MOCKS=true`) nên đăng nhập được mà không cần backend.

Nếu đang chạy Cách 1, hãy tắt các container backend và front-end trước để tránh trùng cổng: `docker compose stop auth-service category-service front-end`.

## Cấu hình

Mọi cấu hình đọc từ biến môi trường. Xem đầy đủ trong [.env.example](.env.example).

| Biến | Dùng cho | Mặc định |
|---|---|---|
| `DB_USERNAME`, `DB_PASSWORD` | Tài khoản các service kết nối DB | `postgres` / `postgres` |
| `AUTH_DB_URL` | DB của auth-service | `jdbc:postgresql://postgres:5432/auth_db` |
| `CATEGORY_DB_URL` | DB của category-service | `jdbc:postgresql://postgres:5432/category_db` |
| `JWT_SECRET` | Khóa ký JWT, **bắt buộc**, tối thiểu 32 ký tự | giá trị mẫu chỉ để dev |
| `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | Tài khoản MinIO | `minioadmin` / `minioadmin` |
| `VITE_API_BASE_URL`, `VITE_CATEGORY_API_URL` | URL front-end gọi tới | `localhost:8081`, `localhost:8080` |

**Không commit file `.env`** (đã có trong `.gitignore`). Các giá trị trong `.env.example` chỉ dùng cho dev. Môi trường dùng chung hoặc khi deploy phải tạo mật khẩu và khóa mới (`openssl rand -hex 32`).

### Dùng Postgres dùng chung của nhóm (qua Tailscale)

# tương tác database 
1. trên máy đã có psql  và đã vào taiscale của tôi 
2.  kiểm tra
    tailscale ping 100.67.250.1
    nc -zv 100.67.250.1 5432


3. kết nối vào db
    psql "postgresql://role:mật_khẩu@100.67.250.1:5432/appdb"

# bảo huy 
role: baohuy 
mật khẩu: baohuy123
# gia bảo 
role: giabao
mật khẩu: giabao123
# gia huy
role: giahuy 
mật khẩu: giahuy123
# kim anh  
role: kimanh
mật khẩu: kimanh123

1. Bật Tailscale và tham gia mạng của nhóm.
2. Sửa `.env`, thay `postgres` bằng IP Tailscale của máy chạy DB và dùng tài khoản được cấp:

   ```env
   AUTH_DB_URL=jdbc:postgresql://100.67.250.1:5432/auth_db
   CATEGORY_DB_URL=jdbc:postgresql://100.67.250.1:5432/category_db
   DB_USERNAME=<tài khoản của bạn>
   DB_PASSWORD=<mật khẩu của bạn>
   ```

3. Chạy lại: `docker compose up -d`.

## Lệnh thường dùng

```bash
docker compose logs -f auth-service                # Xem log một service
docker compose up -d --build auth-service          # Build lại một service sau khi sửa code
docker compose down                                # Tắt toàn bộ, giữ dữ liệu
docker compose down -v                             # Tắt và XÓA toàn bộ dữ liệu (DB, MinIO)
```

## Kiểm tra trước khi tạo pull request

CI chạy đúng các lệnh dưới đây trên mọi pull request. Pass ở máy thì CI cũng sẽ pass.

```bash
# Mỗi service backend (trong thư mục back-end/<service>)
./mvnw checkstyle:check test package

# Front-end (trong thư mục front-end)
npm run lint && npm run format:check && npm test && npm run build
```

## Quy trình làm việc

- Mỗi tính năng làm trên một branch riêng, đặt tên theo dạng `feature/{tên}`, ví dụ `feature/fe`, `feature/cate`, `feature/auth`.
- Muốn đưa code vào `main` thì phải mở **pull request**. Nhánh `main` được bảo vệ ([.github/rulesets/protect-main.json](.github/rulesets/protect-main.json)):
  - CI phải pass: lint, test, build cho BE và FE, build Docker image.
  - Cần ít nhất **1 thành viên khác approve**.
  - Không push thẳng hoặc force-push lên `main`.

## Xử lý sự cố

| Lỗi | Nguyên nhân và cách xử lý |
|---|---|
| `required variable JWT_SECRET is missing a value` | Chưa có file `.env`. Chạy `cp .env.example .env` |
| `port is already allocated` / `address already in use` | Cổng 5432, 8080, 8081 hoặc 3000 đang bị chương trình khác dùng. Tắt chương trình đó, hoặc đổi cổng (ví dụ `POSTGRES_PORT=5433` trong `.env`) |
| auth-service báo `database "auth_db" does not exist` | Volume Postgres được tạo từ trước khi có script init. Tạo bằng tay: `docker exec docs-postgres psql -U postgres -c "CREATE DATABASE auth_db;"` |
| Service không kết nối được DB dùng chung | Kiểm tra Tailscale đã bật chưa và chạy `nc -vz 100.x.x.x 5432` |
| Muốn làm lại từ đầu | `docker compose down -v`, sau đó `docker compose up -d --build` |

## Hạn chế hiện tại

- **Front-end chưa kết nối được với auth-service thật**: auth-service chưa bật CORS cho `localhost:3000`. Khi chạy Cách 1, đăng nhập trên giao diện web chưa hoạt động. Gọi API trực tiếp bằng curl hoặc Postman thì vẫn chạy.
- **category-service chưa xác thực JWT thật**: service này chỉ nhận token giả như `Authorization: Bearer ADMIN` và chưa kiểm tra JWT do auth-service cấp.
- **MinIO đã chạy nhưng chưa service nào dùng**: chức năng đính kèm tệp chưa được làm.
