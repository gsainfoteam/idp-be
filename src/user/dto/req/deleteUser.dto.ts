import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { IsGistEmail } from 'src/global/validator/gistEmail.validator';

export class DeleteUserDto {
  @ApiProperty({
    example: 'JohnDoe@gm.gist.ac.kr',
    description: 'GIST 이메일',
  })
  @IsEmail()
  @IsGistEmail()
  email: string;

  @ApiProperty({
    example: 'password1234',
    description: '비밀번호',
  })
  @IsString()
  password: string;
}
