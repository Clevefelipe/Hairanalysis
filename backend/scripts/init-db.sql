-- Initialize Hair Analysis System Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for better performance
-- These will be created by migrations, but we add them here for initial setup

-- Set default timezone
SET timezone = 'America/Sao_Paulo';

-- Create custom types if needed
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'PROFESSIONAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE analysis_type AS ENUM ('CAPILLAR', 'TRICOLOGIC');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Grant permissions (adjust as needed)
-- GRANT ALL PRIVILEGES ON DATABASE hair_analysis TO postgres;
