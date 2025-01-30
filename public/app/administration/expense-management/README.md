# 💰 Módulo de Gestão de Despesas

## 🌟 Visão Geral
Módulo de gerenciamento de despesas para o sistema SIRIUS, permitindo controle e acompanhamento detalhado de gastos departamentais.

## ✨ Funcionalidades
- Cadastro de novas despesas
- Listagem e filtragem de despesas
- Atualização de despesas existentes
- Exclusão de despesas
- Geração de resumo de despesas por departamento

## 🔧 Tecnologias Utilizadas
- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js, Express.js
- Banco de Dados: MySQL
- Autenticação: JWT

## 📡 Endpoints da API

### Despesas
- `POST /expense-management/expenses`: Criar nova despesa
- `GET /expense-management/expenses`: Listar despesas
- `PUT /expense-management/expenses/:id`: Atualizar despesa
- `DELETE /expense-management/expenses/:id`: Excluir despesa
- `GET /expense-management/expenses/summary`: Resumo de despesas

## 🔒 Autenticação
Todos os endpoints requerem autenticação via token JWT.

## 📊 Campos de Despesa
- `description`: Descrição da despesa
- `amount`: Valor da despesa
- `department_id`: ID do departamento
- `payment_date`: Data de pagamento
- `status`: Status da despesa (pendente/pago)
- `frequency`: Frequência da despesa

## 🚀 Como Usar
1. Faça login no sistema
2. Navegue até o módulo de Gestão de Despesas
3. Utilize os botões para adicionar, editar ou excluir despesas

## 🛠 Próximos Passos
- Implementar filtros avançados
- Adicionar gráficos de despesas
- Melhorar relatórios

## 📝 Notas
- Sempre valide os dados de entrada
- Mantenha as informações de despesas atualizadas
- Consulte o administrador em caso de dúvidas

## 📄 Licença
[Inserir informações de licença]
