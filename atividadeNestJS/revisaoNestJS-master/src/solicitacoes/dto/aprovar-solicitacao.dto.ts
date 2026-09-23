import { IsInt, IsOptional, Min } from 'class-validator';

export class AprovarSolicitacaoDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  versao?: number;

  @IsInt()
  @Min(1)
  versaoSolicitacao: number;

  @IsInt()
  @Min(1)
  versaoCentroCusto: number;
}