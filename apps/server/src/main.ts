import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, RequestMethod } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { bootstrapAuth } from './auth/oidc-server';

const logger = new Logger('Bootstrap');

async function bootstrap() {
    // Bootstrap OIDC auth — fetches provider metadata and JWKS endpoint
    const oidcIssuer = process.env.OIDC_ISSUER_URI || 'https://accounts.google.com';
    const oidcAudience = process.env.OIDC_AUDIENCE;

    if (!oidcAudience) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('OIDC_AUDIENCE environment variable is required in production');
        }
        logger.warn('OIDC_AUDIENCE not set — audience validation is disabled. Set to your Google client ID.');
    }

    await bootstrapAuth({
        implementation: 'real',
        issuerUri: oidcIssuer,
        expectedAudience: oidcAudience,
    });

    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('api/v1', {
        exclude: [{ path: 'health', method: RequestMethod.GET }],
    });

    // Enable CORS with specific origin
    app.enableCors({
        origin: process.env.WEB_URL || 'http://localhost:3000',
        credentials: true,
    });

    // Enable global validation
    app.useGlobalPipes(new ZodValidationPipe());

    // HTTP request logging
    const httpLogger = new Logger('HTTP');
    app.use((req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            httpLogger.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
        });
        next();
    });

    const port = Number(process.env.PORT ?? 3001);
    await app.listen(port);
    logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
