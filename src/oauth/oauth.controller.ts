import {
  Body,
  Controller,
  Delete,
  Get,
  HttpRedirectResponse,
  Post,
  Query,
  Redirect,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiPermanentRedirectResponse,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { UserGuard } from 'src/auth/guard/auth.guard';

import {
  AuthorizationReqDto,
  ConsentReqDto,
  RevokeReqDto,
  TokenReqDto,
} from './dto/req.dto';
import { TokenResDto } from './dto/res.dto';
import { BasicAuthGuard } from './guards/basicAuth.guard';
import { OauthService } from './oauth.service';
import { GrantContentType } from './types/grant.type';

@Controller('oauth')
@UsePipes(new ValidationPipe({ transform: true }))
export class OauthController {
  constructor(private readonly oauthService: OauthService) {}

  @ApiCreatedResponse({
    description:
      'make the user consent to the client. through this endpoint, the user can agree to use the client.',
  })
  @Post('consent')
  @UseGuards(UserGuard)
  async consent(
    @Body() body: ConsentReqDto,
    @GetUser() user: User,
  ): Promise<void> {
    return this.oauthService.consent(body, user);
  }

  @ApiPermanentRedirectResponse({
    description:
      'it move to client uri with certain query parameters, ex) https://client.com/callback?code=123&state=123&iss=https://auth-server.com',
  })
  @Redirect()
  @Get('authorize')
  @UseGuards(UserGuard)
  async authorize(
    @Query() query: AuthorizationReqDto,
    @GetUser() user: User,
  ): Promise<HttpRedirectResponse> {
    return {
      url: await this.oauthService.authorize(query, user),
      statusCode: 302,
    };
  }

  @ApiOperation({})
  @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
  @UseGuards(BasicAuthGuard)
  @Post('token')
  token(@Body() body: TokenReqDto): Promise<TokenResDto> {
    return this.oauthService.token(body as GrantContentType);
  }

  @ApiOperation({})
  @Delete('token')
  async revoke(@Body() body: RevokeReqDto): Promise<void> {
    return this.oauthService.revoke(body);
  }
}
