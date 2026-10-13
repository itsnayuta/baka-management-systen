# BAKA OPERATIONS & ERP PLATFORM (ENTERPRISE MANAGEMENT SYSTEM)

Hệ thống quản trị điều hành doanh nghiệp toàn diện tích hợp 6 phân hệ cốt lõi: **Tài chính Kế toán kép (VAS)**, **Nhân sự & Chấm công GPS**, **Quản trị Tiến độ EVM**, **Bảng lương tự động (BHXH, Thuế TNCN)** và **Trung tâm Phê duyệt Đa cấp (SLA Matrix)**.

Hệ thống tuân thủ nghiêm ngặt mô hình phân tách hai phân hệ độc lập:
1. **Side 1 — Cổng Nhân Viên (Employee Portal - ESS):** Giao diện Mobile-first tối ưu cho thao tác chấm công GPS, ghi nhận giờ làm việc, xem phiếu lương minh bạch và nộp đơn từ.
2. **Side 2 — Cổng Quản Trị (Management Portal - BOD & Admin):** Dashboard điều hành Desktop dành cho Ban Giám Đốc, Trưởng phòng, Kế toán trưởng: Báo cáo P&L real-time, Dòng tiền & Runway, Workload Heatmap, Sổ cái kép và Phê duyệt 1-click.

---

## 🏗️ 1. Kiến Trúc Ngăn Xếp Công Nghệ (Tech Stack)

- **Monorepo:** `pnpm workspace`
- **Backend API (`apps/backend-api`):** NestJS 12, Prisma ORM 6, PostgreSQL 16, Redis 7, Passport JWT, Swagger OpenAPI.
- **Frontend Web (`apps/web`):** Next.js 16 (Turbopack), React 19, Tailwind CSS v4, Lucide Icons, Fetch API nguyên sinh (Zero-axios).
- **Quality Gate & Testing:** Vitest (Unit & Security Guard testing < 1s), GitHub Actions CI.
- **Containerization:** Docker Multi-stage & Docker Compose.

---

## ⚡ 2. Cổng Kết Nối & Dịch Vụ Mặc Định

