import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { SelfAttendanceController } from './self-attendance.controller';
import { ManagementAttendanceController } from './management-attendance.controller';

@Module({
  controllers: [SelfAttendanceController, ManagementAttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}

