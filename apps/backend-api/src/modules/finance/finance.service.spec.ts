import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('FinanceService (Kiểm thử Nghiệp vụ Sổ cái Kép & Báo cáo P&L Real-time)', () => {
  let service: FinanceService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      account: {
        findMany: vi.fn(),
      },
      journalEntry: {
        create: vi.fn(),
      },
      journalLine: {
        findMany: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prismaMock)),
    };
    service = new FinanceService(prismaMock as unknown as PrismaService);
  });

  describe('createJournalEntry (Kiểm soát Kế toán Kép: Tổng Nợ = Tổng Có)', () => {
    it('nên ném BadRequestException nếu bút toán có dưới 2 dòng hạch toán', async () => {
      const dto = {
        entryNumber: 'JE-001',
        description: 'Bút toán lỗi 1 dòng',
        lines: [{ accountCode: '111', debitAmount: 1000000, creditAmount: 0 }],
      };

      await expect(service.createJournalEntry('user-1', dto)).rejects.toThrowError(
        BadRequestException,
      );
      await expect(service.createJournalEntry('user-1', dto)).rejects.toThrowError(
        /Bút toán kế toán kép bắt buộc phải có ít nhất 2 dòng hạch toán/,
      );
    });

    it('nên ném BadRequestException nếu Tổng Nợ không bằng Tổng Có (Lệch dù chỉ 1 đồng)', async () => {
      const dto = {
        entryNumber: 'JE-002',
        description: 'Bút toán bị lệch Nợ Có',
        lines: [
          { accountCode: '112', debitAmount: 50000000, creditAmount: 0 },
          { accountCode: '511', debitAmount: 0, creditAmount: 49999999 }, // Lệch 1 đồng
        ],
      };

      await expect(service.createJournalEntry('user-1', dto)).rejects.toThrowError(
        BadRequestException,
      );
      await expect(service.createJournalEntry('user-1', dto)).rejects.toThrowError(
        /Lệch bút toán kế toán kép/,
      );
    });

    it('nên ghi nhận thành công vào sổ cái khi Tổng Nợ = Tổng Có', async () => {
      const dto = {
        entryNumber: 'JE-003',
        description: 'Thu tiền khách hàng hợp lệ',
        lines: [
          { accountCode: '112', debitAmount: 50000000, creditAmount: 0 },
          { accountCode: '131', debitAmount: 0, creditAmount: 50000000 },
        ],
      };

      prismaMock.journalEntry.create.mockResolvedValue({
        id: 'entry-1',
        ...dto,
      });

      const result = await service.createJournalEntry('user-1', dto);
      expect(result).toBeDefined();
      expect(prismaMock.journalEntry.create).toHaveBeenCalled();
    });
  });

  describe('getRealtimePnL (Báo cáo Kết quả Kinh doanh Doanh thu - Chi phí)', () => {
    it('nên tính toán chính xác Doanh thu, Giá vốn, Chi phí QLDN và Lợi nhuận thuần', async () => {
      // Mock dữ liệu dòng hạch toán
      prismaMock.journalLine.findMany.mockResolvedValue([
        // Doanh thu 511: 100,000,000 VND (Có 511)
        { accountCode: '511', debitAmount: 0, creditAmount: 100000000, account: { accountCode: '511', accountName: 'Doanh thu', accountType: 'REVENUE' } },
        // Giá vốn 632: 40,000,000 VND (Nợ 632)
        { accountCode: '632', debitAmount: 40000000, creditAmount: 0, account: { accountCode: '632', accountName: 'Giá vốn', accountType: 'EXPENSE' } },
        // Chi phí QLDN 642: 25,000,000 VND (Nợ 642)
        { accountCode: '642', debitAmount: 25000000, creditAmount: 0, account: { accountCode: '642', accountName: 'Chi phí QLDN', accountType: 'EXPENSE' } },
      ]);

      const pnl = await service.getRealtimePnL();

      // Doanh thu: 100tr
      expect(pnl.summary.totalRevenue).toBe(100000000);
      // Giá vốn: 40tr
      expect(pnl.summary.totalCOGS).toBe(40000000);
      // Lợi nhuận gộp: 100tr - 40tr = 60tr
      expect(pnl.summary.grossProfit).toBe(60000000);
      // Chi phí vận hành: 25tr
      expect(pnl.summary.totalOpEx).toBe(25000000);
      // Lợi nhuận thuần Net Profit: 60tr - 25tr = 35tr
      expect(pnl.summary.netProfit).toBe(35000000);
      // Biên lợi nhuận: 35%
      expect(pnl.summary.profitMarginPercentage).toBe(35);
    });
  });

  describe('getCashflowSummary (Đo lường Runway & Cảnh báo Sức khỏe Dòng tiền)', () => {
    it('nên cảnh báo HEALTHY nếu số tháng Runway >= 6 tháng', async () => {
      // Tiền trong ngân hàng: 600,000,000 VND
      prismaMock.journalLine.findMany
        .mockResolvedValueOnce([
          { accountCode: '112', debitAmount: 600000000, creditAmount: 0 },
        ])
        // Chi phí bình quân 1 tháng: 100,000,000 VND
        .mockResolvedValueOnce([
          { accountCode: '642', debitAmount: 100000000, creditAmount: 0 },
        ]);

      const cashflow = await service.getCashflowSummary();
      expect(cashflow.totalLiquidCash).toBe(600000000);
      expect(cashflow.runwayMonths).toBe(6);
      expect(cashflow.healthStatus).toBe('HEALTHY');
    });

    it('nên cảnh báo WARNING nếu số tháng Runway dưới 6 tháng và CRITICAL nếu dưới 3 tháng', async () => {
      // Tiền trong ngân hàng: 200,000,000 VND (Burn-rate 100tr -> Runway 2 tháng)
      prismaMock.journalLine.findMany
        .mockResolvedValueOnce([
          { accountCode: '112', debitAmount: 200000000, creditAmount: 0 },
        ])
        .mockResolvedValueOnce([
          { accountCode: '642', debitAmount: 100000000, creditAmount: 0 },
        ]);

      const cashflow = await service.getCashflowSummary();
      expect(cashflow.runwayMonths).toBe(2);
      expect(cashflow.healthStatus).toBe('CRITICAL');
    });
  });
});
