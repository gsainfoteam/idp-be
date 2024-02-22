import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { OauthService } from './oauth.service';
import { ConvertCaseInterceptor } from 'src/global/interceptor/convertCase.interceptor';
import {
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IdpGuard } from 'src/idp/guard/idp.guard';
import { AuthorizeDto } from './dto/req/authorize.dto';
import { GetUser } from 'src/idp/decorator/getUser.decorator';
import { UserInfo } from 'src/idp/types/userInfo.type';

@Controller('oauth')
@UseInterceptors(ConvertCaseInterceptor)
export class OauthController {
  constructor(private readonly oauthService: OauthService) {}

  @Post('authorize')
  @UseGuards(IdpGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async authorize(
    @Body() authorizeDto: AuthorizeDto,
    @GetUser() user: UserInfo,
  ) {
    return this.oauthService.authorize(authorizeDto, user);
  }
}

@ApiTags('OpenID Connect Discovery')
@Controller('.well-known/openid-configuration')
export class OpenIDDiscoveryController {
  constructor(private readonly oauthService: OauthService) {}

  @ApiOperation({
    summary: 'OpenID Connect Discovery',
    description: 'OpenID Connect Discovery',
  })
  @ApiResponse({ status: 200, description: 'OpenID Connect Discovery' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get()
  discovery(): object {
    return this.oauthService.discovery();
  }
}
