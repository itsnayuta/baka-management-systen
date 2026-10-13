import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AudienceGuard } from '../../common/guards/audience.guard';
import { RequireAudience } from '../../common/decorators/audience.decorator';

@ApiTags('Management Portal - Giám sát Chấm công')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AudienceGuard, RolesGuard)
@RequireAudience('management-portal')
@Roles(Role.SUPER_ADMIN, Role.DIRECTOR, Role.HR_MANAGER)
@Controller('management/attendance')
export class ManagementAttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Tổng quan tình hình chấm công toàn công ty hôm nay (Real-time)' })
  async getOverview() {
    return this.attendanceService.getCompanyOverview();
  }
}

