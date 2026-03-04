import { IsOptional, IsString } from 'class-validator';

export class StartVisionSessionDto {
  @IsString()
  clientId!: string;

  @IsString()
  analysisType!: 'capilar' | 'tricologica' | 'geral';

  @IsOptional()
  @IsString()
  type?: string;
}
