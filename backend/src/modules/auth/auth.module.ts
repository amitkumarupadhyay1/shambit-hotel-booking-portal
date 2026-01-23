import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { HotelRbacController } from './controllers/hotel-rbac.controller';
import { GdprComplianceController } from './controllers/gdpr-compliance.controller';
import { UsersModule } from '../users/users.module';
import { AuditService } from '../audit/audit.service';
import { AuditLog } from '../audit/entities/audit-log.entity';
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
import { SessionService } from './session.service';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    CacheModule.register(),
    TypeOrmModule.forFeature([
      HotelUserRole,
      OnboardingAuditLog,
      AuditLog,
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
    AuditService, // Add AuditService
    // GdprComplianceService, // Temporarily remove to avoid circular dependencies
    HotelPermissionGuard,
    EncryptionInterceptor,
    SessionService, // Added SessionService
  ],
  controllers: [AuthController, HotelRbacController], // Remove GdprComplianceController temporarily
  exports: [
    AuthService,
    HotelRbacService,
    OnboardingAuditService,
    EncryptionService,
    AuditService, // Export AuditService
    // GdprComplianceService, // Temporarily remove
    HotelPermissionGuard,
    EncryptionInterceptor,
    SessionService, // Added SessionService
  ],
})
export class AuthModule { }