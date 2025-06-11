# Prompt para Desenvolvimento Backend do Módulo de Gerenciamento de Patrimônio

## Contexto do Projeto

Estou desenvolvendo um módulo de Gerenciamento de Patrimônio (patrimony-tracker) para o sistema SIRIUS-SYSTEM. O frontend já está implementado com HTML, CSS e JavaScript, incluindo todas as visualizações e interações de usuário. Agora, preciso desenvolver o backend completo para suportar essas funcionalidades.

## Estrutura do Sistema

O sistema SIRIUS-SYSTEM já possui:
- Backend em Node.js/Express
- Banco de dados MySQL
- Sistema de autenticação e autorização
- APIs RESTful para outros módulos

## Requisitos do Backend

### 1. Modelo de Dados

Precisamos implementar um modelo de dados robusto para suportar:

- **Itens de Patrimônio**: Ativos da empresa com informações como:
  - ID/Código único
  - Descrição
  - Categoria
  - Data de aquisição
  - Valor de aquisição
  - Estado atual (Disponível, Em Uso, Em Manutenção, Danificado, Descartado)
  - Localização
  - Notas/Observações
  - Informações técnicas (quando aplicável)
  - Histórico de eventos

- **Atribuições**: Vínculo entre um item e um colaborador:
  - ID da atribuição
  - ID do item
  - ID do colaborador
  - Data de início
  - Data de término (se concluída)
  - Notas sobre a atribuição
  - Status da atribuição

- **Eventos**: Registro de todas as ações realizadas em um item:
  - ID do evento
  - ID do item
  - Tipo de evento (Cadastro, Atribuição, Devolução, Manutenção, Dano, Descarte)
  - Data e hora
  - Usuário responsável
  - Descrição/detalhes
  - Metadados adicionais (JSON)

### 2. APIs Necessárias

#### Itens de Patrimônio
- `GET /api/patrimony/items` - Listar todos os itens (com filtros e paginação)
- `GET /api/patrimony/items/:id` - Obter detalhes de um item específico
- `POST /api/patrimony/items` - Criar novo item
- `PUT /api/patrimony/items/:id` - Atualizar item existente
- `DELETE /api/patrimony/items/:id` - Remover item (soft delete)

#### Atribuições
- `GET /api/patrimony/assignments` - Listar todas as atribuições
- `GET /api/patrimony/assignments/:id` - Obter detalhes de uma atribuição
- `GET /api/patrimony/items/:id/assignments` - Listar atribuições de um item específico
- `GET /api/patrimony/users/:id/assignments` - Listar atribuições de um usuário específico
- `POST /api/patrimony/assignments` - Criar nova atribuição
- `PUT /api/patrimony/assignments/:id` - Atualizar atribuição existente
- `DELETE /api/patrimony/assignments/:id` - Encerrar atribuição

#### Eventos
- `GET /api/patrimony/events` - Listar todos os eventos
- `GET /api/patrimony/items/:id/events` - Listar eventos de um item específico
- `POST /api/patrimony/events` - Registrar novo evento

#### Ações Específicas
- `POST /api/patrimony/items/:id/assign` - Atribuir item a um colaborador
- `POST /api/patrimony/items/:id/return` - Registrar devolução de item
- `POST /api/patrimony/items/:id/maintenance` - Enviar item para manutenção
- `POST /api/patrimony/items/:id/maintenance/return` - Retornar item da manutenção
- `POST /api/patrimony/items/:id/damage` - Marcar item como danificado
- `POST /api/patrimony/items/:id/discard` - Descartar/Baixar item

#### Relatórios e Analytics
- `GET /api/patrimony/reports/inventory` - Relatório de inventário atual
- `GET /api/patrimony/reports/assignments` - Relatório de atribuições ativas
- `GET /api/patrimony/reports/maintenance` - Relatório de itens em manutenção
- `GET /api/patrimony/analytics/usage` - Análise de utilização dos itens
- `GET /api/patrimony/analytics/costs` - Análise de custos e depreciação

### 3. Regras de Negócio

1. **Controle de Estados**:
   - Um item só pode estar em um estado por vez
   - Transições entre estados devem seguir regras específicas (ex: um item descartado não pode voltar a ficar disponível)
   - Toda transição de estado deve gerar um evento no histórico

2. **Atribuições**:
   - Um item só pode ser atribuído se estiver no estado "Disponível"
   - Ao atribuir um item, seu estado deve mudar para "Em Uso"
   - Um item só pode estar atribuído a um colaborador por vez
   - Ao devolver um item, seu estado deve voltar para "Disponível"

3. **Manutenção**:
   - Um item em uso deve ser devolvido antes de ir para manutenção
   - Itens em manutenção não podem ser atribuídos
   - Ao retornar da manutenção, o item volta para o estado "Disponível"

4. **Descarte**:
   - Um item descartado não pode mais ser editado ou ter seu estado alterado
   - O descarte deve exigir uma justificativa
   - Deve-se manter um registro completo do histórico do item mesmo após o descarte

