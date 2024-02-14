import {
  Body,
  Controller,
  Delete,
  Post,
  Req,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { IdpService } from './idp.service';
import {
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/req/login.dto';
import { LoginResDto } from './dto/res/loginRes.dto';
import { Request, Response } from 'express';

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
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResDto> {
    const { refreshToken, ...rest } = await this.idpService.login(loginDto);
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 6),
    });
    return rest;
  }

  @ApiOperation({ summary: '로그아웃' })
  @ApiResponse({ status: 204, description: '로그아웃 성공' })
  @ApiInternalServerErrorResponse({ description: '서버 에러' })
  @Delete('logout')
  async logout(@Res({ passthrough: true }) response: Response): Promise<void> {
    response.clearCookie('refreshToken');
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
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginResDto> {
    const { refreshToken: newRefreshToken, ...rest } =
      await this.idpService.refresh(request.cookies.refreshToken);
    response.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 6),
    });
    return rest;
  }
}
