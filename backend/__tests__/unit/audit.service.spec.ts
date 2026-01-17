import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditService } from '../../src/modules/audit/audit.service';
import { AuditLog } from '../../src/modules/audit/entities/audit-log.entity';
import { CreateAuditLogDto } from '../../src/modules/audit/dto/create-audit-log.dto';

describe('AuditService', () => {
  let service: AuditService;
  let repository: Repository<AuditLog>;

  const mockAuditLog: AuditLog = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    action: 'LOGIN_SUCCESS',
    resource: 'auth',
    resourceId: 'user-123',
    userId: 'user-123',
    details: { ipAddress: '127.0.0.1', userAgent: 'Test Agent' },
    createdAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));

    // Reset mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create and save an audit log', async () => {
      const createAuditLogDto: CreateAuditLogDto = {
        action: 'LOGIN_SUCCESS',
        resource: 'auth',
        resourceId: 'user-123',
        userId: 'user-123',
        details: { ipAddress: '127.0.0.1', userAgent: 'Test Agent' },
      };

      mockRepository.create.mockReturnValue(mockAuditLog);
      mockRepository.save.mockResolvedValue(mockAuditLog);

      const result = await service.log(createAuditLogDto);

      expect(mockRepository.create).toHaveBeenCalledWith(createAuditLogDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockAuditLog);
      expect(result).toEqual(mockAuditLog);
    });
  });

  describe('findByUser', () => {
    it('should find audit logs by user ID', async () => {
      const userId = 'user-123';
      const mockLogs = [mockAuditLog];

      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findByUser(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(mockLogs);
    });

    it('should find audit logs by user ID with custom limit', async () => {
      const userId = 'user-123';
      const limit = 10;
      const mockLogs = [mockAuditLog];

      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findByUser(userId, limit);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('findByResource', () => {
    it('should find audit logs by resource', async () => {
      const resource = 'auth';
      const mockLogs = [mockAuditLog];

      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findByResource(resource);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { resource },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(mockLogs);
    });

    it('should find audit logs by resource and resourceId', async () => {
      const resource = 'auth';
      const resourceId = 'user-123';
      const mockLogs = [mockAuditLog];

      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findByResource(resource, resourceId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { resource, resourceId },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('findByAction', () => {
    it('should find audit logs by action', async () => {
      const action = 'LOGIN_SUCCESS';
      const mockLogs = [mockAuditLog];

      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findByAction(action);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { action },
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(mockLogs);
    });
  });
});