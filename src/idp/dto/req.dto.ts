import { IsGistEmail } from '@lib/global';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'JohbDoe@gm.gist.ac.kr',
    description: '유저의 이메일 주소',
  })
  @IsEmail()
  @IsGistEmail()
  email: string;

  @ApiProperty({
    example: 'password1234',
    description: '유저의 비밀번호',
  })
  @IsString()
  password: string;
}
