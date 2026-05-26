import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { ActivityModule } from '../activity/activity.module';
import { NotificationModule } from '../notification/notification.module';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  imports: [DatabaseModule, NotificationModule, ActivityModule],
  controllers: [CommentController],
  providers: [CommentService],
})
export class CommentModule {}
