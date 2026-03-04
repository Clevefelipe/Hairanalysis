import { IsString } from 'class-validator';

export class ApplyBrandingPresetDto {
  @IsString()
  presetId: string;
}
