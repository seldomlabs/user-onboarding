import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(private readonly client: Redis) {}

  /**
   * Get a value by key from Redis
   * @param key The key to retrieve
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (err) {
      console.error(`Error getting key "${key}":`, err);
      throw err;
    }
  }

  /**
   * Set a key-value pair with optional expiration
   * @param key The key to set
   * @param value The value to set
   * @param ttl Optional time-to-live in seconds
   */
  async set(key: string, value: string, ttl?: number): Promise<string> {
    try {
      if (ttl) {
        return await this.client.set(key, value, 'EX', ttl);
      }
      return await this.client.set(key, value);
    } catch (err) {
      console.error(`Error setting key "${key}":`, err);
      throw err;
    }
  }

  /**
   * Increment the value of a key by 1
   * @param key The key to increment
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (err) {
      console.error(`Error incrementing key "${key}":`, err);
      throw err;
    }
  }

  /**
   * Set a key's time to live in seconds
   * @param key The key to set an expiration time on
   * @param seconds Expiration time in seconds
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, seconds);
      return result === 1; // Redis returns 1 if successful
    } catch (err) {
      console.error(`Error setting expiration for key "${key}":`, err);
      throw err;
    }
  }

  /**
   * Delete a key from Redis
   * @param key The key to delete
   */
  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (err) {
      console.error(`Error deleting key "${key}":`, err);
      throw err;
    }
  }

    /**
   * Ping the Redis server to check connectivity
   */
  async ping(): Promise<void> {
    try {
      const response = await this.client.ping();
      if (response !== 'PONG') {
        throw new Error('Redis server did not respond with PONG');
      }
    } catch (err) {
      console.error('Error pinging Redis server:', err);
      throw new Error('Unable to connect to Redis server');
    }
  }

}

