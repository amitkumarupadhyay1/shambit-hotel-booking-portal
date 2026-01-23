import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { User, UserRole } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthResponse } from './interfaces/auth-response.interface';
import { SessionService } from './session.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
    private sessionService: SessionService,
  ) { }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && await this.usersService.validatePassword(user, password)) {
      return user;
    }
    return null;
  }

  async login(loginDto: LoginDto, ipAddress: string, userAgent: string): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      // Log failed login attempt
      await this.auditService.log({
        action: 'LOGIN_FAILED',
        resource: 'auth',
        resourceId: loginDto.email,
        details: { reason: 'Invalid credentials', ipAddress, userAgent },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== 'ACTIVE') {
      // Log blocked login attempt
      await this.auditService.log({
        action: 'LOGIN_BLOCKED',
        resource: 'auth',
        resourceId: user.id,
        userId: user.id,
        details: { reason: `Account status: ${user.status}`, ipAddress, userAgent },
      });
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}`);
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Log successful login
    await this.auditService.log({
      action: 'LOGIN_SUCCESS',
      resource: 'auth',
      resourceId: user.id,
      userId: user.id,
      details: { ipAddress, userAgent },
    });

    // Create session
    const session = await this.sessionService.createSession(user.id, {
      ipAddress,
      userAgent,
      deviceFingerprint: 'unknown', // TODO: Extract from request/DTO
    });

    // Generate tokens
    const tokens = await this.generateTokens(user, session.id);

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: 'Login successful',
    };
  }

  async register(registerDto: RegisterDto, ipAddress: string, userAgent: string): Promise<AuthResponse> {
    try {
      // Determine roles based on registration type
      let roles = [UserRole.BUYER]; // Default for customers

      if (registerDto.role === UserRole.SELLER) {
        roles = [UserRole.SELLER];
      } else if (registerDto.role === UserRole.ADMIN) {
        roles = [UserRole.ADMIN];
      }

      // Create user
      const user = await this.usersService.create({
        ...registerDto,
        roles,
      });

      // Log successful registration
      await this.auditService.log({
        action: 'USER_REGISTERED',
        resource: 'user',
        resourceId: user.id,
        userId: user.id,
        details: { ipAddress, userAgent, roles: user.roles },
      });

      // Create session
      const session = await this.sessionService.createSession(user.id, {
        ipAddress,
        userAgent,
        deviceFingerprint: 'unknown',
      });

      // Generate tokens
      const tokens = await this.generateTokens(user, session.id);

      return {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        message: 'Registration successful',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Registration failed');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Validate session if present in payload
      if (payload.sessionId) {
        const session = await this.sessionService.validateSession(payload.sessionId);
        if (!session) {
          throw new UnauthorizedException('Session invalid or expired');
        }
      }

      const accessToken = await this.generateAccessToken(user, payload.sessionId);
      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, sessionId: string | undefined, ipAddress: string, userAgent: string): Promise<void> {
    // Log logout event
    await this.auditService.log({
      action: 'LOGOUT',
      resource: 'auth',
      resourceId: userId,
      userId,
      details: { ipAddress, userAgent, sessionId },
    });

    // Invalidate session if provided
    if (sessionId) {
      await this.sessionService.invalidateSession(sessionId);
    }
  }

  async logoutGlobal(userId: string, ipAddress: string, userAgent: string): Promise<void> {
    // Log global logout event
    await this.auditService.log({
      action: 'LOGOUT_GLOBAL',
      resource: 'auth',
      resourceId: userId,
      userId,
      details: { ipAddress, userAgent },
    });

    await this.sessionService.invalidateAllUserSessions(userId);
  }

  private async generateTokens(user: User, sessionId?: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      sessionId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async generateAccessToken(user: User, sessionId?: string): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      sessionId,
    };

    return this.jwtService.signAsync(payload);
  }
}