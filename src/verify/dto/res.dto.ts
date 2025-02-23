import { ApiProperty } from '@nestjs/swagger';

export class VerificationJwtResDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV...',
    description: 'jwt 토큰',
  })
  verificationJwtToken: string;
}
