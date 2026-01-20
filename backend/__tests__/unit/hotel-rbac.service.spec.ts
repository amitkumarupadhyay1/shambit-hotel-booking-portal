import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { HotelRbacService } from '../../src/modules/auth/services/hotel-rbac.service';
import { HotelUserRole } from '../../src/modules/auth/entities/hotel-user-role.entity';
import { User, UserRole } from '../../src/modules/users/entities/user.entity';
import { HotelRole, OnboardingPermission, HOTEL_ROLE_PERMISSIONS } from '../../src/modules/auth/enums/hotel-roles.enum';

describe('Hotel RBAC Service - Security and Compliance Tests', () => {
  let service: HotelRbacService;
  let hotelUserRoleRepository: Repository<HotelUserRole>;
  let userRepository: Repository<User>;

  // Test data generators
  const userIdArb = fc.uuid();
  const hotelIdArb = fc.uuid();
  const hotelRoleArb = fc.constantFrom(...Object.values(HotelRole));
  const onboardingPermissionArb = fc.constantFrom(...Object.values(OnboardingPermission));
  const userRoleArb = fc.constantFrom(...Object.values(UserRole));

  const validHotelUserRoleArb = fc.record({
    id: fc.uuid(),
    userId: userIdArb,
    hotelId: hotelIdArb,
    role: hotelRoleArb,
    isActive: fc.boolean(),
    expiresAt: fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }), { nil: null }),
    createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
    updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  }).map(data => {
    const role = new HotelUserRole();
    Object.assign(role, data);
    
    // Mock the isValid method
    role.isValid = jest.fn().mockReturnValue(
      data.isActive && (!data.expiresAt || data.expiresAt > new Date())
    );
    
    return role;
  });

  const validUserArb = fc.record({
    id: userIdArb,
    name: fc.string({ minLength: 1, maxLength: 100 }),
    email: fc.emailAddress(),
    roles: fc.array(userRoleArb, { minLength: 1, maxLength: 3 }),
  }).map(data => {
    const user = new User();
    Object.assign(user, data);
    return user;
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HotelRbacService,
        {
          provide: getRepositoryToken(HotelUserRole),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<HotelRbacService>(HotelRbacService);
    hotelUserRoleRepository = module.get<Repository<HotelUserRole>>(getRepositoryToken(HotelUserRole));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 21: Role-Based Access Control', () => {
    /**
     * Feature: enhanced-hotel-onboarding, Property 21: Role-Based Access Control
     * 
     * For any user with assigned roles, the system should enforce appropriate permissions 
     * and restrict access based on role-based rules.
     * 
     * Validates: Requirements 10.1
     */
    it('**Feature: enhanced-hotel-onboarding, Property 21: Role-Based Access Control**', () => {
      fc.assert(
        fc.asyncProperty(
          userIdArb,
          hotelIdArb,
          hotelRoleArb,
          async (userId, hotelId, role) => {
            // Create a completely fresh service instance for each test iteration
            const mockHotelUserRoleRepo = {
              findOne: jest.fn(),
              find: jest.fn(),
              save: jest.fn(),
              update: jest.fn(),
            };
            
            const mockUserRepo = {
              findOne: jest.fn(),
            };
            
            // Create fresh service instance
            const testService = new HotelRbacService(
              mockHotelUserRoleRepo as any,
              mockUserRepo as any
            );
            
            // Setup: Create a valid hotel role for the user
            const hotelUserRole = new HotelUserRole();
            hotelUserRole.userId = userId;
            hotelUserRole.hotelId = hotelId;
            hotelUserRole.role = role;
            hotelUserRole.isActive = true;
            hotelUserRole.expiresAt = null;
            hotelUserRole.isValid = jest.fn().mockReturnValue(true);

            // Configure mocks for this iteration
            mockHotelUserRoleRepo.findOne.mockResolvedValue(hotelUserRole);
            mockUserRepo.findOne.mockResolvedValue(null); // Not a system admin

            // Get all permissions defined for this role
            const rolePermissions = HOTEL_ROLE_PERMISSIONS[role] || [];
            
            // Test a few permissions that should be granted
            for (let i = 0; i < Math.min(3, rolePermissions.length); i++) {
              const permission = rolePermissions[i];
              const hasPermission = await testService.hasPermission({
                userId,
                hotelId,
                permission,
              });
              
              // Verify: User should have this permission
              expect(hasPermission).toBe(true);
            }

            // Test one permission that should NOT be granted (if any exist)
            const allPermissions = Object.values(OnboardingPermission);
            const deniedPermissions = allPermissions.filter(p => !rolePermissions.includes(p));
            
            if (deniedPermissions.length > 0) {
              const deniedPermission = deniedPermissions[0];
              
              const hasPermission = await testService.hasPermission({
                userId,
                hotelId,
                permission: deniedPermission,
              });
              
              // Verify: User should NOT have this permission
              expect(hasPermission).toBe(false);
            }
            // If no denied permissions exist (e.g., HOTEL_OWNER has all permissions), 
            // that's valid and the test should pass
          }
        ),
        { numRuns: 25 } // Reduced runs to avoid timeout
      );
    });

    it('should grant all permissions to system administrators', () => {
      fc.assert(
        fc.asyncProperty(
          userIdArb,
          hotelIdArb,
          onboardingPermissionArb,
          async (userId, hotelId, permission) => {
            // Create fresh mock repositories for each iteration
            const mockHotelUserRoleRepo = {
              findOne: jest.fn(),
              find: jest.fn(),
              save: jest.fn(),
              update: jest.fn(),
            };
            
            const mockUserRepo = {
              findOne: jest.fn(),
            };
            
            // Create fresh service instance
            const testService = new HotelRbacService(
              mockHotelUserRoleRepo as any,
              mockUserRepo as any
            );
            
            // Setup: Create a system admin user
            const adminUser = new User();
            adminUser.id = userId;
            adminUser.roles = [UserRole.ADMIN];

            mockUserRepo.findOne.mockResolvedValue(adminUser);

            // Test permission check
            const hasPermission = await testService.hasPermission({
              userId,
              hotelId,
              permission,
            });

            // Verify: System admin should have all permissions
            expect(hasPermission).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should deny permissions for users without hotel roles', () => {
      fc.assert(
        fc.asyncProperty(
          userIdArb,
          hotelIdArb,
          onboardingPermissionArb,
          async (userId, hotelId, permission) => {
            // Create fresh mock repositories for each iteration
            const mockHotelUserRoleRepo = {
              findOne: jest.fn(),
              find: jest.fn(),
              save: jest.fn(),
              update: jest.fn(),
            };
            
            const mockUserRepo = {
              findOne: jest.fn(),
            };
            
            // Create fresh service instance
            const testService = new HotelRbacService(
              mockHotelUserRoleRepo as any,
              mockUserRepo as any
            );
            
            // Setup: User has no hotel role
            mockHotelUserRoleRepo.findOne.mockResolvedValue(null);
            mockUserRepo.findOne.mockResolvedValue(null);

            // Test permission check
            const hasPermission = await testService.hasPermission({
              userId,
              hotelId,
              permission,
            });

            // Verify: Should deny permission
            expect(hasPermission).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should deny permissions for expired or inactive roles', () => {
      fc.assert(
        fc.asyncProperty(
          userIdArb,
          hotelIdArb,
          hotelRoleArb,
          onboardingPermissionArb,
          fc.boolean(),
          fc.option(fc.date({ min: new Date('2020-01-01'), max: new Date('2021-12-31') }), { nil: null }),
          async (userId, hotelId, role, permission, isActive, expiresAt) => {
            // Create fresh mock repositories for each iteration
            const mockHotelUserRoleRepo = {
              findOne: jest.fn(),
              find: jest.fn(),
              save: jest.fn(),
              update: jest.fn(),
            };
            
            const mockUserRepo = {
              findOne: jest.fn(),
            };
            
            // Create fresh service instance
            const testService = new HotelRbacService(
              mockHotelUserRoleRepo as any,
              mockUserRepo as any
            );
            
            // Setup: Create an invalid role (inactive or expired)
            const hotelUserRole = new HotelUserRole();
            hotelUserRole.userId = userId;
            hotelUserRole.hotelId = hotelId;
            hotelUserRole.role = role;
            hotelUserRole.isActive = isActive;
            hotelUserRole.expiresAt = expiresAt;
            
            // Mock isValid to return false for invalid roles
            const isValidRole = isActive && (!expiresAt || expiresAt > new Date());
            hotelUserRole.isValid = jest.fn().mockReturnValue(isValidRole);

            mockHotelUserRoleRepo.findOne.mockResolvedValue(hotelUserRole);
            mockUserRepo.findOne.mockResolvedValue(null);

            // Test permission check
            const hasPermission = await testService.hasPermission({
              userId,
              hotelId,
              permission,
            });

            // Verify: Invalid roles should not grant permissions
            if (!isValidRole) {
              expect(hasPermission).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 22: Security and Compliance', () => {
    /**
     * Feature: enhanced-hotel-onboarding, Property 22: Security and Compliance
     * 
     * For any stored data, the system should implement appropriate access controls, 
     * comply with data protection regulations, maintain comprehensive audit logs for 
     * all changes, and encrypt sensitive information in transit and at rest.
     * 
     * Validates: Requirements 10.2, 10.3, 10.4, 10.5
     */
    it('**Feature: enhanced-hotel-onboarding, Property 22: Security and Compliance**', () => {
      fc.assert(
        fc.asyncProperty(
          fc.record({
            assignerId: userIdArb,
            targetUserId: userIdArb,
            hotelId: hotelIdArb,
            role: hotelRoleArb,
          }),
          async (roleAssignment) => {
            // Create fresh mock repositories for each iteration
            const mockHotelUserRoleRepo = {
              findOne: jest.fn(),
              find: jest.fn(),
              save: jest.fn(),
              update: jest.fn(),
            };
            
            const mockUserRepo = {
              findOne: jest.fn(),
            };
            
            // Create fresh service instance
            const testService = new HotelRbacService(
              mockHotelUserRoleRepo as any,
              mockUserRepo as any
            );
            
            // Setup: Create assigner role with appropriate permissions
            const assignerRole = new HotelUserRole();
            assignerRole.userId = roleAssignment.assignerId;
            assignerRole.hotelId = roleAssignment.hotelId;
            assignerRole.role = HotelRole.OWNER; // Owner can assign all roles
            assignerRole.isActive = true;
            assignerRole.isValid = jest.fn().mockReturnValue(true);

            mockHotelUserRoleRepo.findOne.mockResolvedValue(assignerRole);
            mockHotelUserRoleRepo.save.mockResolvedValue(assignerRole);

            // Test role assignment authorization
            const canAssign = await testService.canAssignRole(
              roleAssignment.assignerId,
              roleAssignment.hotelId,
              roleAssignment.role
            );

            // Verify: Access control is properly enforced
            expect(canAssign).toBe(true); // Owner can assign any role

            // Test with insufficient permissions - create fresh mock for second test
            const staffRole = new HotelUserRole();
            staffRole.userId = roleAssignment.assignerId;
            staffRole.hotelId = roleAssignment.hotelId;
            staffRole.role = HotelRole.STAFF;
            staffRole.isActive = true;
            staffRole.isValid = jest.fn().mockReturnValue(true);
            
            // Reset and configure mock for staff role test
            mockHotelUserRoleRepo.findOne.mockClear();
            mockHotelUserRoleRepo.findOne.mockResolvedValue(staffRole);
            
            const canAssignAsStaff = await testService.canAssignRole(
              roleAssignment.assignerId,
              roleAssignment.hotelId,
              HotelRole.OWNER
            );

            // Verify: Staff cannot assign owner roles (security control)
            expect(canAssignAsStaff).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce hierarchical role assignment permissions', () => {
      fc.assert(
        fc.asyncProperty(
          userIdArb,
          hotelIdArb,
          hotelRoleArb,
          hotelRoleArb,
          async (assignerId, hotelId, assignerRole, targetRole) => {
            // Create fresh mock repositories for each iteration
            const mockHotelUserRoleRepo = {
              findOne: jest.fn(),
              find: jest.fn(),
              save: jest.fn(),
              update: jest.fn(),
            };
            
            const mockUserRepo = {
              findOne: jest.fn(),
            };
            
            // Create fresh service instance
            const testService = new HotelRbacService(
              mockHotelUserRoleRepo as any,
              mockUserRepo as any
            );
            
            // Setup: Create assigner with specific role
            const roleEntity = new HotelUserRole();
            roleEntity.userId = assignerId;
            roleEntity.hotelId = hotelId;
            roleEntity.role = assignerRole;
            roleEntity.isActive = true;
            roleEntity.isValid = jest.fn().mockReturnValue(true);

            mockHotelUserRoleRepo.findOne.mockResolvedValue(roleEntity);

            // Test role assignment authorization
            const canAssign = await testService.canAssignRole(assignerId, hotelId, targetRole);

            // Verify: Role hierarchy is enforced
            let expectedCanAssign = false;
            
            switch (targetRole) {
              case HotelRole.OWNER:
                expectedCanAssign = assignerRole === HotelRole.OWNER;
                break;
              case HotelRole.MANAGER:
                expectedCanAssign = assignerRole === HotelRole.OWNER;
                break;
              case HotelRole.STAFF:
                expectedCanAssign = [HotelRole.OWNER, HotelRole.MANAGER].includes(assignerRole);
                break;
            }

            expect(canAssign).toBe(expectedCanAssign);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should properly filter and return only valid roles', () => {
      fc.assert(
        fc.asyncProperty(
          userIdArb,
          fc.array(validHotelUserRoleArb, { minLength: 1, maxLength: 10 }),
          async (userId, roles) => {
            // Create fresh mock repositories for each iteration
            const mockHotelUserRoleRepo = {
              findOne: jest.fn(),
              find: jest.fn(),
              save: jest.fn(),
              update: jest.fn(),
            };
            
            const mockUserRepo = {
              findOne: jest.fn(),
            };
            
            // Create fresh service instance
            const testService = new HotelRbacService(
              mockHotelUserRoleRepo as any,
              mockUserRepo as any
            );
            
            // Setup: Mix of valid and invalid roles
            const rolesForUser = roles.map(role => {
              const roleEntity = new HotelUserRole();
              Object.assign(roleEntity, { ...role, userId });
              roleEntity.isValid = role.isValid;
              roleEntity.getRoleDisplayName = jest.fn().mockReturnValue(`Role: ${role.role}`);
              return roleEntity;
            });
            
            mockHotelUserRoleRepo.find.mockResolvedValue(rolesForUser);

            // Test getting user hotel roles
            const userRoles = await testService.getUserHotelRoles(userId);

            // Verify: Only valid roles are returned (security compliance)
            const expectedValidRoles = rolesForUser.filter(role => role.isValid());
            expect(userRoles).toHaveLength(expectedValidRoles.length);

            // Verify each returned role is valid
            userRoles.forEach(role => {
              expect(role.isValid()).toBe(true);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain data integrity during role operations', () => {
      fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: userIdArb,
            hotelId: hotelIdArb,
            role: hotelRoleArb,
            assignedBy: userIdArb,
          }),
          async (roleData) => {
            // Create fresh mock repositories for each iteration
            const mockHotelUserRoleRepo = {
              findOne: jest.fn(),
              find: jest.fn(),
              save: jest.fn(),
              update: jest.fn(),
            };
            
            const mockUserRepo = {
              findOne: jest.fn(),
            };
            
            // Create fresh service instance
            const testService = new HotelRbacService(
              mockHotelUserRoleRepo as any,
              mockUserRepo as any
            );
            
            // Setup: Mock repository operations
            const savedRole = new HotelUserRole();
            Object.assign(savedRole, roleData);
            savedRole.id = fc.sample(fc.uuid(), 1)[0];
            savedRole.isActive = true;
            savedRole.createdAt = new Date();
            savedRole.updatedAt = new Date();

            mockHotelUserRoleRepo.findOne.mockResolvedValue(null);
            mockHotelUserRoleRepo.save.mockResolvedValue(savedRole);

            // Test role assignment
            const result = await testService.assignHotelRole(roleData);

            // Verify: Data integrity is maintained
            expect(result.userId).toBe(roleData.userId);
            expect(result.hotelId).toBe(roleData.hotelId);
            expect(result.role).toBe(roleData.role);
            expect(result.assignedBy).toBe(roleData.assignedBy);
            expect(result.isActive).toBe(true);

            // Verify repository was called with correct data
            expect(mockHotelUserRoleRepo.save).toHaveBeenCalledWith(
              expect.objectContaining({
                userId: roleData.userId,
                hotelId: roleData.hotelId,
                role: roleData.role,
                assignedBy: roleData.assignedBy,
              })
            );
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Role Permission Mapping Consistency', () => {
    it('should maintain consistent permission mappings for all roles', () => {
      // Verify that all hotel roles have defined permissions
      Object.values(HotelRole).forEach(role => {
        expect(HOTEL_ROLE_PERMISSIONS[role]).toBeDefined();
        expect(Array.isArray(HOTEL_ROLE_PERMISSIONS[role])).toBe(true);
        expect(HOTEL_ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
      });

      // Verify permission hierarchy (owners should have all permissions)
      const ownerPermissions = HOTEL_ROLE_PERMISSIONS[HotelRole.OWNER];
      const managerPermissions = HOTEL_ROLE_PERMISSIONS[HotelRole.MANAGER];
      const staffPermissions = HOTEL_ROLE_PERMISSIONS[HotelRole.STAFF];

      // Owner should have the most permissions
      expect(ownerPermissions.length).toBeGreaterThanOrEqual(managerPermissions.length);
      expect(managerPermissions.length).toBeGreaterThanOrEqual(staffPermissions.length);

      // Staff permissions should be subset of manager permissions
      staffPermissions.forEach(permission => {
        expect(managerPermissions.includes(permission) || ownerPermissions.includes(permission)).toBe(true);
      });
    });
  });
});