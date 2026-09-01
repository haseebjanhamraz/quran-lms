import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis | null = null;
  private isConnected = false;
  // Local in-memory fallback cache in case Redis is temporarily offline
  private readonly memoryCache = new Map<string, { value: string; expiresAt: number }>();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const port = Number(this.configService.get<number>('REDIS_PORT')) || 6379;
    const password = this.configService.get<string>('REDIS_PASSWORD') || undefined;
    const enabled = this.configService.get<string>('REDIS_ENABLED') !== 'false';

    if (!enabled) {
      this.logger.log('Redis Cache disabled via REDIS_ENABLED=false. Using in-memory cache.');
      return;
    }

    try {
      this.client = new Redis({
        host,
        port,
        password,
        lazyConnect: true,
        connectTimeout: 1500,
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        autoResubscribe: false,
        retryStrategy: (times) => {
          if (times > 2) {
            // Stop retrying if Redis server is not running and use in-memory fallback
            return null;
          }
          return 1000;
        },
      });

      this.client.connect().then(() => {
        this.isConnected = true;
        this.logger.log(`Redis Cache connected successfully at ${host}:${port}`);
      }).catch((err) => {
        this.isConnected = false;
        this.logger.warn(`Redis is not running at ${host}:${port} (${err.message}). Using in-memory fallback cache.`);
        try {
          this.client?.disconnect(false);
        } catch (_) {}
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        this.isConnected = true;
      });
    } catch (err: any) {
      this.logger.warn(`Failed to initialize Redis client: ${err.message}. Using in-memory fallback cache.`);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      if (this.isConnected && this.client) {
        const raw = await this.client.get(key);
        if (!raw) return null;
        return JSON.parse(raw) as T;
      }
    } catch (err: any) {
      this.logger.debug(`Redis get error for key ${key}: ${err.message}`);
    }

    // Fallback to in-memory cache
    const cached = this.memoryCache.get(key);
    if (cached) {
      if (cached.expiresAt > Date.now()) {
        try {
          return JSON.parse(cached.value) as T;
        } catch (_) {
          return null;
        }
      } else {
        this.memoryCache.delete(key);
      }
    }
    return null;
  }

  async set(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
    const serialized = JSON.stringify(value);

    try {
      if (this.isConnected && this.client) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
        return;
      }
    } catch (err: any) {
      this.logger.debug(`Redis set error for key ${key}: ${err.message}`);
    }

    // In-memory fallback
    this.memoryCache.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        await this.client.del(key);
      }
    } catch (err: any) {
      this.logger.debug(`Redis del error for key ${key}: ${err.message}`);
    }
    this.memoryCache.delete(key);
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      }
    } catch (err: any) {
      this.logger.debug(`Redis delByPattern error for pattern ${pattern}: ${err.message}`);
    }

    // In-memory fallback cleanup matching glob pattern
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.memoryCache.keys()) {
      if (regexPattern.test(key)) {
        this.memoryCache.delete(key);
      }
    }
  }

  async getOrSet<T = any>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number = 60,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }
    const fresh = await factory();
    if (fresh !== undefined && fresh !== null) {
      await this.set(key, fresh, ttlSeconds);
    }
    return fresh;
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (_) {}
    }
  }
}
