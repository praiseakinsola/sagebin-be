import {
  Controller,
  Get,
  Query,
  Res,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Response } from 'express';
import { generateQRWithLogo } from 'qr-with-logo';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';

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

    // The library requires an output file for PNG, so we'll use a temp file
    // and then send it back to the user.
    const tempFileName = `qr_${Date.now()}.png`;
    const tempFilePath = join(process.cwd(), tempFileName);

    try {
      if (!existsSync(logoPath)) {
        // If logo doesn't exist, we might need to handle it.
        // For now, let's assume it exists based on our search.
      }

      await generateQRWithLogo(
        data,
        logoPath,
        { errorCorrectionLevel: 'H' },
        'PNG',
        tempFileName,
        async () => {
          // Callback is called when file is written
          res.sendFile(tempFilePath, (err) => {
            if (err) {
              console.error('Error sending file:', err);
            }
            // Cleanup temp file
            if (existsSync(tempFilePath)) {
              unlinkSync(tempFilePath);
            }
          });
        },
      );
    } catch (error) {
      console.error('QR Generation Error:', error);
      if (existsSync(tempFilePath)) {
        unlinkSync(tempFilePath);
      }
      throw new InternalServerErrorException('Failed to generate QR code');
    }
  }
}
