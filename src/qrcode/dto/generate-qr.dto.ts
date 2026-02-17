import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateQrDto {
  @IsString()
  @IsNotEmpty({ message: 'serialNumber is required' })
  serialNumber: string;
}
