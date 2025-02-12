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
import { LoginDto } from './dto/req.dto';
import { LoginResDto } from './dto/res.dto';

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
    const { refreshToken, ...rest } = await this.authService.login(loginDto);
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 6),
      path: '/auth',
    });
    return rest;
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
    const { refreshToken: newRefreshToken, ...rest } =
      await this.authService.refresh(request.cookies.refreshToken ?? '');
    response.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 6),
      path: '/auth',
    });
    return rest;
  }
}
