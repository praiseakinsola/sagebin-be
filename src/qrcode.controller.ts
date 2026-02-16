import {
  Controller,
  Get,
  Query,
  Res,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Response } from 'express';
import QrCodeWithLogo from 'qrcode-with-logos';
import { join } from 'path';

@Controller('qrcode')
export class QrcodeController {
  @Get('generate')
  async generate(
    @Query('serialNumber') serialNumber: string,
    @Res() res: Response,
  ) {
    if (!serialNumber) {
      return res.status(400).send('serialNumber is required');
    }

    const data = JSON.stringify({ serialNumber });
    const logoPath = join(process.cwd(), 'src', 'assets', 'logo.png');

    try {
      const qrcode = new QrCodeWithLogo({
        content: data,
        width: 512,
        logo: {
          src: logoPath,
        } as any,
        nodeQrCodeOptions: {
          errorCorrectionLevel: 'H',
          margin: 4,
        },
      });

      // qrcode-with-logos returns a promise for a canvas in Node
      const canvas = await (qrcode as any).getCanvas();
      const img = canvas.toBuffer('image/png');

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', img.length);
      res.end(img);
    } catch (error) {
      console.error('QR Generation Error:', error);
      throw new InternalServerErrorException('Failed to generate QR code');
    }
  }
}
