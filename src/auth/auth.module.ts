import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],

  imports: [
    ConfigModule,

    TypeOrmModule.forFeature([User]),

    //configuracion jwt
    PassportModule.register({ defaultStrategy: 'jwt' }),

    //cofiguracion para el jwt
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        // console.log('JWT SEcret', configService.get('JWT_SECRET'))
        // console.log("JWT", process.env.JWT_SECRET)

        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: '8h',
          },
        };
      },
    }), 
  ],

 //par poder usarlos en otros modulos
  exports:[TypeOrmModule, JwtStrategy, PassportModule, JwtModule]
})
export class AuthModule {}
