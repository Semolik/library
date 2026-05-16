import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CirculationService } from './circulation.service';

@Injectable()
export class OverdueFineCronService {
  private readonly logger = new Logger(OverdueFineCronService.name);

  constructor(private readonly circulationService: CirculationService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async runDailyAccrual() {
    try {
      const updated = await this.circulationService.accrueOverdueFines(new Date());
      this.logger.log(`Ежедневное начисление штрафов: обновлено записей — ${updated}`);
    } catch (err) {
      this.logger.error(
        'Ошибка cron начисления штрафов',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
