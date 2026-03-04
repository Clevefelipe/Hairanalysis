-- Seed data for Hair Analysis System
-- Run this after migrations to populate initial data

-- Insert default admin user (password: admin123)
INSERT INTO "users" ("id", "email", "password", "fullName", "role", "createdAt", "updatedAt")
VALUES (
    uuid_generate_v4(),
    'admin@hairanalysis.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: admin123
    'Administrador do Sistema',
    'ADMIN',
    NOW(),
    NOW()
) ON CONFLICT ("email") DO NOTHING;

-- Insert default salon
INSERT INTO "salons" ("id", "name", "createdAt", "updatedAt")
VALUES (
    uuid_generate_v4(),
    'SDM Piraquara',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- Insert default professional user (password: prof123)
INSERT INTO "users" ("id", "email", "password", "fullName", "role", "salonId", "createdAt", "updatedAt")
SELECT 
    uuid_generate_v4(),
    'profissional@hairanalysis.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: prof123
    'Profissional',
    'PROFESSIONAL',
    s.id,
    NOW(),
    NOW()
FROM "salons" s 
WHERE s.name = 'SDM Piraquara'
LIMIT 1
ON CONFLICT ("email") DO NOTHING;

-- Insert sample straightening treatments
INSERT INTO "straightening" ("id", "salonId", "name", "description", "active", "maxDamageTolerance", "porositySupport", "elasticitySupport", "criteria", "createdAt", "updatedAt")
SELECT 
    uuid_generate_v4(),
    s.id,
    'Progressiva Orgânica',
    'Tratamento progressivo com ingredientes orgânicos',
    true,
    30,
    'Alta porosidade',
    'Elasticidade boa',
    '{"hairTypes": ["ondulado", "crespo"], "damageLevel": 30, "observations": "Requer teste mecha"}',
    NOW(),
    NOW()
FROM "salons" s 
WHERE s.name = 'SDM Piraquara'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO "straightening" ("id", "salonId", "name", "description", "active", "maxDamageTolerance", "porositySupport", "elasticitySupport", "criteria", "createdAt", "updatedAt")
SELECT 
    uuid_generate_v4(),
    s.id,
    'Botox Capilar',
    'Tratamento de reconstrução e alinhamento',
    true,
    20,
    'Porosidade média a alta',
    'Elasticidade preservada',
    '{"hairTypes": ["liso", "ondulado", "crespo"], "damageLevel": 20, "observations": "Seguro para quimicadas"}',
    NOW(),
    NOW()
FROM "salons" s 
WHERE s.name = 'SDM Piraquara'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample client
INSERT INTO "clientes" ("id", "nome", "telefone", "email", "createdAt", "updatedAt")
VALUES (
    uuid_generate_v4(),
    'Cliente Demonstração',
    '(11) 99999-9999',
    'cliente@hairanalysis.com',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;
