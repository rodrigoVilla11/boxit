import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Cabeceras de seguridad. Es una API JSON: el CSP lo maneja el front y
  // habilitamos CORP cross-origin para que el front (otro origen) la consuma.
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Detrás de un proxy (nginx) para que el rate-limit vea la IP real del cliente
  app.set('trust proxy', 1);

  // Cookies httpOnly (usadas a full en Fase 2 para JWT)
  app.use(cookieParser());

  // Todas las rutas bajo /api
  app.setGlobalPrefix('api');

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS con credentials para que el front pueda mandar cookies
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  app.enableCors({ origin: corsOrigin, credentials: true });

  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 3001;
  await app.listen(port);

  Logger.log(`BOX iT API escuchando en http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
