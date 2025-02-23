import { ApiProperty } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Exclude } from 'class-transformer';

export class UserResDto implements User {
  @ApiProperty({
    example: '홍길동',
    description: '사용자 이름',
  })
  name: string;

  @ApiProperty({
    example: 'uuid',
    description: '사용자 uuid',
  })
  uuid: string;

  @ApiProperty({
    example: 'https://bucket.s3.ap-northeast-2.amazonaws.com/1626740269.webp',
    description: '프로필 이미지 url',
  })
  profile: string | null;

  @ApiProperty({
    example: 'johndoe@gm.gist.ac.kr',
    description: '사용자 이메일',
  })
  email: string;

  @ApiProperty({
    example: '20180000',
    description: '사용자 학번',
  })
  studentId: string;

  @ApiProperty({
    example: '01012345678',
    description: '사용자 전화번호',
  })
  phoneNumber: string;

  @ApiProperty({
    example: '2021-07-20T14:31:09.000Z',
    description: '가입일',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2021-07-20T14:31:09.000Z',
    description: '최근 수정일',
  })
  updatedAt: Date;

  @Exclude()
  password: string;

  constructor(user: User) {
    Object.assign(this, user);
  }
}

export class UpdateUserProfileResDto {
  @ApiProperty({
    example:
      'https://bucket.s3.ap-northeast-2.amazonaws.com/1626740269/profile.webp',
    description: '프로필 이미지 presigned url',
  })
  presignedUrl: string;
}
