import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ClientService } from './client.service';
import {
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IdpGuard } from 'src/idp/guard/idp.guard';
import { User } from '@prisma/client';
import { GetUser } from 'src/idp/decorator/getUser.decorator';
import { ClientResDto } from './dto/res/clientRes.dto';

@ApiTags('client')
@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @ApiOperation({
    summary: 'Get client list',
    description: '유저가 멤버로 있는 client의 리스트를 알려준다.',
  })
  @ApiResponse({ status: 200, type: [ClientResDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get()
  @UseGuards(IdpGuard)
  async getClientList(@GetUser() user: Omit<User, 'password' | 'id'>) {
    return this.clientService.getClientList(user);
  }

  @ApiOperation({
    summary: 'Get client',
    description: '유저가 멤버로 있는 client의 정보를 알려준다.',
  })
  @ApiResponse({ status: 200, type: ClientResDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get(':uuid')
  @UseGuards(IdpGuard)
  async getClient(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @GetUser() user: Omit<User, 'password' | 'id'>,
  ): Promise<ClientResDto> {
    return this.clientService.getClient(uuid, user);
  }
}
