import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  const port = parseInt(process.env.PORT ?? '8080', 10);
  await app.listen(port);
  console.log(JSON.stringify({ event: 'startup', port, node_env: process.env.NODE_ENV, message: 'Payments API listening' }));
}
bootstrap();
