import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsJWT, IsString } from 'class-validator';
import { IsGistEmail } from 'src/global/validator/gistEmail.validator';

export class RegisterDto {
  @ApiProperty({
    example: 'JohnDoe@gm.gist.ac.kr',
    description: 'GIST 이메일',
  })
  @IsEmail()
  @IsGistEmail({ message: 'GIST 이메일을 입력해주세요.' })
  email: string;

  @ApiProperty({
    example: 'password1234',
    description: '비밀번호',
  })
  @IsString()
  password: string;

  @ApiProperty({
    example: 'John Doe',
    description: '이름',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: '20180000',
    description: '학번',
  })
  @IsString()
  studentId: string;

  @ApiProperty({
    example: '01012345678',
    description: '전화번호',
  })
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImpvaG5AZ21haWwuY29tIiwiaWF0IjoxNjI2NzQwMjY5LCJleHAiOjE2MjY3NDAyNzZ9.4RZq0Xq2vHf6VQ5o4GtG6tKv4oL9a8kF8y0JW7w5ZlY',
    description: '이메일 인증 jwt 토큰',
  })
  @IsJWT()
  certificationJwtToken: string;
}
