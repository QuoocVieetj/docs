# Document Management System

Hệ thống quản lý hồ sơ, công văn theo kiến trúc microservice (monorepo).

```
docs/
├── back-end/
│   ├── auth-service/        Đăng nhập, JWT, gRPC    (REST :8081, gRPC :9091)
│   └── category-service/    Quản lý danh mục        (REST :8080)
├── front-end/               React + Vite + TS        (:3000 Docker, :5173 dev)
├── docker/postgres/init/    Script tạo database
├── docker-compose.yml       Chạy toàn bộ hệ thống
└── .env.example             Mẫu cấu hình (copy thành .env)
```

**Stack:** Java 21, Spring Boot 4, JPA, Flyway · React 19, Vite, TypeScript · PostgreSQL 16 · MinIO (bucket `attachments`)

## Chạy dự án

**Cách 1: toàn bộ bằng Docker**

```bash
cp .env.example .env
docker compose up -d --build
docker compose ps          # docs-minio-init "Exited (0)" là bình thường
```

**Cách 2: chạy service bằng IDE** (Docker chỉ chạy hạ tầng, cần Java 21, Node 22)

```bash
docker compose up -d postgres minio minio-init

cd back-end/auth-service
JWT_SECRET=change-me-dev-only-secret-at-least-32-chars APP_SEED_ENABLED=true ./mvnw spring-boot:run

cd back-end/category-service && ./mvnw spring-boot:run

cd front-end && cp .env.example .env && npm ci && npm run dev
```

Đang chạy Cách 1 thì tắt container trước: `docker compose stop auth-service category-service front-end`.

| Thành phần | Địa chỉ |
|---|---|
| Front-end | http://localhost:3000 |
| auth-service | http://localhost:8081/api/auth |
| category-service | http://localhost:8080/api/categories |
| MinIO console | http://localhost:9001 (`minioadmin` / `minioadmin`) |
| PostgreSQL | `localhost:5432` (`postgres` / `postgres`) |

Tài khoản mẫu: `admin` / `Admin@123`, `manager` / `Manager@123`, `employee1` / `Employee@123`.

## Database

| Việc | Ở đâu |
|---|---|
| Tạo database | [docker/postgres/init/01-create-databases.sql](docker/postgres/init/01-create-databases.sql) (chỉ chạy khi volume trống) |
| Tạo, sửa bảng | `back-end/<service>/src/main/resources/db/migration/` (Flyway) |
| Kết nối | `application.properties` + biến môi trường trong `docker-compose.yml`, `.env` |

- Mỗi service một database, **không query sang database của service khác**. Cần dữ liệu thì gọi API hoặc gRPC.
- Service không tự tạo database, phải tạo trước.

### Kết nối và truy vấn

```bash
# Postgres local
docker exec -it docs-postgres psql -U postgres -d auth_db
```

