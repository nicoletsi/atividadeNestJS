import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AprovarSolicitacaoDto } from './aprovar-solicitacao.dto';

describe('AprovarSolicitacaoDto', () => {
  it('aceita as versões da solicitação e do centro de custo', async () => {
    const dto = plainToInstance(AprovarSolicitacaoDto, {
      versaoSolicitacao: 3,
      versaoCentroCusto: 7,
    });

    const erros = await validate(dto);

    expect(erros).toHaveLength(0);
    expect(dto).toMatchObject({
      versaoSolicitacao: 3,
      versaoCentroCusto: 7,
    });
  });
});
