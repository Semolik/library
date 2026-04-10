-- Initialize database
-- This script is executed on first PostgreSQL container startup
-- It ensures the 'library' database exists

-- Create database if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'library') THEN
        CREATE DATABASE library;
    END IF;
END
$$;


