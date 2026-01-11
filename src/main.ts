import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as swaggerUi from 'swagger-ui-express';
import { getLandingPage } from './modules/Landing-page/landing-page.template';
import { swaggerUiOptions } from './config/swagger.config';
const cookieParser = require('cookie-parser');

// Load environment variables first
config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove unknown properties
      forbidNonWhitelisted: true, // if true → throw error instead of stripping
      transform: true, // auto-transform payloads to DTO class
    }),
  );
  app.use(cookieParser());

  // Enable CORS for all origins (reflects requesting origin) and allow credentials (cookies)
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');
  // Get Express instance
  const expressApp = app.getHttpAdapter().getInstance();

  // Landing page
  expressApp.get('/', (req, res) => {
    res.send(getLandingPage());
  });
  // Swagger UI
  try {
    const swaggerFilePath = join(process.cwd(), 'openapi', 'openapi.json');
    const swaggerDocument = JSON.parse(readFileSync(swaggerFilePath, 'utf8'));

    expressApp.use(
      '/docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerDocument, swaggerUiOptions),
    );
  } catch (error) {
    console.warn('Swagger documentation not available:', error.message);
  }

  const port = 4001;
  await app.listen(port);
}
bootstrap();
