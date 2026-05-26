import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { FileModule } from '../file/file.module';
import { NotificationModule } from '../notification/notification.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [DatabaseModule, NotificationModule, FileModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
