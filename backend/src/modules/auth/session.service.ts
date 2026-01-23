import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Session } from './interfaces/session.interface';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SessionService {
    private readonly logger = new Logger(SessionService.name);
    private readonly SESSION_PREFIX = 'session:';
    private readonly USER_SESSIONS_PREFIX = 'user:sessions:';
    private readonly BLACKLIST_PREFIX = 'blacklist:';

    constructor(
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private configService: ConfigService,
    ) { }

    async createSession(
        userId: string,
        deviceInfo: { ipAddress: string; userAgent: string; deviceFingerprint: string },
    ): Promise<Session> {
        const sessionId = randomUUID();
        const now = new Date();
        const expirationDays = this.configService.get<number>('SESSION_ABSOLUTE_TIMEOUT_DAYS', 7);
        const idleMinutes = this.configService.get<number>('SESSION_IDLE_TIMEOUT_MINUTES', 30);

        const absoluteExpiresAt = new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000);
        const initialExpiresAt = new Date(now.getTime() + idleMinutes * 60 * 1000);

        // Use the strictly smaller of the two
        const expiresAt = initialExpiresAt < absoluteExpiresAt ? initialExpiresAt : absoluteExpiresAt;

        const session: Session = {
            id: sessionId,
            userId,
            ipAddress: deviceInfo.ipAddress,
            userAgent: deviceInfo.userAgent,
            deviceFingerprint: deviceInfo.deviceFingerprint,
            createdAt: now.toISOString(),
            lastActivity: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
            absoluteExpiresAt: absoluteExpiresAt.toISOString(),
            isActive: true,
        };

        const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
        const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;

        // Store session
        // Convert session object to string because some cache stores might need it, 
        // but nestjs cache-manager usually handles objects. 
        // However, for redis store, simple objects work fine.
        await this.cacheManager.set(sessionKey, session, this.calculateTTL(expiresAt.toISOString()));

        // Track user's sessions (using a Set in Redis if we had direct access, 
        // but here we might need to handle it via cache manager workaround or assumes list)
        // For simplicity with CacheManager, we'll store a list of sessionIDs.
        let userSessions: string[] = (await this.cacheManager.get(userSessionsKey)) || [];
        userSessions.push(sessionId);
        await this.cacheManager.set(userSessionsKey, userSessions, 0); // 0 = no expiry for key mapping (or long time)

        this.logger.log(`Created session ${sessionId} for user ${userId}`);
        return session;
    }

    async validateSession(sessionId: string): Promise<Session | null> {
        const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
        const session = await this.cacheManager.get<Session>(sessionKey);

        if (!session || !session.isActive) {
            return null;
        }

        // Sliding Expiration Logic
        const now = new Date();
        const absoluteExpiresAt = new Date(session.absoluteExpiresAt);
        const currentExpiresAt = new Date(session.expiresAt);

        // Double check expiry (Redis should handle this, but for safety)
        if (now > currentExpiresAt) {
            await this.invalidateSession(sessionId);
            return null;
        }

        // Calculate new expiration based on idle timeout
        const idleMinutes = this.configService.get<number>('SESSION_IDLE_TIMEOUT_MINUTES', 30);
        let newExpiresAt = new Date(now.getTime() + idleMinutes * 60 * 1000);

        // Enforce absolute maximum lifetime
        if (newExpiresAt > absoluteExpiresAt) {
            newExpiresAt = absoluteExpiresAt;
        }

        // Only update if we are extending it (or if it was capped)
        // Actually, for sliding window, we always want to set it to Now + Window
        session.lastActivity = now.toISOString();
        session.expiresAt = newExpiresAt.toISOString();

        const ttl = this.calculateTTL(session.expiresAt);
        if (ttl > 0) {
            await this.cacheManager.set(sessionKey, session, ttl);
        } else {
            // Should theoretically be caught by absolute check, but handled here
            await this.invalidateSession(sessionId);
            return null;
        }

        return session;
    }

    async invalidateSession(sessionId: string): Promise<void> {
        const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
        const session = await this.cacheManager.get<Session>(sessionKey);

        if (session) {
            session.isActive = false;
            await this.cacheManager.del(sessionKey);

            // Remove from user sessions list
            const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${session.userId}`;
            let userSessions: string[] = (await this.cacheManager.get(userSessionsKey)) || [];
            userSessions = userSessions.filter(id => id !== sessionId);
            await this.cacheManager.set(userSessionsKey, userSessions, 0);

            this.logger.log(`Invalidated session ${sessionId} for user ${session.userId}`);
        }
    }

    async invalidateAllUserSessions(userId: string): Promise<void> {
        const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
        const userSessions: string[] = (await this.cacheManager.get(userSessionsKey)) || [];

        for (const sessionId of userSessions) {
            await this.invalidateSession(sessionId);
        }

        await this.cacheManager.del(userSessionsKey);
        this.logger.log(`Invalidated all sessions for user ${userId}`);
    }

    async blacklistToken(jti: string, reason: string, expiresInSeconds: number): Promise<void> {
        const key = `${this.BLACKLIST_PREFIX}${jti}`;
        await this.cacheManager.set(key, { reason, blacklistedAt: new Date().toISOString() }, expiresInSeconds * 1000);
        this.logger.warn(`Token ${jti} blacklisted. Reason: ${reason}`);
    }

    async isTokenBlacklisted(jti: string): Promise<boolean> {
        const key = `${this.BLACKLIST_PREFIX}${jti}`;
        const entry = await this.cacheManager.get(key);
        return !!entry;
    }

    private calculateTTL(expiresAtIso: string): number {
        const expiresAt = new Date(expiresAtIso).getTime();
        const now = new Date().getTime();
        return Math.max(0, expiresAt - now);
    }
}
