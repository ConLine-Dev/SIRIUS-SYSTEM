-- ========================================
-- TABELAS DE LOG PARA EMAILS HEADCARGO
-- ========================================

-- Tabela principal de logs de envio de emails
CREATE TABLE IF NOT EXISTS `active_logs_headcargo_email_sends` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email_type` VARCHAR(50) NOT NULL COMMENT 'Tipo do email: morning_individual, evening_individual, morning_manager, evening_manager',
    `recipient_email` VARCHAR(255) NOT NULL COMMENT 'Email do destinatário',
    `recipient_name` VARCHAR(255) NOT NULL COMMENT 'Nome do destinatário',
    `subject` VARCHAR(500) NOT NULL COMMENT 'Assunto do email',
    `status` ENUM('success', 'error') NOT NULL COMMENT 'Status do envio',
    `error_message` TEXT NULL COMMENT 'Mensagem de erro (se houver)',
    `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data/hora do envio',
    `retry_count` INT DEFAULT 0 COMMENT 'Número de tentativas de reenvio',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data/hora de criação do registro',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data/hora da última atualização',
    
    -- Índices para otimização
    INDEX `idx_email_type` (`email_type`),
    INDEX `idx_recipient_email` (`recipient_email`),
    INDEX `idx_status` (`status`),
    INDEX `idx_sent_at` (`sent_at`),
    INDEX `idx_retry_count` (`retry_count`),
    INDEX `idx_email_type_status` (`email_type`, `status`),
    INDEX `idx_recipient_date` (`recipient_email`, `sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Log de envio de emails do sistema HeadCargo';

-- Tabela de configurações de agendamento
CREATE TABLE IF NOT EXISTS `active_logs_headcargo_email_config` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `config_key` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Chave da configuração',
    `config_value` TEXT NOT NULL COMMENT 'Valor da configuração',
    `description` VARCHAR(500) NULL COMMENT 'Descrição da configuração',
    `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Se a configuração está ativa',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data/hora de criação',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data/hora da última atualização',
    
    INDEX `idx_config_key` (`config_key`),
    INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Configurações do sistema de emails HeadCargo';

-- Tabela de estatísticas de envio
CREATE TABLE IF NOT EXISTS `active_logs_headcargo_email_stats` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `date` DATE NOT NULL COMMENT 'Data das estatísticas',
    `email_type` VARCHAR(50) NOT NULL COMMENT 'Tipo do email',
    `total_sent` INT DEFAULT 0 COMMENT 'Total de emails enviados',
    `success_count` INT DEFAULT 0 COMMENT 'Emails enviados com sucesso',
    `error_count` INT DEFAULT 0 COMMENT 'Emails com erro',
    `retry_count` INT DEFAULT 0 COMMENT 'Total de retries',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data/hora de criação',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data/hora da última atualização',
    
    UNIQUE KEY `uk_date_type` (`date`, `email_type`),
    INDEX `idx_date` (`date`),
    INDEX `idx_email_type` (`email_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Estatísticas de envio de emails HeadCargo';

-- Inserir configurações padrão
INSERT INTO `active_logs_headcargo_email_config` (`config_key`, `config_value`, `description`) VALUES
('morning_time', '06:30', 'Horário para envio dos relatórios matinais'),
('evening_time', '17:45', 'Horário para envio dos relatórios vespertinos'),
('max_retries', '3', 'Número máximo de tentativas de reenvio'),
('retry_interval_hours', '1', 'Intervalo em horas para retry de emails com falha'),
('email_delay_seconds', '1', 'Delay entre envios de email em segundos'),
('production_mode_only', 'true', 'Se o agendamento só funciona em modo produção'),
('log_retention_days', '90', 'Dias para manter logs antigos'),
('enable_retry', 'true', 'Se o sistema de retry está habilitado');

-- Criar view para facilitar consultas de estatísticas
CREATE OR REPLACE VIEW `active_logs_headcargo_email_daily_stats` AS
SELECT 
    DATE(sent_at) as date,
    email_type,
    COUNT(*) as total_emails,
    SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
    SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count,
    SUM(retry_count) as total_retries,
    ROUND((SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as success_rate
FROM `active_logs_headcargo_email_sends`
GROUP BY DATE(sent_at), email_type
ORDER BY date DESC, email_type;

-- Criar view para emails com falha recentes
CREATE OR REPLACE VIEW `active_logs_headcargo_email_failed_recent` AS
SELECT 
    id,
    email_type,
    recipient_email,
    recipient_name,
    subject,
    error_message,
    sent_at,
    retry_count,
    DATEDIFF(NOW(), sent_at) as days_old
FROM `active_logs_headcargo_email_sends`
WHERE status = 'error' 
AND sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY sent_at DESC;

-- Criar view para verificar emails enviados hoje
CREATE OR REPLACE VIEW `active_logs_headcargo_email_today` AS
SELECT 
    email_type,
    recipient_email,
    recipient_name,
    status,
    sent_at,
    retry_count
FROM `active_logs_headcargo_email_sends`
WHERE DATE(sent_at) = CURDATE()
ORDER BY sent_at DESC;

-- ========================================
-- PROCEDURES ÚTEIS
-- ========================================

-- Procedure para limpar logs antigos
DELIMITER //
CREATE PROCEDURE `active_logs_headcargo_email_cleanup_old_logs`(IN days_to_keep INT)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE deleted_count INT DEFAULT 0;
    
    -- Deletar logs mais antigos que o especificado
    DELETE FROM `active_logs_headcargo_email_sends` 
    WHERE sent_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);
    
    SET deleted_count = ROW_COUNT();
    
    -- Log da limpeza
    INSERT INTO `active_logs_headcargo_email_config` (`config_key`, `config_value`, `description`)
    VALUES ('last_cleanup', NOW(), CONCAT('Limpeza automática: ', deleted_count, ' registros removidos'))
    ON DUPLICATE KEY UPDATE 
    `config_value` = NOW(),
    `description` = CONCAT('Limpeza automática: ', deleted_count, ' registros removidos');
    
    SELECT CONCAT('Limpeza concluída: ', deleted_count, ' registros removidos') as result;
END //
DELIMITER ;

-- Procedure para gerar estatísticas diárias
DELIMITER //
CREATE PROCEDURE `active_logs_headcargo_email_generate_daily_stats`(IN target_date DATE)
BEGIN
    INSERT INTO `active_logs_headcargo_email_stats` (`date`, `email_type`, `total_sent`, `success_count`, `error_count`, `retry_count`)
    SELECT 
        DATE(sent_at) as date,
        email_type,
        COUNT(*) as total_sent,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count,
        SUM(retry_count) as retry_count
    FROM `active_logs_headcargo_email_sends`
    WHERE DATE(sent_at) = target_date
    GROUP BY email_type
    ON DUPLICATE KEY UPDATE
    `total_sent` = VALUES(`total_sent`),
    `success_count` = VALUES(`success_count`),
    `error_count` = VALUES(`error_count`),
    `retry_count` = VALUES(`retry_count`),
    `updated_at` = NOW();
    
    SELECT CONCAT('Estatísticas geradas para ', target_date) as result;
END //
DELIMITER ;

-- ========================================
-- TRIGGERS PARA MANTER ESTATÍSTICAS ATUALIZADAS
-- ========================================

-- Trigger para atualizar estatísticas quando um email é enviado
DELIMITER //
CREATE TRIGGER `active_logs_headcargo_email_after_insert`
AFTER INSERT ON `active_logs_headcargo_email_sends`
FOR EACH ROW
BEGIN
    INSERT INTO `active_logs_headcargo_email_stats` (`date`, `email_type`, `total_sent`, `success_count`, `error_count`, `retry_count`)
    VALUES (
        DATE(NEW.sent_at),
        NEW.email_type,
        1,
        CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status = 'error' THEN 1 ELSE 0 END,
        NEW.retry_count
    )
    ON DUPLICATE KEY UPDATE
    `total_sent` = `total_sent` + 1,
    `success_count` = `success_count` + CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
    `error_count` = `error_count` + CASE WHEN NEW.status = 'error' THEN 1 ELSE 0 END,
    `retry_count` = `retry_count` + NEW.retry_count,
    `updated_at` = NOW();
END //
DELIMITER ;

-- ========================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ========================================

/*
SISTEMA DE LOG DE EMAILS HEADCARGO
===================================

ESTRUTURA DAS TABELAS:
---------------------
1. active_logs_headcargo_email_sends: Log principal de envios
2. active_logs_headcargo_email_config: Configurações do sistema
3. active_logs_headcargo_email_stats: Estatísticas diárias

VIEWS DISPONÍVEIS:
------------------
1. active_logs_headcargo_email_daily_stats: Estatísticas diárias
2. active_logs_headcargo_email_failed_recent: Emails com falha recentes
3. active_logs_headcargo_email_today: Emails enviados hoje

PROCEDURES ÚTEIS:
-----------------
1. active_logs_headcargo_email_cleanup_old_logs(days): Limpa logs antigos
2. active_logs_headcargo_email_generate_daily_stats(date): Gera estatísticas

CONSULTAS ÚTEIS:
----------------
-- Emails com falha hoje
SELECT * FROM active_logs_headcargo_email_sends 
WHERE DATE(sent_at) = CURDATE() AND status = 'error';

-- Estatísticas do mês
SELECT * FROM active_logs_headcargo_email_daily_stats 
WHERE date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);

-- Configurações ativas
SELECT * FROM active_logs_headcargo_email_config WHERE is_active = TRUE;
*/ 