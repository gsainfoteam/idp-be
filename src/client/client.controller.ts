import { ExceptionLoggerFilter } from '@lib/logger';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
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
import { ClientCredentialResDto, ClientResDto } from './dto/res.dto';

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
    summary: 'Delete client',
    description: 'client를 생성한 유저가 client를 삭제한다.',
  })
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({ description: '성공' })
  @ApiUnauthorizedResponse({ description: '인증 실패' })
  @ApiForbiddenResponse({ description: '접근 불가' })
  @ApiInternalServerErrorResponse({ description: '서버 오류' })
  @UseGuards(UserGuard)
  @Delete(':clientId')
  async deleteClient(
    @Param('clientId', ParseUUIDPipe) uuid: string,
    @GetUser() user: User,
  ): Promise<void> {
    return this.clientService.deleteClient(uuid, user);
  }
}
