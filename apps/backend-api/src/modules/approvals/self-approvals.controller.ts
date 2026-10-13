import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApprovalsService, CreateApprovalRequestDto } from './approvals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Employee Portal - Đề xuất & Đơn từ (Self-Service)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('self/approvals')
export class SelfApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post('requests')
  @ApiOperation({
    summary: 'Tạo đơn đề xuất (Nghỉ phép, Tạm ứng, Chi phí, Tăng ca) - Tự động định tuyến cấp duyệt theo số tiền',
  })
  async createRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateApprovalRequestDto,
  ) {
    return this.approvalsService.createRequest(user.employeeId!, dto);
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Xem danh sách đề xuất cá nhân và tiến trình phê duyệt' })
  async getMyRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.approvalsService.getMyRequests(user.employeeId!);
  }
}

