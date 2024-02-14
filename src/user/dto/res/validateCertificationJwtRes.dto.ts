import { ApiProperty } from '@nestjs/swagger';

export class ValidateCertificationJwtResDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImpvaG5AZ21haWwuY29tIiwiaWF0IjoxNjI2NzQwMjY5LCJleHAiOjE2MjY3NDAyNzZ9.4RZq0Xq2vHf6VQ5o4GtG6tKv4oL9a8kF8y0JW7w5ZlY',
    description: 'jwt 토큰',
  })
  certificationJwtToken: string;
}
