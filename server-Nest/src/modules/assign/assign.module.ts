import { Module } from '@nestjs/common';
import { AssignService } from './assign.service';
import { AssignController } from './assign.controller';
import { DatabaseModule } from '../../database/database.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [DatabaseModule, NotificationModule],
  controllers: [AssignController],
  providers: [AssignService],
  exports: [AssignService],
})
export class AssignModule {}
