/**
 * Hotel-specific roles for enhanced onboarding access control
 * Requirements: 10.1 - Role-based access control for onboarding operations
 */
export enum HotelRole {
  OWNER = 'HOTEL_OWNER',
  MANAGER = 'HOTEL_MANAGER', 
  STAFF = 'HOTEL_STAFF',
}

/**
 * Permissions for onboarding operations
 */
export enum OnboardingPermission {
  // Session management
  CREATE_SESSION = 'onboarding:create_session',
  VIEW_SESSION = 'onboarding:view_session',
  UPDATE_SESSION = 'onboarding:update_session',
  DELETE_SESSION = 'onboarding:delete_session',
  COMPLETE_SESSION = 'onboarding:complete_session',
  
  // Step management
  UPDATE_AMENITIES = 'onboarding:update_amenities',
  UPDATE_IMAGES = 'onboarding:update_images',
  UPDATE_PROPERTY_INFO = 'onboarding:update_property_info',
  UPDATE_ROOMS = 'onboarding:update_rooms',
  UPDATE_BUSINESS_FEATURES = 'onboarding:update_business_features',
  
  // Quality and reporting
  VIEW_QUALITY_REPORTS = 'onboarding:view_quality_reports',
  GENERATE_QUALITY_REPORTS = 'onboarding:generate_quality_reports',
  
  // Administrative
  VIEW_AUDIT_LOGS = 'onboarding:view_audit_logs',
  MANAGE_HOTEL_USERS = 'onboarding:manage_hotel_users',
}

/**
 * Role-permission mapping for hotel onboarding operations
 */
export const HOTEL_ROLE_PERMISSIONS: Record<HotelRole, OnboardingPermission[]> = {
  [HotelRole.OWNER]: [
    // Full access to all onboarding operations
    OnboardingPermission.CREATE_SESSION,
    OnboardingPermission.VIEW_SESSION,
    OnboardingPermission.UPDATE_SESSION,
    OnboardingPermission.DELETE_SESSION,
    OnboardingPermission.COMPLETE_SESSION,
    OnboardingPermission.UPDATE_AMENITIES,
    OnboardingPermission.UPDATE_IMAGES,
    OnboardingPermission.UPDATE_PROPERTY_INFO,
    OnboardingPermission.UPDATE_ROOMS,
    OnboardingPermission.UPDATE_BUSINESS_FEATURES,
    OnboardingPermission.VIEW_QUALITY_REPORTS,
    OnboardingPermission.GENERATE_QUALITY_REPORTS,
    OnboardingPermission.VIEW_AUDIT_LOGS,
    OnboardingPermission.MANAGE_HOTEL_USERS,
  ],
  [HotelRole.MANAGER]: [
    // Management-level access excluding user management
    OnboardingPermission.CREATE_SESSION,
    OnboardingPermission.VIEW_SESSION,
    OnboardingPermission.UPDATE_SESSION,
    OnboardingPermission.COMPLETE_SESSION,
    OnboardingPermission.UPDATE_AMENITIES,
    OnboardingPermission.UPDATE_IMAGES,
    OnboardingPermission.UPDATE_PROPERTY_INFO,
    OnboardingPermission.UPDATE_ROOMS,
    OnboardingPermission.UPDATE_BUSINESS_FEATURES,
    OnboardingPermission.VIEW_QUALITY_REPORTS,
    OnboardingPermission.GENERATE_QUALITY_REPORTS,
  ],
  [HotelRole.STAFF]: [
    // Limited access for staff members
    OnboardingPermission.VIEW_SESSION,
    OnboardingPermission.UPDATE_AMENITIES,
    OnboardingPermission.UPDATE_IMAGES,
    OnboardingPermission.UPDATE_ROOMS,
    OnboardingPermission.VIEW_QUALITY_REPORTS,
  ],
};