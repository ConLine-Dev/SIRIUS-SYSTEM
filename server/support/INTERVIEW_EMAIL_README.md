# Sistema de Email de Alerta de Entrevistas

## 📧 Visão Geral

Este sistema envia automaticamente um email diário com todas as entrevistas agendadas para o dia, permitindo que a equipe de RH se organize melhor.

## 🚀 Funcionalidades

### 1. **Email Diário Automático**
- **Horário**: Enviado todos os dias às 8:00 da manhã
- **Conteúdo**: Lista de todas as entrevistas do dia
- **Formato**: Email HTML responsivo e profissional

### 2. **Template de Email**
- **Design**: Interface moderna com gradientes e ícones
- **Informações**: Candidato, vaga, departamento, horário
- **Links**: Acesso direto ao sistema para ver detalhes
- **Dicas**: Sugestões para o dia de entrevistas

### 3. **Teste Manual**
- **Botão**: Disponível na interface do sistema
- **Script**: Comando npm para teste via terminal
- **API**: Endpoint para teste programático

## 📋 Configuração

### 1. **Email de Destino**
Atualmente configurado para: `petryck.leite@conlinebr.com.br`

Para alterar, edite o arquivo: `server/controllers/hr-job-openings.js`
```javascript
const recipientEmail = 'seu-email@empresa.com';
```

### 2. **Horário de Envio**
Configurado para 8:00 da manhã (fuso horário de Brasília)

Para alterar, edite o arquivo: `server/scripts/interview-alert-cron.js`
```javascript
cron.schedule('0 8 * * *', async () => {
  // 0 8 * * * = Todos os dias às 8:00
});
```

### 3. **URL do Sistema**
Para links funcionarem corretamente, configure a variável de ambiente:
```env
SYSTEM_URL=https://seu-dominio.com
```

## 🧪 Como Testar

### 1. **Via Interface Web**
1. Acesse: `/app/administration/rh-job-openings/view.html`
2. Clique no botão "Testar Email" (ícone de envelope)
3. Aguarde a confirmação

### 2. **Via Terminal**
```bash
npm run interview-email-test
```

### 3. **Via API**
```bash
curl -X POST http://localhost:3000/api/hr-job-openings/send-interview-alert
```

## 📊 Estrutura do Email

### **Cabeçalho**
- Título: "📅 Alerta de Entrevistas"
- Data atual
- Resumo do dia

### **Tabela de Entrevistas**
- **Candidato**: Nome e email
- **Vaga**: Título e departamento
- **Horário**: Formato HH:MM
- **Ação**: Link para ver candidato

### **Dicas do Dia**
- Confirmação de presença
- Preparação da sala
- Documentação necessária
- Atualização do cronograma

## 🔧 Arquivos Principais

### **Backend**
- `server/controllers/hr-job-openings.js` - Lógica de busca e envio
- `server/support/emails-template.js` - Template do email
- `server/scripts/interview-alert-cron.js` - Agendamento
- `server/routes/api-hr-job-openings.js` - Rota de teste

### **Frontend**
- `public/app/administration/rh-job-openings/view.html` - Botão de teste

### **Scripts**
- `server/scripts/test-interview-email.js` - Teste manual
- `package.json` - Comando npm

## 📅 Agendamento

### **Cron Job**
```javascript
// Executar todos os dias às 8:00
cron.schedule('0 8 * * *', async () => {
  await sendInterviewAlertEmail();
});
```

### **Inicialização**
O cron job é inicializado automaticamente quando o servidor inicia.

## 🎯 Próximos Passos

### **Melhorias Futuras**
1. **Múltiplos Destinatários**: Lista de emails do RH
2. **Configuração via Interface**: Painel administrativo
3. **Lembretes**: Emails de confirmação 1h antes
4. **Relatórios**: Estatísticas de entrevistas
5. **Integração**: Calendário do Google/Outlook

### **Personalização**
1. **Templates**: Múltiplos estilos de email
2. **Horários**: Configuração flexível
3. **Filtros**: Por departamento, tipo de vaga
4. **Notificações**: Push notifications

## 🐛 Troubleshooting

### **Email não enviado**
1. Verificar configurações SMTP
2. Verificar se há entrevistas no dia
3. Verificar logs do servidor

### **Cron não executando**
1. Verificar se o servidor está rodando
2. Verificar fuso horário
3. Verificar logs de inicialização

### **Template com erro**
1. Verificar sintaxe HTML
2. Verificar variáveis do template
3. Testar com dados mock

## 📞 Suporte

Para dúvidas ou problemas, entre em contato com a equipe de desenvolvimento. 