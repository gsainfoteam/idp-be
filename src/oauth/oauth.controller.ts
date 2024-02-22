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
import { ClientOptionalGuard } from 'src/client/guard/clientOptional.guard';
import { TokenDto } from './dto/req/token.dto';
import { GetClient } from 'src/client/decorator/getClient.decorator';
import { Client } from '@prisma/client';
import { TokenResDto } from './dto/res/tokenRes.dto';
import { RevokeDto } from './dto/req/revoke.dto';
import { Oauth2Guard } from './guard/oauth2.guard';

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

  @Post('token')
  @UseGuards(ClientOptionalGuard)
  async token(
    @Body() body: TokenDto,
    @GetClient() client: Client,
  ): Promise<TokenResDto> {
    return this.oauthService.token(body, client);
  }

  @Post('revoke')
  @UseGuards(ClientOptionalGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async revoke(@Body() body: RevokeDto, @GetClient() client: Client) {
    return this.oauthService.revoke(body, client);
  }

  @Get('certs')
  async certs() {
    return this.oauthService.certs();
  }

  @Get('userinfo')
  @UseGuards(Oauth2Guard)
  async userinfo(@GetUser() user: UserInfo) {
    return user;
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
