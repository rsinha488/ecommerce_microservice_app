import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

    // ✅ Swagger Config
    const config = new DocumentBuilder()
        .setTitle('User Service')
        .setDescription('User microservice API documentation')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document); // http://localhost:4001/api/docs

    await app.listen(process.env.PORT || 4001);
    console.log(`✅ User service running on port ${process.env.PORT || 4001}`);
}
bootstrap();
