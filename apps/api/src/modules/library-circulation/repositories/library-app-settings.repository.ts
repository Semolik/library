import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LibraryAppSettingsModel } from '../../library-data/models/library-app-settings.model';

const SETTINGS_ROW_ID = 1;

@Injectable()
export class LibraryAppSettingsRepository {
  constructor(
    @InjectRepository(LibraryAppSettingsModel)
    private readonly repo: Repository<LibraryAppSettingsModel>,
  ) {}

  async getSingleton(): Promise<{
    defaultLoanDays: number;
    finePerOverdueDay: number;
    fineGraceDays: number;
  }> {
    let row = await this.repo.findOne({ where: { id: SETTINGS_ROW_ID } });
    if (!row) {
      row = await this.repo.save(
        this.repo.create({
          id: SETTINGS_ROW_ID,
          defaultLoanDays: 14,
          finePerOverdueDay: 10,
          fineGraceDays: 0,
        }),
      );
    }
    return {
      defaultLoanDays: row.defaultLoanDays,
      finePerOverdueDay: row.finePerOverdueDay,
      fineGraceDays: row.fineGraceDays,
    };
  }

  async patchSettings(data: {
    defaultLoanDays?: number;
    finePerOverdueDay?: number;
    fineGraceDays?: number;
  }): Promise<{
    defaultLoanDays: number;
    finePerOverdueDay: number;
    fineGraceDays: number;
  }> {
    let row = await this.repo.findOne({ where: { id: SETTINGS_ROW_ID } });
    if (!row) {
      row = this.repo.create({
        id: SETTINGS_ROW_ID,
        defaultLoanDays: 14,
        finePerOverdueDay: 10,
        fineGraceDays: 0,
      });
    }
    if (data.defaultLoanDays !== undefined) {
      row.defaultLoanDays = data.defaultLoanDays;
    }
    if (data.finePerOverdueDay !== undefined) {
      row.finePerOverdueDay = data.finePerOverdueDay;
    }
    if (data.fineGraceDays !== undefined) {
      row.fineGraceDays = data.fineGraceDays;
    }
    await this.repo.save(row);
    return this.getSingleton();
  }
}
