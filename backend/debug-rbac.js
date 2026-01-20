// Debug script to test RBAC logic
const { HotelRole, OnboardingPermission, HOTEL_ROLE_PERMISSIONS } = require('./dist/modules/auth/enums/hotel-roles.enum.js');

console.log('=== RBAC Debug ===');
console.log('HotelRole:', HotelRole);
console.log('OnboardingPermission:', OnboardingPermission);
console.log('HOTEL_ROLE_PERMISSIONS:', HOTEL_ROLE_PERMISSIONS);

// Test permission logic
const ownerPermissions = HOTEL_ROLE_PERMISSIONS[HotelRole.OWNER];
const staffPermissions = HOTEL_ROLE_PERMISSIONS[HotelRole.STAFF];

console.log('\n=== Owner Permissions ===');
console.log('Count:', ownerPermissions.length);
console.log('Permissions:', ownerPermissions);

console.log('\n=== Staff Permissions ===');
console.log('Count:', staffPermissions.length);
console.log('Permissions:', staffPermissions);

// Test specific permission
const testPermission = OnboardingPermission.CREATE_SESSION;
console.log('\n=== Permission Test ===');
console.log('Test permission:', testPermission);
console.log('Owner has permission:', ownerPermissions.includes(testPermission));
console.log('Staff has permission:', staffPermissions.includes(testPermission));

// Test denied permissions
const allPermissions = Object.values(OnboardingPermission);
const ownerDenied = allPermissions.filter(p => !ownerPermissions.includes(p));
const staffDenied = allPermissions.filter(p => !staffPermissions.includes(p));

console.log('\n=== Denied Permissions ===');
console.log('Owner denied count:', ownerDenied.length);
console.log('Owner denied:', ownerDenied);
console.log('Staff denied count:', staffDenied.length);
console.log('Staff denied:', staffDenied.slice(0, 3)); // Show first 3