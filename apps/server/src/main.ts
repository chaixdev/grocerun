import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, RequestMethod } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { bootstrapAuth } from './auth/oidc-server';
import { env } from './config';

const logger = new Logger('Bootstrap');

async function bootstrap() {
    // Bootstrap OIDC auth — fetches provider metadata and JWKS endpoint.
    // Defaults to Google for backward compat; set OIDC_ISSUER_URI for any other IdP.
    const oidcIssuer = env.OIDC_ISSUER_URI;
    const oidcAudience = env.OIDC_AUDIENCE;

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
        origin: env.WEB_URL,
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

    const port = env.PORT;
    await app.listen(port);
    logger.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
