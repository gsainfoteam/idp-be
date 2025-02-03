import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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
import { User } from '@prisma/client';
import { GetUser } from 'src/idp/decorator/getUser.decorator';
import { IdpGuard } from 'src/idp/guard/idp.guard';

import { ClientService } from './client.service';
import { CreateClientDto, UpdateClientDto } from './dto/req.dto';
import {
  ClientCredentialResDto,
  ClientPublicResDto,
  ClientResDto,
} from './dto/res.dto';

@ApiTags('client')
@Controller('client')
@UseInterceptors(ClassSerializerInterceptor)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @ApiOperation({
    summary: 'Get client list',
    description: '유저가 멤버로 있는 client의 리스트를 알려준다.',
  })
  @ApiBearerAuth('idp:jwt')
  @ApiResponse({ status: 200, type: [ClientResDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get()
  @UseGuards(IdpGuard)
  async getClientList(@GetUser() user: User): Promise<ClientResDto[]> {
    return (await this.clientService.getClientList(user)).map((client) => {
      return new ClientResDto(client);
    });
  }

  @ApiOperation({
    summary: 'Get client',
    description: '유저가 멤버로 있는 client의 정보를 알려준다.',
  })
  @ApiBearerAuth('idp:jwt')
  @ApiResponse({ status: 200, type: ClientResDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get(':uuid')
  @UseGuards(IdpGuard)
  async getClient(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @GetUser() user: User,
  ): Promise<ClientResDto> {
    return new ClientResDto(await this.clientService.getClient(uuid, user));
  }

  @ApiOperation({
    summary: 'Get client public information',
    description: 'client의 공개 정보를 알려준다.',
  })
  @ApiBearerAuth('idp:jwt')
  @ApiResponse({ status: 200, type: ClientPublicResDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Get(':id/public')
  @UseGuards(IdpGuard)
  async getClientPublicInformation(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<ClientPublicResDto> {
    return new ClientPublicResDto(
      await this.clientService.getClientPublicInformation(id, user),
    );
  }

  @ApiOperation({
    summary: 'Register client',
    description: '유저가 client를 등록한다.',
  })
  @ApiBearerAuth('idp:jwt')
  @ApiResponse({ status: 201, type: ClientCredentialResDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiConflictResponse({ description: 'Conflict' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Post()
  @UseGuards(IdpGuard)
  async registerClient(
    @Body() createClientDto: CreateClientDto,
    @GetUser() user: User,
  ): Promise<ClientCredentialResDto> {
    return new ClientCredentialResDto(
      await this.clientService.registerClient(createClientDto, user),
    );
  }

  @ApiOperation({
    summary: 'Reset client secret',
    description: '유저가 client의 secret을 재설정한다.',
  })
  @ApiBearerAuth('idp:jwt')
  @ApiResponse({ status: 200, type: ClientCredentialResDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Patch(':uuid/reset-secret')
  @UseGuards(IdpGuard)
  async resetClientSecret(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @GetUser() user: User,
  ): Promise<ClientCredentialResDto> {
    return new ClientCredentialResDto(
      await this.clientService.resetClientSecret(uuid, user),
    );
  }

  @ApiOperation({
    summary: 'Update client',
    description: '유저가 client의 정보를 수정한다.',
  })
  @ApiBearerAuth('idp:jwt')
  @ApiResponse({ status: 200, type: ClientResDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  @ApiInternalServerErrorResponse({ description: 'Internal Server Error' })
  @Patch(':uuid')
  @UseGuards(IdpGuard)
  async updateClient(
    @Param('uuid') uuid: string,
    @Body() body: UpdateClientDto,
    @GetUser() user: User,
  ): Promise<ClientResDto> {
    return new ClientResDto(
      await this.clientService.updateClient(uuid, body, user),
    );
  }
}
