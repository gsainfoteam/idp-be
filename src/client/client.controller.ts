import { ExceptionLoggerFilter } from '@lib/logger';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { RoleType, User } from '@prisma/client';
import { GetUser } from 'src/auth/decorator/getUser.decorator';
import { UserGuard } from 'src/auth/guard/auth.guard';

import { ClientService } from './client.service';
import {
  CreateClientDto,
  MemberEmailDto,
  UpdateClientDto,
} from './dto/req.dto';
import {
  ClientCredentialResDto,
  ClientPublicResDto,
  ClientResDto,
  UpdateClientPictureResDto,
} from './dto/res.dto';
import { ClientRoleGuard, Roles } from './guard/role.guard';

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
    summary: 'Add a member to client',
    description: 'Add a member to access the client',
  })
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({
    description: 'Client added successfully',
  })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  @ApiForbiddenResponse({ description: '접근 불가' })
  @ApiInternalServerErrorResponse({ description: '서버 오류' })
  @UseGuards(UserGuard, ClientRoleGuard)
  @Roles(RoleType.ADMIN)
  @Post(':clientId/members')
  async addMember(
    @Param('clientId', ParseUUIDPipe) uuid: string,
    @Body() body: MemberEmailDto,
  ): Promise<void> {
    return this.clientService.addMember(uuid, body.email);
  }

  @ApiOperation({
    summary: 'Remove a member from client',
    description: 'Remove a user from client to restrict the access',
  })
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({
    description: 'Client removed successfully',
  })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  @ApiForbiddenResponse({ description: '접근 불가' })
  @ApiInternalServerErrorResponse({ description: '서버 오류' })
  @UseGuards(UserGuard, ClientRoleGuard)
  @Roles(RoleType.ADMIN)
  @Delete(':cliendId/members')
  async removeMemebr(
    @Param('clientId', ParseUUIDPipe) uuid: string,
    @Body() body: MemberEmailDto,
  ): Promise<void> {
    return this.clientService.removeMember(uuid, body.email);
  }

  @ApiOperation({
    summary: 'Give admin to a member',
    description: 'Give an access to add and remove users',
  })
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({
    description: 'Admin given successfully',
  })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  @ApiForbiddenResponse({ description: '접근 불가' })
  @ApiInternalServerErrorResponse({ description: '서버 오류' })
  @UseGuards(UserGuard, ClientRoleGuard)
  @Roles(RoleType.OWNER)
  @Post(':cliendId/:userId/give/admin')
  async giveAdmin(
    @Param('clientId', ParseUUIDPipe) uuid: string,
    @Param('userId', ParseUUIDPipe) userUuid: string,
  ): Promise<void> {
    return this.clientService.giveAdmin(uuid, userUuid);
  }

  @ApiOperation({
    summary: 'Remove admin from a member',
    description: 'Remove an access to add and remove users',
  })
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({
    description: 'Admin removed successfully',
  })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  @ApiForbiddenResponse({ description: '접근 불가' })
  @ApiInternalServerErrorResponse({ description: '서버 오류' })
  @UseGuards(UserGuard, ClientRoleGuard)
  @Roles(RoleType.OWNER)
  @Post(':cliendId/:userId/remove/admin')
  async removeAdmin(
    @Param('clientId', ParseUUIDPipe) uuid: string,
    @Param('userId', ParseUUIDPipe) userUuid: string,
  ): Promise<void> {
    return this.clientService.removeAdmin(uuid, userUuid);
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
  @UseGuards(UserGuard, ClientRoleGuard)
  @Roles(RoleType.ADMIN)
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
  @UseGuards(UserGuard, ClientRoleGuard)
  @Roles(RoleType.ADMIN)
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
    summary: 'update picture',
    description:
      'api for updating client image. it will return updated client presigned url. image format must be webp',
  })
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({ description: 'success', type: UpdateClientPictureResDto })
  @ApiUnauthorizedResponse({ description: 'token not valid' })
  @ApiForbiddenResponse({ description: 'access token and user not match' })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @UseGuards(UserGuard, ClientRoleGuard)
  @Roles(RoleType.ADMIN)
  @Patch(':clientId/picture')
  async updateClientPicture(
    @Param('clientId', ParseUUIDPipe) uuid: string,
    @Query('length', ParseIntPipe) length: number,
    @GetUser() user: User,
  ): Promise<UpdateClientPictureResDto> {
    return this.clientService.updateClientPicture(length, uuid, user.uuid);
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
  @UseGuards(UserGuard, ClientRoleGuard)
  @Roles(RoleType.MEMBER)
  deleteClient(
    @Param('clientId', ParseUUIDPipe) uuid: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.clientService.deleteClientRequest(uuid, user);
  }

  @ApiOperation({
    summary: 'delete client picture',
    description: '유저가 client의 이미지를 삭제한다.',
  })
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({ description: '성공' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  @ApiForbiddenResponse({ description: '접근 불가' })
  @ApiInternalServerErrorResponse({ description: '서버 오류' })
  @Delete(':clientId/picture')
  @UseGuards(UserGuard, ClientRoleGuard)
  @Roles(RoleType.ADMIN)
  async deleteClientPicture(
    @Param('clientId', ParseUUIDPipe) uuid: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.clientService.deleteClientPicture(uuid, user.uuid);
  }
}
