import { MigrationInterface, QueryRunner } from 'typeorm';

export class AdicionarCentroCusto1790090000000 implements MigrationInterface {
  name = 'AdicionarCentroCusto1790090000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "centros_custo" (
        "codigo" character varying(30) NOT NULL,
        "saldo_disponivel" numeric(12,2) NOT NULL DEFAULT 0,
        "versao" integer NOT NULL DEFAULT 0,
        "criada_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "atualizada_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_centros_custo" PRIMARY KEY ("codigo"),
        CONSTRAINT "CHK_centros_custo_saldo" CHECK ("saldo_disponivel" >= 0)
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "solicitacoes"
      ADD COLUMN "valor_estimado" numeric(12,2) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "solicitacoes"
      ADD CONSTRAINT "CHK_solicitacoes_valor_estimado"
      CHECK ("valor_estimado" >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "solicitacoes"
      ADD CONSTRAINT "FK_solicitacoes_centro_custo"
      FOREIGN KEY ("centro_custo") REFERENCES "centros_custo"("codigo")
      ON DELETE RESTRICT
      ON UPDATE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "solicitacoes"
      DROP CONSTRAINT "FK_solicitacoes_centro_custo"
    `);

    await queryRunner.query(`
      ALTER TABLE "solicitacoes"
      DROP CONSTRAINT "CHK_solicitacoes_valor_estimado"
    `);

    await queryRunner.query(`
      ALTER TABLE "solicitacoes"
      DROP COLUMN "valor_estimado"
    `);

    await queryRunner.query(`DROP TABLE "centros_custo"`);
  }
}
