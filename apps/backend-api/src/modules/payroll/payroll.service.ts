import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  // ================= SIDE 1: EMPLOYEE SELF-SERVICE =================

  async getMyPayslips(employeeId: string) {
    if (!employeeId) {
      throw new BadRequestException('Không tìm thấy thông tin nhân viên.');
    }

    return this.prisma.payrollItem.findMany({
      where: { employeeId },
      orderBy: { periodMonth: 'desc' },
    });
  }

  // ================= SIDE 2: MANAGEMENT & ADMIN =================

  async runMonthlyPayroll(periodMonth: string) {
    // periodMonth format: "YYYY-MM" (ví dụ: "2026-10")
    if (!/^\d{4}-\d{2}$/.test(periodMonth)) {
      throw new BadRequestException('Định dạng tháng lương không hợp lệ (Phải là YYYY-MM, ví dụ: 2026-10).');
    }

    const [year, month] = periodMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Lấy toàn bộ nhân viên ACTIVE
    const employees = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: {
        timeLogs: {
          where: {
            workDate: { gte: startDate, lte: endDate },
          },
        },
      },
    });

    const results = [];

    // Chạy vòng lặp tính toán tự động
    for (const emp of employees) {
      const baseSalary = Number(emp.baseSalary) || 10000000; // Mặc định nếu chưa set

      // ponytail: 22 work days / 176h standard assumed; upgrade to dynamic shift_schedules table if variable calendars needed
      const totalOvertimeHours = emp.timeLogs.reduce((sum, log) => sum + (Number(log.overtimeHours) || 0), 0);

      // Đơn giá 1 giờ làm việc bình thường (giả định 1 tháng có 22 ngày công, 8h/ngày = 176h)
      const hourlyRate = baseSalary / 176;
      // Lương làm thêm giờ OT = 150% theo Luật Lao Động
      const otPay = totalOvertimeHours * hourlyRate * 1.5;

      const allowances = 1500000; // Phụ cấp ăn trưa, xăng xe
      const bonus = 0;

      const grossIncome = baseSalary + otPay + allowances + bonus;

      // Trừ BHXH (8%), BHYT (1.5%), BHTN (1%) = Tổng 10.5%
      const insuranceDeduction = baseSalary * 0.105;

      // Giảm trừ gia cảnh bản thân: 11 triệu VNĐ/tháng
      const taxableIncome = Math.max(0, grossIncome - insuranceDeduction - 11000000);

      // Thuế TNCN lũy tiến bậc 1 (5% cho phần thu nhập tính thuế đến 5 triệu)
      let taxDeduction = 0;
      if (taxableIncome > 0) {
        taxDeduction = taxableIncome * 0.05;
      }

      const netSalary = Math.round(grossIncome - insuranceDeduction - taxDeduction);

      const payrollItem = await this.prisma.payrollItem.upsert({
        where: {
          employeeId_periodMonth: {
            employeeId: emp.id,
            periodMonth,
          },
        },
        update: {
          baseSalary,
          bonus: Math.round(bonus + otPay),
          allowances,
          insuranceDeduction: Math.round(insuranceDeduction),
          taxDeduction: Math.round(taxDeduction),
          netSalary,
          status: 'APPROVED',
        },
        create: {
          employeeId: emp.id,
          periodMonth,
          baseSalary,
          bonus: Math.round(bonus + otPay),
          allowances,
          insuranceDeduction: Math.round(insuranceDeduction),
          taxDeduction: Math.round(taxDeduction),
          netSalary,
          status: 'APPROVED',
        },
      });

      results.push(payrollItem);
    }

    return {
      message: `Đã hoàn tất tính toán và chốt bảng lương tháng ${periodMonth}`,
      totalEmployeesProcessed: results.length,
      totalNetSalaryPayout: results.reduce((sum, item) => sum + Number(item.netSalary), 0),
      items: results,
    };
  }

  async getPayrollSummary(periodMonth: string) {
    return this.prisma.payrollItem.findMany({
      where: { periodMonth },
      include: {
        employee: {
          select: { fullName: true, employeeCode: true, department: { select: { name: true } } },
        },
      },
    });
  }
}

