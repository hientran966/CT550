import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { SocketService } from './socket.service';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [SocketService],
  exports: [SocketService],
})
export class SocketModule {}
