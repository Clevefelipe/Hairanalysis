import { IsOptional, IsString, IsObject } from 'class-validator';

export class UploadVisionDto {
  @IsString()
  sessionId!: string;

  @IsString()
  type!: 'capilar' | 'tricologica';

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  uvMode?: string;

  @IsOptional()
  @IsString()
  uvFlags?: string;

  @IsOptional()
  @IsString()
  microscopy?: string;

  @IsOptional()
  @IsObject()
  chemicalProfile?: Record<string, any>;
}
