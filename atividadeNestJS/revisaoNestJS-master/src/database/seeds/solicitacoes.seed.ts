import 'dotenv/config';
import dataSource from '../data-source';
import { Solicitacao } from '../../solicitacoes/solicitacao.entity';
import { CentroCusto } from '../../centros-custo/centro-custo.entity';

const codigoCentroCusto = 'CC-1234';

const centroCustoSeed = {
  codigo: codigoCentroCusto,
  saldoDisponivel: '5000.00',
};

const solicitacoes = [
  {
    titulo: 'Aquisição de monitor',
    centroCusto: codigoCentroCusto,
    valorEstimado: '1200.00',
    prioridade: 'normal' as const,
    status: 'pendente' as const,
  },
  {
    titulo: 'Compra de cabo de rede',
    centroCusto: codigoCentroCusto,
    valorEstimado: '6000.00',
    prioridade: 'urgente' as const,
    status: 'pendente' as const,
  },
];

async function executar() {
  await dataSource.initialize();

  const centroRepository = dataSource.getRepository(CentroCusto);
  const solicitacaoRepository = dataSource.getRepository(Solicitacao);

  const centroExistente = await centroRepository.findOneBy({ codigo: codigoCentroCusto });

  if (!centroExistente) {
    await centroRepository.save(centroRepository.create(centroCustoSeed));
  }

  for (const item of solicitacoes) {
    const existente = await solicitacaoRepository.findOneBy({ titulo: item.titulo, centroCusto: item.centroCusto });

    if (!existente) {
      await solicitacaoRepository.save(
        solicitacaoRepository.create({
          ...item,
        }),
      );
    }
  }

  await dataSource.destroy();
}

executar().catch(async (error) => {
  console.error(error);

  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }

  process.exitCode = 1;
});