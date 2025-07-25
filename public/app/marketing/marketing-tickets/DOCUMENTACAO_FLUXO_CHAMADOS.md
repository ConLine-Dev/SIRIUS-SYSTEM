# Documentação do Sistema de Chamados de Marketing

## 📋 Visão Geral

O sistema de chamados de marketing permite que colaboradores solicitem serviços do time de marketing de forma organizada e estruturada. O sistema gerencia todo o ciclo de vida do chamado, desde a abertura até a finalização, com controle de status, comentários, anexos e notificações.

## 🎯 Tipos de Solicitação Disponíveis

### 1. **Criação de Arte** (`arte`)
- **Descrição**: Solicitação para criação de materiais visuais
- **Campos Específicos**: 
  - **Dimensões/Formato** (obrigatório)
- **Workflow**: Design → Revisão → Aprovação → Entrega
- **Exemplos**: Banners, flyers, posts para redes sociais, logos

### 2. **Sugestão de Postagem** (`postagem`)
- **Descrição**: Proposta de conteúdo para redes sociais
- **Campos Específicos**: Nenhum adicional
- **Workflow**: Análise → Criação → Agendamento → Publicação
- **Exemplos**: Posts para Instagram, LinkedIn, Facebook

### 3. **Solicitação de Brinde** (`brinde`)
- **Descrição**: Pedido de materiais promocionais
- **Campos Específicos**: Nenhum adicional
- **Workflow**: Análise → Cotação → Aprovação → Produção → Entrega
- **Exemplos**: Canetas, camisetas, mugs, folders

### 4. **Ação de Campanha** (`campanha`)
- **Descrição**: Estratégias de marketing e campanhas
- **Campos Específicos**: Nenhum adicional
- **Workflow**: Planejamento → Execução → Monitoramento → Relatório
- **Exemplos**: Campanhas de e-mail, eventos, parcerias

### 5. **Revisão de Conteúdo** (`revisao`)
- **Descrição**: Análise e correção de materiais existentes
- **Campos Específicos**: Nenhum adicional
- **Workflow**: Análise → Correções → Validação → Aprovação
- **Exemplos**: Revisão de textos, ajustes em artes

### 6. **Apoio a Evento** (`evento`)
- **Descrição**: Suporte para eventos corporativos
- **Campos Específicos**: Nenhum adicional
- **Workflow**: Planejamento → Preparação → Execução → Pós-evento
- **Exemplos**: Material para feiras, eventos internos, apresentações

### 7. **Outro** (`outro`)
- **Descrição**: Solicitações não categorizadas
- **Campos Específicos**: 
  - **Descreva o tipo de solicitação** (obrigatório)
- **Workflow**: Análise → Definição de processo → Execução
- **Exemplos**: Consultorias, pesquisas, projetos especiais

## 📝 Campos do Formulário

### **Campos Obrigatórios** (*)
1. **Título** - Nome descritivo do chamado
2. **Tipo de Solicitação** - Categoria principal do pedido
3. **Categoria** - Projeto ou Referência
4. **Descrição detalhada** - Detalhamento completo da solicitação

### **Campos Condicionais**
- **Dimensões/Formato** - Obrigatório apenas para "Criação de Arte"
- **Descreva o tipo de solicitação** - Obrigatório apenas para "Outro"

### **Campos Opcionais**
- **Anexos** - Arquivos de suporte (PDF, JPG, PNG, DOC, XLS)
- **Links de referência** - URLs de materiais de exemplo
- **Envolvidos** - Usuários que devem ser notificados

## 🔄 Workflow de Status

### **1. Novo** (Status Inicial)
- Chamado recém-criado
- Aguarda análise do time de marketing
- **Ações disponíveis**: Comentários, adicionar anexos

### **2. Em Triagem**
- Time de marketing analisando a solicitação
- Definindo responsável e cronograma
- **Ações disponíveis**: Comentários, definir responsável, definir datas

### **3. Em Andamento**
- Trabalho sendo executado
- **Ações disponíveis**: Comentários, upload de anexos, atualizações

### **4. Aguardando Validação**
- Material pronto para aprovação
- **Ações disponíveis**: 
  - Comentários
  - **Botão "Aprovar"** → Muda status para "Finalizado"
  - **Botão "Solicitar Ajustes"** → Muda status para "Em andamento"
- **Workflow**: Validação → Aprovação ou Retorno para ajustes

### **5. Aguardando Retorno do Solicitante**
- Aguardando feedback do solicitante
- **Ações disponíveis**: 
  - Comentários
  - **Botão "Aceitar"** → Muda status para "Finalizado"
  - **Botão "Recusar"** → Muda status para "Em andamento"
  - **Botão "Solicitar Mais Info"** → Muda status para "Em andamento"
