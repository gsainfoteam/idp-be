import { BadRequestException } from '@nestjs/common';

import { AuthorizeError } from '../types/authorizationError.type';

export class OauthAuthorizeException extends BadRequestException {
  constructor(errorType: AuthorizeError) {
    super({
      error: errorType,
    });
  }
}
