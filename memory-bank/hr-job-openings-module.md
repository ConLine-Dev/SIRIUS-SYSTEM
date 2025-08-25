# Módulo: RH - Vagas

## Propósito
Gerenciar vagas disponíveis para contratação, permitindo publicação interna e futura exposição via API pública para o site da empresa.

## Entidades e Relacionamentos
- Departamento (`hr_departments`)
- Localização (`hr_locations`)
- Modalidade (`hr_modalities`)
- Nível (`hr_levels`)
- Tipo de Contrato (`hr_contract_types`)
- Vaga (`hr_job_postings`) — relaciona com todas as entidades acima
  - Responsabilidades (`hr_job_responsibilities`)
  - Requisitos (`hr_job_requirements`)
  - Diferenciais (`hr_job_nice_to_have`)
  - Benefícios (`hr_job_benefits`)

## Tabelas (arquivo SQL)
- Arquivo: `server/sql/schema_hr_job_openings.sql`
- Inclui criação de tabelas, índices, FKs e seeds com base em exemplos reais fornecidos

## Considerações de API (próximas fases)
- Endpoints (internos/admin): CRUD de vagas e itens
- Endpoints (públicos): listagem de vagas publicadas e detalhe por `public_id`
- Filtros: departamento, localização, modalidade, nível, tipo de contrato, status
- Segurança: separar rotas públicas e administrativas, validação de payload

## UI/Frontend (próximas fases)
- Página Admin RH: tabela de vagas, filtros, criação/edição, status (Published/Closed)
- Formulário com campos normalizados e listas (responsabilidades, requisitos, etc.)
- Padrão visual seguindo tema atual (Bootstrap 5, estilos do projeto)

## Próximos Passos Técnicos
1. Criar controller e rotas backend (`server/controllers/hr-job-openings.js`, `server/routes/api-hr-job-openings.js`)
2. Criar páginas HTML/JS em `public/app/administration/rh-job-openings/`
3. Adicionar migrations automatizadas ao pipeline (opcional) ou executar o SQL manualmente
4. Planejar webhooks/integrações (opcional) para publicação externa 