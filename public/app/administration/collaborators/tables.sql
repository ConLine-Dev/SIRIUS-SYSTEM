CREATE TABLE collaborators (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL, -- Nome completo do colaborador
    birth_date DATE, -- Data de nascimento
    gender VARCHAR(20), -- Gênero (ex.: Masculino, Feminino, etc.)
    marital_status VARCHAR(50), -- Estado civil (ex.: Solteiro, Casado, etc.)
    nationality VARCHAR(100), -- Nacionalidade
    cpf VARCHAR(14) UNIQUE, -- CPF, campo único
    rg VARCHAR(20) UNIQUE, -- RG, campo único
    rg_issuer VARCHAR(50), -- Órgão expedidor do RG
    rg_issue_date DATE, -- Data de expedição do RG
    voter_title VARCHAR(20), -- Título de eleitor
    passport_number VARCHAR(20), -- Número do passaporte
    birth_city VARCHAR(100), -- Cidade de nascimento
    birth_state VARCHAR(100), -- Estado de nascimento
    mother_name VARCHAR(255), -- Nome da mãe
    father_name VARCHAR(255), -- Nome do pai
    job_position VARCHAR(100), -- Cargo do colaborador
    department VARCHAR(100), -- Departamento do colaborador
    admission_date DATE, -- Data de admissão
    resignation_date DATE, -- Data de demissão (se aplicável)
    employee_id VARCHAR(50) UNIQUE, -- Matrícula do colaborador, campo único
    salary DECIMAL(10, 2), -- Salário
    contract_type VARCHAR(50), -- Tipo de contrato (ex.: CLT, PJ, Estágio, Temporário)
    weekly_hours INT, -- Carga horária semanal
    immediate_supervisor VARCHAR(100), -- Supervisor imediato
    pis_pasep_number VARCHAR(20), -- Número do PIS/PASEP
    work_card_number VARCHAR(20), -- Número da carteira de trabalho
    work_card_series VARCHAR(20), -- Série da carteira de trabalho
    education VARCHAR(100), -- Escolaridade
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Data de criação do registro
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP -- Data de atualização do registro
);

CREATE TABLE collaborators_addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collaborator_id INT, -- Referência ao ID do colaborador na tabela principal
    street VARCHAR(255), -- Rua
    number VARCHAR(10), -- Número
    complement VARCHAR(255), -- Complemento
    neighborhood VARCHAR(100), -- Bairro
    city VARCHAR(100), -- Cidade
    state VARCHAR(100), -- Estado
    zip_code VARCHAR(10), -- CEP
    FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) -- Chave estrangeira para a tabela de colaboradores
);

CREATE TABLE collaborators_contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collaborator_id INT, -- Referência ao ID do colaborador na tabela principal
    home_phone VARCHAR(20), -- Telefone residencial
    mobile_phone VARCHAR(20), -- Telefone celular
    personal_email VARCHAR(100), -- Email pessoal
    corporate_email VARCHAR(100), -- Email corporativo
    emergency_contact_name VARCHAR(255), -- Nome do contato de emergência
    emergency_contact_phone VARCHAR(20), -- Telefone do contato de emergência
    emergency_contact_relationship VARCHAR(100), -- Parentesco do contato de emergência
    FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) -- Chave estrangeira para a tabela de colaboradores
);

CREATE TABLE collaborators_qualifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collaborator_id INT, -- Referência ao ID do colaborador na tabela principal
    education_level VARCHAR(100), -- Nível de escolaridade
    courses TEXT, -- Cursos realizados
    certifications TEXT, -- Certificações
    languages TEXT, -- Idiomas falados
    previous_experience TEXT, -- Experiência profissional anterior
    FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) -- Chave estrangeira para a tabela de colaboradores
);

CREATE TABLE collaborators_bank_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collaborator_id INT, -- Referência ao ID do colaborador na tabela principal
    bank_name VARCHAR(100), -- Nome do banco
    agency VARCHAR(20), -- Agência bancária
    account_number VARCHAR(20), -- Número da conta
    account_type VARCHAR(50), -- Tipo de conta (Corrente, Poupança)
    FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) -- Chave estrangeira para a tabela de colaboradores
);

CREATE TABLE collaborators_benefits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collaborator_id INT, -- Referência ao ID do colaborador na tabela principal
    transport_allowance BOOLEAN, -- Vale transporte (Sim/Não)
    meal_allowance BOOLEAN, -- Vale refeição/alimentação (Sim/Não)
    health_plan BOOLEAN, -- Plano de saúde (Sim/Não)
    dental_plan BOOLEAN, -- Plano odontológico (Sim/Não)
    life_insurance BOOLEAN, -- Seguro de vida (Sim/Não)
    FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) -- Chave estrangeira para a tabela de colaboradores
);

CREATE TABLE collaborators_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collaborator_id INT, -- Referência ao ID do colaborador na tabela principal
    photo BLOB, -- Foto do colaborador
    rg_copy BLOB, -- Cópia do RG
    cpf_copy BLOB, -- Cópia do CPF
    birth_marriage_certificate_copy BLOB, -- Cópia da certidão de nascimento/casamento
    proof_of_residence_copy BLOB, -- Cópia do comprovante de residência
    work_card_copy BLOB, -- Cópia da carteira de trabalho
    voter_title_copy BLOB, -- Cópia do título de eleitor
    passport_copy BLOB, -- Cópia do passaporte (se aplicável)
    FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) -- Chave estrangeira para a tabela de colaboradores
);

CREATE TABLE collaborators_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collaborator_id INT, -- Referência ao ID do colaborador na tabela principal
    general_notes TEXT, -- Observações gerais
    internal_notes TEXT, -- Anotações internas
    FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) -- Chave estrangeira para a tabela de colaboradores
);

CREATE TABLE collaborators_other_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    collaborator_id INT, -- Referência ao ID do colaborador na tabela principal
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, -- Data da última atualização
    status VARCHAR(50), -- Status do colaborador (Ativo, Inativo, Afastado, etc.)
    FOREIGN KEY (collaborator_id) REFERENCES collaborators(id) -- Chave estrangeira para a tabela de colaboradores
);
