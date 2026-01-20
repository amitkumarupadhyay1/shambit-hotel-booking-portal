import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import * as fc from 'fast-check';
import { OnboardingAuditService } from '../../src/modules/auth/services/onboarding-audit.service';
import { OnboardingAuditLog, OnboardingAuditAction } from '../../src/modules/auth/entities/onboarding-audit-log.entity';

describe('Onboarding Audit Service - Security and Compliance Tests', () => {
  let service: OnboardingAuditService;
  let auditLogRepository: Repository<OnboardingAuditLog>;

  // Test data generators
  const userIdArb = fc.uuid();
  const hotelIdArb = fc.uuid();
  const sessionIdArb = fc.uuid();
  const stepIdArb = fc.constantFrom('amenities', 'images', 'property-info', 'rooms', 'business-features');
  const auditActionArb = fc.constantFrom(...Object.values(OnboardingAuditAction));
  const ipAddressArb = fc.ipV4();
  const userAgentArb = fc.string({ minLength: 10, maxLength: 200 });

  const auditMetadataArb = fc.record({
    ipAddress: fc.option(ipAddressArb, { nil: undefined }),
    userAgent: fc.option(userAgentArb, { nil: undefined }),
    requestId: fc.option(fc.uuid(), { nil: undefined }),
    duration: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: undefined }),
    errorMessage: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: undefined }),
  });

  const auditLogDataArb = fc.record({
    previousData: fc.option(fc.object(), { nil: null }),
    newData: fc.option(fc.object(), { nil: null }),
    description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
  });

  const validAuditLogArb = fc.record({
    id: fc.uuid(),
    action: auditActionArb,
    userId: userIdArb,
    hotelId: hotelIdArb,
    sessionId: fc.option(sessionIdArb, { nil: null }),
    stepId: fc.option(stepIdArb, { nil: null }),
    previousData: fc.option(fc.object(), { nil: null }),
    newData: fc.option(fc.object(), { nil: null }),
    metadata: auditMetadataArb,
    description: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  }).map(data => {
    const log = new OnboardingAuditLog();
    Object.assign(log, data);
    
    // Mock methods
    log.getActionDescription = jest.fn().mockReturnValue(`Action: ${data.action}`);
    log.isSecurityEvent = jest.fn().mockReturnValue([
      OnboardingAuditAction.ROLE_ASSIGNED,
      OnboardingAuditAction.ROLE_REMOVED,
      OnboardingAuditAction.PERMISSION_DENIED,
      OnboardingAuditAction.DATA_EXPORTED,
    ].includes(data.action));
    log.getDataChangeSummary = jest.fn().mockReturnValue('Data changed');
    
    return log;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingAuditService,
        {
          provide: getRepositoryToken(OnboardingAuditLog),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OnboardingAuditService>(OnboardingAuditService);
    auditLogRepository = module.get<Repository<OnboardingAuditLog>>(getRepositoryToken(OnboardingAuditLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 22: Security and Compliance - Audit Logging', () => {
    /**
     * Feature: enhanced-hotel-onboarding, Property 22: Security and Compliance
     * 
     * For any stored data, the system should maintain comprehensive audit logs for 
     * all changes with user identification and timestamps.
     * 
     * Validates: Requirements 10.4 - Comprehensive audit logging
     */
    it('**Feature: enhanced-hotel-onboarding, Property 22: Security and Compliance - Audit Logging**', () => {
      fc.assert(
        fc.asyncProperty(
          auditActionArb,
          userIdArb,
          hotelIdArb,
          fc.option(sessionIdArb, { nil: undefined }),
          fc.option(stepIdArb, { nil: undefined }),
          auditLogDataArb,
          auditMetadataArb,
          async (action, userId, hotelId, sessionId, stepId, logData, metadata) => {
            // Setup: Mock successful save
            const savedLog = new OnboardingAuditLog();
            savedLog.id = fc.sample(fc.uuid(), 1)[0];
            savedLog.action = action;
            savedLog.userId = userId;
            savedLog.hotelId = hotelId;
            savedLog.sessionId = sessionId || null;
            savedLog.stepId = stepId || null;
            savedLog.previousData = logData.previousData;
            savedLog.newData = logData.newData;
            savedLog.metadata = metadata;
            savedLog.description = logData.description;
            savedLog.createdAt = new Date();

            // Mock security event detection
            savedLog.isSecurityEvent = jest.fn().mockReturnValue([
              OnboardingAuditAction.ROLE_ASSIGNED,
              OnboardingAuditAction.ROLE_REMOVED,
              OnboardingAuditAction.PERMISSION_DENIED,
              OnboardingAuditAction.DATA_EXPORTED,
            ].includes(action));

            jest.spyOn(auditLogRepository, 'save').mockResolvedValue(savedLog);

            // Test audit logging
            const result = await service.logAuditEvent({
              action,
              userId,
              hotelId,
              sessionId,
              stepId,
              previousData: logData.previousData,
              newData: logData.newData,
              metadata,
              description: logData.description,
            });

            // Verify: Audit log is properly created with all required fields
            expect(result.action).toBe(action);
            expect(result.userId).toBe(userId);
            expect(result.hotelId).toBe(hotelId);
            expect(result.sessionId).toBe(sessionId || null);
            expect(result.stepId).toBe(stepId || null);
            expect(result.metadata).toEqual(metadata);
            expect(result.createdAt).toBeInstanceOf(Date);

            // Verify: Repository save was called with correct data
            expect(auditLogRepository.save).toHaveBeenCalledWith(
              expect.objectContaining({
                action,
                userId,
                hotelId,
                sessionId: sessionId || null,
                stepId: stepId || null,
                previousData: logData.previousData || null,
                newData: logData.newData || null,
                metadata: metadata || {},
                description: logData.description || null,
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should properly identify and handle security events', () => {
      fc.assert(
        fc.asyncProperty(
          auditActionArb,
          userIdArb,
          hotelIdArb,
          auditMetadataArb,
          async (action, userId, hotelId, metadata) => {
            // Setup: Mock audit log
            const savedLog = new OnboardingAuditLog();
            savedLog.action = action;
            savedLog.userId = userId;
            savedLog.hotelId = hotelId;
            savedLog.metadata = metadata;
            savedLog.createdAt = new Date();

            // Determine if this is a security event
            const securityActions = [
              OnboardingAuditAction.ROLE_ASSIGNED,
              OnboardingAuditAction.ROLE_REMOVED,
              OnboardingAuditAction.PERMISSION_DENIED,
              OnboardingAuditAction.DATA_EXPORTED,
            ];
            const isSecurityEvent = securityActions.includes(action);
            savedLog.isSecurityEvent = jest.fn().mockReturnValue(isSecurityEvent);

            jest.spyOn(auditLogRepository, 'save').mockResolvedValue(savedLog);

            // Test audit logging
            const result = await service.logAuditEvent({
              action,
              userId,
              hotelId,
              metadata,
            });

            // Verify: Security events are properly identified
            expect(result.isSecurityEvent()).toBe(isSecurityEvent);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain audit log integrity and completeness', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(validAuditLogArb, { minLength: 1, maxLength: 50 }),
          hotelIdArb,
          fc.integer({ min: 1, max: 365 }),
          async (auditLogs, hotelId, days) => {
            // Setup: Filter logs for the specified hotel and date range
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const relevantLogs = auditLogs.filter(log => 
              log.hotelId === hotelId && 
              log.createdAt >= startDate
            );

            jest.spyOn(auditLogRepository, 'find').mockResolvedValue(relevantLogs);

            // Test audit summary generation
            const summary = await service.getAuditSummary(hotelId, days);

            // Verify: Audit summary maintains data integrity
            expect(summary.totalLogs).toBe(relevantLogs.length);
            expect(summary.securityEvents).toBe(
              relevantLogs.filter(log => log.isSecurityEvent()).length
            );
            expect(summary.recentActivity.length).toBeLessThanOrEqual(10);
            expect(summary.topActions.length).toBeLessThanOrEqual(5);
            expect(summary.topUsers.length).toBeLessThanOrEqual(5);

            // Verify: Repository was called with correct parameters
            expect(auditLogRepository.find).toHaveBeenCalledWith({
              where: {
                hotelId,
                createdAt: Between(startDate, expect.any(Date)),
              },
              relations: ['user'],
              order: { createdAt: 'DESC' },
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should properly filter and paginate audit logs', () => {
      fc.assert(
        fc.asyncProperty(
          fc.array(validAuditLogArb, { minLength: 10, maxLength: 100 }),
          hotelIdArb,
          fc.integer({ min: 1, max: 50 }),
          fc.integer({ min: 0, max: 50 }),
          async (allLogs, hotelId, limit, offset) => {
            // Setup: Mock repository response
            const filteredLogs = allLogs.filter(log => log.hotelId === hotelId);
            const paginatedLogs = filteredLogs.slice(offset, offset + limit);
            
            jest.spyOn(auditLogRepository, 'findAndCount').mockResolvedValue([
              paginatedLogs,
              filteredLogs.length,
            ]);

            // Test audit log retrieval with pagination
            const result = await service.getAuditLogs({
              hotelId,
              limit,
              offset,
            });

            // Verify: Pagination and filtering work correctly
            expect(result.logs.length).toBeLessThanOrEqual(limit);
            expect(result.total).toBe(filteredLogs.length);

            // Verify: Repository was called with correct parameters
            expect(auditLogRepository.findAndCount).toHaveBeenCalledWith({
              relations: ['user'],
              order: { createdAt: 'DESC' },
              take: limit,
              skip: offset,
              where: { hotelId },
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle audit log export with proper authorization tracking', () => {
      fc.assert(
        fc.asyncProperty(
          hotelIdArb,
          userIdArb,
          fc.date({ min: new Date('2020-01-01'), max: new Date('2023-12-31') }),
          fc.date({ min: new Date('2024-01-01'), max: new Date() }),
          fc.array(validAuditLogArb, { minLength: 1, maxLength: 20 }),
          async (hotelId, requestedBy, startDate, endDate, exportLogs) => {
            // Setup: Mock logs for export
            const logsInRange = exportLogs.filter(log => 
              log.hotelId === hotelId &&
              log.createdAt >= startDate &&
              log.createdAt <= endDate
            );

            // Mock the export request logging
            const exportAuditLog = new OnboardingAuditLog();
            exportAuditLog.action = OnboardingAuditAction.DATA_EXPORTED;
            exportAuditLog.userId = requestedBy;
            exportAuditLog.hotelId = hotelId;
            exportAuditLog.createdAt = new Date();

            jest.spyOn(auditLogRepository, 'save').mockResolvedValue(exportAuditLog);
            jest.spyOn(auditLogRepository, 'find').mockResolvedValue(logsInRange);

            // Test audit log export
            const exportedLogs = await service.exportAuditLogs(
              hotelId,
              startDate,
              endDate,
              requestedBy
            );

            // Verify: Export operation is properly audited
            expect(auditLogRepository.save).toHaveBeenCalledWith(
              expect.objectContaining({
                action: OnboardingAuditAction.DATA_EXPORTED,
                userId: requestedBy,
                hotelId,
                metadata: expect.objectContaining({
                  startDate,
                  endDate,
                  exportType: 'audit_logs',
                }),
              })
            );

            // Verify: Correct logs are exported
            expect(exportedLogs).toEqual(logsInRange);

            // Verify: Repository was called with correct date range
            expect(auditLogRepository.find).toHaveBeenCalledWith({
              where: {
                hotelId,
                createdAt: Between(startDate, endDate),
              },
              relations: ['user', 'hotel', 'session'],
              order: { createdAt: 'ASC' },
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Audit Log Data Integrity', () => {
    it('should preserve all audit data without modification', () => {
      fc.assert(
        fc.asyncProperty(
          fc.record({
            action: auditActionArb,
            userId: userIdArb,
            hotelId: hotelIdArb,
            sessionId: fc.option(sessionIdArb, { nil: undefined }),
            stepId: fc.option(stepIdArb, { nil: undefined }),
            previousData: fc.option(fc.object(), { nil: undefined }),
            newData: fc.option(fc.object(), { nil: undefined }),
            metadata: auditMetadataArb,
            description: fc.option(fc.string(), { nil: undefined }),
          }),
          async (auditRequest) => {
            // Setup: Mock save to return the same data
            const savedLog = new OnboardingAuditLog();
            Object.assign(savedLog, {
              ...auditRequest,
              id: fc.sample(fc.uuid(), 1)[0],
              createdAt: new Date(),
              sessionId: auditRequest.sessionId || null,
              stepId: auditRequest.stepId || null,
              previousData: auditRequest.previousData || null,
              newData: auditRequest.newData || null,
              metadata: auditRequest.metadata || {},
              description: auditRequest.description || null,
            });

            jest.spyOn(auditLogRepository, 'save').mockResolvedValue(savedLog);

            // Test audit logging
            const result = await service.logAuditEvent(auditRequest);

            // Verify: All data is preserved exactly as provided
            expect(result.action).toBe(auditRequest.action);
            expect(result.userId).toBe(auditRequest.userId);
            expect(result.hotelId).toBe(auditRequest.hotelId);
            
            if (auditRequest.previousData !== undefined) {
              expect(result.previousData).toEqual(auditRequest.previousData || null);
            }
            
            if (auditRequest.newData !== undefined) {
              expect(result.newData).toEqual(auditRequest.newData || null);
            }
            
            if (auditRequest.metadata !== undefined) {
              expect(result.metadata).toEqual(auditRequest.metadata || {});
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});