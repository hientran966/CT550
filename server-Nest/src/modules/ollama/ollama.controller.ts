import { Body, Controller, Post } from '@nestjs/common';
import { OllamaService } from './ollama.service';

@Controller('ai')
export class OllamaController {
  constructor(private readonly service: OllamaService) {}

  @Post()
  taskCreate(@Body() body: any) {
    return this.service.taskCreate(body);
  }
}
