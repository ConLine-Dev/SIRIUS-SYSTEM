# Módulo de Gestão de Procedimentos

## 1. Visão Geral

O Módulo de Gestão de Procedimentos é uma ferramenta robusta e moderna projetada para criar, gerenciar, versionar e consultar todos os procedimentos operacionais padrão (POPs) de uma organização. Ele foi construído com foco em uma experiência de usuário clara, consistente e segura.

O sistema utiliza uma interface de cards para visualização rápida, filtros dinâmicos e janelas de popup para as ações de CRUD (Criar, Ler, Atualizar, Deletar), garantindo que o usuário nunca perca o contexto da tela principal.

---

## 2. Funcionalidades Principais

| Funcionalidade | Descrição |
| :--- | :--- |
| **Listagem e Filtragem** | A tela principal exibe todos os procedimentos em formato de cards. É possível filtrar a lista por **palavra-chave** (no título ou tags), **departamento** e **cargo**. |
| **Editor de Conteúdo Rico** | Para a criação e edição dos procedimentos, o módulo utiliza o editor **Quill.js**, que permite formatação de texto, listas, links, imagens e vídeos diretamente no corpo do procedimento. |
| **Sistema de Anexos** | É possível adicionar múltiplos anexos a um procedimento, que podem ser de três tipos: **Link** (para documentos externos, PDFs, etc.), **Vídeo** (incorpora players do YouTube/Vimeo) ou **Imagem** (exibida em um modal). |
| **Histórico de Versões** | Cada alteração salva em um procedimento cria uma nova versão, preservando o histórico completo. É possível visualizar o conteúdo de versões antigas e reverter para elas. |
| **Design Consistente** | Todas as telas (Listagem, Criação, Edição e Visualização) seguem um padrão de layout unificado, com um card principal que ocupa 100% da tela, proporcionando uma experiência de usuário coesa. |
| **Feedback Visual** | O sistema fornece feedback claro ao usuário, como spinners de carregamento em botões durante operações e notificações de sucesso ou erro. |

---

## 3. Guia do Usuário (Manual de Operação)

### 3.1. Tela Principal

- **Filtros:** Use os campos na parte superior para refinar a busca. Clique em "Limpar" para remover todos os filtros.
- **Ações do Card:** Cada procedimento possui três botões de ação rápida:
    - **Ver (Ícone de olho):** Abre a tela de visualização do procedimento.
    - **Editar (Ícone de lápis):** Abre a tela de edição.
    - **Excluir (Ícone de lixeira):** Remove o procedimento (pede confirmação).
- **Novo Procedimento:** Clique no botão "Novo Procedimento" no canto superior direito para abrir a tela de criação.

### 3.2. Criando e Editando um Procedimento

As telas de criação e edição são divididas em duas colunas:
- **À Esquerda (Conteúdo Principal):**
    - **Título:** O nome do procedimento.
    - **Conteúdo do Procedimento:** O corpo do texto, editável com a barra de ferramentas do editor.
- **À Direita (Barra Lateral):**
    - **Detalhes:** Campos como departamento, cargo, tipo, responsável e tags.
    - **Anexos:** Adicione ou remova links, vídeos e imagens.
    - **Histórico de Versões (apenas na edição):** Lista de todas as versões salvas.

### 3.3. Entendendo o Histórico de Versões

Esta é a funcionalidade mais poderosa do módulo e possui um fluxo de trabalho seguro:

1.  **Modo de Edição (Padrão):** Ao abrir a tela, você está no modo de edição. O editor está liberado.
2.  **Entrando no Modo de Preview:**
    - Clique em uma versão na lista de histórico.
    - O editor será **bloqueado** e um aviso **"MODO DE VISUALIZAÇÃO"** aparecerá.
    - Você agora está vendo o conteúdo daquela versão antiga, sem risco de editá-lo acidentalmente.
3.  **Ações no Modo de Preview:**
    - **Voltar à Versão Atual:** Clique neste botão para sair do modo de preview, restaurar o conteúdo mais recente e liberar o editor.
    - **Reverter:** Se você deseja usar o conteúdo da versão antiga que está visualizando, clique neste botão (após confirmar a ação). O sistema fará o seguinte:
        - Carregará o conteúdo antigo no editor.
        - Liberará o editor para que você possa fazer ajustes finos.
        - Exibirá um alerta instruindo a **salvar o procedimento** para que essa reversão seja registrada como uma **nova versão**, mantendo a integridade do histórico.

---

## 4. Estrutura Técnica (Para Desenvolvedores)

- **Frontend:**
    - Local: `public/app/administration/procedures-management/`
    - Arquivos principais: `index.html`, `create.html`, `edit.html`, `view.html`.
    - Lógica: `assets/js/` para cada página correspondente.
    - Bibliotecas: jQuery, Bootstrap, Quill.js.
- **Backend (API Mockada):**
    - Roteador: `server/routes/procedures-management.js`
    - Controller: `server/controllers/api-procedures-management.js`. É neste arquivo que os dados mockados (o "banco de dados" de exemplo) estão definidos. Todas as requisições do frontend são tratadas aqui. 