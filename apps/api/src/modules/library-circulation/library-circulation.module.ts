import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  LibraryAppSettingsModel,
  PaidRentFineModel,
  RentedBookModel,
  ReturnBookModel,
} from '../library-data/models';
import { LibraryCatalogModule } from '../library-catalog/library-catalog.module';
import { UserModule } from '../user/user.module';
import { LibraryCirculationController } from './controllers/library-circulation.controller';
import { LibraryAppSettingsRepository } from './repositories/library-app-settings.repository';
import { PaidRentFineRepository } from './repositories/paid-rent-fine.repository';
import { RentedBookRepository } from './repositories/rented-book.repository';
import { ReturnBookRepository } from './repositories/return-book.repository';
import { CirculationService } from './services/circulation.service';
import { OverdueFineCronService } from './services/overdue-fine-cron.service';

@Module({
  imports: [
    LibraryCatalogModule,
    UserModule,
    TypeOrmModule.forFeature([
      RentedBookModel,
      ReturnBookModel,
      PaidRentFineModel,
      LibraryAppSettingsModel,
    ]),
  ],
  controllers: [LibraryCirculationController],
  providers: [
    RentedBookRepository,
    ReturnBookRepository,
    PaidRentFineRepository,
    LibraryAppSettingsRepository,
    CirculationService,
    OverdueFineCronService,
  ],
  exports: [CirculationService],
})
export class LibraryCirculationModule {}
