import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  Patch,
  Post,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtPayloadDto, PayRentFineDto, UpdateLibrarySettingsDto } from '@workspace/shared-types';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CirculationService } from '../services/circulation.service';

const LIBRARY_STAFF_ROLES = ['SUPERUSER', 'ADMIN', 'LIBRARIAN'] as const;
const SETTINGS_ADMIN_ROLES = ['SUPERUSER', 'ADMIN'] as const;

function isLibraryStaff(roles: string[] | undefined): boolean {
  return Boolean(roles?.some((r) => LIBRARY_STAFF_ROLES.includes(r as (typeof LIBRARY_STAFF_ROLES)[number])));
}

@UseGuards(JwtAuthGuard)
@Controller('library')
export class LibraryCirculationController {
  constructor(private readonly circulationService: CirculationService) {}

  @Get('settings')
  getLibrarySettings() {
    return this.circulationService.getLibrarySettings();
  }

  @Patch('settings')
  @UseGuards(RolesGuard)
  @Roles(...SETTINGS_ADMIN_ROLES)
  updateLibrarySettings(@Body() body: UpdateLibrarySettingsDto) {
    return this.circulationService.patchLibrarySettings(body);
  }

  @Get('borrowed')
  listBorrowedBooks(
    @CurrentUser() user: JwtPayloadDto,
    @Query('soonDays', new DefaultValuePipe(7), ParseIntPipe) soonDays: number,
    @Query('userId') userId?: string,
  ) {
    if (!Number.isFinite(soonDays) || soonDays < 0 || soonDays > 60) {
      throw new BadRequestException('Параметр soonDays: число от 0 до 60.');
    }
    const effectiveUserId = isLibraryStaff(user.roles) ? userId?.trim() || undefined : user.sub;
    return this.circulationService.listBorrowedBooks(effectiveUserId, soonDays);
  }

  @Get('my-rents/history')
  listMyRentHistory(@CurrentUser() user: JwtPayloadDto) {
    return this.circulationService.listRentHistoryForUser(user.sub);
  }

  @Get('fines')
  @UseGuards(RolesGuard)
  @Roles(...LIBRARY_STAFF_ROLES)
  listFines() {
    return this.circulationService.listFinesLedger();
  }

  @Get('rents/:id')
  getRentFineSnapshot(@CurrentUser() user: JwtPayloadDto, @Param('id') id: string) {
    return this.circulationService.getRentFineSnapshot(id.trim(), user);
  }

  @Post('rents')
  @UseGuards(RolesGuard)
  @Roles(...LIBRARY_STAFF_ROLES)
  createRent(
    @Body('copyId') copyId: string,
    @Body('userId') userId: string,
    @Body('dueDate') dueDate?: string | null,
  ) {
    if (!copyId?.trim() || !userId?.trim()) {
      throw new BadRequestException('Укажите экземпляр и читателя.');
    }
    return this.circulationService.createRent(copyId.trim(), userId.trim(), dueDate ?? undefined);
  }

  @Post('rents/:id/return')
  @UseGuards(RolesGuard)
  @Roles(...LIBRARY_STAFF_ROLES)
  returnRent(@Param('id') id: string) {
    return this.circulationService.returnRent(id.trim());
  }

  @Post('rents/:id/fine')
  @UseGuards(RolesGuard)
  @Roles(...LIBRARY_STAFF_ROLES)
  payFine(@Param('id') id: string, @Body() body: PayRentFineDto) {
    return this.circulationService.payFine(id.trim(), body.fineAmount);
  }
}
