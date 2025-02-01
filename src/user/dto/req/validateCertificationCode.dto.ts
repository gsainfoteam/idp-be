import { IsGistEmail } from '@lib/global';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class ValidationCertificationCodeDto {
  @ApiProperty({
    example: 'JohnDoe@gm.gist.ac.kr',
    description: 'GIST 이메일',
    required: true,
  })
  @IsEmail()
  @IsGistEmail({ message: 'GIST 이메일을 입력해주세요.' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: '이메일 인증 코드',
    required: true,
  })
  @IsString()
  code: string;
}
