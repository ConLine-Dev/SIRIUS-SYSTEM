# Sistema de Emails Automáticos de Entrevistas

## 📋 Visão Geral

O sistema de emails automáticos de entrevistas foi redesenhado para garantir confiabilidade e rastreabilidade. Agora utiliza uma tabela de controle para gerenciar o estado dos emails, evitando perdas por falhas de servidor ou problemas de rede.

## 🏗️ Arquitetura

### Tabelas do Banco de Dados

#### `hr_interview_email_logs`
Controla o estado de todos os emails automáticos:

```sql
- id: Identificador único
- email_type: Tipo do email (daily_alert, reminder_15min, reminder_candidate)
- application_id: ID da aplicação (opcional)
- interview_date: Data/hora da entrevista
- candidate_email: Email do candidato (para lembretes)
- recipient_emails: Array JSON de emails destinatários
- subject: Assunto do email
- email_content: Conteúdo HTML do email
- status: Estado (pending, sent, failed, skipped)
- sent_at: Timestamp de envio
- error_message: Mensagem de erro (se houver)
- retry_count: Contador de tentativas
- max_retries: Máximo de tentativas
- next_retry_at: Próxima tentativa
- created_at/updated_at: Timestamps
```

#### `hr_interview_email_config`
Configurações do sistema:

```sql
- config_key: Chave da configuração
- config_value: Valor da configuração
- description: Descrição
- is_active: Status ativo
```

### Componentes Principais

#### 1. InterviewEmailManager (`server/services/interview-email-manager.js`)
Classe principal que gerencia:
- Registro de emails para envio
- Processamento de emails pendentes
- Controle de tentativas e retry
- Limpeza de logs antigos

#### 2. Configuração (`server/config/interview-email-config.js`)
Sistema de configuração com cache:
- Busca/atualização de configurações
- Cache de 5 minutos para performance
- Funções de compatibilidade com código existente

#### 3. Processador (`server/scripts/process-interview-emails.js`)
Script independente para:
- Processamento manual de emails
- Estatísticas e relatórios
- Limpeza de logs
- Execução via linha de comando

## 🔄 Fluxo de Funcionamento

### 1. Registro de Emails
```javascript
// O sistema registra emails em vez de enviar diretamente
const emailId = await emailManager.registerDailyAlert(interviews);
const emailIds = await emailManager.registerReminders(interviews);
```

### 2. Processamento de Emails Pendentes
```javascript
// Processa emails pendentes com retry automático
const result = await emailManager.processPendingEmails();
```

### 3. Controle de Estado
- **pending**: Email aguardando envio
- **sent**: Email enviado com sucesso
- **failed**: Falha no envio (com retry automático)
- **skipped**: Email ignorado (já enviado, desabilitado, etc.)

## ⚙️ Configurações Disponíveis

### Configurações Básicas
- `daily_alert_enabled`: Habilitar email diário (true/false)
- `daily_alert_time`: Horário do alerta diário (HH:MM)
- `reminder_15min_enabled`: Habilitar lembretes 15min (true/false)
- `reminder_15min_interval`: Intervalo em minutos (padrão: 15)
- `candidate_reminder_enabled`: Habilitar lembretes para candidatos (true/false)

### Configurações de Retry
- `max_retries`: Máximo de tentativas (padrão: 3)
- `retry_interval_minutes`: Intervalo entre tentativas (padrão: 5)

### Configurações de Email
- `recipient_emails`: Array JSON de emails destinatários
- `email_subject_prefix`: Prefixo do assunto (padrão: [CONLINE])

## 🚀 Como Usar

### Via API

#### Buscar Configurações
```bash
GET /api/hr-job-openings/email-config
```

#### Atualizar Configuração
```bash
PUT /api/hr-job-openings/email-config
{
  "key": "daily_alert_enabled",
  "value": "true",
  "description": "Habilitar email diário de alerta de entrevistas"
}
```

#### Processar Emails Pendentes
```bash
POST /api/hr-job-openings/process-pending-emails
```

#### Ver Estatísticas
```bash
GET /api/hr-job-openings/email-stats
```

### Via Linha de Comando

#### Processar Emails Pendentes
```bash
node server/scripts/process-interview-emails.js pending
```

#### Verificar Alertas Diários
```bash
node server/scripts/process-interview-emails.js daily
```

#### Verificar Lembretes 15min
```bash
node server/scripts/process-interview-emails.js reminders
```

#### Processamento Completo
```bash
node server/scripts/process-interview-emails.js full
```

#### Limpar Logs Antigos
```bash
node server/scripts/process-interview-emails.js cleanup 15
```

#### Ver Estatísticas
```bash
node server/scripts/process-interview-emails.js stats
```

## 📅 Agendamento (Cron)

O sistema mantém o agendamento via cron, mas agora com melhor controle:

```javascript
// 7:00 - Email diário
cron.schedule('0 7 * * *', async () => {
  await processor.checkDailyAlerts();
});

// A cada 5 min - Processar emails pendentes
cron.schedule('*/5 * * * *', async () => {
  await processor.processPendingEmails();
});

// A cada minuto - Verificar lembretes 15min
cron.schedule('* * * * *', async () => {
  await processor.checkReminders();
});

// Domingo 2:00 - Limpeza de logs
cron.schedule('0 2 * * 0', async () => {
  await processor.cleanupOldLogs(30);
});
```

## 🔍 Monitoramento e Debug

### Logs Detalhados
O sistema gera logs detalhados para cada operação:
- Registro de emails
- Tentativas de envio
- Sucessos e falhas
- Retry automático

