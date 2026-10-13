# Enterprise ERP & Operations Backend API

Hệ thống Quản trị Doanh nghiệp Toàn diện xây dựng bằng **NestJS 12**, **TypeScript**, **PostgreSQL (Prisma ORM)** và **Redis**.

---

## 1. Kiến trúc Hai Phân hệ (Dual-Portal Separation)

Backend cung cấp 2 nhóm API độc lập được bảo vệ bởi **AudienceGuard** và **RolesGuard**:

### Side 1: Cổng Nhân viên (Employee Portal - Self-Service)
* `POST /api/v1/self/attendance/check-in`: Chấm công 1 chạm kèm GPS.
* `POST /api/v1/self/attendance/check-out`: Chốt giờ làm việc và tính giờ tăng ca (OT).
* `GET /api/v1/self/attendance/my-logs`: Xem lịch sử công của chính mình.
* `GET /api/v1/self/tasks`: Danh sách công việc cá nhân được phân công.
* `POST /api/v1/self/tasks/:id/work-log`: Ghi nhận giờ làm việc vào task (tự động tính giá vốn dự án).
* `GET /api/v1/self/payroll/payslips`: Xem phiếu lương cá nhân (Payslip).
* `POST /api/v1/self/approvals/requests`: Tạo đơn đề xuất (nghỉ phép, tạm ứng, chi phí, tăng ca).
* `GET /api/v1/self/approvals/my-requests`: Theo dõi trạng thái duyệt đơn.

### Side 2: Cổng Quản lý (Management Portal)
* `GET /api/v1/management/attendance/overview`: Giám sát chấm công toàn công ty theo thời gian thực.
* `GET /api/v1/management/operations/projects`: Quản trị danh mục dự án, ngân sách và chi phí thực tế.
* `POST /api/v1/management/operations/tasks`: Tạo WBS Task và phân bổ nhân sự.
* `GET /api/v1/management/operations/workload-heatmap`: Biểu đồ nhiệt phân bổ tải nhân sự.
* `GET /api/v1/management/finance/accounts`: Hệ thống tài khoản kế toán Việt Nam chuẩn.
* `POST /api/v1/management/finance/journal-entries`: Bút toán sổ cái kép (kiểm soát chặt chẽ $\sum Nợ = \sum Có$).
* `GET /api/v1/management/finance/pnl-report`: Báo cáo Lãi/Lỗ (P&L) thời gian thực.
* `GET /api/v1/management/finance/cashflow`: Dòng tiền khả dụng, tốc độ đốt tiền (Burn-rate) và Runway.
* `POST /api/v1/management/payroll/run`: Chạy động cơ tính lương tự động (BHXH, Thuế TNCN lũy tiến).
* `GET /api/v1/management/approvals/pending`: Trạm duyệt tập trung các đề xuất toàn công ty.
* `POST /api/v1/management/approvals/:id/decide`: Phê duyệt hoặc từ chối đơn từ theo hạn mức.

---

## 2. Hướng dẫn Khởi chạy Nhanh

### Bước 1: Khởi động Cơ sở dữ liệu (PostgreSQL & Redis)
```bash
# Tại thư mục gốc của dự án:
docker compose up -d postgres redis adminer
```
* **PostgreSQL:** `localhost:5432` (User: `erp_user`, Pass: `erp_password_secure`, DB: `erp_core_db`)
* **Redis:** `localhost:6379`
* **Adminer (Giao diện xem DB):** `http://localhost:8080`

### Bước 2: Đồng bộ Schema & Nạp Dữ liệu Mẫu (Seed Data)
```bash
# Chạy migration tạo bảng trong PostgreSQL:
pnpm prisma:migrate

# Hoặc nạp dữ liệu mẫu ban đầu:
pnpm prisma:seed
```

### Bước 3: Khởi động Backend API
```bash
# Chế độ phát triển (Hot-reload):
pnpm dev:backend

# Hoặc biên dịch bản production:
pnpm build:backend
```

* **API Base URL:** `http://localhost:4000/api/v1`
* **Tài liệu Swagger OpenAPI:** `http://localhost:4000/docs`

---

## 3. Tài khoản Mẫu Đã Tạo Sẵn (Mật khẩu mặc định: `Admin123@`)

| Email | Chức vụ | Quyền (Role) | Cổng Được Phép Truy Cập |
| :--- | :--- | :--- | :--- |
| `admin@company.vn` | Tổng Quản Trị | `SUPER_ADMIN` | Management Portal |
| `ceo@company.vn` | Tổng Giám Đốc | `DIRECTOR` | Management Portal |
| `cfo@company.vn` | Giám Đốc Tài Chính | `FINANCE_MANAGER` | Management Portal |
| `pm@company.vn` | Quản Lý Dự Án | `PROJECT_MANAGER` | Management Portal |
| `dev@company.vn` | Kỹ Sư Phần Mềm | `EMPLOYEE` | **Employee Portal duy nhất** |
| `sales@company.vn` | Nhân Viên Kinh Doanh | `EMPLOYEE` | **Employee Portal duy nhất** |
