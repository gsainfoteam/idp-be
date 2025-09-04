import { ExceptionLoggerFilter } from '@lib/logger';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Post,
  Req,
  Res,
  UseFilters,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AuthService } from './auth.service';
import {
  LoginDto,
  PasskeyDto,
  VerifyPasskeyAuthenticationDto,
  VerifyPasskeyRegistrationDto,
} from './dto/req.dto';
import { LoginResDto } from './dto/res.dto';
import { LoginResultType } from './types/loginResult.type';

@ApiTags('auth')
@Controller('auth')
@UsePipes(ValidationPipe)
@UseInterceptors(ClassSerializerInterceptor)
@UseFilters(new ExceptionLoggerFilter())
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'login',
    description:
      '로그인을 수행합니다. 이때, refreshToken은 cookie로 전달됩니다.',
  })
  @ApiCreatedResponse({ description: '성공', type: LoginResDto })
  @ApiUnauthorizedResponse({ description: '로그인 실패' })
  @ApiInternalServerErrorResponse({ description: '서버 에러' })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<LoginResDto> {
    const {
      refreshToken,
      accessToken,
      refreshTokenExpireTime,
      accessTokenExpireTime,
    } = await this.authService.login(loginDto);
    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + accessTokenExpireTime),
      path: '/',
    });
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + refreshTokenExpireTime),
      path: '/auth',
    });
    return {
      accessToken,
    };
  }

  @ApiOperation({ summary: 'logout' })
  @ApiOkResponse({ description: '로그아웃 성공' })
  @ApiInternalServerErrorResponse({ description: '서버 에러' })
  @Delete('logout')
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<void> {
    await this.authService.logout(request.cookies.refreshToken ?? '');
    response.clearCookie('accessToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/auth',
    });
  }

  @ApiOperation({
    summary: 'refresh access token',
    description:
      '액세스 토큰을 갱신합니다. 이때, refreshToken은 cookie로 전달됩니다.',
  })
  @ApiCreatedResponse({ description: '성공', type: LoginResDto })
  @ApiUnauthorizedResponse({ description: '유효하지 않은 refreshToken' })
  @ApiInternalServerErrorResponse({ description: '서버 에러' })
  @Post('refresh')
  async refresh(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<LoginResDto> {
    const {
      refreshToken: newRefreshToken,
      accessToken,
      refreshTokenExpireTime,
      accessTokenExpireTime,
    } = await this.authService.refresh(request.cookies.refreshToken ?? '');
    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + accessTokenExpireTime),
      path: '/',
    });
    response.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + refreshTokenExpireTime),
      path: '/auth',
    });
    return {
      accessToken,
    };
  }

  @ApiOperation({
    summary: 'register the passkey',
    description: '패스키를 등록을 위한 challenge를 발급합니다.',
  })
  @Post('passkey/register')
  async registerOptions(
    @Body() { email }: PasskeyDto,
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    return this.authService.registerOptions(email);
  }

  @ApiOperation({
    summary: 'verify the registration options',
    description: '패스키 등록합니다.',
  })
  @Post('passkey/register/verify')
  async verifyRegistration(
    @Body() { email, registrationResponse }: VerifyPasskeyRegistrationDto,
  ): Promise<LoginResultType> {
    return this.authService.verifyRegistration(email, registrationResponse);
  }

  @ApiOperation({
    summary: 'login the passkey',
    description: '패스키를 사용해 로그인합니다.',
  })
  @Post('passkey/login')
  async loginPasskey(
    @Body() { email }: PasskeyDto,
  ): Promise<PublicKeyCredentialRequestOptionsJSON> {
    return this.authService.authenticateOptions(email);
  }

  @ApiOperation({
    summary: 'verify the passkey options',
    description: '패스키를 인증합니다.',
  })
  @Post('passkey/login/verify')
  async verifyPasskey(
    @Body() { email, authenticationResponse }: VerifyPasskeyAuthenticationDto,
  ): Promise<LoginResultType> {
    return this.authService.verifyAuthentication(email, authenticationResponse);
  }
}