Postgres dùng chung: xem [Tạo database và bảng trên DB dùng chung](#tạo-database-và-bảng-trên-db-dùng-chung-dev).

DBeaver / IntelliJ: `localhost:5432`, `postgres` / `postgres`, database `auth_db` hoặc `category_db`.

```sql
\l   \c category_db   \dt   \d categories        -- DB, đổi DB, bảng, cấu trúc bảng
SELECT * FROM flyway_schema_history;              -- migration đã chạy
```

### Tạo, sửa bảng (Flyway)

Tạo file `V<số>__<mô_tả>.sql` trong `db/migration/`, rồi sửa Entity cho khớp. Flyway tự chạy khi service khởi động.

```sql
-- V2__add_description_to_categories.sql
ALTER TABLE categories ADD COLUMN description VARCHAR(500);
```

```java
@Column(length = 500)
private String description;
```

- `ddl-auto=validate`: Entity không khớp bảng thì service không chạy.
- **Không sửa migration đã merge**, tạo file `V` mới (sửa file cũ sẽ gây lỗi `checksum mismatch`).
- **Không sửa bảng bằng tay** trên DB dùng chung.
- Trùng số `V` với người khác thì đổi số trước khi mở PR.
- CI không chạy migration (test dùng H2), nên phải chạy service với Postgres thật trước khi mở PR.

## Thêm service mới có database

Ví dụ: `document-service`, database `document_db`, cổng `8082`.

**1. `docker/postgres/init/01-create-databases.sql`**

```sql
CREATE DATABASE document_db;
```

Máy đã có volume thì tạo tay: `docker exec docs-postgres psql -U postgres -c "CREATE DATABASE document_db;"`

**2. `pom.xml`**: `spring-boot-starter-data-jpa`, `spring-boot-starter-flyway`, `flyway-database-postgresql`, `postgresql` (runtime). Copy từ [category-service/pom.xml](back-end/category-service/pom.xml).

**3. `src/main/resources/application.properties`**

```properties
server.port=8082
spring.datasource.url=${DB_URL:jdbc:postgresql://localhost:5432/document_db}
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD:postgres}
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
```

**4. `src/main/resources/db/migration/V1__create_documents_table.sql`**: tạo bảng, rồi viết Entity + Repository.

**5. `docker-compose.yml`**

```yaml
  document-service:
    build: ./back-end/document-service
    container_name: document-service
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      SPRING_DATASOURCE_URL: ${DOCUMENT_DB_URL:-jdbc:postgresql://postgres:5432/document_db}
      SPRING_DATASOURCE_USERNAME: ${DB_USERNAME:-postgres}
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD:-postgres}
    ports:
      - "8082:8082"
```

**6. `.env.example`**

```env
DOCUMENT_DB_URL=jdbc:postgresql://postgres:5432/document_db
```

Host của DB theo nơi chạy:

| Chạy ở | Host trong URL |
|---|---|
| IDE | `localhost` |
| Docker Compose | `postgres` |
| DB dùng chung | `100.67.250.1` |

## Dùng Postgres dùng chung (Tailscale)

Sửa `.env`, **mỗi service một dòng URL**:

```env
AUTH_DB_URL=jdbc:postgresql://100.67.250.1:5432/auth_db
CATEGORY_DB_URL=jdbc:postgresql://100.67.250.1:5432/category_db
DOCUMENT_DB_URL=jdbc:postgresql://100.67.250.1:5432/document_db   # service mới thì thêm dòng
DB_USERNAME=<tài khoản>
DB_PASSWORD=<mật khẩu>
```

Rồi chạy `docker compose up -d`.

DB dùng chung chỉ truy cập được khi máy chủ DB đang bật Docker và Tailscale. Script `docker/postgres/init` không chạy trên DB dùng chung, nên service mới phải tạo database theo các bước dưới.

### Tạo database và bảng trên DB dùng chung (dev)

**1. Tạo lại container** (trên máy chủ DB, trong thư mục `postgres-shared`)

```bash
docker compose up -d
docker compose ps
```

**2. Cấp quyền cho thành viên** (admin chạy một lần cho mỗi người)

```sql
ALTER ROLE baohuy CREATEDB;     -- cho phép tạo database
ALTER ROLE baohuy CREATEROLE;   -- cho phép tạo và quản lý role khác
```

**3. Vào DB để tương tác**

```bash
psql "postgresql://<role>:<mật_khẩu>@100.67.250.1:5432/appdb"
```

**4. Tạo database và cấp quyền cho cả nhóm**

```sql
CREATE DATABASE ten_db_moi;

-- Cho các thành viên kết nối vào database này
GRANT CONNECT ON DATABASE ten_db_moi TO baohuy, giabao, giahuy, kimanh;

-- Chuyển sang database mới (phải chuyển trước khi cấp quyền schema)
\c ten_db_moi

-- Cho các thành viên dùng và tạo bảng trong schema public
GRANT USAGE, CREATE ON SCHEMA public TO baohuy, giabao, giahuy, kimanh;
```

Sau đó thêm `<TÊN>_DB_URL=jdbc:postgresql://100.67.250.1:5432/ten_db_moi` vào `.env`. Bảng do Flyway của service tạo khi service khởi động.

## Cấu hình

| Biến | Dùng cho | Mặc định |
|---|---|---|
| `DB_USERNAME`, `DB_PASSWORD` | Tài khoản DB của các service | `postgres` / `postgres` |
| `AUTH_DB_URL` | DB auth-service | `jdbc:postgresql://postgres:5432/auth_db` |
| `CATEGORY_DB_URL` | DB category-service | `jdbc:postgresql://postgres:5432/category_db` |
| `JWT_SECRET` | Khóa ký JWT của auth-service, không cần đặt khi dev (deploy thật thì đặt khóa mới) | giá trị dev trong `docker-compose.yml` |
| `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | Tài khoản MinIO | `minioadmin` / `minioadmin` |
| `VITE_API_BASE_URL`, `VITE_CATEGORY_API_URL` | URL front-end gọi tới | `localhost:8081`, `localhost:8080` |

Không commit `.env` và không ghi mật khẩu vào repo.

## Lệnh thường dùng

```bash
docker compose logs -f auth-service           # xem log
docker compose up -d --build auth-service     # build lại sau khi sửa code
docker compose down                           # tắt, giữ dữ liệu
docker compose down -v                        # tắt và XÓA dữ liệu (DB, MinIO)
```

