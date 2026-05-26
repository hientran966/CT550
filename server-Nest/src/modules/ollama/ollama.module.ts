import { Module } from '@nestjs/common';
import { ProjectModule } from '../project/project.module';
import { TaskModule } from '../task/task.module';
import { OllamaController } from './ollama.controller';
import { OllamaService } from './ollama.service';

@Module({
  imports: [ProjectModule, TaskModule],
  controllers: [OllamaController],
  providers: [OllamaService],
})
export class OllamaModule {}
