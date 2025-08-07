# Funcionalidade: Adicionar Atividade Cotando com Fornecedor

## Descrição
Nova funcionalidade que permite adicionar automaticamente atividades do tipo "Cotando com Fornecedor" agrupadas por domínio dos destinatários dos emails.

## Como Funciona

### Frontend (sendEmail.html)
- **Novo checkbox**: "Adicionar atividade Cotando com Fornecedor agrupada por domínio"
- **ID**: `adicionarAtividadeCotando`
- **Localização**: Após os checkboxes existentes de "Revisão Pricing" e "Alterar status da atividade"

### Backend (direct_mail_pricing.js)

#### Funções Implementadas

1. **`groupEmailsByDomain(EmailTO)`**
   - Agrupa emails por domínio principal
   - Exemplos de agrupamento:
     - `test@msc.com, user@msc.com` → grupo `msc`
     - `info@pio.com.br` → grupo `pio`  
     - `contact@domain.gov` → grupo `domain`
     - `user@empresa.gov.br` → grupo `empresa`

2. **`getProposalActivityData(proposalRef)`**
   - Busca dados da proposta no SQL Server
   - Retorna `IdProjeto_Atividade` necessário para criar as atividades

3. **`getLastActivityId()`**
   - Busca o último ID de atividade no SQL Server
   - Usado para gerar novos IDs incrementais

4. **`insertActivity(idAtividade, idProjetoAtividade, domain)`**
   - Insere nova atividade no SQL Server com **sistema de retry**
   - Parâmetros fixos: `IdTarefa = 1790`, `Situacao = 0`, `Prioridade = 0`
   - Domínio é inserido no campo `Complemento` **sempre em MAIÚSCULA**
   - **Retry automático**: Em caso de conflito de ID, consulta novamente o último ID e tenta novamente
   - **Máximo de 5 tentativas** para evitar loops infinitos

#### Fluxo de Execução

Quando o checkbox `adicionarAtividadeCotando` está marcado e um email é enviado:

1. **Agrupamento**: Emails são agrupados por domínio principal
2. **Consulta Proposta**: Busca dados da proposta usando o número de referência
3. **Último ID**: Obtém o último `IdAtividade` do banco
4. **Inserção**: Para cada domínio encontrado:
   - Calcula ID inicial: `último_id + buffer(10) + índice + 1`
   - Tenta inserir nova atividade com o domínio no campo `Complemento`
   - **Se ID já existe**: Incrementa sequencialmente (+1) até encontrar disponível
   - **Retry robusto**: Até 50 tentativas por domínio
   - **Estratégia de pulo**: A cada 10 tentativas, busca novo último ID
   - **Logs detalhados**: Para cada tentativa e resultado

## Exemplo de Uso

### Entrada
- **Destinatários**: 
  - `test@msc.com, user@msc.com`
  - `info@pio.com.br` 
  - `contact@hapag.com`
- **Checkbox marcado**: `adicionarAtividadeCotando = true`
- **Proposta**: `PR-2024-001`

### Resultado
Serão criadas 3 atividades:
1. Atividade com `Complemento = "MSC"`
2. Atividade com `Complemento = "PIO"`  
3. Atividade com `Complemento = "HAPAG"`

## Tratamento de Erros

### Sistema de Retry Robusto
- **Detecção automática** de conflitos de chave primária (ID duplicado)
- **Incremento sequencial** de ID até encontrar um disponível  
- **Máximo de 50 tentativas** por atividade com estratégia de "pulo"
- **Buffer de segurança** de 10 IDs no cálculo inicial
- **Reconsulta automática** a cada 10 tentativas para "pular" faixas ocupadas
- **Continua processamento** mesmo se uma atividade falhar

### Validações e Logs
- Validação de proposta existente
- Log inicial: `🎯 Tentando criar atividade para domínio X com ID inicial: Y`
- Logs de retry: `🔄 Tentativa X - ID Y já existe. Tentando com ID: Z`
- Logs de pulo: `🔍 Após X tentativas, consultando último ID novamente...`
- Logs de sucesso: `✅ Atividade criada para domínio: X - ID: Y`
- Logs de erro: `❌ Erro ao criar atividade para domínio X`
- Try/catch para capturar erros e continuar execução
- Verificação de dados obrigatórios antes da inserção

### Tipos de Erro Tratados
- **PRIMARY KEY violation**: Retry automático com novo ID
- **Erros de conexão**: Falha após tentativas
- **Dados inválidos**: Falha imediata (sem retry)
- **Timeout**: Falha após tentativas

## Query de Exemplo

**Inserir nova atividade:**
```sql
INSERT INTO mov_Atividade
(IdAtividade, IdProjeto_Atividade, IdTarefa, Situacao, Prioridade, Mensagem_Automatica, Acompanhamento_Automatico, Complemento) 
VALUES (1443408, 88794, 1790, 0, 0, '', '', 'MSC')
```

**Resultado no banco:**
- `IdAtividade`: 1443408 (gerado automaticamente)
- `IdProjeto_Atividade`: 88794 (da proposta)
- `IdTarefa`: 1790 (fixo - Cotando com Fornecedor)
- `Situacao`: 0 (pendente)
- `Prioridade`: 0 (normal)
- `Complemento`: **"MSC"** (domínio em maiúscula) 