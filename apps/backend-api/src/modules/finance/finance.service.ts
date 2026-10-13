import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateJournalEntryDto {
  entryNumber: string;
  transactionDate?: string;
  referenceType?: string;
  referenceId?: string;
  description: string;
  lines: {
    accountCode: string;
    debitAmount: number;
    creditAmount: number;
    projectId?: string;
    departmentId?: string;
    note?: string;
  }[];
}

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getChartOfAccounts() {
    return this.prisma.account.findMany({
      orderBy: { accountCode: 'asc' },
    });
  }

  async createJournalEntry(userId: string, dto: CreateJournalEntryDto) {
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('Bút toán kế toán kép bắt buộc phải có ít nhất 2 dòng hạch toán.');
    }

    // Kiểm tra nguyên tắc kế toán kép: Tổng Nợ (Debit) phải bằng Tổng Có (Credit)
    const totalDebit = dto.lines.reduce((sum, l) => sum + (Number(l.debitAmount) || 0), 0);
    const totalCredit = dto.lines.reduce((sum, l) => sum + (Number(l.creditAmount) || 0), 0);

    // Làm tròn đến 2 chữ số thập phân để so sánh
    const diff = Math.abs(Math.round(totalDebit * 100) - Math.round(totalCredit * 100));
    if (diff > 0) {
      throw new BadRequestException(
        `Lệch bút toán kế toán kép: Tổng Nợ (${totalDebit.toLocaleString('vi-VN')} đ) không bằng Tổng Có (${totalCredit.toLocaleString('vi-VN')} đ). Chênh lệch: ${diff / 100} đ`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const entry = await tx.journalEntry.create({
        data: {
          entryNumber: dto.entryNumber,
          transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : new Date(),
          referenceType: dto.referenceType || 'MANUAL',
          referenceId: dto.referenceId,
          description: dto.description,
          createdById: userId,
          status: 'POSTED',
          lines: {
            create: dto.lines.map((l) => ({
              accountCode: l.accountCode,
              debitAmount: l.debitAmount,
              creditAmount: l.creditAmount,
              projectId: l.projectId,
              departmentId: l.departmentId,
              note: l.note,
            })),
          },
        },
        include: { lines: true },
      });

      return entry;
    });
  }

  async getRealtimePnL(startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    const lines = await this.prisma.journalLine.findMany({
      where: {
        entry: {
          transactionDate: { gte: start, lte: end },
          status: 'POSTED',
        },
      },
      include: {
        account: true,
        project: { select: { id: true, name: true, projectCode: true } },
      },
    });

    let totalRevenue = 0;
    let totalCOGS = 0; // Giá vốn hàng bán (Tài khoản 632)
    let totalOpEx = 0; // Chi phí quản lý & bán hàng (Tài khoản 641, 642)
    let otherExpenses = 0;

    const breakdownByAccount: Record<string, { code: string; name: string; amount: number; type: string }> = {};

    for (const l of lines) {
      const code = l.accountCode;
      const netAmount = Number(l.creditAmount) - Number(l.debitAmount); // Với doanh thu: Có tăng Nợ giảm

      if (code.startsWith('511')) {
        totalRevenue += netAmount;
      } else if (code.startsWith('632')) {
        const cost = Number(l.debitAmount) - Number(l.creditAmount);
        totalCOGS += cost;
      } else if (code.startsWith('641') || code.startsWith('642')) {
        const cost = Number(l.debitAmount) - Number(l.creditAmount);
        totalOpEx += cost;
      } else if (l.account.accountType === 'EXPENSE') {
        const cost = Number(l.debitAmount) - Number(l.creditAmount);
        otherExpenses += cost;
      }

      if (!breakdownByAccount[code]) {
        breakdownByAccount[code] = {
          code: l.account.accountCode,
          name: l.account.accountName,
          amount: 0,
          type: l.account.accountType,
        };
      }
      breakdownByAccount[code].amount += Number(l.debitAmount) + Number(l.creditAmount);
    }

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalOpEx - otherExpenses;
    const profitMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 10000) / 100 : 0;

    return {
      period: {
        from: start.toISOString().split('T')[0],
        to: end.toISOString().split('T')[0],
      },
      summary: {
        totalRevenue: Math.round(totalRevenue),
        totalCOGS: Math.round(totalCOGS),
        grossProfit: Math.round(grossProfit),
        totalOpEx: Math.round(totalOpEx),
        netProfit: Math.round(netProfit),
        profitMarginPercentage: profitMargin,
      },
      breakdown: Object.values(breakdownByAccount),
    };
  }

  async getCashflowSummary() {
    // Tài khoản tiền mặt 111 và tiền gửi ngân hàng 112
    const cashLines = await this.prisma.journalLine.findMany({
      where: {
        accountCode: { in: ['111', '112'] },
        entry: { status: 'POSTED' },
      },
    });

    let totalCashInBank = 0;
    let totalCashOnHand = 0;

    for (const l of cashLines) {
      const net = Number(l.debitAmount) - Number(l.creditAmount); // Tài sản: Nợ tăng Có giảm
      if (l.accountCode === '112') totalCashInBank += net;
      if (l.accountCode === '111') totalCashOnHand += net;
    }

    const totalLiquidCash = totalCashInBank + totalCashOnHand;

    // Giả định mức chi phí vận hành trung bình hàng tháng (Burn-rate)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentExpenseLines = await this.prisma.journalLine.findMany({
      where: {
        entry: { transactionDate: { gte: thirtyDaysAgo }, status: 'POSTED' },
        account: { accountType: 'EXPENSE' },
      },
    });

    let monthlyBurnRate = 0;
    for (const l of recentExpenseLines) {
      monthlyBurnRate += Number(l.debitAmount) - Number(l.creditAmount);
    }
    if (monthlyBurnRate <= 0) monthlyBurnRate = 100000000; // Default floor 100m VND

    const runwayMonths = Math.round((totalLiquidCash / monthlyBurnRate) * 10) / 10;

    return {
      totalLiquidCash: Math.round(totalLiquidCash),
      cashInBank: Math.round(totalCashInBank),
      cashOnHand: Math.round(totalCashOnHand),
      monthlyBurnRate: Math.round(monthlyBurnRate),
      runwayMonths,
      healthStatus: runwayMonths >= 6 ? 'HEALTHY' : runwayMonths >= 3 ? 'WARNING' : 'CRITICAL',
    };
  }
}

