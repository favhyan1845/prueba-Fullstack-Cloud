import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './infrastructure/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const port = Number(process.env.PORT ?? 3000);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Code Insight AI API')
    .setDescription('Reverse engineering of source repositories')
    .setVersion('0.1.0')
    .build();
  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, doc);

  await app.listen(port, '0.0.0.0');
  Logger.log(`🚀 Code Insight AI running on http://localhost:${port}/api/v1/analysis`, 'Bootstrap');
  Logger.log(`📘 Swagger UI: http://localhost:${port}/api/docs`, 'Bootstrap');
}
bootstrap();