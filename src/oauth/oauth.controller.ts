import { ConvertCaseInterceptor } from '@lib/global';
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
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { UserGuard } from 'src/auth/guard/auth.guard';

import { AuthorizeDto } from './dto/req/authorize.dto';
import { RevokeDto } from './dto/req/revoke.dto';
import { TokenDto } from './dto/req/token.dto';
import { AuthorizeResDto } from './dto/res/authorizeRes.dto';
import { TokenResDto } from './dto/res/tokenRes.dto';
import { OauthService } from './oauth.service';

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
  @ApiBearerAuth('user:jwt')
  @Post('authorize')
  @UseGuards(UserGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async authorize(
    @Body() authorizeDto: AuthorizeDto,
    @GetUser() user: User,
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
  async token(@Body() body: TokenDto): Promise<TokenResDto> {
    return this.oauthService.token(body);
  }

  @ApiOperation({
    summary: 'Revoke',
    description: 'Revoke the token',
  })
  @ApiCreatedResponse({ description: 'Revoke' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @Post('revoke')
  @UsePipes(new ValidationPipe({ transform: true }))
  async revoke(@Body() body: RevokeDto): Promise<void> {
    return this.oauthService.revoke(body);
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

  //TODO: Implement get user info
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
