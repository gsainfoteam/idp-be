import { Injectable, Logger } from '@nestjs/common';
import { render } from '@react-email/components';

import Code from './templates/code';
import Password from './templates/password';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  async renderCode(code: string): Promise<string> {
    return render(<Code code={code} />);
  }

  async renderTemporaryPassword(password: string): Promise<string> {
    return render(<Password password={password} />);
  }
}
