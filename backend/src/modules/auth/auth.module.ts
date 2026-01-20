import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { HotelRbacController } from './controllers/hotel-rbac.controller';
import { GdprComplianceController } from './controllers/gdpr-compliance.controller';
import { UsersModule } from '../users/users.module';
import { AuditModule } from '../audit/audit.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { HotelRbacService } from './services/hotel-rbac.service';
import { OnboardingAuditService } from './services/onboarding-audit.service';
import { EncryptionService } from './services/encryption.service';
import { GdprComplianceService } from './services/gdpr-compliance.service';
import { HotelUserRole } from './entities/hotel-user-role.entity';
import { OnboardingAuditLog } from './entities/onboarding-audit-log.entity';
import { HotelPermissionGuard } from './guards/hotel-permission.guard';
import { EncryptionInterceptor } from './interceptors/encryption.interceptor';

@Module({
  imports: [
    UsersModule,
    // AuditModule, // Temporarily remove to avoid circular dependencies
    PassportModule,
    TypeOrmModule.forFeature([
      HotelUserRole,
      OnboardingAuditLog,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    AuthService, 
    JwtStrategy, 
    LocalStrategy,
    HotelRbacService,
    OnboardingAuditService,
    EncryptionService,
    // GdprComplianceService, // Temporarily remove to avoid circular dependencies
    HotelPermissionGuard,
    EncryptionInterceptor,
  ],
  controllers: [AuthController, HotelRbacController], // Remove GdprComplianceController temporarily
  exports: [
    AuthService, 
    HotelRbacService, 
    OnboardingAuditService,
    EncryptionService,
    // GdprComplianceService, // Temporarily remove
    HotelPermissionGuard,
    EncryptionInterceptor,
  ],
})
export class AuthModule {}