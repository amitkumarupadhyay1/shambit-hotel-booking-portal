import { UserRole } from '../../users/entities/user.entity';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  roles: UserRole[];
  sessionId?: string;
  jti?: string;
  iat?: number;
  exp?: number;
}