import {
  IsOptional,
  IsString,
  IsObject,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export type ScalpDto = {
  tipoCouro?: 'normal' | 'oleoso' | 'seco' | 'sensivel';
  lesoes?: boolean;
  eritema?: boolean;
  descamacao?: 'seca' | 'oleosa' | 'ausente';
  biofilmeOdor?: boolean;
};

export type FiberDto = {
  porosidade?: 'baixa' | 'media' | 'alta';
  elasticidade?: 'normal' | 'baixa' | 'borrachuda';
  espessura?: 'fino' | 'medio' | 'grosso';
  danos?: string[];
  distribuicaoDano?: Array<'raiz' | 'meio' | 'pontas'>;
};

export type ChemistryDto = {
  sistemaAtual?:
    | 'nenhum'
    | 'hidroxido'
    | 'tioglicolato'
    | 'persulfato'
    | 'coloracaoOx';
  diasDesdeUltimaQuimica?: number;
  incompatibilidade?: boolean;
  acaoAgressiva?: boolean;
  testMechaFeito?: boolean;
  testMechaResultado?: 'ok' | 'fraco' | 'rompeu';
};

export type NeutralizacaoDto = {
  exigida?: boolean;
  produto?: string;
  tempoMinutos?: number;
  phAlvo?: string;
  justificativa?: string;
};

export class ChemicalProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  scalp?: ScalpDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  fiber?: FiberDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  chemistry?: ChemistryDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  neutralizacao?: NeutralizacaoDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  evidencias?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => Object)
  followUp?: {
    dataSugerida?: string;
    observacoes?: string;
  };
}

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
  @ValidateNested()
  @Type(() => ChemicalProfileDto)
  chemicalProfile?: ChemicalProfileDto;
}
