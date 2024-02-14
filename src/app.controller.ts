import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health Check')
@Controller()
export class AppController {
  @ApiOperation({ summary: 'Health Check' })
  @ApiResponse({
    status: 200,
    description: 'Returns the string "pong" when the server is activated',
    content: {
      'application/json': {
        example: 'pong',
      },
    },
  })
  @Get()
  async healthCheck(): Promise<string> {
    return 'pong';
  }
}
