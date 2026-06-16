import { Module } from '@nestjs/common';
import { BadgesModule } from '../../badges/badges.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './token.service';

@Module({
  imports: [
    BadgesModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret-change-me',
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, TokenService],
  exports: [TokenService, JwtModule],
})
export class AuthModule {}
