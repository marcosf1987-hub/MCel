-- Permitir reportar comentarios de listas
ALTER TYPE report_target_type ADD VALUE IF NOT EXISTS 'list_comment';
