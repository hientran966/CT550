import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { DatabaseModule } from '../../database/database.module';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [DatabaseModule, AccountModule],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
