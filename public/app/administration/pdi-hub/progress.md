# Progresso do Projeto PDI Hub

Este arquivo acompanha o andamento das implementações, próximos passos e status de cada etapa do módulo PDI Hub.

---

## Etapas e Status

- [ ] **Reestruturação do Banco de Dados (setup.sql)**
    - [ ] Tabela de fatores/pesos dinâmicos
    - [ ] Associação de fatores a cada PDI
    - [ ] Datas de início/fim do PDI
    - [ ] Configuração dos níveis de desempenho por PDI
    - [ ] Ajuste das tabelas de avaliações mensais para registrar respostas por fator
- [ ] **Backend (pdi-hub.js e rotas)**
    - [ ] Buscar fatores/pesos do banco ao criar avaliação
    - [ ] Salvar respostas por fator
    - [ ] Calcular média ponderada para escala de avaliação
    - [ ] Permitir múltiplos PDIs por colaborador e seleção no frontend
    - [ ] Expor endpoint para buscar níveis de desempenho por PDI
- [ ] **Frontend**
    - [ ] Ajustar create-pdi.html (remover escolha de escala de avaliação)
    - [ ] Ajustar evaluation.html (buscar fatores/pesos do backend e montar avaliação dinâmica)
    - [ ] Ajustar collaborator.html (seleção de PDI vigente/histórico, barra de progresso e ícones)

---

## Próximo Passo

- Iniciar pela reestruturação do banco de dados (`setup.sql`) para suportar todos os requisitos novos.

---

## Observações
- Cada PDI pode ter sua própria configuração de percentuais de desempenho.
- Cadastro/edição de fatores e pesos será feito via SQL diretamente no banco.
- O progresso será atualizado a cada etapa concluída. 