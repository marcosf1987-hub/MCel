-- Reportes de locales y evaluaciones de locales

ALTER TYPE report_target_type ADD VALUE IF NOT EXISTS 'place';
ALTER TYPE report_target_type ADD VALUE IF NOT EXISTS 'place_review';
