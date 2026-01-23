
export interface Session {
    id: string;
    userId: string;
    deviceFingerprint: string;
    ipAddress: string;
    userAgent: string;
    createdAt: string; // ISO8601
    lastActivity: string; // ISO8601
    expiresAt: string; // ISO8601
    absoluteExpiresAt: string; // ISO8601 - Maximum lifetime of the session
    isActive: boolean;
}

export interface SessionMetadata {
    loginMethod: 'password' | 'sso' | 'refresh';
    riskScore: number;
}
