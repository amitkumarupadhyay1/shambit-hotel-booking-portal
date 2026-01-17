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
import { User } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { AuthResponse } from './interfaces/auth-response.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

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
      await this.auditService.log({
        action: 'LOGIN_BLOCKED',
        resource: 'auth',
        resourceId: user.id,
        userId: user.id,
        details: { reason: `Account status: ${user.status}`, ipAddress, userAgent },
      });
      throw new UnauthorizedException('Account is not active');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Log successful login
    await this.auditService.log({
      action: 'LOGIN_SUCCESS',
      resource: 'auth',
      resourceId: user.id,
      userId: user.id,
      details: { ipAddress, userAgent },
    });

    return {
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: 'Login successful',
    };
  }

  async register(registerDto: RegisterDto, ipAddress: string, userAgent: string): Promise<AuthResponse> {
    try {
      const user = await this.usersService.create(registerDto);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Log registration
      await this.auditService.log({
        action: 'USER_REGISTERED',
        resource: 'user',
        resourceId: user.id,
        userId: user.id,
        details: { ipAddress, userAgent },
      });

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

      const accessToken = await this.generateAccessToken(user);
      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string, ipAddress: string, userAgent: string): Promise<void> {
    // Log logout
    await this.auditService.log({
      action: 'LOGOUT',
      resource: 'auth',
      resourceId: userId,
      userId,
      details: { ipAddress, userAgent },
    });
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
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

  private async generateAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return this.jwtService.signAsync(payload);
  }
}