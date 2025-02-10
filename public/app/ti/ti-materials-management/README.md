# Módulo de Gerenciamento de Materiais TI

## 📋 Descrição
Sistema de gerenciamento de materiais e estoque para o departamento de TI, parte do SIRIUS SYSTEM.

## 🚀 Funcionalidades

### Gerenciamento de Materiais
- ✨ Cadastro de novos materiais com informações detalhadas
- 📝 Edição de materiais existentes
- 🔍 Visualização de todos os materiais cadastrados
- 🗑️ Exclusão de materiais (com validação de movimentações)
- 💡 Controle de status (Ativo/Inativo)

### Controle de Estoque
- ➕ Registro de entradas no estoque
- ➖ Registro de saídas do estoque
- 📊 Visualização do saldo atual
- ⚠️ Alerta de estoque mínimo
- 📈 Histórico de movimentações

### Recursos Adicionais
- 🔄 Atualização em tempo real dos dados
- 🎨 Interface intuitiva e responsiva
- 🔍 Busca e filtros avançados
- 📱 Compatível com dispositivos móveis

## 🛠️ Manual de Uso

### 1. Gerenciamento de Materiais

#### 1.1 Cadastro de Material
1. Clique no botão "Novo Material"
2. Preencha os campos obrigatórios:
   - Nome do material
   - Descrição
   - Categoria
   - SKU (código único)
   - Estoque mínimo
   - Status (Ativo/Inativo)
3. Clique em "Salvar"

#### 1.2 Edição de Material
1. Na tabela de materiais, clique no ícone de edição (✏️)
2. Atualize os campos desejados
3. O status pode ser alterado entre Ativo e Inativo
4. Clique em "Salvar"

#### 1.3 Exclusão de Material
1. Na tabela de materiais, clique no ícone de exclusão (🗑️)
2. Confirme a ação no diálogo de confirmação
3. **Importante**: 
   - Materiais com movimentações não podem ser excluídos
   - Neste caso, considere inativar o material em vez de excluí-lo

### 2. Movimentações de Estoque

#### 2.1 Entrada de Material
1. Acesse a aba "Entrada de Material"
2. Selecione o material
3. Informe a quantidade
4. Adicione observações se necessário
5. Clique em "Registrar Entrada"

#### 2.2 Saída de Material
1. Acesse a aba "Saída de Material"
2. Selecione o material
3. Informe a quantidade
4. Adicione o motivo da saída
5. Clique em "Registrar Saída"

### 3. Consultas e Relatórios

#### 3.1 Consulta de Estoque
- A tabela principal mostra todos os materiais com:
  - Quantidade atual em estoque
  - Status do material (Ativo/Inativo)
  - Indicador visual de estoque baixo

#### 3.2 Histórico de Movimentações
- Clique em "Ver Movimentações" para acessar o histórico
- Filtros disponíveis:
  - Por período
  - Por tipo de movimento
  - Por material

## 🔄 Atualizações Recentes

### Versão 2.0.1 (10/02/2025)
- ✨ Novo sistema de status de materiais (Ativo/Inativo)
- 🛡️ Validação aprimorada na exclusão de materiais
- 🎨 Melhorias visuais na exibição do status
- 🐛 Correções de bugs:
  - Tratamento correto do status na edição
  - Exibição correta do status na tabela
  - Validação de materiais com movimentações

## 📞 Suporte

Em caso de dúvidas ou problemas:
1. Consulte este manual
2. Entre em contato com o suporte técnico
3. Abra um chamado no sistema de tickets

## 🔒 Observações de Segurança

- Mantenha os registros sempre atualizados
- Verifique as informações antes de confirmar movimentações
- Em caso de erro, contate o administrador do sistema
- Não compartilhe suas credenciais de acesso
