import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { CentroCusto } from '../centros-custo/centro-custo.entity';

export type StatusSolicitacao = 'pendente' | 'aprovada';
export type PrioridadeSolicitacao = 'normal' | 'urgente';

@Entity({ name: 'solicitacoes' })
export class Solicitacao {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  titulo: string;

  @Column({ name: 'centro_custo', type: 'varchar', length: 30 })
  centroCusto: string;

  @ManyToOne(() => CentroCusto, (centro) => centro.solicitacoes, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'centro_custo', referencedColumnName: 'codigo' })
  centroCustoInfo: CentroCusto;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  valorEstimado: string;

  @Column({ type: 'varchar', length: 10, default: 'normal' })
  prioridade: PrioridadeSolicitacao;

  @Column({ type: 'varchar', length: 20, default: 'pendente' })
  status: StatusSolicitacao;

  @VersionColumn({ name: 'versao' })
  versao: number;

  @CreateDateColumn({ name: 'criada_em', type: 'timestamptz' })
  criadaEm: Date;

  @UpdateDateColumn({ name: 'atualizada_em', type: 'timestamptz' })
  atualizadaEm: Date;
}