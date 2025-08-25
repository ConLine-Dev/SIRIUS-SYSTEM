-- Migração: Adicionar campos de hash para evitar duplicatas de arquivos
-- Data: 2024-12-20
-- Descrição: Adiciona campos file_hash e email_hash para identificar arquivos únicos por email

-- Adicionar campos de hash na tabela hr_applicant_attachments
ALTER TABLE hr_applicant_attachments 
ADD COLUMN file_hash VARCHAR(64) NULL COMMENT 'Hash SHA-256 do conteúdo do arquivo',
ADD COLUMN email_hash VARCHAR(64) NULL COMMENT 'Hash combinado: file_hash + email do candidato',
ADD INDEX idx_hr_applicant_attachments_file_hash (file_hash),
ADD INDEX idx_hr_applicant_attachments_email_hash (email_hash),
ADD UNIQUE KEY uq_hr_applicant_attachments_email_hash (email_hash);

-- Comentário explicativo
-- file_hash: Hash único do conteúdo do arquivo (mesmo arquivo = mesmo hash)
-- email_hash: Hash combinado do file_hash + email do candidato (evita duplicatas por email)
-- Índices para performance nas consultas de verificação de duplicatas 