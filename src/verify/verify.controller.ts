import { ExceptionLoggerFilter } from '@lib/logger';
import {
  Body,
  Controller,
  Post,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import {
  SendEmailCodeDto,
  VerifyCodeDto,
  VerifyStudentIdDto,
} from './dto/req.dto';
import { StudentIdDto, VerificationJwtResDto } from './dto/res.dto';
import { VerifyService } from './verify.service';

@ApiTags('verify')
@Controller('verify')
@UsePipes(new ValidationPipe({ transform: true }))
@UseFilters(new ExceptionLoggerFilter())
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  @ApiOperation({
    summary: 'verify certification code',
    description:
      'verify the certification code. If the code is valid, return the jwt token',
  })
  @ApiResponse({
    status: 200,
    description: 'success',
    type: VerificationJwtResDto,
  })
  @ApiBadRequestResponse({
    description: 'certification code is not valid or timeout',
  })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @Post()
  async verify(@Body() body: VerifyCodeDto): Promise<VerificationJwtResDto> {
    return this.verifyService.validateCode(body);
  }

  @ApiOperation({
    summary: 'send email certification code',
    description:
      'send the email certification code to the email address. The code is valid for 5 minutes.',
  })
  @ApiResponse({ status: 201, description: 'success' })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @Post('/email')
  async sendEmailCertificationCode(
    @Body() body: SendEmailCodeDto,
  ): Promise<void> {
    await this.verifyService.sendEmailCode(body);
  }

  @Post('/studentId')
  async verifyStudentId(
    @Body() dto: VerifyStudentIdDto,
  ): Promise<StudentIdDto> {
    return await this.verifyService.verifyStudentId(dto);
  }
}
