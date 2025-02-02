import {
  Body,
  Controller,
  Delete,
  Post,
  Get,
  Req,
  Res,
  UsePipes,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { IdpService } from './idp.service';
import {
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/req/login.dto';
import { LoginResDto } from './dto/res/loginRes.dto';
import { IdpGuard } from './guard/idp.guard';
import { GetUser } from './decorator/getUser.decorator';
import { UserResDto } from './dto/res/userRes.dto';
import { UserInfo } from './types/userInfo.type';
import { FastifyReply, FastifyRequest } from 'fastify';

@ApiTags('idp')
@Controller('idp')
@UsePipes(ValidationPipe)
export class IdpController {
  constructor(private readonly idpService: IdpService) {}

  @ApiOperation({
    summary: '로그인',
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

  @ApiOperation({ summary: '로그아웃' })
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
    summary: '액세스 토큰 갱신',
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
    summary: '회원 정보',
    description: '회원 정보를 반환합니다.',
  })
  @ApiResponse({ type: UserResDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @ApiBearerAuth('access-token')
  @Get('user')
  @UseGuards(IdpGuard)
  getUserInfo(@GetUser() user: UserInfo): UserResDto {
    return user;
  }
}
