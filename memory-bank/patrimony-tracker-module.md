# Módulo Patrimony Tracker

## 1. Visão Geral

O módulo patrimony-tracker é um sistema completo para o rastreamento de ativos (patrimônios) dentro da organização. Ele permite cadastrar itens, gerenciar seus estados (disponível, em uso, em manutenção, etc.), atribuí-los a colaboradores, e visualizar um histórico completo de todas as ações e eventos relacionados a cada item.

O sistema é dividido em um backend (Node.js/Express) que gerencia a lógica de negócio e a comunicação com o banco de dados MySQL, e um frontend (HTML/CSS/jQuery) que fornece a interface do usuário.

## 2. Estrutura de Arquivos Essenciais

**Backend:**

*   `server/controllers/patrimony-tracker.js`: O cérebro do módulo. Contém toda a lógica de negócio, como buscar, criar, atualizar e atribuir itens.
*   `server/routes/api-patrimony-tracker.js`: Define as rotas da API (endpoints) que o frontend utiliza para se comunicar com o controller.
*   `sql/patrimony_schema_creation.sql`: Contém os comandos CREATE TABLE para todas as tabelas do banco de dados relacionadas a este módulo.

**Frontend:**

*   `public/app/administration/patrimony-tracker/`: Pasta raiz do frontend do módulo.
*   `index.html` / `assets/js/index.js`: Tela principal que lista todos os itens, com filtros e ações.
*   `view.html` / `assets/js/view.js`: Tela de visualização detalhada de um único item, seu estado atual, atribuição e históricos.
*   `create.html` / `assets/js/create.js`: Formulário para cadastrar um novo item.
*   `edit.html` / `assets/js/edit.js`: Formulário para editar um item existente.
*   `assets/js/fetchAPI.js`: (Compartilhado) Helper para realizar as chamadas à API.

## 3. Funcionamento do Backend

**Controller (`patrimony-tracker.js`)**

*   Utiliza a função `executeQuery` para se comunicar com o banco de dados MySQL.
*   `getItemById(req, res)`: Endpoint principal da tela de visualização. Ele busca:
    *   Os dados do item na tabela `pat_items`.
    *   O histórico completo de atribuições da tabela `pat_assignments`, fazendo JOIN com `collaborators` para obter os nomes. Os dados já são enviados ordenados pela data de atribuição mais recente (`ORDER BY a.start_date DESC`).
    *   O log completo de eventos da tabela `pat_events`.
    *   As datas de atribuição, devolução e eventos são formatadas diretamente na consulta SQL para o padrão `dd/mm/aaaa HH:mm`.
    *   Retorna um único objeto JSON contendo todas essas informações aninhadas (ex: `item.assignment_history`).

## 4. Funcionamento do Frontend

**`view.html` + `view.js` (Tela de Detalhes)**

Este é o fluxo principal para exibir os detalhes de um item:

1.  A página carrega e o `view.js` extrai o `id` do item da URL.
2.  A função `fetchItemData(id)` é chamada.
3.  Ela usa `makeRequest` para chamar a API: `GET /api/patrimony-tracker/items/:id`.
4.  Ao receber o objeto JSON do backend, ele é armazenado na variável global `currentItem`.
5.  A função `renderItemData()` é chamada e distribui os dados para outras funções de renderização.
    *   `renderItemData()`: Preenche os cards de "Informações Básicas" e "Atribuição Atual" usando os seletores de ID corretos (ex: `#current-employee-name`).
    *   `renderAssignmentHistory()`:
        *   Pega o array `currentItem.assignment_history` (que já vem ordenado do backend).
        *   **NÃO** aplica nenhuma ordenação `.sort()`.
        *   Itera sobre o array e cria as linhas (`<tr>`) da tabela de histórico.
        *   **Ajuste de Fuso Horário**: Para a data de devolução, ele a converte para um objeto `Date`, subtrai 3 horas, e a formata de volta para exibição. Isso corrige a diferença de fuso entre o servidor (UTC) e o cliente (local).
    *   `renderEventLog()`:
        *   Pega o array `currentItem.event_log`.
        *   **Ajuste de Fuso Horário**: Para a data do evento, ele aplica a mesma lógica: converte, subtrai 3 horas, e formata para exibição.

**`index.html` + `index.js` (Tela de Listagem)**

*   Carrega todos os itens via `GET /api/patrimony-tracker/items`.
*   Renderiza os itens em tabela, cards ou de forma agrupada.
*   Gerencia os modais de ações (ex: Atribuir, Devolver, etc.).
*   O modal de atribuição usa um campo `datetime-local` para permitir o registro da data e da hora. 