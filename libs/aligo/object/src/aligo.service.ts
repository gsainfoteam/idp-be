import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

/**
 * Service for using AWS S3.
 */
@Injectable()
export class AligoService {
  private readonly logger = new Logger(AligoService.name);
  private readonly aligoApiUrl =
    this.configService.getOrThrow<string>('ALIGO_API_URL');
  private readonly aligoApiKey =
    this.configService.getOrThrow<string>('ALIGO_API_KEY');
  private readonly aligoApiId =
    this.configService.getOrThrow<string>('ALIGO_API_ID');
  private readonly aligoApiSender =
    this.configService.getOrThrow<string>('ALIGO_API_SENDER');
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async sendMessage(phoneNumber: string, msg: string): Promise<void> {
    const body = new URLSearchParams();
    body.append('key', this.aligoApiKey);
    body.append('user_id', this.aligoApiId);
    body.append('sender', this.aligoApiSender);
    body.append('receiver', phoneNumber);
    body.append('msg_type', 'SMS');
    body.append('msg', msg);

    const { result_code, message } = (
      await firstValueFrom(
        this.httpService.post<{ result_code: string; message: string }>(
          this.aligoApiUrl,
          body,
        ),
      )
    ).data;

    if (result_code !== '1') {
      this.logger.error(`Aligo SMS send error: ${result_code} ${message}`);
      throw new InternalServerErrorException('failed to send SMS');
    }
  }
}
