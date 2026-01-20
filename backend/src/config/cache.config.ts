import { CacheModuleAsyncOptions } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

export const cacheConfig: CacheModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const redisUrl = configService.get<string>('REDIS_URL');
    const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
    const redisPort = configService.get<number>('REDIS_PORT', 6379);
    const redisPassword = configService.get<string>('REDIS_PASSWORD');

    // If REDIS_URL is provided, use it; otherwise, construct from individual values
    const storeConfig = redisUrl
      ? { url: redisUrl }
      : {
          host: redisHost,
          port: redisPort,
          ...(redisPassword && { password: redisPassword }),
        };

    return {
      store: redisStore as any,
      ...storeConfig,
      ttl: 300, // 5 minutes default TTL
      max: 1000, // Maximum number of items in cache
      isGlobal: true,
    };
  },
  inject: [ConfigService],
};