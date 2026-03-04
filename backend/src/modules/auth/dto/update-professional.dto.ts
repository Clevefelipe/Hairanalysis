import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateProfessionalDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  fullName?: string;
}
