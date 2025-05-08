import { IsGistEmail } from '@lib/global';
import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

import { VerificationList, VerificationType } from '../types/verification.type';

export class SendEmailCodeDto {
  @ApiProperty({
    example: 'JohnDoe@gm.gist.ac.kr',
    description: 'GIST 이메일',
    required: true,
  })
  @IsEmail()
  @IsGistEmail({ message: 'GIST 이메일을 입력해주세요.' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    throw new BadRequestException('이메일 형식이 올바르지 않습니다.');
  })
  email: string;
}

export class VerifyCodeDto {
  @ApiProperty({
    example: 'JohnDoe@gm.gist.ac.kr',
    description: 'GIST 이메일 혹은 다른 인증 대상의 대푯값',
    required: true,
  })
  subject: string;

  @ApiProperty({
    example: 'verification-code',
    description: '인증 코드',
    required: true,
  })
  code: string;

  @ApiProperty({
    example: 'email',
    description: '인증 타입',
    required: true,
    enum: VerificationList,
  })
  hint: VerificationType;
}
