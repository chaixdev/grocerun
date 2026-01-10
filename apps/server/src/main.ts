import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS with specific origin
  app.enableCors({
    origin: process.env.WEB_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  // Enable global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // Strip properties not in DTO
    forbidNonWhitelisted: true,   // Throw error if unknown properties
    transform: true,              // Auto-transform to DTO class instances
    transformOptions: {
      enableImplicitConversion: true, // Convert string "123" to number 123
    },
  }));
  
  // HTTP request logging
  const logger = new Logger('HTTP');
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    });
    next();
  });
  
  await app.listen(3001);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
