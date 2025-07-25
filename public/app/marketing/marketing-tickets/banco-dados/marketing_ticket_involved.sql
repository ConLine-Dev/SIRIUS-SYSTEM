-- marketing_ticket_involved.sql
CREATE TABLE marketing_ticket_involved (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    user_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES marketing_tickets(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
); 