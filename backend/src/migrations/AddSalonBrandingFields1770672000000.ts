import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSalonBrandingFields1770672000000 implements MigrationInterface {
  name = 'AddSalonBrandingFields1770672000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "salons"
      ADD COLUMN IF NOT EXISTS "logoUrl" text
    `);
    await queryRunner.query(`
      ALTER TABLE "salons"
      ADD COLUMN IF NOT EXISTS "brandPrimaryColor" character varying(7)
    `);
    await queryRunner.query(`
      ALTER TABLE "salons"
      ADD COLUMN IF NOT EXISTS "brandSecondaryColor" character varying(7)
    `);
    await queryRunner.query(`
      ALTER TABLE "salons"
      ADD COLUMN IF NOT EXISTS "brandAccentColor" character varying(7)
    `);
    await queryRunner.query(`
      ALTER TABLE "salons"
      ADD COLUMN IF NOT EXISTS "brandFontFamily" character varying(64)
    `);
    await queryRunner.query(`
      ALTER TABLE "salons"
      ADD COLUMN IF NOT EXISTS "branding" jsonb
    `);
    await queryRunner.query(`
      ALTER TABLE "salons"
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "salons"
      DROP COLUMN IF EXISTS "updatedAt"
    `);
    await queryRunner.query(`
      ALTER TABLE "salons"
      DROP COLUMN IF EXISTS "branding"
    `);
    await queryRunner.query(`
      ALTER TABLE "salons"
      DROP COLUMN IF EXISTS "brandFontFamily"
    `);
    await queryRunner.query(`
      ALTER TABLE "salons"
      DROP COLUMN IF EXISTS "brandAccentColor"
    `);
    await queryRunner.query(`
      ALTER TABLE "salons"
      DROP COLUMN IF EXISTS "brandSecondaryColor"
    `);
    await queryRunner.query(`
      ALTER TABLE "salons"
      DROP COLUMN IF EXISTS "brandPrimaryColor"
    `);
    await queryRunner.query(`
      ALTER TABLE "salons"
      DROP COLUMN IF EXISTS "logoUrl"
    `);
  }
}
