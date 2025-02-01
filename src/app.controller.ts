import { Loggable } from '@lib/logger';
import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

@Controller()
export class AppController {
  private readonly apiVersion: string;
  private readonly publishedAt: string;
  constructor(private readonly configService: ConfigService) {
    this.apiVersion = this.configService.getOrThrow<string>('API_VERSION');
    this.publishedAt = new Date().toISOString();
  }

  @ApiOperation({
    summary: 'Get information about the service',
    description: 'Returns the information about the service',
  })
  @ApiOkResponse()
  @ApiInternalServerErrorResponse()
  @Get()
  async info() {
    return {
      name: 'infoteam-idp',
      version: this.apiVersion,
      publishedAt: this.publishedAt,
    };
  }
}
