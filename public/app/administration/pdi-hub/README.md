# PDI Hub - Sistema de Gestão de Planos de Desenvolvimento Individual

O PDI Hub é um módulo do SIRIUS-SYSTEM desenvolvido para gerenciar Planos de Desenvolvimento Individual (PDIs) de colaboradores da organização. Este sistema permite que supervisores e coordenadores criem, monitorem e atualizem PDIs, enquanto os colaboradores podem visualizar e atualizar o status das ações atribuídas a eles.

## Funcionalidades

### Para Supervisores/Coordenadores:
- Criação de PDIs para colaboradores
- Definição de perfil (Comunicador, Executor, Planejador, Analista)
- Registro de pontos fortes e pontos de melhoria
- Definição de objetivos de desenvolvimento
- Criação de planos de ação com prazos
- Monitoramento do progresso das ações

### Para Colaboradores:
- Visualização do seu PDI
- Atualização do status das ações atribuídas
- Registro de conclusão de ações

## Estrutura do Sistema

### Frontend
- `index.html` - Interface para supervisores/coordenadores
- `collaborator.html` - Interface para colaboradores
- `assets/` - Pasta com arquivos CSS, JavaScript e imagens

### Backend
- `server/controllers/pdi-hub.js` - Lógica de negócio do PDI Hub
- `server/routes/api-pdi-hub.js` - Rotas da API para o PDI Hub
- `server/sql/pdi-hub-schema.sql` - Script SQL para criar as tabelas no banco de dados

## Configuração

Para configurar o sistema, é necessário executar o script SQL `setup.sql` no banco de dados MySQL. Este script criará as tabelas necessárias para o funcionamento do PDI Hub.

## Acesso

- Acesso para supervisores/coordenadores: `/app/administration/pdi-hub`
- Acesso para colaboradores: `/app/administration/pdi-hub/collaborator.html?id_collaborator=[ID]`

## Tipos de Perfil

O sistema trabalha com quatro tipos de perfil:

1. **COMUNICADOR** - Perfil voltado para habilidades de comunicação e relacionamento
2. **EXECUTOR** - Perfil orientado à ação e resultados
3. **PLANEJADOR** - Perfil com foco em organização e estratégia
4. **ANALISTA** - Perfil voltado para análise crítica e resolução de problemas

## Status das Ações

As ações podem ter três status:

1. **Pendente** - Ação ainda não iniciada
2. **Em Andamento** - Ação em processo de execução
3. **Concluído** - Ação finalizada

## Tecnologias Utilizadas

- Frontend: HTML, CSS, JavaScript, Bootstrap
- Backend: Node.js, Express
- Banco de Dados: MySQL 