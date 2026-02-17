import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { BinsService } from './bins.service';
import { SetFillLevelDto } from './dto/set-fill-level.dto';
import { SetStatusDto } from './dto/set-status.dto';

@Controller('bins')
export class BinsController {
  constructor(private readonly binsService: BinsService) {}

  @Get(':serialNumber')
  getBin(@Param('serialNumber') serialNumber: string) {
    return this.binsService.getBin(serialNumber);
  }

  @Patch(':serialNumber/fill-level')
  setFillLevel(
    @Param('serialNumber') serialNumber: string,
    @Body() setFillLevelDto: SetFillLevelDto,
  ) {
    return this.binsService.setFillLevel(
      serialNumber,
      setFillLevelDto.percentage,
    );
  }

  @Patch(':serialNumber/status')
  setStatus(
    @Param('serialNumber') serialNumber: string,
    @Body() setStatusDto: SetStatusDto,
  ) {
    return this.binsService.setStatus(serialNumber, setStatusDto.status);
  }

  @Patch(':serialNumber/online')
  setOnline(@Param('serialNumber') serialNumber: string) {
    return this.binsService.setOnline(serialNumber);
  }

  @Get(':serialNumber/timeline/fill-level')
  getFillLevelTimeline(@Param('serialNumber') serialNumber: string) {
    return this.binsService.getFillLevelTimeline(serialNumber);
  }

  @Get(':serialNumber/timeline/status')
  getStatusTimeline(@Param('serialNumber') serialNumber: string) {
    return this.binsService.getStatusTimeline(serialNumber);
  }
}