| Dịch vụ | URL Truy cập | Mục đích |
| :--- | :--- | :--- |
| **Frontend Web Portal** | [http://localhost:3000](http://localhost:3000) | Giao diện đăng nhập 2 Side (ESS & BOD) |
| **Backend REST API** | [http://localhost:4000/api/v1](http://localhost:4000/api/v1) | Cổng API nghiệp vụ |
| **Swagger API Docs** | [http://localhost:4000/docs](http://localhost:4000/docs) | Tài liệu kiểm thử API tương tác trực tiếp |
| **Database GUI (Adminer)** | [http://localhost:8080](http://localhost:8080) | Quản trị trực quan PostgreSQL |
| **PostgreSQL Database** | `localhost:5432` (`erp_core_db`) | Cơ sở dữ liệu nghiệp vụ |
| **Redis Cache** | `localhost:6379` | Token blacklist & Caching |

---

## 🔑 3. Tài Khoản Thử Nghiệm 1-Click (Demo Accounts)

Trên giao diện đăng nhập ([http://localhost:3000](http://localhost:3000)), hệ thống có sẵn các nút bấm 1-click để vào ngay:

| Vị trí | Mã Nhân Viên | Mật khẩu mặc định | Phân quyền & Cổng phù hợp |
| :--- | :--- | :--- | :--- |
| 👑 **Tổng Giám Đốc (BOD)** | `BOD001` | `Admin@123456` | Toàn quyền, Management Portal (Duyệt chi >100M) |
| 💼 **Trưởng Phòng Nhân Sự** | `HR001` | `HR@123456` | Quản lý Chấm công, Bảng lương, Management Portal |
| 💰 **Kế Toán Trưởng** | `ACC001` | `Acc@123456` | Sổ cái kép, Báo cáo P&L, Duyệt chi <100M |
| 💻 **Lập Trình Viên (Senior Dev)** | `DEV001` | `Dev@123456` | Employee Portal (Chấm công GPS, Ghi log task) |

---

## 🚀 4. Hướng Dẫn Chạy Môi Trường Phát Triển (Local Development)

### Yêu cầu tiên quyết:
- **Node.js:** v22.x hoặc v24.x trở lên
- **pnpm:** `npm i -g pnpm@12`
- **Docker Desktop** (đang chạy)

### Bước 1: Khởi động cơ sở dữ liệu (PostgreSQL + Redis)
```bash
# Bật container Postgres, Redis và Adminer
pnpm db:up
```

### Bước 2: Đồng bộ Schema & Nạp Dữ Liệu Mẫu (Seed Data)
```bash
# 1. Sinh Prisma Client
pnpm prisma:generate

# 2. Đẩy cấu trúc bảng vào PostgreSQL
pnpm prisma:migrate

# 3. Nạp dữ liệu tài khoản kế toán VN (VAS), phòng ban, sếp & nhân viên
pnpm prisma:seed
```

### Bước 3: Khởi chạy Backend & Frontend
Mở 2 tab terminal riêng biệt:

**Terminal 1 — Chạy Backend:**
```bash
pnpm dev:backend
# API sẽ lắng nghe tại: http://localhost:4000/api/v1
# Swagger docs tại:    http://localhost:4000/docs
```

**Terminal 2 — Chạy Frontend:**
```bash
pnpm dev:web
# Web Portal sẽ mở tại: http://localhost:3000
```

---

## 🐳 5. Triển Khai Full-Stack Bằng Docker (1-Click Docker Compose)

Nếu bạn muốn chạy toàn bộ hệ thống (Postgres, Redis, Backend, Frontend) trong các Docker container độc lập mà không cần cài Node.js trên máy host:

```bash
# Build và khởi chạy tất cả các container ngầm
docker compose up --build -d

# Kiểm tra trạng thái các container đang chạy
docker compose ps
```

Khi chạy xong:
- Truy cập Web: `http://localhost:3000`
- Truy cập API: `http://localhost:4000/docs`
- Để dừng hệ thống: `docker compose down`

---

## 🧪 6. Chạy Kiểm Thử Tự Động (Automated Testing)

Toàn bộ test suite được viết bằng **Vitest**, chạy song song và hoàn tất trong ~600ms:

```bash
# Chạy 23 unit & security tests
pnpm test:backend

# Kiểm tra build production
pnpm build:backend
pnpm build:web
```

---

## ☁️ 7. Hướng Dẫn Triển Khai Lên Server Production (VPS / Cloud)

### Cách 1: Sử dụng Docker & Docker Compose (Khuyên dùng)
1. Cài đặt Docker & Git trên máy chủ Ubuntu/Debian:
   ```bash
   sudo apt update && sudo apt install -y git docker.io docker-compose-v2
   ```
2. Clone repository:
   ```bash
   git clone https://github.com/itsnayuta/baka-management-systen.git /opt/baka-erp
   cd /opt/baka-erp
   ```
3. Cập nhật các biến môi trường nhạy cảm trong `docker-compose.yml` (`POSTGRES_PASSWORD`, `JWT_SECRET`).
4. Khởi chạy:
   ```bash
   docker compose up --build -d
   ```
5. Cấu hình Nginx Reverse Proxy trỏ tên miền (ví dụ `staff.yourcompany.com` và `admin.yourcompany.com`) về port 3000 & 4000 có SSL Certbot.

### Cách 2: Triển Khai Cloud Tách Biệt
- **Backend API:** Deploy lên Railway, Render, hoặc AWS ECS Fargate với biến môi trường `DATABASE_URL` (kết nối Supabase / AWS RDS).
- **Frontend Web:** Deploy lên Vercel / Cloudflare Pages / Coolify, cấu hình biến `NEXT_PUBLIC_API_URL` trỏ về domain Backend API.

