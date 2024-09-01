import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
} from '@nestjs/swagger';

@Controller()
export class AppController {
  private readonly apiVersion =
    this.configService.getOrThrow<string>('API_VERSION');
  private readonly publishedAt = new Date().toISOString();
  constructor(private readonly configService: ConfigService) {}

  @ApiOperation({
    summary: 'API INFO',
    description: 'API 서버의 정보를 확인합니다.',
  })
  @ApiOkResponse()
  @ApiInternalServerErrorResponse()
  @Get()
  async health() {
    return {
      name: 'IdP',
      version: this.apiVersion,
      publishedAt: this.publishedAt,
    };
  }
}
