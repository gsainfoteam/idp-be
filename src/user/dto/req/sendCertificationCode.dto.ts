import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { IsGistEmail } from 'src/global/validator/gistEmail.validator';

export class SendCertificationCodeDto {
  @ApiProperty({
    example: 'JohnDoe@gm.gist.ac.kr',
    description: 'GIST 이메일',
    required: true,
  })
  @IsEmail()
  @IsGistEmail({ message: 'GIST 이메일을 입력해주세요.' })
  email: string;
}
