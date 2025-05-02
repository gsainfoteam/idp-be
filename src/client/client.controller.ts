import { ExceptionLoggerFilter } from '@lib/logger';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { UserGuard } from 'src/auth/guard/auth.guard';

import { ClientService } from './client.service';
import { CreateClientDto, UpdateClientDto } from './dto/req.dto';
import {
  ClientCredentialResDto,
  ClientPublicResDto,
  ClientResDto,
} from './dto/res.dto';

@ApiTags('client')
@Controller('client')
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@UseFilters(new ExceptionLoggerFilter())
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @ApiOperation({
    summary: 'Get client list',
    description: '유저가 멤버로 있는 client의 리스트를 알려준다.',
  })
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({ description: '성공', type: [ClientResDto] })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  @ApiInternalServerErrorResponse({ description: '서버 오류' })
  @Get()
  @UseGuards(UserGuard)
  async getClientList(@GetUser() user: User): Promise<ClientResDto[]> {
    return (await this.clientService.getClientList(user)).map((client) => {
      return new ClientResDto(client);
    });
  }

  @ApiOperation({
    summary: 'Get client',
    description: '유저가 멤버로 있는 client의 정보를 알려준다.',
  })
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({ description: '성공', type: ClientResDto })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  @ApiInternalServerErrorResponse({ description: '서버 오류' })
  @Get(':clientId')
  @UseGuards(UserGuard)
  async getClient(
    @Param('clientId', ParseUUIDPipe) uuid: string,
    @GetUser() user: User,
  ): Promise<ClientResDto> {
    return new ClientResDto(await this.clientService.getClient(uuid, user));
  }

  @ApiOperation({
    summary: "Get Client's public information",
    description:
      '모든 유저가 확인할 수 있는 Client의 정보를 알려준다. IdP를 사용하는 유저라고 확인하기 위해서, Jwt토큰을 사용한다. 해당 유저가 소유한 Client를 찾기 위한 것은 아니므로, user의 권한을 확인하지 않는다.',
  })
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({ description: '성공', type: ClientPublicResDto })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  @ApiBadRequestResponse({
    description:
      '잘못된 요청, clientId의 타입이 uuid가 아니면 발생할 수 있습니다.',
  })
  @ApiInternalServerErrorResponse({ description: '서버 오류' })
  @Get(':clientId/public')
  @UseGuards(UserGuard)
  async getClientPublic(
    @Param('clientId', ParseUUIDPipe) uuid: string,
  ): Promise<ClientPublicResDto> {
    return new ClientPublicResDto(
      await this.clientService.getClientByUuid(uuid),
    );
  }
  @ApiOperation({
    summary: 'Register client',
    description: '유저가 client를 등록한다.',
  })
  @ApiBearerAuth('user:jwt')
  @ApiCreatedResponse({ description: '성공', type: ClientCredentialResDto })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  @ApiConflictResponse({ description: '이미 있는 데이터' })
  @ApiInternalServerErrorResponse({ description: '서버 오류' })
  @Post()
  @UseGuards(UserGuard)
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
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({ description: '성공', type: ClientCredentialResDto })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  @ApiForbiddenResponse({ description: '접근 불가' })
  @ApiInternalServerErrorResponse({ description: '서버 오류' })
  @Patch(':clientId/secret')
  @UseGuards(UserGuard)
  async resetClientSecret(
    @Param('clientId', ParseUUIDPipe) uuid: string,
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
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({ description: '성공', type: ClientResDto })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  @ApiForbiddenResponse({ description: '접근 불가' })
  @ApiInternalServerErrorResponse({ description: '서버 오류' })
  @Patch(':clientId')
  @UseGuards(UserGuard)
  async updateClient(
    @Param('clientId', ParseUUIDPipe) uuid: string,
    @Body() body: UpdateClientDto,
    @GetUser() user: User,
  ): Promise<ClientResDto> {
    return new ClientResDto(
      await this.clientService.updateClient(uuid, body, user),
    );
  }

  @ApiOperation({
    summary: 'send delete request',
    description: '유저가 client를 삭제하고 싶다는 요청을 보낸다.',
  })
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({ description: '성공' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  @ApiForbiddenResponse({ description: '접근 불가' })
  @ApiInternalServerErrorResponse({ description: '서버 오류' })
  @Post(':clientId/delete')
  @UseGuards(UserGuard)
  deleteClient(
    @Param('clientId', ParseUUIDPipe) uuid: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.clientService.deleteClientRequest(uuid, user);
  }
}
