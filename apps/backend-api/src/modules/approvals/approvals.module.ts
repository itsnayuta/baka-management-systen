import { Module } from '@nestjs/common';
import { ApprovalsService } from './approvals.service';
import { SelfApprovalsController } from './self-approvals.controller';
import { ManagementApprovalsController } from './management-approvals.controller';

@Module({
  controllers: [SelfApprovalsController, ManagementApprovalsController],
  providers: [ApprovalsService],
  exports: [ApprovalsService],
})
export class ApprovalsModule {}

