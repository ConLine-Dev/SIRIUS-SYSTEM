# Módulo de Gestão de Materiais de TI

## 📋 Visão Geral

Este módulo permite o gerenciamento completo de materiais de TI, oferecendo controle de estoque, movimentações e alocação de recursos.

## ✨ Funcionalidades Principais

- Cadastro de Materiais
- Controle de Estoque
- Movimentação de Materiais
- Alocação por Colaborador
- Geração de Relatórios

## 🛠 Tecnologias Utilizadas

- Frontend: HTML5, CSS3, JavaScript
- Bibliotecas:
  - jQuery
  - Bootstrap
  - DataTables
  - SweetAlert2

## 📦 Estrutura do Módulo

```
ti-materials-management/
├── assets/
│   ├── css/
│   │   └── index.css
│   └── js/
│       ├── materials.js
│       ├── stock-control.js
│       └── collaborators.js
├── pages/
│   ├── materials-registration.html
│   ├── stock-management.html
│   ├── material-movement.html
│   └── reports.html
├── index.html
└── schema.sql
```

## 🚀 Configuração

1. Certifique-se de ter todas as dependências globais instaladas
2. Configure as variáveis de ambiente
3. Importe o `schema.sql` para preparar o banco de dados

## 📊 Endpoints Principais

- `/api/ti/ti-materials`: Gerenciamento de materiais
- `/api/ti/ti-material-movements`: Controle de movimentações
- `/api/ti/ti-collaborators`: Gestão de colaboradores

## 🔒 Permissões

- Administradores: Acesso completo
- Usuários de TI: Acesso limitado

## 🛡️ Segurança

- Autenticação obrigatória
- Registro de logs de movimentações
- Validações de estoque e permissões

## 🔜 Próximos Passos

- [ ] Implementar testes unitários
- [ ] Adicionar mais filtros de relatórios
- [ ] Integração com sistema de notificações

## 🤝 Contribuição

Por favor, leia as diretrizes de contribuição antes de propor alterações.

---

**Manual de Uso do Módulo de Gestão de Materiais de TI**

# 📦 Módulo de Gestão de Materiais de TI - Manual do Usuário

## 🎯 Objetivo do Módulo

O Módulo de Gestão de Materiais de TI foi desenvolvido para fornecer um controle eficiente e transparente do estoque de materiais de tecnologia da informação, permitindo o acompanhamento detalhado de alocações, entradas e saídas.

## 🗂️ Funcionalidades Principais

### 1. Página Inicial (index.html)

#### 1.1 Alocação de Material
- **Função**: Distribuir materiais para colaboradores
- **Como Usar**:
  1. Clique no botão "Alocar Material"
  2. Selecione o material desejado
  3. Escolha o colaborador que receberá o material
  4. Informe a quantidade
  5. Confirme a alocação

#### 1.2 Devolução de Material
- **Função**: Registrar o retorno de materiais
- **Como Usar**:
  1. Clique no botão "Devolver Material"
  2. Selecione o material a ser devolvido
  3. Confirme a quantidade devolvida
  4. O sistema atualizará o estoque automaticamente

#### 1.3 Gerenciamento de Estoque
- **Função**: Abrir página de gerenciamento detalhado
- **Como Usar**:
  1. Clique no botão "Gerenciar Estoque"
  2. Uma nova janela será aberta com funcionalidades avançadas

### 2. Página de Gerenciamento de Estoque (stock-management.html)

#### 2.1 Lista de Materiais
- **Informações Exibidas**:
  - SKU (Código de Identificação)
  - Nome do Material
  - Categoria
  - Estoque Atual
  - Estoque Mínimo
  - Status (Ativo/Inativo)

#### 2.2 Cadastro de Novo Material
- **Função**: Adicionar novos itens ao inventário
- **Campos**:
  1. Nome do Material
  2. SKU
  3. Categoria (Hardware, Software, Acessório, Consumível)
  4. Unidade de Medida
  5. Estoque Mínimo
  6. Status
  7. Descrição (Opcional)

#### 2.3 Entrada de Estoque
- **Função**: Registrar novos materiais ou incrementar estoque
- **Como Usar**:
  1. Clique em "Entrada de Estoque"
  2. Selecione o material
  3. Informe a quantidade
  4. Escolha a origem (Compra, Doação, Transferência)
  5. Opcional: Adicione número da nota fiscal
  6. Opcional: Adicione observações

#### 2.4 Saída de Estoque
- **Função**: Registrar baixa ou movimentação de materiais
- **Como Usar**:
  1. Clique em "Saída de Estoque"
  2. Selecione o material
  3. Informe a quantidade
  4. Escolha o motivo (Descarte, Doação, Transferência, Manutenção)
  5. Opcional: Informe o destino
  6. Opcional: Adicione observações

## 🚨 Alertas e Indicadores

### Estoque
- **Vermelho**: Estoque abaixo do mínimo
- **Verde**: Estoque adequado

### Status do Material
- **Verde**: Material Ativo
- **Vermelho**: Material Inativo

## 💡 Boas Práticas

1. Mantenha o cadastro de materiais sempre atualizado
2. Registre todas as movimentações com precisão
3. Fique atento aos materiais com estoque baixo
4. Use a descrição para adicionar informações relevantes

## 🔒 Segurança e Permissões

- Apenas usuários autorizados podem realizar movimentações
- Todas as ações são registradas para auditoria

## 🛠️ Solução de Problemas

### Problemas Comuns
- **Material não aparece na lista**: Verifique se foi cadastrado corretamente
- **Não consigo alocar/devolver**: Confirme se há estoque disponível
- **Erro ao salvar**: Verifique se todos os campos obrigatórios foram preenchidos

### Suporte
Em caso de dúvidas ou problemas, entre em contato com a equipe de TI.

## 📊 Relatórios

Futuramente, serão implementados relatórios detalhados de:
- Consumo de materiais
- Histórico de movimentações
- Previsão de reposição de estoque

## 🔄 Atualizações Futuras

- Integração com sistema de compras
- Notificações automáticas de estoque baixo
- Geração de relatórios em PDF

---

**Última Atualização**: 05 de fevereiro de 2025
**Versão do Módulo**: 1.0.0

---

**SIRIUS SYSTEM** - Gestão Inteligente de Recursos
