import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { FinanceService, CreateJournalEntryDto } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AudienceGuard } from '../../common/guards/audience.guard';
import { RequireAudience } from '../../common/decorators/audience.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Management Portal - Tài chính & Kế toán Quản trị')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AudienceGuard, RolesGuard)
@RequireAudience('management-portal')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.FINANCE_MANAGER)
@Controller('management/finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'Lấy Hệ thống Tài khoản Kế toán (Chart of Accounts)' })
  async getAccounts() {
    return this.financeService.getChartOfAccounts();
  }

  @Post('journal-entries')
  @ApiOperation({ summary: 'Tạo Bút toán Sổ cái Kế toán Kép (Kiểm soát chặt chẽ Tổng Nợ = Tổng Có)' })
  async createJournalEntry(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateJournalEntryDto,
  ) {
    return this.financeService.createJournalEntry(user.userId, dto);
  }

  @Get('pnl-report')
  @ApiOperation({ summary: 'Báo cáo Kết quả Kinh doanh Lãi/Lỗ (P&L) Thời gian thực' })
  async getPnLReport(@Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.financeService.getRealtimePnL(startDate, endDate);
  }

  @Get('cashflow')
  @ApiOperation({ summary: 'Báo cáo Dòng tiền Khả dụng, Tốc độ Đốt tiền (Burn Rate) và Runway' })
  async getCashflow() {
    return this.financeService.getCashflowSummary();
  }
}

