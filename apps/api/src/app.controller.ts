import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Проверка статуса сервера' })
  @ApiResponse({
    status: 200,
    description: 'Сервер работает',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
      },
    },
  })
  getHealth() {
    return this.appService.getHealth();
  }
}

