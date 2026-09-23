import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { Solicitacao } from '../solicitacoes/solicitacao.entity';

@Entity({ name: 'centros_custo' })
export class CentroCusto {
  @PrimaryColumn({ type: 'varchar', length: 30 })
  codigo: string;

  @Column({ name: 'saldo_disponivel', type: 'decimal', precision: 12, scale: 2, default: 0 })
  saldoDisponivel: string;

  @VersionColumn({ name: 'versao' })
  versao: number;

  @CreateDateColumn({ name: 'criada_em', type: 'timestamptz' })
  criadaEm: Date;

  @UpdateDateColumn({ name: 'atualizada_em', type: 'timestamptz' })
  atualizadaEm: Date;

  @OneToMany(() => Solicitacao, (solicitacao) => solicitacao.centroCustoInfo)
  solicitacoes: Solicitacao[];
}