5. **Auditoria**:
   - Todas as ações devem ser registradas com timestamp e usuário responsável
   - O sistema deve permitir rastrear todo o histórico de um item

### 4. Autenticação e Autorização

Implementar controle de acesso com diferentes níveis:

- **Visualização**: Qualquer usuário autenticado
- **Cadastro e Edição**: Usuários com permissão de gestão de patrimônio
- **Atribuição/Devolução**: Usuários com permissão de gestão de patrimônio
- **Manutenção**: Usuários com permissão de gestão de patrimônio ou manutenção
- **Descarte/Baixa**: Apenas usuários com permissão administrativa avançada

### 5. Integrações

Integrar com outros módulos do sistema:

- **Módulo de Usuários**: Para obter informações de colaboradores nas atribuições
- **Módulo Financeiro**: Para registrar dados de depreciação e baixa contábil
- **Módulo de Notificações**: Para alertar sobre manutenções preventivas ou situações críticas

### 6. Validações

Implementar validações robustas para:

- Dados obrigatórios em todas as operações
- Formatos válidos (datas, valores monetários, etc.)
- Regras de negócio mencionadas acima
- Verificação de duplicidade de códigos de patrimônio

### 7. Tratamento de Erros

- Implementar respostas de erro padronizadas
- Registrar logs detalhados de erros
- Fornecer mensagens amigáveis para o frontend

### 8. Documentação

- Documentar todas as APIs usando Swagger/OpenAPI
- Incluir exemplos de requisição e resposta
- Documentar o modelo de dados e relacionamentos

## Detalhes Técnicos

### Banco de Dados

Precisamos criar as seguintes tabelas:

```sql
CREATE TABLE pat_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255) NOT NULL,
    category_id INT,
    acquisition_date DATE,
    acquisition_value DECIMAL(15,2),
    current_status ENUM('available', 'in_use', 'maintenance', 'damaged', 'discarded') DEFAULT 'available',
    location_id INT,
    notes TEXT,
    technical_info JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (category_id) REFERENCES pat_categories(id),
    FOREIGN KEY (location_id) REFERENCES pat_locations(id)
);

CREATE TABLE pat_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE pat_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES pat_locations(id)
);

CREATE TABLE pat_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    user_id INT NOT NULL,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NULL,
    status ENUM('active', 'returned', 'expired') DEFAULT 'active',
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES pat_items(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE pat_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    event_type ENUM('created', 'updated', 'assigned', 'returned', 'maintenance_start', 'maintenance_end', 'damaged', 'discarded') NOT NULL,
    event_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT NOT NULL,
    description TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES pat_items(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE pat_maintenance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NULL,
    description TEXT NOT NULL,
    cost DECIMAL(15,2),
    provider VARCHAR(255),
    status ENUM('ongoing', 'completed', 'cancelled') DEFAULT 'ongoing',
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES pat_items(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### Estrutura de Arquivos Backend Sugerida

```
server/
├── controllers/
│   ├── patrimonyItemController.js
│   ├── patrimonyAssignmentController.js
│   ├── patrimonyEventController.js
│   ├── patrimonyMaintenanceController.js
│   └── patrimonyReportController.js
├── models/
│   ├── patrimonyItem.js
│   ├── patrimonyCategory.js
│   ├── patrimonyLocation.js
│   ├── patrimonyAssignment.js
│   ├── patrimonyEvent.js
│   └── patrimonyMaintenance.js
├── routes/
│   └── patrimonyRoutes.js
├── services/
│   ├── patrimonyItemService.js
│   ├── patrimonyAssignmentService.js
│   ├── patrimonyEventService.js
│   └── patrimonyReportService.js
├── middleware/
│   └── patrimonyPermissions.js
├── validators/
│   └── patrimonyValidators.js
└── utils/
    └── patrimonyHelpers.js
```

## Frontend Já Implementado

O frontend já possui as seguintes páginas:

1. **index.html**: Listagem principal com visualizações em tabela, cards e agrupada
2. **view.html**: Visualização detalhada de um item com todas as informações e histórico
3. **edit.html**: Formulário para edição de um item existente
4. **create.html**: Formulário para cadastro de novo item

Cada página tem seu próprio arquivo CSS e JavaScript correspondente.

## Requisitos de Desempenho

- API deve responder em menos de 500ms para operações comuns
- Suporte para pelo menos 1000 itens sem degradação de desempenho
- Capacidade de lidar com pelo menos 50 requisições simultâneas

## Próximos Passos

1. Iniciar com a definição do esquema do banco de dados
2. Implementar os modelos e controllers básicos
3. Desenvolver as APIs principais para CRUD de itens
4. Implementar as regras de negócio para transições de estado
5. Adicionar sistema de eventos para registro de histórico
6. Desenvolver relatórios e análises
7. Integrar com o frontend existente
8. Realizar testes de integração e carga

## Observações Finais

O backend deve seguir as melhores práticas de desenvolvimento:
- Código limpo e bem documentado
- Validações completas de input
- Tratamento adequado de erros
- Logs detalhados
- Segurança (prevenção de SQL injection, XSS, etc.)
- Testes unitários e de integração 