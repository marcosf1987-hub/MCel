-- Notificaciones al publicar / rechazar propuestas de locales

ALTER TYPE user_notification_type ADD VALUE IF NOT EXISTS 'place_published';
ALTER TYPE user_notification_type ADD VALUE IF NOT EXISTS 'place_rejected';
