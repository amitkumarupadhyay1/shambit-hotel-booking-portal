import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private userCache = new Map<string, { user: User; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const userId = payload.sub;
    const now = Date.now();
    
    // Check cache first
    const cached = this.userCache.get(userId);
    if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
      if (!cached.user || cached.user.status !== 'ACTIVE') {
        throw new UnauthorizedException('User not found or inactive');
      }
      return cached.user;
    }

    // Fetch from database
    const user = await this.usersService.findOne(userId);
    
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Cache the result
    this.userCache.set(userId, { user, timestamp: now });
    
    // Clean up old cache entries periodically
    if (this.userCache.size > 100) {
      this.cleanupCache();
    }

    return user;
  }

  private cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.userCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.userCache.delete(key);
      }
    }
  }
}