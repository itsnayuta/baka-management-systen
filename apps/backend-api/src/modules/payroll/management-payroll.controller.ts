import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AudienceGuard } from '../../common/guards/audience.guard';
import { RequireAudience } from '../../common/decorators/audience.decorator';

@ApiTags('Management Portal - Quản lý Bảng Lương (Payroll Engine)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AudienceGuard, RolesGuard)
@RequireAudience('management-portal')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
@Controller('management/payroll')
export class ManagementPayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Post('run')
  @ApiOperation({
    summary: 'Chạy động cơ tính lương tự động hàng tháng (Tính OT, BHXH, Thuế TNCN lũy tiến)',
  })
  async runPayroll(@Body('periodMonth') periodMonth: string) {
    return this.payrollService.runMonthlyPayroll(periodMonth);
  }

  @Get('summary/:periodMonth')
  @ApiOperation({ summary: 'Xem bảng tổng hợp lương toàn công ty theo tháng' })
  async getSummary(@Param('periodMonth') periodMonth: string) {
    return this.payrollService.getPayrollSummary(periodMonth);
  }
}

