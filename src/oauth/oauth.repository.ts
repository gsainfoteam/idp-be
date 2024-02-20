import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OauthRepository {
  constructor(private readonly prismaService: PrismaService) {}
}
