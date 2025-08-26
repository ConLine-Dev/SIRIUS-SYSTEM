# Sistema de Notificação de Nova Candidatura ao RH

## 📋 Visão Geral

Este sistema envia automaticamente emails de notificação para a equipe de RH sempre que um candidato se inscrever em uma vaga, seja através do sistema administrativo ou da página pública de candidaturas.

## 🚀 Funcionalidades

### ✅ Notificação Automática
- **Disparo automático**: Email enviado instantaneamente quando candidato se inscreve
- **Múltiplos destinatários**: Suporte a vários emails do RH
- **Informações completas**: Dados do candidato, vaga e anexos

### 📧 Template Profissional
- **Design responsivo**: Email otimizado para desktop e mobile
- **Informações detalhadas**: Nome, email, telefone, LinkedIn, portfólio
- **Botões de ação**: Links diretos para o sistema
- **Próximos passos**: Checklist para o RH

### ⚙️ Configuração Flexível
- **Emails dinâmicos**: Configurados na tabela `hr_interview_email_config`
- **Prefixo personalizável**: Assunto do email configurável
- **Falha silenciosa**: Não interrompe o processo de candidatura

## 🔧 Componentes Técnicos

### 1. Template de Email
**Arquivo**: `server/support/hr-candidate-templates.js`
- Função: `newApplicationNotification.generate()`
- Template HTML profissional com informações completas
- Botões para visualizar no sistema

### 2. Função de Envio
**Arquivo**: `server/controllers/hr-job-openings.js`
- Função: `sendNewApplicationNotificationToHR()`
- Busca emails do RH na configuração
- Envia para todos os destinatários configurados
- Retorna estatísticas de envio

### 3. Integração nas Candidaturas
**Locais de execução**:
- `createApplicantAndApplication()` - Sistema administrativo
- `publicApply()` - Página pública de candidaturas

## 📊 Dados Incluídos no Email

### 👤 Informações do Candidato
- Nome completo
- Email
- Telefone (se fornecido)
- LinkedIn (se fornecido)
- Portfólio (se fornecido)
- Currículo (link se anexado)

### 💼 Informações da Vaga
- Título da vaga
- Departamento
- Data da candidatura
- ID da candidatura
- Origem da candidatura

### 📝 Conteúdo Adicional
- Carta de apresentação (se fornecida)
- Próximos passos sugeridos
- Links diretos para o sistema
- Checklist para o RH

## ⚙️ Configuração

### Emails do RH
Os emails destinatários são configurados na tabela `hr_interview_email_config`:

```sql
-- Visualizar configuração atual
SELECT config_value 
FROM hr_interview_email_config 
WHERE config_key = 'recipient_emails';

-- Atualizar emails (JSON array)
UPDATE hr_interview_email_config 
SET config_value = '["rh@empresa.com", "recrutamento@empresa.com"]'
WHERE config_key = 'recipient_emails';
```

### Via API
```javascript
// GET - Buscar configurações atuais
GET /api/hr-job-openings/email-config

// PUT - Atualizar emails do RH
PUT /api/hr-job-openings/email-config
{
  "recipient_emails": ["rh@empresa.com", "recrutamento@empresa.com"]
}
```

## 🔄 Fluxo de Funcionamento

1. **Candidato se inscreve** (sistema admin ou público)
2. **Dados são salvos** no banco de dados
3. **Email de confirmação** enviado ao candidato
4. **Notificação enviada** para todos os emails do RH
5. **Socket.IO emitido** para atualizações em tempo real
6. **Logs registrados** para auditoria

## 📈 Monitoramento

### Logs do Sistema
```javascript
// Sucesso
console.log(`✅ Notificação de nova candidatura enviada para RH: ${hrEmail}`);

// Estatísticas
console.log(`📊 Notificação de candidatura - Enviados: ${successCount}/${totalCount} emails`);
console.log(`   - Candidato: ${candidate_name}`);
console.log(`   - Vaga: ${job_title}`);
```

### Verificação via API
```javascript
// Endpoint para estatísticas
GET /api/hr-job-openings/email-stats
```

## 🛠️ Troubleshooting

### Email não está sendo enviado
1. Verificar configuração do SMTP
2. Verificar emails configurados: `SELECT * FROM hr_interview_email_config WHERE config_key = 'recipient_emails'`
3. Verificar logs do console

### Template não está sendo gerado
1. Verificar se o template existe em `hr-candidate-templates.js`
2. Verificar se todos os dados necessários estão sendo passados

### Configuração de emails
```javascript
// Usar função utilitária
const { updateRecipientEmails } = require('../config/interview-email-config');
await updateRecipientEmails(['rh@empresa.com', 'novo@empresa.com']);
```

## 📋 Checklist de Implementação

- [x] Template de email criado e estilizado
- [x] Função de envio implementada
- [x] Integração nas funções de candidatura
- [x] Configuração via banco de dados
- [x] Sistema de múltiplos destinatários
- [x] Logs e monitoramento
- [x] Tratamento de erros
- [x] Documentação completa

## 🔮 Melhorias Futuras

1. **Dashboard de métricas**: Painel com estatísticas de envio
2. **Templates personalizáveis**: Editor de templates via interface
3. **Webhooks**: Integração com sistemas externos
4. **Filtros inteligentes**: Notificações baseadas em critérios
5. **Mobile app**: Notificações push para mobile

---

**Status**: ✅ Implementado e funcionando
**Data**: Agosto 2025
**Versão**: 1.0 