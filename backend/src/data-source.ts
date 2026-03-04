import { DataSource } from 'typeorm';
import { UserEntity } from './modules/auth/user.entity';
import { SalonEntity } from './modules/salon/salon.entity';
import { HistoryEntity } from './modules/history/history.entity';
import { KnowledgeDocument } from './modules/knowledge/knowledge-document.entity';
import { StraighteningEntity } from './modules/straightening/straightening.entity';
import { Cliente } from './clientes/entities/cliente.entity';
import { AuditLogEntity } from './modules/audit/audit-log.entity';
import { NotificationReadEntity } from './modules/history/entities/notification-read.entity';

const dbPort = Number(process.env.DATABASE_PORT) || 5432;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: dbPort,
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'hair_analysis',
  entities: [
    UserEntity,
    SalonEntity,
    HistoryEntity,
    KnowledgeDocument,
    StraighteningEntity,
    Cliente,
    AuditLogEntity,
    NotificationReadEntity,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
