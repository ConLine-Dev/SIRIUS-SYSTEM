-- ===============================
-- ÍNDICES DE PERFORMANCE PARA EVITAR LOCK TIMEOUTS
-- ===============================

-- 1. ÍNDICES PARA TABELAS DE PROCEDIMENTOS
-- ===============================

-- Índice para busca por departamento
CREATE INDEX IF NOT EXISTS idx_proc_main_department ON proc_main(department_id);

-- Índice para busca por responsável
CREATE INDEX IF NOT EXISTS idx_proc_main_responsible ON proc_main(responsible_id);

-- Índice para busca por tipo
CREATE INDEX IF NOT EXISTS idx_proc_main_type ON proc_main(type_id);

-- Índice para ordenação por data de atualização
CREATE INDEX IF NOT EXISTS idx_proc_main_updated ON proc_main(updated_at);

-- Índice para versões de procedimentos
CREATE INDEX IF NOT EXISTS idx_proc_versions_procedure ON proc_versions(procedure_id);
CREATE INDEX IF NOT EXISTS idx_proc_versions_number ON proc_versions(procedure_id, version_number);

-- Índice para tags
CREATE INDEX IF NOT EXISTS idx_proc_tags_name ON proc_tags(name);
CREATE INDEX IF NOT EXISTS idx_proc_procedure_tags_procedure ON proc_procedure_tags(procedure_id);
CREATE INDEX IF NOT EXISTS idx_proc_procedure_tags_tag ON proc_procedure_tags(tag_id);

-- Índice para anexos
CREATE INDEX IF NOT EXISTS idx_proc_attachments_procedure ON proc_attachments(procedure_id);

-- 2. ÍNDICES PARA TABELAS DE PDI
-- ===============================

-- Índice para PDIs por colaborador
CREATE INDEX IF NOT EXISTS idx_pdi_plans_collaborator ON pdi_plans(collaborator_id);

-- Índice para PDIs por supervisor
CREATE INDEX IF NOT EXISTS idx_pdi_plans_supervisor ON pdi_plans(supervisor_id);

-- Índice para PDIs por status
CREATE INDEX IF NOT EXISTS idx_pdi_plans_status ON pdi_plans(status);

-- Índice para ações de PDI
CREATE INDEX IF NOT EXISTS idx_pdi_actions_pdi ON pdi_actions(pdi_id);
CREATE INDEX IF NOT EXISTS idx_pdi_actions_status ON pdi_actions(status);
CREATE INDEX IF NOT EXISTS idx_pdi_actions_deadline ON pdi_actions(deadline);

-- Índice para fatores de PDI
CREATE INDEX IF NOT EXISTS idx_pdi_plan_factors_pdi ON pdi_plan_factors(pdi_id);
CREATE INDEX IF NOT EXISTS idx_pdi_plan_factors_factor ON pdi_plan_factors(factor_id);

-- Índice para avaliações mensais
CREATE INDEX IF NOT EXISTS idx_pdi_monthly_evaluations_pdi ON pdi_monthly_evaluations(pdi_id);
CREATE INDEX IF NOT EXISTS idx_pdi_monthly_evaluations_month_year ON pdi_monthly_evaluations(month, year);

