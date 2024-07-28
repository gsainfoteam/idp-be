import {
  Controller,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PasskeyService } from './passkey.service';
import { IdpGuard } from 'src/idp/guard/idp.guard';
import { GetUser } from 'src/idp/decorator/getUser.decorator';
import { UserInfo } from 'src/idp/types/userInfo.type';
import { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/server/script/deps';

@ApiTags('passkey')
@Controller('passkey')
@UsePipes(new ValidationPipe({ transform: true }))
@UseGuards(IdpGuard)
export class PasskeyController {
  constructor(private readonly passkeyService: PasskeyService) {}

  @ApiOperation({
    summary: '패스키 생성',
    description: '패스키를 생성하는 api이다.',
  })
  @Post('/register')
  async register(
    @GetUser() user: UserInfo,
  ): Promise<PublicKeyCredentialCreationOptionsJSON> {
    return this.passkeyService.registerPasskey(user);
  }
}
