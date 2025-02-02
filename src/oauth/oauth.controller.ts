import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { OauthService } from './oauth.service';
import {
  ApiBasicAuth,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
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
import { AuthorizeResDto } from './dto/res/authorizeRes.dto';
import { ConvertCaseInterceptor } from '@lib/global';

@ApiTags('oauth')
@Controller('oauth')
@UseInterceptors(ConvertCaseInterceptor)
export class OauthController {
  constructor(private readonly oauthService: OauthService) {}

  @ApiOperation({
    summary: 'Authorize',
    description: 'Authorize',
  })
  @ApiCreatedResponse({ description: 'Authorize', type: AuthorizeResDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiBearerAuth('access-token')
  @Post('authorize')
  @UseGuards(IdpGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async authorize(
    @Body() authorizeDto: AuthorizeDto,
    @GetUser() user: UserInfo,
  ): Promise<AuthorizeResDto> {
    return this.oauthService.authorize(authorizeDto, user);
  }

  @ApiOperation({
    summary: 'Token',
    description: 'Token',
  })
  @ApiCreatedResponse({ description: 'Token', type: TokenResDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiBasicAuth('client-auth')
  @HttpCode(HttpStatus.OK)
  @Post('token')
  @UseGuards(ClientOptionalGuard)
  async token(
    @Body() body: TokenDto,
    @GetClient() client: Client,
  ): Promise<TokenResDto> {
    return this.oauthService.token(body, client);
  }

  @ApiOperation({
    summary: 'Revoke',
    description: 'Revoke the token',
  })
  @ApiCreatedResponse({ description: 'Revoke' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @Post('revoke')
  @UseGuards(ClientOptionalGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async revoke(
    @Body() body: RevokeDto,
    @GetClient() client: Client,
  ): Promise<void> {
    return this.oauthService.revoke(body, client);
  }

  @ApiOperation({
    summary: 'certs',
    description: 'returns the public key',
  })
  @ApiOkResponse({ description: 'certs' })
  @Get('certs')
  certs(): object {
    return this.oauthService.certs();
  }

  @ApiOperation({
    summary: 'userinfo',
    description: 'returns userinfo',
  })
  @ApiOkResponse({ description: 'userinfo' })
  @Get('userinfo')
  @UseGuards(Oauth2Guard)
  userinfo(@GetUser() user: UserInfo): UserInfo {
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