### Estatísticas
```javascript
// Buscar estatísticas dos últimos 7 dias
const stats = await emailManager.getEmailStats();
```

### Verificar Estado
```sql
-- Emails pendentes
SELECT * FROM hr_interview_email_logs 
WHERE status = 'pending' 
AND (next_retry_at IS NULL OR next_retry_at <= NOW());

-- Emails falhados
SELECT * FROM hr_interview_email_logs 
WHERE status = 'failed' 
AND retry_count >= max_retries;

-- Emails enviados hoje
SELECT * FROM hr_interview_email_logs 
WHERE status = 'sent' 
AND DATE(sent_at) = CURDATE();
```

## 🕐 Correções de Fuso Horário

### Problema Identificado
- Sistema estava usando UTC incorretamente, causando cálculos errados
- Entrevista às 15:00 local estava sendo calculada como -182 min (incorreto)
- Cálculos de tempo inconsistentes entre JavaScript e MySQL

### Soluções Implementadas
1. **Uso de horário local** no MySQL com `NOW()` para consistência
2. **Remoção de conversões UTC** desnecessárias
3. **Logs detalhados** mostrando horários locais
4. **Scripts de teste** para verificar funcionamento

### Como Testar
```bash
# Teste de correção de fuso horário
node server/scripts/test-timezone-fix.js

# Teste de fuso horário (antigo)
node server/scripts/test-interview-timezone.js

# Criar entrevista de teste (12 min no futuro)
node server/scripts/create-test-interview.js

# Testar lembretes
node server/scripts/process-interview-emails.js reminders

# Remover entrevista de teste
node server/scripts/create-test-interview.js remove
```

## ⏰ Emails para Entrevistas Passadas

### Nova Funcionalidade
O sistema agora envia emails de aviso para entrevistas que já passaram, desde que o email ainda não tenha sido enviado.

### Comportamento
- **Entrevistas futuras**: Envia lembrete 15 min antes (como antes)
- **Entrevistas passadas**: Envia aviso mesmo que já tenha passado (até 2 horas atrás)
- **Controle de duplicação**: Não envia email se já foi enviado anteriormente

### Tipos de Email
- `reminder_15min`: Para entrevistas futuras (15 min antes)
- `reminder_past`: Para entrevistas passadas (sem email enviado)
- `reminder_candidate`: Para candidatos (apenas entrevistas futuras)

### Como Testar
```bash
# Criar entrevista passada para teste
node server/scripts/test-past-interview-reminder.js create

# Testar envio de emails para entrevistas passadas
node server/scripts/test-past-interview-reminder.js test

# Limpar dados de teste
node server/scripts/test-past-interview-reminder.js cleanup
```

## 🛠️ Manutenção

### Limpeza Automática
- Logs com mais de 30 dias são removidos automaticamente
- Configurável via `cleanup` command

### Backup de Configurações
```sql
-- Backup das configurações
SELECT * FROM hr_interview_email_config WHERE is_active = 1;
```

### Recuperação de Falhas
```bash
# Processar emails pendentes manualmente
node server/scripts/process-interview-emails.js pending

# Verificar se há emails falhados
node server/scripts/process-interview-emails.js stats
```

## 🔧 Migração

### Do Sistema Anterior
1. O sistema é compatível com o código existente
2. Funções antigas foram mantidas para compatibilidade
3. Configurações antigas são migradas automaticamente

### Verificação Pós-Migração
```bash
# Verificar se o sistema está funcionando
node server/scripts/process-interview-emails.js full

# Verificar configurações
GET /api/hr-job-openings/email-config
```

## 📊 Benefícios

### ✅ Confiabilidade
- Não perde emails por falhas de servidor
- Retry automático com backoff
- Controle de estado completo

### ✅ Rastreabilidade
- Log completo de todos os emails
- Estatísticas detalhadas
- Debug facilitado

### ✅ Flexibilidade
- Configurações via banco de dados
- Processamento independente do cron
- Controle granular de funcionalidades

### ✅ Manutenibilidade
- Código modular e bem documentado
- Fácil extensão e modificação
- Logs estruturados

## 🚨 Troubleshooting

### Emails Não Enviados
1. Verificar se há emails pendentes: `pending` command
2. Verificar configurações: `GET /email-config`
3. Verificar logs de erro na tabela

### Problemas de Fuso Horário
1. **Entrevistas não detectadas**: Verificar se as datas estão em UTC
2. **Teste de fuso horário**: `node server/scripts/test-interview-timezone.js`
3. **Criar entrevista de teste**: `node server/scripts/create-test-interview.js`
4. **Verificar logs detalhados**: O sistema agora mostra horários local e UTC

### Falhas de Configuração
1. Verificar se a tabela `hr_interview_email_config` existe
2. Verificar se as configurações padrão foram inseridas
3. Verificar permissões de banco de dados

### Performance
1. Verificar se o cache está funcionando
2. Limpar logs antigos regularmente
3. Monitorar uso de memória do processador

## 📝 Notas de Implementação

- O sistema mantém compatibilidade total com o código existente
- As funções antigas foram refatoradas para usar o novo sistema
- Configurações são carregadas do banco com cache de 5 minutos
- Logs são mantidos por 30 dias por padrão
- Retry automático com intervalo configurável
- Processamento independente do cron para maior confiabilidade
- **Correção de fuso horário**: Agora usa UTC consistentemente
- **Logs detalhados**: Mostra horários local e UTC para debug 