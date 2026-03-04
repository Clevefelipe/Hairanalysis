import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateClienteDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  cpf?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  codigo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  dataNascimento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observacoes?: string;
}
