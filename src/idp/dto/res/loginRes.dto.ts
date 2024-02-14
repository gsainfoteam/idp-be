import { ApiProperty } from '@nestjs/swagger';

export class LoginResDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huZG9lQGdtLmdpc3QuYWMua3IiLCJpYXQiOjE2MzIwNzIwMzYsImV4cCI6MTYzMjA3MjA5Nn0.',
    description: '액세스 토큰',
  })
  accessToken: string;
}
