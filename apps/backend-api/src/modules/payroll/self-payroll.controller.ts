import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Employee Portal - Lương & Đãi ngộ (Self-Service)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('self/payroll')
export class SelfPayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('payslips')
  @ApiOperation({ summary: 'Xem danh sách Phiếu Lương (Payslip) cá nhân của chính mình' })
  async getMyPayslips(@CurrentUser() user: AuthenticatedUser) {
    return this.payrollService.getMyPayslips(user.employeeId!);
  }
}

