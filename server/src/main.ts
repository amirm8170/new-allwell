import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.enableCors();
  app.use(cookieParser());
  app.setViewEngine('ejs');
  app.useStaticAssets(join(__dirname, '..', 'templates'));
  app.setViewEngine(join(__dirname, '..', 'templates'));
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(2000);
}
bootstrap();
