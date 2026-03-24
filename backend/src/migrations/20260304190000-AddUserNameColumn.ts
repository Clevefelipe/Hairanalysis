import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserNameColumn20260304190000 implements MigrationInterface {
  name = 'AddUserNameColumn20260304190000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "name"`,
    );
  }
}
