import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Employee Portal - Chấm công (Self-Service)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('self/attendance')
export class SelfAttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Nhân viên Check-in 1-chạm (GPS/App)' })
  async checkIn(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { lat?: number; lng?: number; verificationMethod?: string },
  ) {
    return this.attendanceService.checkIn(user.employeeId!, body);
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Nhân viên Check-out kết thúc ngày làm việc' })
  async checkOut(@CurrentUser() user: AuthenticatedUser) {
    return this.attendanceService.checkOut(user.employeeId!);
  }

  @Get('my-logs')
  @ApiOperation({ summary: 'Xem lịch sử chấm công 30 ngày gần nhất của chính mình' })
  async getMyLogs(@CurrentUser() user: AuthenticatedUser) {
    return this.attendanceService.getMyLogs(user.employeeId!);
  }
}

