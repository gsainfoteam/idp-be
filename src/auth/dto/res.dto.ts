import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class LoginResDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX9.eyJzdWIiOiJqb2huZG9lQGdtLmdpc3QuYWMua3IiLCJpYXQiOjE2MzIwNzIwMzYsImV4cCI6MTYzMjA3MjA5Nn0.',
    description: '액세스 토큰',
  })
  accessToken: string;
}

export class UserResDto implements User {
  @ApiProperty({
    example: 'uuid',
    description: '유저 uuid',
  })
  uuid: string;

  @ApiProperty({
    example: 'email',
    description: '유저 이메일',
  })
  email: string;

  @ApiProperty({
    example: 'name',
    description: '유저 이름',
  })
  name: string;

  @ApiProperty({
    example: 'profile',
    description: '프로필 사진',
  })
  profile: string | null;

  @ApiProperty({
    example: 'studentId',
    description: '학번',
  })
  studentId: string;

  @ApiProperty({
    example: 'phoneNumber',
    description: '전화번호',
  })
  phoneNumber: string;

  @ApiProperty({
    example: 'createdAt',
    description: '생성일',
  })
  createdAt: Date;

  @ApiProperty({
    example: 'updatedAt',
    description: '수정일',
  })
  updatedAt: Date;

  @Exclude()
  password: string;

  constructor(user: User) {
    Object.assign(this, user);
  }
}
