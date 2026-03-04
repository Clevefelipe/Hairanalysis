import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1770465292823 implements MigrationInterface {
  name = 'InitSchema1770465292823';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    // Users
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "fullName" character varying,
        "name" character varying,
        "role" character varying NOT NULL DEFAULT 'PROFESSIONAL',
        "salonId" uuid,
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users" PRIMARY KEY ("id")
      )
    `);

    // Salons
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "salons" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying NOT NULL,
        CONSTRAINT "PK_salons" PRIMARY KEY ("id")
      )
    `);

    // Clientes
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "clientes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "nome" character varying NOT NULL,
        "telefone" character varying NOT NULL,
        "email" character varying,
        "cpf" character varying,
        "dataNascimento" date,
        "observacoes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clientes" PRIMARY KEY ("id")
      )
    `);

    // History
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "analysis_history" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "clientId" uuid NOT NULL,
        "salonId" uuid,
        "professionalId" uuid NOT NULL,
        "visionResult" jsonb NOT NULL,
        "aiExplanation" jsonb,
        "recommendations" jsonb,
        "publicToken" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_analysis_history" PRIMARY KEY ("id")
      )
    `);

    // Knowledge Documents
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "knowledge_documents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "salonId" uuid NOT NULL,
        "groupId" uuid NOT NULL,
        "chunkIndex" integer NOT NULL,
        "domain" character varying NOT NULL,
        "title" character varying,
        "content" text NOT NULL,
        "sourceType" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_knowledge_documents" PRIMARY KEY ("id")
      )
    `);

    // Straightenings
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "straightening" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "salonId" uuid NOT NULL,
        "name" character varying NOT NULL,
        "description" text,
        "active" boolean NOT NULL DEFAULT true,
        "maxDamageTolerance" integer,
        "porositySupport" text,
        "elasticitySupport" text,
        "criteria" json,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_straightening" PRIMARY KEY ("id")
      )
    `);

    // Audit Logs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "action" character varying NOT NULL,
        "userId" uuid,
        "salonId" uuid,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id")
      )
    `);

    // Indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_salonId" ON "users" ("salonId")`,
    );

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'analysis_history' AND column_name = 'salonId'
        ) THEN
          EXECUTE 'CREATE INDEX IF NOT EXISTS "IDX_analysis_history_salonId" ON "analysis_history" ("salonId")';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'analysis_history' AND column_name = 'professionalId'
        ) THEN
          EXECUTE 'CREATE INDEX IF NOT EXISTS "IDX_analysis_history_professionalId" ON "analysis_history" ("professionalId")';
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'analysis_history' AND column_name = 'clientId'
        ) THEN
          EXECUTE 'CREATE INDEX IF NOT EXISTS "IDX_analysis_history_clientId" ON "analysis_history" ("clientId")';
        END IF;
      END $$;
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_knowledge_documents_salonId" ON "knowledge_documents" ("salonId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_knowledge_documents_groupId" ON "knowledge_documents" ("groupId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_straightening_salonId" ON "straightening" ("salonId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_logs_salonId" ON "audit_logs" ("salonId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_audit_logs_userId" ON "audit_logs" ("userId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE "straightening"`);
    await queryRunner.query(`DROP TABLE "knowledge_documents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "analysis_history"`);
    await queryRunner.query(`DROP TABLE "clientes"`);
    await queryRunner.query(`DROP TABLE "salons"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
