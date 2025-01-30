# SIRIUS SYSTEM - Project Context and Structure

## 🏗 Project Overview

### Estrutura Geral do Projeto
- **Linguagem Principal**: JavaScript/Node.js
- **Estrutura de Diretórios Principais**:
  - `public/`: Conteúdo público da aplicação
  - `server/`: Lógica de servidor e backend
  - `node_modules/`: Dependências do projeto
  - `scripts/`: Scripts auxiliares
  - `uploads/`: Armazenamento de uploads
  - `storageService/`: Serviços de armazenamento

### 📂 Estrutura de Diretórios Detalhada

#### Public
- Localização: `public/`
- Conteúdo: Aplicações front-end, interfaces de usuário
- Subdiretório principal: `public/app/`
- Organização: Provavelmente organizado por módulos ou funcionalidades (ex: RH, Administração)

#### Server
- Localização: `server/`
- Estrutura:
  - `controllers/`: Lógica de negócio e processamento (42 controladores)
  - `routes/`: Definição de rotas da aplicação (44 rotas)
  - `connect/`: Configurações de conexão
  - `support/`: Funções de suporte

### 🔧 Tecnologias e Ferramentas

#### Backend
- **Tecnologias**:
  - Node.js
  - Express.js (presumido pela estrutura de rotas)
  - banco de dados MYSQL

#### Gerenciamento de Dependências
- **Gerenciador de Pacotes**: npm
- Arquivos de configuração:
  - `package.json`: Definição de dependências
  - `package-lock.json`: Lock de versões

#### Configurações Adicionais
- `.env`: Configurações de ambiente
- `.gitignore`: Configurações de versionamento
- `vercel.json`: Configurações de deploy

### 📝 Padrões de Desenvolvimento

#### Convenções de Código
- Estrutura modular
- Separação clara entre frontend (`public/`) e backend (`server/`)
- Organização por responsabilidade (controllers, routes)

#### Padrão Arquitetural
- Próximo ao padrão MVC (Model-View-Controller)
- Modularização por funcionalidade

### 🚀 Processo de Expansão do Projeto

#### Adicionando Novas Funcionalidades
1. **Backend**:
   - Criar controlador em `server/controllers/`
   - Definir rotas em `server/routes/`
   - Implementar lógica de negócio no controlador

2. **Frontend**:
   - Adicionar nova página/componente em `public/app/`
   - Seguir estrutura de diretórios existente
   - Manter consistência de nomenclatura

#### Padrão de Criação de Novos Módulos (Exemplo: RH Payroll)

Ao criar um novo módulo no diretório `public/app/administration/`, siga este padrão:

1. **Estrutura de Diretórios**
   ```
   rh-payroll-v2/
   ├── assets/
   │   ├── css/
   │   │   └── index.css (Estilos específicos do módulo)
   │   ├── js/
   │   │   └── custom.js (Scripts personalizados)
   │   └── images/ (Imagens específicas do módulo)
   ├── pages/ (Páginas específicas do módulo)
   ├── index.html (Página principal)
   └── schema.sql (Esquema de banco de dados, se aplicável)
   ```

2. **Importações de Tema e Layout**
   - Usar imports relativos de temas globais:
     ```html
     <!-- Tema Bootstrap -->
     <link href="../../assets/libs/bootstrap/css/bootstrap.min.css" rel="stylesheet">
     
     <!-- Estilos principais -->
     <link href="../../assets/css/styles.min.css" rel="stylesheet">
     <link href="../../assets/css/icons.css" rel="stylesheet">
     
     <!-- Estilos específicos do módulo -->
     <link href="./assets/css/index.css" rel="stylesheet">
     ```

3. **Configurações Padrão**
   - Manter configurações consistentes no `<html>`:
     ```html
     <html lang="en" dir="ltr" 
         data-nav-layout="vertical" 
         data-theme-mode="light" 
         data-header-styles="light"
         data-menu-styles="dark" 
         loader="true" 
         data-vertical-style="overlay">
     ```

4. **Componentes Comuns**
   - Incluir componentes padrão:
     - Loader
     - Header
     - Sidebar de filtros
     - Área de conteúdo principal
     - Toast container

5. **Bibliotecas e Dependências**
   - Usar CDNs para bibliotecas comuns
   - Importar bibliotecas globais:
     - Bootstrap
     - DataTables
     - Font Awesome
     - Choices.js

### 🔍 Diretrizes para Novos Módulos

1. **Consistência Visual**
   - Seguir o design system existente
   - Usar cores e estilos definidos globalmente

2. **Performance**
   - Minimizar dependências
   - Usar imports relativos
   - Otimizar carregamento de assets

3. **Modularidade**
   - Separar CSS, JS e HTML
   - Criar componentes reutilizáveis
   - Manter código limpo e organizado

### 🔍 Recomendações para Desenvolvimento

1. **Modularização**
   - Manter cada módulo focado em uma responsabilidade
   - Evitar acoplamento entre módulos

2. **Consistência**
   - Seguir padrões de nomenclatura existentes
   - Manter estrutura de diretórios organizada

3. **Documentação**
   - Comentar código complexo
   - Manter este documento `CONTEXT_STRUCTURE.md` atualizado

### 🛠 Próximos Passos
- Implementar testes unitários
- Configurar lint e formatadores de código
- Revisar e documentar APIs

---

**NOTA**: Este documento é um guia vivo. Atualize-o conforme o projeto evolui.


