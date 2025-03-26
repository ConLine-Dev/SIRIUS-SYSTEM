-- Tabela para armazenar estatísticas de tráfego de páginas
CREATE TABLE IF NOT EXISTS user_tracking_page_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,
    view_count INT NOT NULL DEFAULT 0,
    timestamp DATETIME NOT NULL,
    INDEX idx_module (module),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela para armazenar sessões de usuários (opcional)
CREATE TABLE IF NOT EXISTS user_tracking_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    user_id INT,
    user_name VARCHAR(255),
    page_title VARCHAR(255),
    page_path VARCHAR(255),
    module VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    duration INT,
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 