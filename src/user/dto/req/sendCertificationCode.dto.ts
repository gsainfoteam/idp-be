import { IsGistEmail } from '@lib/global';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';
import { CertificationCodeEnum } from 'src/user/types/certificationCode.type';

export class SendCertificationCodeDto {
  @ApiProperty({
    example: 'JohnDoe@gm.gist.ac.kr',
    description: 'GIST 이메일',
    required: true,
  })
  @IsEmail()
  @IsGistEmail({ message: 'GIST 이메일을 입력해주세요.' })
  email: string;

  @ApiProperty({
    example: 'register or password',
    description: '인증 코드 타입',
    required: true,
  })
  @IsEnum(CertificationCodeEnum)
  type: CertificationCodeEnum;
}
