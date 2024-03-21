import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ClientService } from './client.service';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IdpGuard } from 'src/idp/guard/idp.guard';
import { GetUser } from 'src/idp/decorator/getUser.decorator';
import { ClientResDto } from './dto/res/clientRes.dto';
import { CreateClientDto } from './dto/req/createClient.dto';
import { ClientCredentialResDto } from './dto/res/ClinetCredential.dto';
import { UpdateClientDto } from './dto/req/updateClient.dto';
import { UserInfo } from 'src/idp/types/userInfo.type';

@ApiTags('client')
@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @ApiOperation({
    summary: 'Get client list',
    description: '유저가 멤버로 있는 client의 리스트를 알려준다.',
  })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, type: [ClientResDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get()
  @UseGuards(IdpGuard)
  async getClientList(@GetUser() user: UserInfo): Promise<ClientResDto[]> {
    return this.clientService.getClientList(user);
  }

  @ApiOperation({
    summary: 'Get client',
    description: '유저가 멤버로 있는 client의 정보를 알려준다.',
  })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, type: ClientResDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get(':uuid')
  @UseGuards(IdpGuard)
  async getClient(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @GetUser() user: UserInfo,
  ): Promise<ClientResDto> {
    return this.clientService.getClient(uuid, user);
  }

  @ApiOperation({
    summary: 'Register client',
    description: '유저가 client를 등록한다.',
  })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 201, type: ClientCredentialResDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiConflictResponse({ description: 'Conflict' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post()
  @UseGuards(IdpGuard)
  async registerClient(
    @Body() createClientDto: CreateClientDto,
    @GetUser() user: UserInfo,
  ): Promise<ClientCredentialResDto> {
    return this.clientService.registerClient(createClientDto, user);
  }

  @ApiOperation({
    summary: 'Admin request',
    description: '유저가 client에 admin 권한을 요청한다.',
  })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200 })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post(':uuid/admin')
  @UseGuards(IdpGuard)
  async adminRequest(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @GetUser() user: UserInfo,
  ): Promise<void> {
    return this.clientService.adminRequest(uuid, user);
  }

  @ApiOperation({
    summary: 'Reset client secret',
    description: '유저가 client의 secret을 재설정한다.',
  })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, type: ClientCredentialResDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Patch(':uuid/reset-secret')
  @UseGuards(IdpGuard)
  async resetClientSecret(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @GetUser() user: UserInfo,
  ): Promise<ClientCredentialResDto> {
    return this.clientService.resetClientSecret(uuid, user);
  }

  @ApiOperation({
    summary: 'Update client',
    description: '유저가 client의 정보를 수정한다.',
  })
  @ApiBearerAuth('access-token')
  @ApiResponse({ status: 200, type: ClientResDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Patch(':uuid')
  @UseGuards(IdpGuard)
  async updateClient(
    @Param('uuid') uuid: string,
    @Body() body: UpdateClientDto,
    @GetUser() user: UserInfo,
  ): Promise<ClientResDto> {
    return this.clientService.updateClient(uuid, body, user);
  }
}
