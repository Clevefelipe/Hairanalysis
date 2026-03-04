import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateSalonBrandingDto {
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{6})$/, {
    message: 'primaryColor deve estar no formato #RRGGBB',
  })
  primaryColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{6})$/, {
    message: 'secondaryColor deve estar no formato #RRGGBB',
  })
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#([0-9a-fA-F]{6})$/, {
    message: 'accentColor deve estar no formato #RRGGBB',
  })
  accentColor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  fontFamily?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024 * 1024 * 3)
  logoUrl?: string;
}
