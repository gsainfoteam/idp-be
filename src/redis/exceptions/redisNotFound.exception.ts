export class RedisNotFoundException extends Error {
  constructor(key: string) {
    super(`Key ${key} not found in cache`);
    this.name = 'RedisNotFoundException';
  }
}
