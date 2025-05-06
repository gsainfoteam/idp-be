import { AllowCorsInterceptor } from '@lib/global/interceptor/allowCors.interceptor';
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { WellKnownService } from './well-known.service';

@ApiTags('well-known')
@Controller('.well-known')
@UseInterceptors(AllowCorsInterceptor)
export class WellKnownController {
  constructor(private readonly wellKnownService: WellKnownService) {}

  @Get('openid-configuration')
  discovery(): object {
    return this.wellKnownService.discovery();
  }
}
