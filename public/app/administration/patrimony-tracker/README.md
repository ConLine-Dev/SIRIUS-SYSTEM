# Módulo de Gerenciamento de Patrimônio

## Visão Geral

O Módulo de Gerenciamento de Patrimônio é uma solução completa para controle do ciclo de vida dos ativos empresariais, desde o cadastro inicial até o descarte. Desenvolvido para atender às necessidades de inventário, rastreabilidade e auditoria, o sistema oferece uma interface moderna e intuitiva para gerenciar todos os aspectos relacionados ao patrimônio da organização.

## Funcionalidades Principais

### 1. Gerenciamento de Itens

- **Cadastro de Itens**: Registro de novos ativos com informações como código, descrição, localização e data de aquisição.
- **Edição de Informações**: Atualização de dados básicos de itens existentes.
- **Visualização Detalhada**: Acesso a todas as informações do item, incluindo histórico completo de atribuições e eventos.
- **Múltiplas Visualizações**: Três modos de visualização na listagem principal:
  - **Tabela**: Visão tradicional com todos os dados em colunas.
  - **Cards**: Apresentação visual em cartões para fácil identificação.
  - **Agrupada**: Organização por localização para facilitar inventários físicos.

### 2. Ciclo de Vida do Ativo

O sistema gerencia o item em todos os seus possíveis estados:

- **Disponível**: Item livre para atribuição.
- **Em Uso**: Atribuído a um colaborador específico.
- **Em Manutenção**: Temporariamente indisponível para uso.
- **Danificado**: Identificado com problemas, aguardando decisão.
- **Descartado/Baixado**: Removido do patrimônio ativo da empresa.

### 3. Gestão de Atribuições

- **Atribuição a Colaboradores**: Vinculação de itens a funcionários.
- **Devolução**: Registro da devolução de itens atribuídos.
- **Histórico Completo**: Registro permanente de todas as atribuições anteriores.
- **Notas e Observações**: Documentação de detalhes específicos de cada atribuição.

### 4. Manutenção e Controle de Qualidade

- **Envio para Manutenção**: Registro quando um item precisa de reparos.
- **Retorno de Manutenção**: Reintegração ao inventário após conserto.
- **Marcação como Danificado**: Identificação de itens com problemas.
- **Descarte/Baixa**: Processo para remover permanentemente itens do inventário ativo.

### 5. Auditoria e Análise

- **Auditoria Inteligente com IA**: Análise automatizada dos padrões de uso, histórico de manutenção e recomendações.
- **Log de Eventos**: Registro detalhado de todas as ações realizadas no item.
- **Timeline de Atividades**: Visualização cronológica de todos os eventos relacionados ao item.

## Arquitetura do Módulo

### Estrutura de Arquivos

```
patrimony-tracker/
├── assets/
│   ├── css/
│   │   ├── index.css
│   │   ├── view.css
│   │   ├── edit.css
│   │   └── create.css
│   └── js/
│       ├── index.js
│       ├── view.js
│       ├── edit.js
│       └── create.js
├── index.html
├── view.html
├── edit.html
├── create.html
└── database_schema.sql
```

### Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript, jQuery, Bootstrap 5
- **Backend**: Node.js, Express
- **Banco de Dados**: MySQL
- **Dependências**: Bootstrap, DataTables, Remix Icons

### Integração com o Sistema

O módulo está integrado ao sistema principal SIRIUS-SYSTEM através de:

1. Autenticação compartilhada
2. API RESTful
3. Design System unificado
4. Acesso via menu principal

## Fluxos de Trabalho

### Cadastro de Novo Item

1. Acesso à tela de cadastro
2. Preenchimento das informações básicas (código, descrição, localização, data de aquisição)
3. Opcionalmente, definição do estado inicial e notas adicionais
4. Submissão do formulário
5. Validação e confirmação do cadastro

### Atribuição a Colaborador

1. Seleção do item na listagem
2. Acionamento da opção "Atribuir" no dropdown de ações
3. Seleção do colaborador destinatário
4. Inclusão de notas sobre a atribuição
5. Confirmação da operação
6. Atualização do estado do item para "Em Uso"

### Envio para Manutenção

1. Seleção do item na listagem
2. Acionamento da opção "Enviar para Manutenção" no dropdown de ações
3. Confirmação da operação
4. Atualização do estado do item para "Em Manutenção"

### Baixa/Descarte de Item

1. Seleção do item na listagem
2. Acionamento da opção "Descartar/Baixar" no dropdown de ações
3. Confirmação dupla (por segurança)
4. Inclusão de justificativa para o descarte
5. Atualização do estado do item para "Descartado/Baixado"

## Estrutura do Banco de Dados

O módulo utiliza as seguintes tabelas principais:

- **pat_items**: Armazena os metadados de cada item de patrimônio
- **pat_assignments**: Histórico de atribuições de itens a colaboradores
- **pat_events**: Log de eventos e ações realizadas nos itens

## Interface e Experiência do Usuário

### Princípios de Design

- **Simplicidade**: Interface limpa e direta, focada nas tarefas comuns
- **Feedback Claro**: Confirmações visuais para todas as ações
- **Contextualização**: Ações disponíveis conforme o estado atual do item
- **Responsividade**: Adaptação a diferentes tamanhos de tela
- **Consistência**: Padrões visuais uniformes em todo o módulo

### Elementos de Interface

- **Badges de Status**: Identificação visual rápida do estado do item
- **Dropdowns de Ação**: Acesso contextual às operações disponíveis
- **Modais de Confirmação**: Prevenção de ações acidentais
- **Toasts Informativos**: Feedback não-intrusivo sobre operações
- **Timeline de Eventos**: Visualização cronológica das atividades

## Manutenção e Expansão

### Possíveis Melhorias Futuras

1. **Integração com Leitor de QR Code/Código de Barras** para inventário físico
2. **Depreciação Automática** para cálculos contábeis
3. **Notificações** para manutenções preventivas
4. **Dashboard Analítico** com métricas de utilização e custos
5. **Importação/Exportação em Massa** de itens
6. **Gestão de Garantias** com alertas de vencimento

### Customização

O módulo foi desenvolvido para ser facilmente adaptável a diferentes necessidades, permitindo:

- Personalização de campos obrigatórios
- Adição de campos personalizados
- Configuração de fluxos de aprovação
- Integração com outros módulos do sistema

## Segurança e Controle de Acesso

O módulo utiliza o sistema de permissões da plataforma principal, permitindo:

- Configuração granular de permissões por função
- Registro de auditoria para todas as operações
- Validação de dados em múltiplas camadas
- Proteção contra operações não autorizadas

---

## Conclusão

O Módulo de Gerenciamento de Patrimônio oferece uma solução completa e moderna para o controle de ativos empresariais, combinando facilidade de uso com funcionalidades avançadas. A interface intuitiva e os fluxos de trabalho otimizados permitem que equipes de qualquer tamanho gerenciem eficientemente todo o ciclo de vida dos itens patrimoniais, desde a aquisição até o descarte. 