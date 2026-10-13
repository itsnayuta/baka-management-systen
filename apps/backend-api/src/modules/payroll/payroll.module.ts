import { Module } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { SelfPayrollController } from './self-payroll.controller';
import { ManagementPayrollController } from './management-payroll.controller';

@Module({
  controllers: [SelfPayrollController, ManagementPayrollController],
  providers: [PayrollService],
  exports: [PayrollService],
})
export class PayrollModule {}

