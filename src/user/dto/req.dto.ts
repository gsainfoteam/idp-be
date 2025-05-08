import { IsGistEmail } from '@lib/global';
import { IsStudentId } from '@lib/global/validator/studentId.validator';
import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsJWT, IsString, MaxLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'JohnDoe@gm.gist.ac.kr',
    description: 'GIST 이메일',
  })
  @IsEmail()
  @IsGistEmail()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    throw new BadRequestException('이메일 형식이 올바르지 않습니다.');
  })
  email: string;

  @ApiProperty({
    example: 'password1234',
    description: '비밀번호',
  })
  @IsString()
  password: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp9.eyJlbWFpbCI6ImpvaG5AZ21haWwuY29tIiwiaWF0IjoxNjI2NzQwMjY5LCJleHAiOjE2MjY3NDAyNzZ9.4RZq0Xq2vHf6VQ5o4GtG6tKv4oL9a8kF8y0JW7w5ZlY',
    description: '이메일 인증 jwt 토큰',
  })
  @IsJWT()
  verificationJwtToken: string;
}

export class RegisterDto {
  @ApiProperty({
    example: 'JohnDoe@gm.gist.ac.kr',
    description: 'GIST 이메일',
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
  @IsStudentId()
  studentId: string;

  @ApiProperty({
    example: '01012345678',
    description: '전화번호',
  })
  @IsString()
  @MaxLength(30)
  phoneNumber: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6Ikp9.eyJlbWFpbCI6ImpvaG5AZ21haWwuY29tIiwiaWF0IjoxNjI2NzQwMjY5LCJleHAiOjE2MjY3NDAyNzZ9.4RZq0Xq2vHf6VQ5o4GtG6tKv4oL9a8kF8y0JW7w5ZlY',
    description: '이메일 인증 jwt 토큰',
  })
  @IsJWT()
  verificationJwtToken: string;
}

export class DeleteUserReqDto {
  @ApiProperty({
    example: 'password',
    description: '비밀번호',
  })
  @IsString()
  password: string;
}
