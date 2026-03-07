import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChemicalProfileToHistory20260307150900 implements MigrationInterface {
  name = 'AddChemicalProfileToHistory20260307150900';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'analysis_history' AND column_name = 'chemicalProfile'
        ) THEN
          ALTER TABLE "analysis_history" ADD COLUMN "chemicalProfile" jsonb;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'analysis_history' AND column_name = 'chemicalProfile'
        ) THEN
          ALTER TABLE "analysis_history" DROP COLUMN "chemicalProfile";
        END IF;
      END $$;
    `);
  }
}
