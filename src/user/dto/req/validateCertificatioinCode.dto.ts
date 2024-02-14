import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { IsGistEmail } from 'src/global/validator/gistEmail.validator';

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
