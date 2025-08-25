# Active Context: SIRIUS-SYSTEM

## Current Work Focus

*   Modelagem e criação do módulo `RH - Vagas` (job openings), incluindo schema SQL e documentação.

## Recent Changes

*   Criação do arquivo `server/sql/schema_hr_job_openings.sql` com tabelas, FKs, índices e seeds baseados em exemplos reais.
*   Documentação inicial do módulo em `memory-bank/hr-job-openings-module.md`.

## Next Steps

*   Implementar backend: controllers e rotas para CRUD e listagem pública.
*   Implementar frontend administrativo em `public/app/administration/rh-job-openings/` seguindo o tema atual.
*   Planejar API pública para site corporativo consumir as vagas publicadas.

## Active Decisions and Considerations

*   Normalização de domínio (departamento, localização, modalidade, nível, contrato) para consistência e filtros futuros.
*   Uso de `public_id` como slug estável para consumo público via API. 