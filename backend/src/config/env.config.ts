import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// Carrega variáveis de ambiente antes da validação (suporta .env.local e .env)
loadEnv({ path: '.env.local', override: true });
loadEnv();

// Schema de validação para variáveis de ambiente
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().optional(),
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().default(5432),
  DATABASE_USERNAME: z.string().default('postgres'),
  DATABASE_PASSWORD: z.string().default('postgres'),
  DATABASE_NAME: z.string().default('hair_analysis'),

  // Legacy database vars (fallback)
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().optional(),
  DB_USER: z.string().optional(),
  DB_PASS: z.string().optional(),
  DB_NAME: z.string().optional(),

  // Application
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(3000),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),

  // Rate limiting
  RATE_LIMIT_TTL: z.coerce.number().default(60),
  RATE_LIMIT_LIMIT: z.coerce.number().default(100),

  // AI/OpenAI
  OPENAI_API_KEY: z.string().optional(),

  // S3/Storage
  REPORTS_STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  REPORTS_S3_BUCKET: z.string().optional(),
  REPORTS_S3_REGION: z.string().optional(),
  REPORTS_S3_ACCESS_KEY_ID: z.string().optional(),
  REPORTS_S3_SECRET_ACCESS_KEY: z.string().optional(),

  // URLs
  FRONTEND_URL: z.string().optional(),
  PUBLIC_APP_URL: z.string().optional(),
  PUBLIC_REPORT_BASE_URL: z.string().optional(),

  // Observability
  PROMETHEUS_PORT: z.coerce.number().default(9090),
  GRAFANA_URL: z.string().optional(),
});

// Tipo inferido do schema
type EnvConfig = z.infer<typeof envSchema>;

// Função para validar e parsear variáveis de ambiente
export function validateEnv(): EnvConfig {
  try {
    const parsed = envSchema.parse(process.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('; ');

      // Ajuda a identificar variáveis faltantes ou inválidas na inicialização
      throw new Error(`Variáveis de ambiente inválidas: ${details}`);
    }
    throw error;
  }
}

// Instância validada das variáveis de ambiente
export const env = validateEnv();

// Helper para obter configuração de database (com fallbacks)
export const getDatabaseConfig = () => {
  return {
    host: env.DATABASE_HOST || env.DB_HOST,
    port: env.DATABASE_PORT || env.DB_PORT || 5432,
    username: env.DATABASE_USERNAME || env.DB_USER || 'postgres',
    password: env.DATABASE_PASSWORD || env.DB_PASS || 'postgres',
    database: env.DATABASE_NAME || env.DB_NAME || 'hair_analysis',
  };
};

// Helper para obter configuração de S3
export const getS3Config = () => {
  if (env.REPORTS_STORAGE_PROVIDER !== 's3') {
    return null;
  }

  const requiredS3Vars = [
    'REPORTS_S3_BUCKET',
    'REPORTS_S3_REGION',
    'REPORTS_S3_ACCESS_KEY_ID',
    'REPORTS_S3_SECRET_ACCESS_KEY',
  ];

  for (const varName of requiredS3Vars) {
    if (!env[varName as keyof EnvConfig]) {
      throw new Error(
        `Variável de ambiente ${varName} é obrigatória quando REPORTS_STORAGE_PROVIDER=s3`,
      );
    }
  }

  return {
    bucket: env.REPORTS_S3_BUCKET!,
    region: env.REPORTS_S3_REGION!,
    accessKeyId: env.REPORTS_S3_ACCESS_KEY_ID!,
    secretAccessKey: env.REPORTS_S3_SECRET_ACCESS_KEY!,
  };
};
