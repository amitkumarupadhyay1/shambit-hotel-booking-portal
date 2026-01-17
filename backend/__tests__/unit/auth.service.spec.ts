import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from '../../src/modules/auth/auth.service';
import { UsersService } from '../../src/modules/users/users.service';
import { AuditService } from '../../src/modules/audit/audit.service';
import { User, UserRole, UserStatus } from '../../src/modules/users/entities/user.entity';
import { LoginDto } from '../../src/modules/auth/dto/login.dto';
import { RegisterDto } from '../../src/modules/auth/dto/register.dto';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let configService: ConfigService;
  let auditService: AuditService;

  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    phone: '+1234567890',
    roles: [UserRole.BUYER],
    isEmailVerified: false,
    status: UserStatus.ACTIVE,
    emailVerificationToken: null,
    emailVerificationExpires: null,
    passwordResetToken: null,
    passwordResetExpires: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: function() {
      const { password, emailVerificationToken, passwordResetToken, ...result } = this;
      return result;
    }
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    validatePassword: jest.fn(),
    updateLastLogin: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
    auditService = module.get<AuditService>(AuditService);

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user for valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'Test123!@#');

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUsersService.validatePassword).toHaveBeenCalledWith(mockUser, 'Test123!@#');
      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Test123!@#',
    };

    const ipAddress = '127.0.0.1';
    const userAgent = 'Test Agent';

    it('should login successfully with valid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockUsersService.updateLastLogin.mockResolvedValue(undefined);
      mockJwtService.signAsync.mockResolvedValueOnce('access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token');
      mockConfigService.get.mockReturnValue('7d');
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.login(loginDto, ipAddress, userAgent);

      expect(mockUsersService.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(mockAuditService.log).toHaveBeenCalledWith({
        action: 'LOGIN_SUCCESS',
        resource: 'auth',
        resourceId: mockUser.id,
        userId: mockUser.id,
        details: { ipAddress, userAgent },
      });
      expect(result).toEqual({
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        message: 'Login successful',
      });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockAuditService.log.mockResolvedValue(undefined);

      await expect(service.login(loginDto, ipAddress, userAgent)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockAuditService.log).toHaveBeenCalledWith({
        action: 'LOGIN_FAILED',
        resource: 'auth',
        resourceId: loginDto.email,
        details: { reason: 'Invalid credentials', ipAddress, userAgent },
      });
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = { ...mockUser, status: UserStatus.SUSPENDED };
      mockUsersService.findByEmail.mockResolvedValue(inactiveUser);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockAuditService.log.mockResolvedValue(undefined);

      await expect(service.login(loginDto, ipAddress, userAgent)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockAuditService.log).toHaveBeenCalledWith({
        action: 'LOGIN_BLOCKED',
        resource: 'auth',
        resourceId: inactiveUser.id,
        userId: inactiveUser.id,
        details: { reason: 'Account status: SUSPENDED', ipAddress, userAgent },
      });
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'Test123!@#',
      phone: '+1234567890',
    };

    const ipAddress = '127.0.0.1';
    const userAgent = 'Test Agent';

    it('should register successfully', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValueOnce('access-token');
      mockJwtService.signAsync.mockResolvedValueOnce('refresh-token');
      mockConfigService.get.mockReturnValue('7d');
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.register(registerDto, ipAddress, userAgent);

      expect(mockUsersService.create).toHaveBeenCalledWith(registerDto);
      expect(mockAuditService.log).toHaveBeenCalledWith({
        action: 'USER_REGISTERED',
        resource: 'user',
        resourceId: mockUser.id,
        userId: mockUser.id,
        details: { ipAddress, userAgent },
      });
      expect(result).toEqual({
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        message: 'Registration successful',
      });
    });

    it('should throw ConflictException if user creation fails', async () => {
      mockUsersService.create.mockRejectedValue(new ConflictException('User already exists'));

      await expect(service.register(registerDto, ipAddress, userAgent)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: mockUser.id, email: mockUser.email, roles: mockUser.roles };
      
      mockJwtService.verify.mockReturnValue(payload);
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue('new-access-token');
      mockConfigService.get.mockReturnValue('refresh-secret');

      const result = await service.refreshToken(refreshToken);

      expect(mockJwtService.verify).toHaveBeenCalledWith(refreshToken, {
        secret: 'refresh-secret',
      });
      expect(mockUsersService.findOne).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual({ accessToken: 'new-access-token' });
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const refreshToken = 'invalid-refresh-token';
      
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const refreshToken = 'valid-refresh-token';
      const payload = { sub: mockUser.id, email: mockUser.email, roles: mockUser.roles };
      const inactiveUser = { ...mockUser, status: UserStatus.BANNED };
      
      mockJwtService.verify.mockReturnValue(payload);
      mockUsersService.findOne.mockResolvedValue(inactiveUser);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should log logout event', async () => {
      const userId = mockUser.id;
      const ipAddress = '127.0.0.1';
      const userAgent = 'Test Agent';

      mockAuditService.log.mockResolvedValue(undefined);

      await service.logout(userId, ipAddress, userAgent);

      expect(mockAuditService.log).toHaveBeenCalledWith({
        action: 'LOGOUT',
        resource: 'auth',
        resourceId: userId,
        userId,
        details: { ipAddress, userAgent },
      });
    });
  });
});