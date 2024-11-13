import { HttpException, HttpStatus } from '@nestjs/common';

export class CacheNotFoundException extends HttpException {
  constructor(key: string) {
    super(`Cache not found: ${key}`, HttpStatus.NOT_FOUND);
    this.name = 'CacheNotFoundException';
  }
}
