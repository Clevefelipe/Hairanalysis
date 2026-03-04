import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from 'typeorm';

export class AddHistoryNotificationsRead20260303180700 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Se a tabela já existir (tentativa anterior), remove para evitar conflitos de constraint
    const hasTable = await queryRunner.hasTable('history_notifications_read');
    if (hasTable) {
      await queryRunner.query('DROP TABLE IF EXISTS "history_notifications_read" CASCADE');
    }

    await queryRunner.createTable(
      new Table({
        name: 'history_notifications_read',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            isGenerated: true,
          },
          {
            name: 'notificationId',
            type: 'varchar',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'salonId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'history_notifications_read',
      new TableUnique({
        name: 'UQ_history_notifications_read_notification_user',
        columnNames: ['notificationId', 'userId'],
      }),
    );

    await queryRunner.createForeignKey(
      'history_notifications_read',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'history_notifications_read',
      new TableForeignKey({
        columnNames: ['salonId'],
        referencedTableName: 'salons',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('history_notifications_read');
    if (table) {
      const unique = table.uniques.find((u) => u.name === 'UQ_history_notifications_read_notification_user');
      if (unique) {
        await queryRunner.dropUniqueConstraint('history_notifications_read', unique);
      }
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('history_notifications_read', fk);
      }
    }
    await queryRunner.dropTable('history_notifications_read', true);
  }
}
