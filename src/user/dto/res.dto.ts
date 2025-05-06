import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { Exclude } from 'class-transformer';

import { UserConsentType } from '../types/userConsent.type';

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

  @ApiPropertyOptional({
    example: 'https://bucket.s3.ap-northeast-2.amazonaws.com/1626740269.webp',
    description: '프로필 이미지 url',
    type: 'string',
    nullable: true,
  })
  picture: string | null;

  @ApiPropertyOptional({
    example: 'https://idp.gistory.me/profile/name',
    description: '사용자 idp profile url',
    type: 'string',
    nullable: true,
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

export class UpdateUserPictureResDto {
  @ApiProperty({
    example:
      'https://bucket.s3.ap-northeast-2.amazonaws.com/1626740269/profile.webp',
    description: '프로필 이미지 presigned url',
  })
  presignedUrl: string;
}

export class UserConsentClientResDto {
  @ApiProperty({
    example: 'client name',
    description: 'client 이름',
  })
  name: string;

  @ApiProperty({
    example: 'uuid',
    description: 'client uuid',
  })
  uuid: string;

  @ApiProperty({
    example: ['scope1', 'scope2'],
    description: 'client scope',
  })
  scopes: string[];

  @ApiProperty({
    example: ['optionalScope1', 'optionalScope2'],
    description: 'optional scope',
  })
  optionalScopes: string[];
}

export class UserConsentResDto implements UserConsentType {
  @ApiProperty({
    example: UserConsentClientResDto,
    description: 'client information',
    type: UserConsentClientResDto,
  })
  client: UserConsentClientResDto;

  @ApiProperty({
    example: 'uuid',
    description: 'client Uuid',
  })
  clientUuid: string;

  @ApiProperty({
    example: ['scope1', 'scope2'],
    description: 'consent scope',
  })
  scopes: string[];

  @ApiProperty({
    example: '2021-07-20T14:31:09.000Z',
    description: 'the time when the consent was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2021-07-20T14:31:09.000Z',
    description: 'the time when the consent was updated',
  })
  updatedAt: Date;

  @Exclude()
  userUuid: string;

  constructor(consent: UserConsentType) {
    Object.assign(this, consent);
  }
}

export class UserConsentListResDto {
  @ApiProperty({
    example: [UserConsentResDto],
    description: 'consent list',
    type: [UserConsentResDto],
  })
  list: UserConsentResDto[];
}
