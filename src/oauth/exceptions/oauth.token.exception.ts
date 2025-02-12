import { BadRequestException } from '@nestjs/common';

import { TokenError } from '../types/tokenError.type';

export class OauthTokenException extends BadRequestException {
  constructor(errorType: TokenError) {
    super({
      error: errorType,
    });
  }
}
