import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Auditoria } from '../auditoria/auditoria.entity';
import { CentroCusto } from '../centros-custo/centro-custo.entity';
import { AprovarSolicitacaoDto } from './dto/aprovar-solicitacao.dto';
import { CriarSolicitacaoDto } from './dto/criar-solicitacao.dto';
import { FiltrarSolicitacoesDto } from './dto/filtrar-solicitacoes.dto';
import { Solicitacao } from './solicitacao.entity';

function converterParaCentavos(valor: string): bigint {
  const [inteiros, decimais = ''] = valor.split('.');
  return BigInt(inteiros) * 100n + BigInt(decimais.padEnd(2, '0').slice(0, 2));
}

function formatarCentavos(valor: bigint): string {
  const sinal = valor < 0n ? '-' : '';
  const absoluto = valor < 0n ? -valor : valor;
  return `${sinal}${absoluto / 100n}.${(absoluto % 100n).toString().padStart(2, '0')}`;
}

@Injectable()
export class SolicitacoesService {
  constructor(
    @InjectRepository(Solicitacao)
    private readonly repository: Repository<Solicitacao>,
    @InjectRepository(CentroCusto)
    private readonly centroCustoRepository: Repository<CentroCusto>,
    private readonly dataSource: DataSource,
  ) {}

  listar(filtros: FiltrarSolicitacoesDto) {
    const where: FindOptionsWhere<Solicitacao> = {};

    if (filtros.status) {
      where.status = filtros.status;
    }

    if (filtros.centroCusto) {
      where.centroCusto = filtros.centroCusto;
    }

    if (filtros.prioridade) {
      where.prioridade = filtros.prioridade;
    }

    return this.repository.find({
      where,
      order: { id: 'ASC' },
    });
  }

  async buscarPorId(id: number) {
    const solicitacao = await this.repository.findOneBy({ id });

    if (!solicitacao) {
      throw new NotFoundException('Solicitação não encontrada');
    }

    return solicitacao;
  }

  criar(dto: CriarSolicitacaoDto) {
    const solicitacao = this.repository.create({
      titulo: dto.titulo,
      centroCusto: dto.centroCusto,
      valorEstimado: dto.valorEstimado.toFixed(2),
      prioridade: dto.prioridade,
      status: 'pendente',
    });
    return this.repository.save(solicitacao);
  }

  async aprovar(id: number, dto: AprovarSolicitacaoDto, atorId: number) {
    return this.dataSource.transaction(async (manager) => {
      const solicitacao = await manager.findOneBy(Solicitacao, { id });

      if (!solicitacao) {
        throw new NotFoundException('Solicitação não encontrada');
      }

      if (solicitacao.versao !== dto.versaoSolicitacao) {
        throw new ConflictException('Versão da solicitação está desatualizada');
      }

      if (solicitacao.status !== 'pendente') {
        throw new ConflictException('Solicitação não está pendente');
      }

      const centroCusto = await manager.findOneBy(CentroCusto, {
        codigo: solicitacao.centroCusto,
      });

      if (!centroCusto) {
        throw new NotFoundException('Centro de custo não encontrado');
      }

      if (centroCusto.versao !== dto.versaoCentroCusto) {
        throw new ConflictException('Versão do centro de custo está desatualizada');
      }

      const valorEstimado = converterParaCentavos(solicitacao.valorEstimado ?? '0');
      const saldoDisponivel = converterParaCentavos(centroCusto.saldoDisponivel ?? '0');

      if (valorEstimado < 0n || saldoDisponivel < 0n) {
        throw new ConflictException('Saldo e valor estimado devem ser válidos');
      }

      if (valorEstimado > saldoDisponivel) {
        throw new ConflictException('Saldo insuficiente para aprovar esta solicitação');
      }

      const saldoAnterior = formatarCentavos(saldoDisponivel);
      const saldoResultante = formatarCentavos(saldoDisponivel - valorEstimado);

      const solicitacaoAtualizada = await manager
        .createQueryBuilder()
        .update(Solicitacao)
        .set({ status: 'aprovada', versao: () => 'versao + 1' })
        .where('id = :id', { id })
        .andWhere('status = :status', { status: 'pendente' })
        .andWhere('versao = :versao', { versao: dto.versaoSolicitacao })
        .execute();

      if (solicitacaoAtualizada.affected !== 1) {
        throw new ConflictException('A solicitação foi alterada; consulte novamente');
      }

      const centroAtualizado = await manager
        .createQueryBuilder()
        .update(CentroCusto)
        .set({ saldoDisponivel: () => 'saldo_disponivel - :valor', versao: () => 'versao + 1' })
        .where('codigo = :codigo', { codigo: solicitacao.centroCusto })
        .andWhere('versao = :versao', { versao: dto.versaoCentroCusto })
        .andWhere('saldo_disponivel >= :valor', { valor: formatarCentavos(valorEstimado) })
        .setParameters({ valor: formatarCentavos(valorEstimado) })
        .execute();

      if (centroAtualizado.affected !== 1) {
        throw new ConflictException('O centro de custo foi alterado; consulte novamente');
      }

      await manager.insert(Auditoria, {
        atorId,
        acao: 'APROVACAO_SOLICITACAO',
        recursoTipo: 'solicitacao',
        recursoId: id,
        detalhes: {
          centroCusto: solicitacao.centroCusto,
          valorReservado: formatarCentavos(valorEstimado),
          saldoAnterior,
          saldoResultante,
          statusAnterior: 'pendente',
          statusAtual: 'aprovada',
          versaoSolicitacaoUtilizada: dto.versaoSolicitacao,
          versaoCentroCustoUtilizada: dto.versaoCentroCusto,
          dataOperacao: new Date().toISOString(),
        },
      });

      return manager.findOneByOrFail(Solicitacao, { id });
    });
  }
}
