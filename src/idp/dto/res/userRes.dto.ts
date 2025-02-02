import { ApiProperty } from '@nestjs/swagger';
import { AccessLevel, User } from '@prisma/client';

export class UserResDto implements Omit<User, 'password'> {
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

  @ApiProperty({
    example: 'accessLevel',
    description: '접근 권한',
    enum: AccessLevel,
  })
  accessLevel: AccessLevel;
}
