import { IsEnum } from 'class-validator';

export class SetStatusDto {
  @IsEnum(['open', 'close'])
  status: 'open' | 'close';
}