- **Workflow**: Avaliação → Aceitação, Recusa ou Solicitação de informações

### **6. Finalizado**
- Chamado concluído com sucesso
- **Ações disponíveis**: Apenas visualização

## 👥 Categorias

### **Projeto** (`projeto`)
- Solicitações que geram novos materiais
- Requer criação do zero
- Exemplos: Criação de arte, campanhas, eventos

### **Referência** (`referencia`)
- Solicitações baseadas em materiais existentes
- Adaptação ou revisão de conteúdo
- Exemplos: Revisão de textos, ajustes em artes

## 📧 Sistema de Notificações

### **E-mails Automáticos**
1. **Confirmação de Criação** - Enviado ao solicitante
2. **Notificação ao Marketing** - Alerta o time sobre novo chamado
3. **Atualizações de Status** - Notifica mudanças importantes
4. **Comentários** - Notifica novos comentários aos envolvidos

### **Destinatários**
- **Solicitante**: Sempre notificado
- **Time de Marketing**: marketing@conlinebr.com.br
- **Envolvidos**: Usuários selecionados no formulário

## 📎 Sistema de Anexos

### **Tipos Aceitos**
- **Imagens**: JPG, JPEG, PNG
- **Documentos**: PDF, DOC, DOCX
- **Planilhas**: XLS, XLSX

### **Funcionalidades**
- **Upload Múltiplo**: Múltiplos arquivos simultâneos
- **Visualização**: Preview de imagens
- **Download**: Acesso direto aos arquivos
- **Organização**: Listagem por data de upload

## 💬 Sistema de Comentários

### **Tipos de Comentário**
- **Público**: Visível para todos os envolvidos
- **Interno**: Apenas para o time de marketing

### **Funcionalidades**
- **Tempo Real**: Atualização via Socket.IO
- **Notificações**: Alertas por e-mail
- **Histórico**: Timeline completa de interações

## 🔍 Filtros e Busca

### **Filtros Disponíveis**
- **Palavra-chave**: Busca em título e descrição
- **Tipo**: Filtro por categoria de solicitação
- **Status**: Filtro por situação atual
- **Responsável**: Filtro por pessoa responsável
- **Solicitante**: Filtro por quem abriu o chamado

### **Ordenação**
- **Padrão**: Mais recentes primeiro
- **Status**: Agrupamento por situação
- **Prioridade**: Baseada em tipo e urgência

## 👤 Controle de Permissões

### **Colaboradores**
- **Criar**: Abrir novos chamados
- **Visualizar**: Ver chamados próprios e envolvidos
- **Comentar**: Adicionar comentários públicos
- **Anexar**: Upload de arquivos

### **Time de Marketing**
- **Todas as permissões de colaboradores**
- **Editar**: Modificar chamados
- **Status**: Alterar situação dos chamados
- **Responsável**: Definir pessoa responsável
- **Datas**: Definir cronograma
- **Comentários Internos**: Comentários privados

### **Administradores**
- **Todas as permissões**
- **Excluir**: Remover chamados
- **Relatórios**: Acesso a métricas
- **Configurações**: Ajustes do sistema

## 📊 Métricas e Relatórios

### **Indicadores Disponíveis**
- **Total de Chamados**: Por período
- **Tempo Médio**: De abertura até finalização
- **Distribuição por Tipo**: Percentual por categoria
- **Performance**: Chamados por responsável
- **Satisfação**: Baseada em feedback

### **Relatórios**
- **Mensal**: Resumo de atividades
- **Por Responsável**: Performance individual
- **Por Tipo**: Análise de demandas
- **Tendências**: Evolução temporal

## 🚀 Fluxo Completo de Criação

### **1. Abertura do Chamado**
1. Usuário acessa a página de criação
2. Preenche campos obrigatórios
3. Seleciona tipo de solicitação
4. Adiciona campos específicos (se aplicável)
5. Anexa arquivos (opcional)
6. Seleciona envolvidos (opcional)
7. Submete formulário

### **2. Processamento Inicial**
1. Sistema valida dados
2. Cria registro no banco
3. Salva anexos
4. Registra envolvidos
5. Envia e-mails de notificação
6. Retorna confirmação

### **3. Análise do Marketing**
1. Time recebe notificação
2. Analisa solicitação
3. Define responsável
4. Estabelece cronograma
5. Atualiza status para "Em Triagem"