-- Índice para respostas de avaliação
CREATE INDEX IF NOT EXISTS idx_pdi_evaluation_answers_evaluation ON pdi_evaluation_answers(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_pdi_evaluation_answers_factor ON pdi_evaluation_answers(factor_id);

-- 3. ÍNDICES PARA TABELAS DE CONTROLE DE MATERIAIS
-- ===============================

-- Índice para movimentações por material
CREATE INDEX IF NOT EXISTS idx_material_control_movements_material ON material_control_movements(material_id);
CREATE INDEX IF NOT EXISTS idx_material_control_movements_type ON material_control_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_material_control_movements_material_type ON material_control_movements(material_id, movement_type);

-- Índice para alocações por material
CREATE INDEX IF NOT EXISTS idx_material_control_allocations_material ON material_control_allocations(material_id);
CREATE INDEX IF NOT EXISTS idx_material_control_allocations_collaborator ON material_control_allocations(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_material_control_allocations_status ON material_control_allocations(status);

-- Índice para materiais por categoria
CREATE INDEX IF NOT EXISTS idx_material_control_materials_category ON material_control_materials(category_id);
CREATE INDEX IF NOT EXISTS idx_material_control_materials_status ON material_control_materials(status);

-- 4. ÍNDICES PARA TABELAS DE COLABORADORES
-- ===============================

-- Índice para colaboradores por departamento
CREATE INDEX IF NOT EXISTS idx_collaborators_department ON collaborators(department_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_status ON collaborators(status);

-- Índice para usuários por colaborador
CREATE INDEX IF NOT EXISTS idx_users_collaborator ON users(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- 5. ÍNDICES PARA TABELAS DE DEPARTAMENTOS
-- ===============================

-- Índice para departamentos por status
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);

-- 6. ÍNDICES PARA TABELAS DE LOGS
-- ===============================

-- Índice para logs de queries por usuário
CREATE INDEX IF NOT EXISTS idx_query_logs_user ON query_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_query_logs_success ON query_logs(success);
CREATE INDEX IF NOT EXISTS idx_query_logs_timestamp ON query_logs(created_at);

-- 7. ÍNDICES PARA TABELAS DE TICKETS
-- ===============================

-- Índice para tickets por status
CREATE INDEX IF NOT EXISTS idx_called_tickets_status ON called_tickets(status);
CREATE INDEX IF NOT EXISTS idx_called_tickets_priority ON called_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_called_tickets_created ON called_tickets(created_at);

-- Índice para tickets envolvidos
CREATE INDEX IF NOT EXISTS idx_called_tickets_involved_ticket ON called_tickets_involved(ticket_id);
CREATE INDEX IF NOT EXISTS idx_called_tickets_involved_collaborator ON called_tickets_involved(collaborator_id);

-- 8. ÍNDICES PARA TABELAS DE CONTROLE DE SENHAS
-- ===============================

-- Índice para senhas por responsável
CREATE INDEX IF NOT EXISTS idx_password_control_responsible ON password_control(responsible);
CREATE INDEX IF NOT EXISTS idx_password_control_status ON password_control(status);

-- Índice para relações de senhas com departamentos
CREATE INDEX IF NOT EXISTS idx_password_relation_department_password ON password_relation_department(password_id);
CREATE INDEX IF NOT EXISTS idx_password_relation_department_department ON password_relation_department(department_id);

-- 9. ÍNDICES PARA TABELAS DE CONTROLE DE VISITANTES
-- ===============================

-- Índice para visitantes por data
CREATE INDEX IF NOT EXISTS idx_visitor_control_date ON visitor_control(date);
CREATE INDEX IF NOT EXISTS idx_visitor_control_status ON visitor_control(status);

-- 10. ÍNDICES PARA TABELAS DE GESTÃO DE DESPESAS
-- ===============================

-- Índice para solicitações de despesa por status
CREATE INDEX IF NOT EXISTS idx_zero_based_expense_requests_status ON zero_based_expense_requests(status);
CREATE INDEX IF NOT EXISTS idx_zero_based_expense_requests_requester ON zero_based_expense_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_zero_based_expense_requests_created ON zero_based_expense_requests(created_at);

-- Índice para itens de despesa
CREATE INDEX IF NOT EXISTS idx_zero_based_expense_items_request ON zero_based_expense_items(expense_request_id);

-- 11. ÍNDICES PARA TABELAS DE RH
-- ===============================

-- Índice para folha de pagamento
CREATE INDEX IF NOT EXISTS idx_rh_payroll_month_year ON rh_payroll(month, year);
CREATE INDEX IF NOT EXISTS idx_rh_payroll_collaborator ON rh_payroll(collaborator_id);

-- Índice para descontos
CREATE INDEX IF NOT EXISTS idx_rh_discounts_collaborator ON rh_discounts(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_rh_discounts_month_year ON rh_discounts(month, year);

-- 12. ÍNDICES PARA TABELAS DE PESSOAS
-- ===============================

-- Índice para pessoas por status
CREATE INDEX IF NOT EXISTS idx_people_status ON people(people_status_id);
CREATE INDEX IF NOT EXISTS idx_people_commercial ON people(collaborators_commercial_id);
CREATE INDEX IF NOT EXISTS idx_people_responsible ON people(collaborators_responsible_id);

-- Índice para relações de pessoas com categorias
CREATE INDEX IF NOT EXISTS idx_people_category_relations_people ON people_category_relations(people_id);
CREATE INDEX IF NOT EXISTS idx_people_category_relations_category ON people_category_relations(people_category_id);

-- ===============================
-- VERIFICAÇÃO DE ÍNDICES EXISTENTES
-- ===============================

-- Query para verificar índices existentes
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    SEQ_IN_INDEX
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME IN (
    'proc_main', 'proc_versions', 'proc_tags', 'proc_procedure_tags', 'proc_attachments',
    'pdi_plans', 'pdi_actions', 'pdi_plan_factors', 'pdi_monthly_evaluations', 'pdi_evaluation_answers',
    'material_control_movements', 'material_control_allocations', 'material_control_materials',
    'collaborators', 'users', 'departments', 'query_logs',
    'called_tickets', 'called_tickets_involved',
    'password_control', 'password_relation_department',
    'visitor_control', 'zero_based_expense_requests', 'zero_based_expense_items',
    'rh_payroll', 'rh_discounts', 'people', 'people_category_relations'
)
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- ===============================
-- ANÁLISE DE PERFORMANCE
-- ===============================

-- Query para identificar tabelas sem índices adequados
SELECT 
    t.TABLE_NAME,
    COUNT(i.INDEX_NAME) as index_count,
    t.TABLE_ROWS
FROM information_schema.TABLES t
LEFT JOIN information_schema.STATISTICS i ON t.TABLE_NAME = i.TABLE_NAME 
    AND i.TABLE_SCHEMA = t.TABLE_SCHEMA
WHERE t.TABLE_SCHEMA = DATABASE()
AND t.TABLE_NAME IN (
    'proc_main', 'proc_versions', 'proc_tags', 'proc_procedure_tags', 'proc_attachments',
    'pdi_plans', 'pdi_actions', 'pdi_plan_factors', 'pdi_monthly_evaluations', 'pdi_evaluation_answers',
    'material_control_movements', 'material_control_allocations', 'material_control_materials',
    'collaborators', 'users', 'departments', 'query_logs',
    'called_tickets', 'called_tickets_involved',
    'password_control', 'password_relation_department',
    'visitor_control', 'zero_based_expense_requests', 'zero_based_expense_items',
    'rh_payroll', 'rh_discounts', 'people', 'people_category_relations'
)
GROUP BY t.TABLE_NAME, t.TABLE_ROWS
ORDER BY t.TABLE_ROWS DESC;

-- ===============================
-- CONFIGURAÇÕES DE PERFORMANCE
-- ===============================

-- Verificar configurações atuais
SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
SHOW VARIABLES LIKE 'innodb_log_file_size';
SHOW VARIABLES LIKE 'innodb_flush_log_at_trx_commit';
SHOW VARIABLES LIKE 'innodb_lock_wait_timeout';
SHOW VARIABLES LIKE 'lock_wait_timeout';
SHOW VARIABLES LIKE 'max_connections';
SHOW VARIABLES LIKE 'wait_timeout';
SHOW VARIABLES LIKE 'interactive_timeout';

-- ===============================
-- MONITORAMENTO DE LOCKS
-- ===============================

-- Query para monitorar locks ativos (MySQL 5.7+)
SELECT 
    r.trx_id waiting_trx_id,
    r.trx_mysql_thread_id waiting_thread,
    r.trx_query waiting_query,
    b.trx_id blocking_trx_id,
    b.trx_mysql_thread_id blocking_thread,
    b.trx_query blocking_query
FROM information_schema.innodb_lock_waits w
INNER JOIN information_schema.innodb_trx b ON b.trx_id = w.blocking_trx_id
INNER JOIN information_schema.innodb_trx r ON r.trx_id = w.requesting_trx_id;

-- Query para verificar processos ativos
SHOW PROCESSLIST; 