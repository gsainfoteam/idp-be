import { IsEmail } from 'class-validator';
import { IsGistEmail } from 'src/global/validator/gistEmail.validator';

export class SendCertificationCodeDto {
  @IsEmail()
  @IsGistEmail({ message: 'GIST 이메일을 입력해주세요.' })
  email: string;
}