### **4. Execução**
1. Responsável executa trabalho
2. Atualiza progresso via comentários
3. Faz upload de materiais
4. Solicita validação quando necessário

### **5. Validação e Entrega**
1. Material é apresentado ao solicitante
2. Solicitante aprova ou solicita ajustes
3. Ajustes são feitos (se necessário)
4. Chamado é finalizado

## ⚠️ Regras e Validações

### **Validações de Formulário**
- **Título**: Máximo 255 caracteres
- **Descrição**: Mínimo 10 caracteres
- **Anexos**: Máximo 10MB por arquivo
- **Links**: Formato URL válido
- **Envolvidos**: Máximo 10 usuários

### **Regras de Negócio**
- **Datas**: Definidas apenas pelo marketing
- **Status**: Apenas marketing pode alterar
- **Responsável**: Apenas marketing pode definir
- **Exclusão**: Apenas administradores
- **Comentários Internos**: Apenas marketing

## 🎯 Botões de Ação por Status

### **Status: "Aguardando Validação"**
Aparecem os seguintes botões:

#### **✅ Aprovar**
- **Ação**: Muda status para "Finalizado"
- **Comentário Automático**: "Material aprovado com sucesso!"
- **Quem pode usar**: Colaboradores (página view.html)
- **Resultado**: Chamado finalizado

#### **⚠️ Solicitar Ajustes**
- **Ação**: Muda status para "Em andamento"
- **Comentário Automático**: "Ajustes solicitados: [descrição]"
- **Quem pode usar**: Colaboradores (página view.html)
- **Resultado**: Chamado retorna para execução

### **Status: "Aguardando Retorno do Solicitante"**
Aparecem os seguintes botões:

#### **✅ Aceitar**
- **Ação**: Muda status para "Finalizado"
- **Comentário Automático**: "Material aceito pelo solicitante!"
- **Quem pode usar**: Solicitante e envolvidos (página view.html)
- **Resultado**: Chamado finalizado

#### **❌ Recusar**
- **Ação**: Muda status para "Em andamento"
- **Comentário Automático**: "Material recusado: [motivo]"
- **Quem pode usar**: Solicitante e envolvidos (página view.html)
- **Resultado**: Chamado retorna para execução

#### **❓ Solicitar Mais Info**
- **Ação**: Muda status para "Em andamento"
- **Comentário Automático**: "Solicitação de informações: [detalhes]"
- **Quem pode usar**: Solicitante e envolvidos (página view.html)
- **Resultado**: Chamado retorna para execução

### **Comportamento dos Botões**
- **Visibilidade**: Botões aparecem apenas nos status específicos na página de visualização
- **Localização**: Botões ficam no cabeçalho da página view.html (apenas para colaboradores)
- **Confirmação**: Todos os botões pedem confirmação via modal antes de executar
- **Comentários**: Ações geram comentários automáticos no histórico
- **Notificações**: Mudanças de status enviam e-mails automáticos
- **Interface**: Status badge e botões são atualizados em tempo real
- **Administração**: Página edit.html não possui botões de ação (apenas edição manual)

### **Limitações**
- **Anexos**: 5 arquivos por chamado
- **Comentários**: Sem limite
- **Envolvidos**: 10 usuários por chamado
- **Tempo**: Sem prazo automático

## 🔧 Configurações Técnicas

### **Banco de Dados**
- **Tabela Principal**: `marketing_tickets`
- **Comentários**: `marketing_ticket_comments`
- **Anexos**: `marketing_ticket_attachments`
- **Envolvidos**: `marketing_ticket_involved`

### **APIs Disponíveis**
- `GET /api/marketing/tickets` - Listar chamados
- `POST /api/marketing/tickets` - Criar chamado
- `GET /api/marketing/tickets/:id` - Detalhes
- `PUT /api/marketing/tickets/:id` - Atualizar
- `DELETE /api/marketing/tickets/:id` - Excluir
- `GET /api/marketing/tickets/users` - Listar usuários
- `POST /api/marketing/tickets/:id/comments` - Adicionar comentário
- `POST /api/marketing/tickets/:id/attachments` - Upload anexo

### **Tecnologias**
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend**: Node.js, Express
- **Banco**: MySQL
- **Upload**: Multer
- **E-mail**: Nodemailer
- **Tempo Real**: Socket.IO

## 📞 Suporte e Contato

Para dúvidas sobre o sistema de chamados de marketing:
- **E-mail**: petryck.leite@conlinebr.com.br
- **Documentação**: Este arquivo
- **Treinamento**: Solicitar ao time de TI

---

*Documentação atualizada em: Dezembro 2024*
*Versão do Sistema: 1.0* 