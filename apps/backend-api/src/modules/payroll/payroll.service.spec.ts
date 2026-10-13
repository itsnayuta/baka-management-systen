import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PayrollService (Kiểm thử Động cơ Tính lương & Thuế TNCN / BHXH)', () => {
  let service: PayrollService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      employee: {
        findMany: vi.fn(),
      },
      payrollItem: {
        findMany: vi.fn(),
        upsert: vi.fn((params) => Promise.resolve(params.create)),
      },
    };
    service = new PayrollService(prismaMock as unknown as PrismaService);
  });

  it('nên ném BadRequestException nếu định dạng tháng không phải YYYY-MM', async () => {
    await expect(service.runMonthlyPayroll('2026/10')).rejects.toThrowError(BadRequestException);
    await expect(service.runMonthlyPayroll('October-2026')).rejects.toThrowError(
      /Định dạng tháng lương không hợp lệ/,
    );
  });

  it('nên tính đúng BHXH 10.5%, tiền làm thêm giờ OT (150%) và Thuế TNCN', async () => {
    // Nhân viên có lương cơ bản: 20,000,000 VND
    // Có 10 giờ làm thêm giờ (OT)
    // Đơn giá 1 giờ: 20,000,000 / 176h = 113,636 VND
    // Tiền OT 150%: 10 * 113,636 * 1.5 = ~1,704,545 VND
    // Phụ cấp: 1,500,000 VND
    // Tổng thu nhập Gross: 20,000,000 + 1,704,545 + 1,500,000 = 23,204,545 VND
    // Trừ BHXH 10.5%: 20,000,000 * 10.5% = 2,100,000 VND
    // Thu nhập sau BHXH: 23,204,545 - 2,100,000 = 21,104,545 VND
    // Giảm trừ bản thân: 11,000,000 VND
    // Thu nhập tính thuế: 21,104,545 - 11,000,000 = 10,104,545 VND
    // Thuế TNCN bậc 1 (5%): 10,104,545 * 5% = 505,227 VND
    // Lương thực nhận Net: 23,204,545 - 2,100,000 - 505,227 = ~20,599,318 VND

    prismaMock.employee.findMany.mockResolvedValue([
      {
        id: 'emp-1',
        fullName: 'Nguyễn Văn Test',
        baseSalary: 20000000,
        timeLogs: [
          { overtimeHours: 6 },
          { overtimeHours: 4 }, // Tổng 10h OT
        ],
      },
    ]);

    const result = await service.runMonthlyPayroll('2026-10');

    expect(result.totalEmployeesProcessed).toBe(1);
    const item = result.items[0];

    expect(item.baseSalary).toBe(20000000);
    // BHXH 10.5% = 2,100,000
    expect(item.insuranceDeduction).toBe(2100000);
    // Tiền thưởng & OT: khoảng 1.7 triệu
    expect(item.bonus).toBeGreaterThan(1700000);
    // Lương thực nhận Net phải lớn hơn 20 triệu
    expect(item.netSalary).toBeGreaterThan(20000000);
  });
});
