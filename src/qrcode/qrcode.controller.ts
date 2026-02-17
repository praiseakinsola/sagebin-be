import { Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { QrcodeService } from './qrcode.service';

@Controller('qrcode')
export class QrcodeController {
  constructor(private readonly qrcodeService: QrcodeService) {}

  @Get('generate')
  async generate(
    @Query('serialNumber') serialNumber: string,
    @Res() res: Response,
  ) {
    console.log(
      `[QrcodeController] Received request to generate QR code for: ${serialNumber}`,
    );

    if (!serialNumber) {
      console.warn('[QrcodeController] serialNumber is missing in query');
      return res.status(400).send('serialNumber is required');
    }

    try {
      const img = await this.qrcodeService.generateQR(serialNumber);

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', img.length);
      res.end(img);

      console.log('[QrcodeController] QR code response sent successfully');
    } catch (error) {
      // Error is already logged in service, but we could add more context here if needed
      console.error(
        '[QrcodeController] Failed to handle QR generation request',
      );
      res.status(500).send('Internal Server Error');
    }
  }
}
