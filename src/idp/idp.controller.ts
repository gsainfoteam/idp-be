import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { FastifyReply, FastifyRequest } from 'fastify';

import { GetUser } from './decorator/getUser.decorator';
import { LoginDto } from './dto/req.dto';
import { LoginResDto, UserResDto } from './dto/res.dto';
import { IdpGuard } from './guard/idp.guard';
import { IdpService } from './idp.service';

@ApiTags('idp')
@Controller('idp')
@UsePipes(ValidationPipe)
@UseInterceptors(ClassSerializerInterceptor)
export class IdpController {
  constructor(private readonly idpService: IdpService) {}

  @ApiOperation({
    summary: 'login',
    description:
      '로그인을 수행합니다. 이때, refreshToken은 cookie로 전달됩니다.',
  })
  @ApiResponse({ type: LoginResDto })
  @ApiUnauthorizedResponse({ description: '로그인 실패' })
  @ApiInternalServerErrorResponse({ description: '서버 에러' })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<LoginResDto> {
    const { refreshToken, ...rest } = await this.idpService.login(loginDto);
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 6),
      path: '/idp',
    });
    return rest;
  }

  @ApiOperation({ summary: 'logout' })
  @ApiResponse({ status: 204, description: '로그아웃 성공' })
  @ApiInternalServerErrorResponse({ description: '서버 에러' })
  @Delete('logout')
  async logout(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<void> {
    await this.idpService.logout(request.cookies.refreshToken ?? '');
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/idp',
    });
  }

  @ApiOperation({
    summary: 'refresh access token',
    description:
      '액세스 토큰을 갱신합니다. 이때, refreshToken은 cookie로 전달됩니다.',
  })
  @ApiResponse({ type: LoginResDto })
  @ApiUnauthorizedResponse({ description: '유효하지 않은 refreshToken' })
  @ApiInternalServerErrorResponse({ description: '서버 에러' })
  @Post('refresh')
  async refresh(
    @Req() request: FastifyRequest,
    @Res({ passthrough: true }) response: FastifyReply,
  ): Promise<LoginResDto> {
    const { refreshToken: newRefreshToken, ...rest } =
      await this.idpService.refresh(request.cookies.refreshToken ?? '');
    response.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 6),
      path: '/idp',
    });
    return rest;
  }

  @ApiOperation({
    summary: 'get user info',
    description: '회원 정보를 반환합니다.',
  })
  @ApiResponse({ type: UserResDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @ApiBearerAuth('idp:jwt')
  @Get('user')
  @UseGuards(IdpGuard)
  getUserInfo(@GetUser() user: User): UserResDto {
    return new UserResDto(user);
  }
}
