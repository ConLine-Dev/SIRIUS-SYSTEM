# API Pública - Vagas de Emprego

Esta API permite que o site da empresa consuma vagas de emprego e receba candidaturas de forma pública.

## Base URL
```
http://localhost:5000/api/public/hr-job-openings
```

## Tratamento de Erros

Todos os endpoints retornam respostas padronizadas:

### Resposta de Sucesso
```json
{
  "success": true,
  "data": {...},
  "message": "Operação realizada com sucesso"
}
```

### Resposta de Erro
```json
{
  "success": false,
  "message": "Descrição detalhada do erro"
}
```

### Códigos de Status HTTP
- `200` - Operação bem-sucedida
- `201` - Recurso criado com sucesso
- `400` - Erro de validação ou dados inválidos
- `404` - Recurso não encontrado
- `500` - Erro interno do servidor

### Exemplos de Erros Comuns

#### Vaga não encontrada
```json
{
  "success": false,
  "message": "Vaga não encontrada ou não está disponível para candidatura"
}
```

#### Candidatura duplicada
```json
{
  "success": false,
  "message": "Você já se candidatou para esta vaga"
}
```

#### Dados inválidos
```json
{
  "success": false,
  "message": "ID da vaga, nome e email são obrigatórios"
}
```

## Endpoints

### 1. Listar Vagas Publicadas

**GET** `/jobs`

Lista todas as vagas que estão publicadas e disponíveis para candidatura.

#### Parâmetros de Query
- `status` (opcional): 
  - `published` (padrão): Apenas vagas com status "Published"
  - `all`: Vagas com status "Published" e "Draft"

#### Exemplo de Requisição
```bash
curl -X GET "http://localhost:5000/api/public/hr-job-openings/jobs?status=published"
```

#### Exemplo de Resposta
```json
{
  "success": true,
  "data": [
    {
      "public_id": "desenvolvedor-fullstack-2024",
      "title": "Desenvolvedor Full Stack",
      "description": "Estamos procurando um desenvolvedor...",
      "posted_at": "2024-01-15",
      "openings": 1,
      "department_name": "Tecnologia",
      "location_name": "Itajaí - SC",
      "modality_name": "Híbrido",
      "level_name": "Pleno",
      "contract_type_name": "CLT",
      "status_name": "Published",
      "responsibilities": [
        "Desenvolver aplicações web",
        "Manter código existente",
        "Participar de code reviews"
      ],
      "requirements": [
        "Conhecimentos em JavaScript",
        "Experiência com React",
        "Conhecimentos em Node.js"
      ],
      "benefits": [
        "Plano de saúde",
        "Vale refeição",
        "Home office"
      ],
      "nice_to_have": [
        "Conhecimentos em TypeScript",
        "Experiência com Docker"
      ]
    }
  ],
  "total": 1
}
```

### 2. Detalhes de uma Vaga Específica

**GET** `/jobs/{public_id}`

Obtém os detalhes completos de uma vaga específica.

#### Parâmetros de Path
- `public_id`: ID público da vaga (slug)

#### Exemplo de Requisição
```bash
curl -X GET "http://localhost:5000/api/public/hr-job-openings/jobs/desenvolvedor-fullstack-2024"
```

#### Exemplo de Resposta
```json
{
  "success": true,
  "data": {
    "public_id": "desenvolvedor-fullstack-2024",
    "title": "Desenvolvedor Full Stack",
    "description": "Estamos procurando um desenvolvedor...",
    "posted_at": "2024-01-15",
    "openings": 1,
    "department_name": "Tecnologia",
    "location_name": "Itajaí - SC",
    "modality_name": "Híbrido",
    "level_name": "Pleno",
    "contract_type_name": "CLT",
    "status_name": "Published",
    "responsibilities": [
      "Desenvolver aplicações web",
      "Manter código existente",
      "Participar de code reviews"
    ],
    "requirements": [
      "Conhecimentos em JavaScript",
      "Experiência com React",
      "Conhecimentos em Node.js"
    ],
    "benefits": [
      "Plano de saúde",
      "Vale refeição",
      "Home office"
    ],
    "nice_to_have": [
      "Conhecimentos em TypeScript",
      "Experiência com Docker"
    ]
  }
}
```

### 3. Candidatura Pública

**POST** `/apply`

Permite que candidatos se inscrevam para uma vaga, incluindo upload de currículo.

#### Parâmetros do Body (multipart/form-data)
- `job_public_id` (obrigatório): ID público da vaga
- `name` (obrigatório): Nome completo do candidato
- `email` (obrigatório): Email do candidato
- `phone` (opcional): Telefone do candidato
- `linkedin_url` (opcional): URL do LinkedIn
- `cover_letter` (opcional): Carta de apresentação
- `resume` (opcional): Arquivo do currículo (PDF, DOC, DOCX, JPG, PNG, TXT - máx 10MB)

#### Exemplo de Requisição
```bash
curl -X POST "http://localhost:5000/api/public/hr-job-openings/apply" \
  -F "job_public_id=desenvolvedor-fullstack-2024" \
  -F "name=João Silva" \
  -F "email=joao.silva@email.com" \
  -F "phone=(11) 99999-9999" \
  -F "linkedin_url=https://linkedin.com/in/joaosilva" \
  -F "cover_letter=Gostaria de me candidatar para esta vaga..." \
  -F "resume=@curriculo.pdf"
```

#### Exemplo de Resposta
```json
{
  "success": true,
  "message": "Candidatura enviada com sucesso!",
  "data": {
    "application_id": 123,
    "job_title": "Desenvolvedor Full Stack",
    "candidate_name": "João Silva",
    "candidate_email": "joao.silva@email.com"
  }
}
```

### 4. Visualizar Anexo

**GET** `/attachments/{attachment_id}`

Permite visualizar/download de anexos de candidatos (apenas para fins administrativos).

#### Parâmetros de Path
- `attachment_id`: ID do anexo

#### Exemplo de Requisição
```bash
curl -X GET "http://localhost:5000/api/public/hr-job-openings/attachments/456"
```

## Códigos de Status HTTP

- `200`: Sucesso
- `201`: Criado com sucesso
- `400`: Dados inválidos ou obrigatórios
- `404`: Recurso não encontrado
- `500`: Erro interno do servidor

## Validações

### Candidatura
- Nome, email e ID da vaga são obrigatórios
- Email deve ter formato válido
- Arquivo de currículo deve ter no máximo 10MB
- Tipos de arquivo permitidos: PDF, DOC, DOCX, JPG, PNG, TXT
- Não é possível se candidatar duas vezes para a mesma vaga
- Vaga deve estar com status "Published" ou "Draft"

### Vagas
- Apenas vagas com `public_id` são retornadas
- Vagas devem estar com status "Published" ou "Draft"
- Vagas devem estar ativas (`is_active = 1`)

## CORS

A API está configurada para aceitar requisições de qualquer origem (`*`) para facilitar o desenvolvimento.

## Exemplo de Integração no Site

```javascript
// Listar vagas
fetch('http://localhost:5000/api/public/hr-job-openings/jobs')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('Vagas:', data.data);
    }
  });

// Candidatura
const formData = new FormData();
formData.append('job_public_id', 'desenvolvedor-fullstack-2024');
formData.append('name', 'João Silva');
formData.append('email', 'joao@email.com');
formData.append('resume', fileInput.files[0]);

fetch('http://localhost:5000/api/public/hr-job-openings/apply', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  if (data.success) {
    alert('Candidatura enviada com sucesso!');
  } else {
    alert('Erro: ' + data.message);
  }
});
``` 