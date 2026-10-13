import { PrismaClient, Role, AccountType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Hệ thống Tài khoản Kế toán Việt Nam Chuẩn (Chart of Accounts)
  const accountsData = [
    { accountCode: '111', accountName: 'Tiền mặt', accountType: AccountType.ASSET },
    { accountCode: '112', accountName: 'Tiền gửi ngân hàng', accountType: AccountType.ASSET },
    { accountCode: '131', accountName: 'Phải thu của khách hàng', accountType: AccountType.ASSET },
    { accountCode: '331', accountName: 'Phải trả cho người bán', accountType: AccountType.LIABILITY },
    { accountCode: '334', accountName: 'Phải trả người lao động', accountType: AccountType.LIABILITY },
    { accountCode: '411', accountName: 'Vốn đầu tư của chủ sở hữu', accountType: AccountType.EQUITY },
    { accountCode: '511', accountName: 'Doanh thu bán hàng và cung cấp dịch vụ', accountType: AccountType.REVENUE },
    { accountCode: '632', accountName: 'Giá vốn hàng bán', accountType: AccountType.EXPENSE },
    { accountCode: '641', accountName: 'Chi phí bán hàng', accountType: AccountType.EXPENSE },
    { accountCode: '642', accountName: 'Chi phí quản lý doanh nghiệp', accountType: AccountType.EXPENSE },
  ];

  for (const acc of accountsData) {
    await prisma.account.upsert({
      where: { accountCode: acc.accountCode },
      update: acc,
      create: acc,
    });
  }
  console.log('✅ Seeded Chart of Accounts');

  // 2. Cơ cấu Phòng ban (Departments)
  const depts = [
    { code: 'BOD', name: 'Ban Giám Đốc', description: 'Hội đồng Quản trị & Điều hành' },
    { code: 'TECH', name: 'Khối Công nghệ & Chuyển đổi số', description: 'Phát triển phần mềm & Hạ tầng' },
    { code: 'SALES', name: 'Khối Kinh doanh & Marketing', description: 'Phát triển thị trường & Doanh thu' },
    { code: 'FIN', name: 'Phòng Tài chính - Kế toán', description: 'Quản trị ngân sách & Dòng tiền' },
    { code: 'HR', name: 'Phòng Nhân sự', description: 'Tuyển dụng, Chấm công & Lương' },
  ];

  const deptMap = new Map<string, string>();
  for (const d of depts) {
    const created = await prisma.department.upsert({
      where: { code: d.code },
      update: d,
      create: d,
    });
    deptMap.set(d.code, created.id);
  }
  console.log('✅ Seeded Departments');

  // 3. Nhân sự & Tài khoản Người dùng (Users & Employees)
  const defaultPassword = await bcrypt.hash('Admin123@', 10);

  const usersData = [
    {
      email: 'admin@company.vn',
      fullName: 'Tổng Quản Trị Hệ Thống',
      code: 'EMP-001',
      role: Role.SUPER_ADMIN,
      deptCode: 'BOD',
      baseSalary: 60000000,
      hourlyCost: 340000,
    },
    {
      email: 'ceo@company.vn',
      fullName: 'Trần Văn Giám Đốc (CEO)',
      code: 'EMP-002',
      role: Role.DIRECTOR,
      deptCode: 'BOD',
      baseSalary: 50000000,
      hourlyCost: 280000,
    },
    {
      email: 'cfo@company.vn',
      fullName: 'Nguyễn Thị Kế Toán Trưởng (CFO)',
      code: 'EMP-003',
      role: Role.FINANCE_MANAGER,
      deptCode: 'FIN',
      baseSalary: 35000000,
      hourlyCost: 200000,
    },
    {
      email: 'pm@company.vn',
      fullName: 'Lê Quản Lý Dự Án (Tech PM)',
      code: 'EMP-004',
      role: Role.PROJECT_MANAGER,
      deptCode: 'TECH',
      baseSalary: 30000000,
      hourlyCost: 170000,
    },
    {
      email: 'dev@company.vn',
      fullName: 'Phạm Lập Trình Viên (Senior Dev)',
      code: 'EMP-005',
      role: Role.EMPLOYEE,
      deptCode: 'TECH',
      baseSalary: 22000000,
      hourlyCost: 125000,
    },
    {
      email: 'sales@company.vn',
      fullName: 'Hoàng Kinh Doanh (Sales Rep)',
      code: 'EMP-006',
      role: Role.EMPLOYEE,
      deptCode: 'SALES',
      baseSalary: 12000000,
      hourlyCost: 70000,
    },
  ];

  let managerEmpId: string | undefined = undefined;

  for (const u of usersData) {
    const employee = await prisma.employee.upsert({
      where: { employeeCode: u.code },
      update: {
        fullName: u.fullName,
        email: u.email,
        departmentId: deptMap.get(u.deptCode),
        baseSalary: u.baseSalary,
        hourlyCostRate: u.hourlyCost,
      },
      create: {
        employeeCode: u.code,
        fullName: u.fullName,
        email: u.email,
        departmentId: deptMap.get(u.deptCode),
        baseSalary: u.baseSalary,
        hourlyCostRate: u.hourlyCost,
        directManagerId: managerEmpId,
      },
    });

    if (u.role === Role.DIRECTOR) {
      managerEmpId = employee.id;
    }

    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        role: u.role,
        employeeId: employee.id,
      },
      create: {
        email: u.email,
        password: defaultPassword,
        role: u.role,
        employeeId: employee.id,
      },
    });
  }
  console.log('✅ Seeded Users & Employees (Password: Admin123@)');

  // 4. Bút toán Đầu kỳ: Góp vốn 2 tỷ đồng gửi ngân hàng
  const entryNumber = 'JE-INIT-001';
  const existingEntry = await prisma.journalEntry.findUnique({
    where: { entryNumber },
  });

  if (!existingEntry) {
    await prisma.journalEntry.create({
      data: {
        entryNumber,
        transactionDate: new Date(),
        referenceType: 'MANUAL',
        description: 'Góp vốn điều lệ chủ sở hữu vào tài khoản ngân hàng',
        status: 'POSTED',
        lines: {
          create: [
            {
              accountCode: '112', // Nợ 112 (Tiền gửi ngân hàng)
              debitAmount: 2000000000,
              creditAmount: 0,
              note: 'Tiền gửi ngân hàng VCB',
            },
            {
              accountCode: '411', // Có 411 (Vốn chủ sở hữu)
              debitAmount: 0,
              creditAmount: 2000000000,
              note: 'Vốn điều lệ',
            },
          ],
        },
      },
    });
    console.log('✅ Seeded Initial Capital Journal Entry (2,000,000,000 VND)');
  }

  // 5. Dự án Mẫu & Công việc (Projects & Tasks)
  const sampleProject = await prisma.project.upsert({
    where: { projectCode: 'PRJ-DX-2026' },
    update: {},
    create: {
      projectCode: 'PRJ-DX-2026',
      name: 'Triển khai Nền tảng Chuyển đổi số ERP',
      description: 'Dự án số hóa quy trình vận hành và tài chính toàn diện',
      estimatedBudget: 500000000,
      actualCost: 0,
      status: 'IN_PROGRESS',
      startDate: new Date(),
      deadline: new Date(new Date().getFullYear(), 11, 31),
    },
  });

  const devEmployee = await prisma.employee.findUnique({ where: { employeeCode: 'EMP-005' } });
  if (devEmployee) {
    const existingTask = await prisma.task.findFirst({
      where: { projectId: sampleProject.id, title: 'Thiết kế & Khởi tạo Backend API' },
    });

    if (!existingTask) {
      const task = await prisma.task.create({
        data: {
          projectId: sampleProject.id,
          title: 'Thiết kế & Khởi tạo Backend API',
          description: 'Xây dựng core modules: Auth, Attendance, Finance, Tasks, Approvals',
          priority: 'URGENT',
          status: 'IN_PROGRESS',
          estimatedHours: 40,
          actualHours: 8,
          dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
          assignees: {
            create: { employeeId: devEmployee.id },
          },
          workLogs: {
            create: {
              employeeId: devEmployee.id,
              hoursSpent: 8,
              hourlyCostRate: Number(devEmployee.hourlyCostRate),
              description: 'Hoàn thành kiến trúc Module và Database Schema',
            },
          },
        },
      });

      // Tăng actualCost của dự án
      await prisma.project.update({
        where: { id: sampleProject.id },
        data: { actualCost: 8 * Number(devEmployee.hourlyCostRate) },
      });
      console.log('✅ Seeded Sample Project & Task with WorkLog');
    }
  }

  console.log('🎉 Database Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

