import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SocketService } from './socket/socket.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  // ===== CORS =====
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // ===== STATIC FILE (Nest uploads fallback) =====
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  // ===== GLOBAL PREFIX (/api) =====
  app.setGlobalPrefix('api');

  const socketService = app.get(SocketService);
  socketService.init(app.getHttpServer());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
