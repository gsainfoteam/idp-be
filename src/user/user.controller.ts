import { ExceptionLoggerFilter } from '@lib/logger';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  ParseIntPipe,
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

import {
  ChangePasswordDto,
  DeleteUserReqDto,
  RegisterDto,
} from './dto/req.dto';
import {
  UpdateUserPictureResDto,
  UserConsentListResDto,
  UserConsentResDto,
  UserResDto,
} from './dto/res.dto';
import { UserService } from './user.service';

@ApiTags('user')
@Controller('user')
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@UseFilters(new ExceptionLoggerFilter())
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: 'get user',
    description: 'api for getting user',
  })
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({ description: 'success', type: UserResDto })
  @ApiUnauthorizedResponse({ description: 'token not valid' })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @UseGuards(UserGuard)
  @Get()
  getUser(@GetUser() user: User): UserResDto {
    return new UserResDto(user);
  }

  @ApiOperation({
    summary: 'get user consent',
    description: 'api for getting user consent',
  })
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({ description: 'success', type: UserConsentListResDto })
  @ApiUnauthorizedResponse({ description: 'token not valid' })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @UseGuards(UserGuard)
  @Get('/consent')
  async getUserConsent(@GetUser() user: User): Promise<UserConsentListResDto> {
    return {
      list: (await this.userService.findUserConsentByUuid(user)).map(
        (userConsent) => {
          return new UserConsentResDto(userConsent);
        },
      ),
    };
  }

  @ApiOperation({
    summary: 'sign up',
    description: 'api for the sign up',
  })
  @ApiCreatedResponse({ description: 'success' })
  @ApiConflictResponse({ description: 'user already exists' })
  @ApiForbiddenResponse({ description: 'certification token is not valid' })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @Post()
  async register(@Body() body: RegisterDto): Promise<void> {
    return this.userService.register(body);
  }

  @ApiOperation({
    summary: 'change password',
    description: 'api for changing password',
  })
  @ApiOkResponse({ description: 'success' })
  @ApiForbiddenResponse({ description: 'token not valid' })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @Patch('/password')
  async changePassword(@Body() body: ChangePasswordDto): Promise<void> {
    return this.userService.changePassword(body);
  }

  @ApiOperation({
    summary: 'update picture',
    description:
      'api for updating profile image. it will return updated profile presigned url. image format must be webp',
  })
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({ description: 'success', type: UpdateUserPictureResDto })
  @ApiUnauthorizedResponse({ description: 'token not valid' })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @UseGuards(UserGuard)
  @Patch('/picture')
  async updatePicture(
    @Query('length', ParseIntPipe) length: number,
    @GetUser() user: User,
  ): Promise<UpdateUserPictureResDto> {
    return this.userService.updateUserPicture(length, user.uuid);
  }

  @ApiOperation({
    summary: 'delete user',
    description: 'api for deleting user',
  })
  @ApiBearerAuth('user:jwt')
  @ApiOkResponse({ description: 'success' })
  @ApiForbiddenResponse({ description: 'password is not valid' })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @UseGuards(UserGuard)
  @Delete()
  async deleteUser(
    @GetUser() user: User,
    @Body() body: DeleteUserReqDto,
  ): Promise<void> {
    return this.userService.deleteUser(user.uuid, body);
  }
}
