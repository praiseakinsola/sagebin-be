import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { BinsService } from './bins.service';
import { SetFillLevelDto } from './dto/set-fill-level.dto';
import { SetStatusDto } from './dto/set-status.dto';
import { RegisterFcmTokenDto } from './dto/register-fcm-token.dto';

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
  getFillLevelTimeline(
    @Param('serialNumber') serialNumber: string,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    return this.binsService.getFillLevelTimeline(serialNumber, days);
  }

  @Get(':serialNumber/timeline/status')
  getStatusTimeline(
    @Param('serialNumber') serialNumber: string,
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    return this.binsService.getStatusTimeline(serialNumber, days);
  }

  @Post('test-notification')
  sendTestNotification(@Body() body: { title?: string; message?: string }) {
    return this.binsService.sendTestNotification(body.title, body.message);
  }

  @Post(':serialNumber/fcm-token')
  registerFcmToken(
    @Param('serialNumber') serialNumber: string,
    @Body() registerFcmTokenDto: RegisterFcmTokenDto,
  ) {
    return this.binsService.registerFcmToken(
      serialNumber,
      registerFcmTokenDto.token,
    );
  }
}
