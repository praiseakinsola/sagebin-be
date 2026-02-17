import { Injectable, InternalServerErrorException } from '@nestjs/common';
import QrCodeWithLogo from 'qrcode-with-logos';
import { join } from 'path';

@Injectable()
export class QrcodeService {
  async generateQR(serialNumber: string): Promise<Buffer> {
    console.log(
      `[QrcodeService] Generating QR code for serialNumber: ${serialNumber}`,
    );

    const data = JSON.stringify({ serialNumber });
    const logoPath = join(process.cwd(), 'src', 'assets', 'logo.png');

    try {
      console.log(`[QrcodeService] Using logo from: ${logoPath}`);

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

      console.log('[QrcodeService] Creating canvas...');
      const canvas = await (qrcode as any).getCanvas();

      console.log('[QrcodeService] Converting canvas to buffer...');
      const buffer = canvas.toBuffer('image/png');

      console.log(
        `[QrcodeService] QR code generated successfully. Buffer size: ${buffer.length} bytes`,
      );
      return buffer;
    } catch (error) {
      console.error('[QrcodeService] Error generating QR code:', error);
      throw new InternalServerErrorException('Failed to generate QR code');
    }
  }
}
