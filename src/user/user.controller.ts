import {
  Body,
  Controller,
  Delete,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  ChangePasswordDto,
  DeleteUserDto,
  RegisterDto,
  SendCertificationCodeDto,
  ValidationCertificationCodeDto,
} from './dto/req.dto';
import { ValidateCertificationJwtResDto } from './dto/res.dto';
import { UserService } from './user.service';

@ApiTags('user')
@Controller('user')
@UsePipes(new ValidationPipe({ transform: true }))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'send email certification code',
    description:
      '이메일 코드를 전송하는 api이다. gist이메일이여야지 작동한다는 사실을 주의해야 한다.',
  })
  @ApiResponse({ status: 201, description: '성공' })
  @ApiConflictResponse({ description: '이미 존재하는 유저' })
  @ApiInternalServerErrorResponse({ description: '서버 에러' })
  @Post('/register/code')
  async sendEmailCertificationCode(
    @Body() body: SendCertificationCodeDto,
  ): Promise<void> {
    return this.userService.sendEmailCertificationCode(body);
  }

  @ApiOperation({
    summary: 'verify email certification code',
    description:
      '이메일 코드를 검증하는 api이다. 이메일과 코드가 일치해야지 jwt토큰을 반환한다.',
  })
  @ApiResponse({
    status: 200,
    description: '성공',
    type: ValidateCertificationJwtResDto,
  })
  @ApiForbiddenResponse({ description: '인증 코드가 일치하지 않거나 시간초과' })
  @ApiInternalServerErrorResponse({ description: '서버 에러' })
  @Post('/register/validate')
  async validateCertificationCode(
    @Body() body: ValidationCertificationCodeDto,
  ): Promise<ValidateCertificationJwtResDto> {
    return this.userService.validateCertificationCode(body);
  }

  @ApiOperation({
    summary: 'sign up',
    description: '회원가입하는 api이다.',
  })
  @ApiResponse({ status: 201, description: '성공' })
  @ApiConflictResponse({ description: '이미 존재하는 유저' })
  @ApiForbiddenResponse({ description: '인증 토큰이 일치하지 않음' })
  @ApiInternalServerErrorResponse({ description: '서버 에러' })
  @Post('/register')
  async register(@Body() body: RegisterDto): Promise<void> {
    return this.userService.register(body);
  }

  @ApiOperation({
    summary: 'change password',
    description: '비밀번호를 변경하는 api이다.',
  })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiForbiddenResponse({ description: '유효하지 않은 토큰' })
  @ApiInternalServerErrorResponse({ description: '서버 에러' })
  @Patch('/password')
  async changePassword(@Body() body: ChangePasswordDto): Promise<void> {
    return this.userService.changePassword(body);
  }

  @ApiOperation({
    summary: 'delete user',
    description: '회원탈퇴하는 api이다.',
  })
  @ApiResponse({ status: 200, description: '성공' })
  @ApiForbiddenResponse({ description: '비밀번호가 일치하지 않음' })
  @ApiInternalServerErrorResponse({ description: '서버 에러' })
  @Delete('')
  async DeleteUserDto(@Body() body: DeleteUserDto): Promise<void> {
    return this.userService.deleteUser(body);
  }
}
