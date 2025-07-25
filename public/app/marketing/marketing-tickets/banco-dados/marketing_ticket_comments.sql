-- marketing_ticket_comments.sql
CREATE TABLE marketing_ticket_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    type ENUM('publico','interno') DEFAULT 'publico',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES marketing_tickets(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
); 