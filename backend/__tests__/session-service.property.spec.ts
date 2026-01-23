import * as fc from 'fast-check';
import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from '../src/modules/auth/session.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

describe('SessionService Security Properties', () => {
    let sessionService: SessionService;
    let cacheStore: Map<string, any>;
    let userSessionsStore: Map<string, string[]>;

    beforeEach(() => {
        cacheStore = new Map();
        userSessionsStore = new Map();

        const mockCacheManager = {
            get: jest.fn().mockImplementation(async (key) => cacheStore.get(key)),
            set: jest.fn().mockImplementation(async (key, value) => {
                // Handle User Sessions List separately for mock logic to replicate service behavior
                // The service logic for user sessions list is: get list, push, set list.
                // But here we just store whatever is set.
                cacheStore.set(key, value);
            }),
            del: jest.fn().mockImplementation(async (key) => cacheStore.delete(key)),
        };

        const mockConfigService = {
            get: jest.fn().mockReturnValue(7), // 7 days expiration
        };

        sessionService = new SessionService(mockCacheManager as any, mockConfigService as any);
    });

    // Feature: authentication-security-hardening, Property 2: Server-Side Session Lifecycle Management
    test('Property 2: Created sessions must be valid and retrievable', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.uuid(),
                fc.ipV4(),
                fc.string(),
                fc.string(),
                async (userId, ip, userAgent, fingerprint) => {
                    const session = await sessionService.createSession(userId, {
                        ipAddress: ip,
                        userAgent: userAgent,
                        deviceFingerprint: fingerprint
                    });

                    const retrieved = await sessionService.validateSession(session.id);

                    return retrieved !== null
                        && retrieved.id === session.id
                        && retrieved.userId === userId
                        && retrieved.isActive === true;
                }
            )
        );
    });

    test('Property 3: Invalidated sessions must be rejected', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.uuid(),
                async (userId) => {
                    const session = await sessionService.createSession(userId, {
                        ipAddress: '127.0.0.1',
                        userAgent: 'test-agent',
                        deviceFingerprint: 'fp'
                    });

                    await sessionService.invalidateSession(session.id);
                    const retrieved = await sessionService.validateSession(session.id);

                    return retrieved === null;
                }
            )
        );
    });

    test('Property: Invalidating all user sessions must invalidate every session for that user', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.uuid(),
                fc.integer({ min: 1, max: 10 }), // Number of sessions
                async (userId, sessionCount) => {
                    // specific mock fix for lists
                    // We need a shared state for the list in our mock
                    // Re-mocking for this specific test to handle the list append logic correctly "in-memory"
                    // because the service does get -> push -> set.

                    const internalCache = new Map<string, any>();
                    (sessionService as any).cacheManager = {
                        get: async (key) => {
                            if (internalCache.has(key)) return JSON.parse(JSON.stringify(internalCache.get(key)));
                            return null;
                        },
                        set: async (key, val) => {
                            internalCache.set(key, val);
                        },
                        del: async (key) => {
                            internalCache.delete(key);
                        }
                    };

                    const sessionIds = [];
                    for (let i = 0; i < sessionCount; i++) {
                        const session = await sessionService.createSession(userId, {
                            ipAddress: '127.0.0.1', userAgent: 'multiple-test', deviceFingerprint: 'fp'
                        });
                        sessionIds.push(session.id);
                    }

                    // Invalidate all
                    await sessionService.invalidateAllUserSessions(userId);

                    // Check all are invalid
                    let allInvalid = true;
                    for (const sid of sessionIds) {
                        const s = await sessionService.validateSession(sid);
                        if (s !== null) allInvalid = false;
                    }

                    return allInvalid;
                }
            )
        );
    });
});
