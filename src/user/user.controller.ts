import { ExceptionLoggerFilter } from '@lib/logger';
import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseFilters,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
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

import { ChangePasswordDto, RegisterDto } from './dto/req.dto';
import { UpdateUserProfileResDto, UserResDto } from './dto/res.dto';
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
  @ApiOkResponse({ description: 'success', type: UserResDto })
  @ApiUnauthorizedResponse({ description: 'token not valid' })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @UseGuards(UserGuard)
  @Get()
  getUser(@GetUser() user: User): UserResDto {
    return new UserResDto(user);
  }

  @ApiOperation({
    summary: 'sign up',
    description: 'api for the sign up',
  })
  @ApiCreatedResponse({ description: 'success' })
  @ApiConflictResponse({ description: 'user already exists' })
  @ApiForbiddenResponse({ description: 'certification token is not valid' })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @Post('/register')
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
    summary: 'update profile',
    description:
      'api for updating profile image. it will return updated profile presigned url. image format must be webp',
  })
  @ApiOkResponse({ description: 'success' })
  @ApiUnauthorizedResponse({ description: 'token not valid' })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @UseGuards(UserGuard)
  @Patch('/profile')
  async updateProfile(@GetUser() user: User): Promise<UpdateUserProfileResDto> {
    return this.userService.updateUserProfile(user.uuid);
  }

  @ApiOperation({
    summary: 'delete user',
    description: 'api for deleting user',
  })
  @ApiOkResponse({ description: 'success' })
  @ApiForbiddenResponse({ description: 'password is not valid' })
  @ApiInternalServerErrorResponse({ description: 'server error' })
  @UseGuards(UserGuard)
  @Delete()
  async deleteUser(@GetUser() user: User): Promise<void> {
    return this.userService.deleteUser(user.uuid);
  }
}
