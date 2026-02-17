import { IsInt, Min, Max } from 'class-validator';

export class SetFillLevelDto {
  @IsInt()
  @Min(0)
  @Max(100)
  percentage: number;
}
