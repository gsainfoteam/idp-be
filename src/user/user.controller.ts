import { ExceptionLoggerFilter } from '@lib/logger';
import {
  Body,
  Controller,
  Delete,
  Patch,
  Post,
  UseFilters,
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
@UseFilters(new ExceptionLoggerFilter())
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'send email certification code',
    description:
      'send the email certification code to the email address. The code is valid for 5 minutes.',
  })
  @ApiResponse({ status: 201, description: 'success' })
  @ApiConflictResponse({ description: 'user already exists' })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @Post('/cert/code')
  async sendEmailCertificationCode(
    @Body() body: SendCertificationCodeDto,
  ): Promise<void> {
    return this.userService.sendEmailCertificationCode(body);
  }

  @ApiOperation({
    summary: 'verify email certification code',
    description:
      'verify the email certification code. If the code is valid, return the jwt token',
  })
  @ApiResponse({
    status: 200,
    description: 'success',
    type: ValidateCertificationJwtResDto,
  })
  @ApiForbiddenResponse({
    description: 'certification code is not valid or timeout',
  })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @Post('/cert/validate')
  async validateCertificationCode(
    @Body() body: ValidationCertificationCodeDto,
  ): Promise<ValidateCertificationJwtResDto> {
    return this.userService.validateCertificationCode(body);
  }

  @ApiOperation({
    summary: 'sign up',
    description: 'api for the sign up',
  })
  @ApiResponse({ status: 201, description: 'success' })
  @ApiConflictResponse({ description: 'user already exists' })
  @ApiForbiddenResponse({ description: 'certification token is not valid' })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @Post('/register')
  async register(@Body() body: RegisterDto): Promise<void> {
    return this.userService.register(body);
  }

  @ApiOperation({
    summary: 'change password',
    description: 'api for changing password',
  })
  @ApiResponse({ status: 200, description: 'success' })
  @ApiForbiddenResponse({ description: 'token not valid' })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @Patch('/password')
  async changePassword(@Body() body: ChangePasswordDto): Promise<void> {
    return this.userService.changePassword(body);
  }

  @ApiOperation({
    summary: 'delete user',
    description: 'api for deleting user',
  })
  @ApiResponse({ status: 200, description: 'success' })
  @ApiForbiddenResponse({ description: 'password is not valid' })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @Delete()
  async DeleteUserDto(@Body() body: DeleteUserDto): Promise<void> {
    return this.userService.deleteUser(body);
  }
}
