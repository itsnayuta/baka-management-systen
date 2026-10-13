import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ApprovalsService } from './approvals.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AudienceGuard } from '../../common/guards/audience.guard';
import { RequireAudience } from '../../common/decorators/audience.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Management Portal - Trạm Phê duyệt Tập trung (Approval Matrix)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AudienceGuard, RolesGuard)
@RequireAudience('management-portal')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER, Role.FINANCE_MANAGER, Role.PROJECT_MANAGER)
@Controller('management/approvals')
export class ManagementApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Get('pending')
  @ApiOperation({ summary: 'Lấy danh sách đề xuất đang chờ phê duyệt toàn công ty' })
  async getPendingRequests() {
    return this.approvalsService.getPendingRequests();
  }

  @Post(':id/decide')
  @ApiOperation({ summary: 'Quyết định phê duyệt hoặc từ chối đề xuất (Approve / Reject)' })
  async decideRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') requestId: string,
    @Body() body: { approved: boolean; comment?: string },
  ) {
    return this.approvalsService.decideRequest(requestId, user.userId, body.approved, body.comment);
  }
}

