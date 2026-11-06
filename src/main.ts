import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  app.setGlobalPrefix('api')

  //  HABILITAR CORS
  app.enableCors({
    origin: [
      'http://localhost:3000', // Puerto habitual de Next.js
      'http://localhost:4321', // Por si tienes otro puerto local
      'http://127.0.0.1:3000',
      'http://127.0.0.1:4321'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Permite cookies y headers de autorización (Bearer Token)
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

   //para utilizar los pipes a nivel de aplicacion
  app.useGlobalPipes(
  
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,  //evita recibir porpiedades no validas
      transform:true,//transformar los valores en los dtos
      transformOptions:{
        enableImplicitConversion:true,
      }
    }),
  )


  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
