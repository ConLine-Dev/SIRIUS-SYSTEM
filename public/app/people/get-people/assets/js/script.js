// Função para formatar o CNPJ e CPF do input
function formatCnpjCpfInput(value) {
   // Remove todos os caracteres não numéricos
   value = value.replace(/\D/g, '');

   // Limita o comprimento a 14 dígitos
   if (value.length > 14) {
       value = value.substring(0, 14);
   }

   // Verifica o comprimento do valor para determinar se é um CNPJ ou CPF
   if (value.length === 14) {
       // Formata como CNPJ: 00.000.000/0000-00
       return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
   } else if (value.length === 11) {
       // Formata como CPF: 000.000.000-00
       return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
   } else {
       // Retorna o valor original se não tiver o comprimento esperado
       return value;
   }
};

// Função que cria o select para selecionar se a pessoa é PJ ou PF
let selectPeopleType;
async function createSelectPeopleType() {
   const inputCnpjCpf = document.getElementById('input-cnpj-cpf');

   // Permite que seja digitado somente numero
   inputCnpjCpf.addEventListener('input', (event) => {
      let value = event.target.value.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
      event.target.value = formatCnpjCpfInput(value);
   });

   inputCnpjCpf.addEventListener('keypress', (event) => {
      // Permite apenas a entrada de números
      const charCode = event.charCode || event.keyCode || event.which;
      if (charCode < 48 || charCode > 57) {
         event.preventDefault();
      }
   });

   // Dados do select
   const data = [
      { value: 0, label: 'Pessoa Jurídica' },
      { value: 1, label: 'Pessoa Física' }
   ];

   // Verifica se o select já existe, caso exista, destroi
   if (selectPeopleType) {
      selectPeopleType.destroy();
   };

   // Renderiza o select com as opções formatadas
   selectPeopleType = new Choices('#typePeople', {
      choices: data,
      allowSearch: true,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });

   // Adiciona um evento para monitorar mudanças no seletor
   document.querySelector('#typePeople').addEventListener('change', (event) => {
      const selectedValue = event.detail.value;
      if (selectedValue === 0) {
         // Pessoa Jurídica
         inputCnpjCpf.maxLength = 18;
         inputCnpjCpf.placeholder = '00.000.000/0000-00';
      } else if (selectedValue === 1) {
         // Pessoa Física
         inputCnpjCpf.maxLength = 11;
         inputCnpjCpf.placeholder = '000.000.000-00';
      } else if (selectedValue === '') {
         inputCnpjCpf.value = '';
         inputCnpjCpf.placeholder = 'CPF/CNPJ';
      };
   });
};

// Função para selecionar o tipo de pessoa com o que vem do banco de dados
async function setSelectPeopleTypeFromDB(value) {
   selectPeopleType.setChoiceByValue(value);
};

// Função para pegar a opção selecionada do Select Tipo de Pessoa
async function getSelectPeopleType() {
   if (selectPeopleType && selectPeopleType.getValue(true).length === 0) {
      return undefined;
   } else {
       // Usar o método getValue() para pegar os valores selecionados
       const selectedValues = selectPeopleType.getValue(true);
       // Transformar o array em uma string com os valores entre parênteses e separados por virgula
       return selectedValues;
   }
};

// Função que cria o select para selecionar as categorias de pessoas
let selectPeopleCategory;
async function createSelectPeopleCategory(data) {
   // Formate o array para ser usado com o Choices.js
   const options = data.map(function(element) {
      return {
         value: element.id,
         label: element.name,
      };
   });

   // verifica se o select ja existe, caso exista destroi
   if (selectPeopleCategory) {
      selectPeopleCategory.destroy();
   }

   // renderiza o select com as opções formatadas
   selectPeopleCategory = new Choices('#selectPeopleCategory', {
      choices: options,
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });
};

// Função para selecionar as categorias da pessoa
async function setSelectPeopleCategoryFromDB(values) {
   values.forEach(value => {
      selectPeopleCategory.setChoiceByValue([value.category_id]);
   });
};

// Função para pegar as opções selecionadas do select Categoria Pessoa
async function getselectPeopleCategory() {
   if (selectPeopleCategory && selectPeopleCategory.getValue(true).length === 0) {
      return undefined;
   } else {
       // Usar o método getValue() para pegar os valores selecionados
       const selectedValues = selectPeopleCategory.getValue(true);
       // Transformar o array em uma string com os valores entre parênteses e separados por virgula
       const formattedValues = `(${selectedValues.map(value => `${value}`).join(', ')})`
       return formattedValues;
   }
};

// Função que cria o select para selecionar as categorias de pessoas
let selectPeopleStatus;
async function createSelectPeopleStatus(data) {
   // Formate o array para ser usado com o Choices.js
   const options = data.map(function(element) {
      return {
         value: element.id,
         label: element.name,
      };
   });

   // verifica se o select ja existe, caso exista destroi
   if (selectPeopleStatus) {
      selectPeopleStatus.destroy();
   }

   // renderiza o select com as opções formatadas
   selectPeopleStatus = new Choices('#selectPeopleStatus', {
      choices: options,
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });
};

// Função para selecionar o status da pessoa
async function setSelectPeopleStatusFromDB(value) {
   selectPeopleStatus.setChoiceByValue(value);
};

// Função para pegar a opção selecionada do Select Tipo de Pessoa
async function getSelectPeopleStatus() {
   if (selectPeopleStatus && selectPeopleStatus.getValue(true).length === 0) {
      return undefined;
   } else {
       // Usar o método getValue() para pegar os valores selecionados
       const selectedValues = selectPeopleStatus.getValue(true);
       // Transformar o array em uma string com os valores entre parênteses e separados por virgula
       return selectedValues;
   }
};

// Função que cria o select para selecionar os comerciais
let selectCommercial;
async function createSelectCommercial(data) {
   // Formate o array para ser usado com o Choices.js
   const options = data.map(function(element) {
      return {
         value: element.commercial_id,
         label: element.commercial,
      };
   });

   // verifica se o select ja existe, caso exista destroi
   if (selectCommercial) {
      selectCommercial.destroy();
   }

   // renderiza o select com as opções formatadas
   selectCommercial = new Choices('#selectCommercial', {
      choices: options,
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });
};

// Função para selecionar o comercial
async function setSelectCommercialFromDB(value) {
   selectCommercial.setChoiceByValue(value);
};

// Função para pegar a opção selecionada do Select Comercial
async function getSelectCommercial() {
   if (selectCommercial && selectCommercial.getValue(true).length === 0) {
      return undefined;
   } else {
       // Usar o método getValue() para pegar os valores selecionados
       const selectedValues = selectCommercial.getValue(true);
       // Transformar o array em uma string com os valores entre parênteses e separados por virgula
       return selectedValues;
   }
};

// Função que cria o select para selecionar os funcionarios responsaveis(inside sales)
let selectCollaboratorResponsable;
async function createSelectCollaboratorResponsable(data) {
   // Formate o array para ser usado com o Choices.js
   const options = data.map(function(element) {
      return {
         value: element.collaborator_responsable_id,
         label: element.collaborator_responsable,
      };
   });

   // verifica se o select ja existe, caso exista destroi
   if (selectCollaboratorResponsable) {
      selectCollaboratorResponsable.destroy();
   }

   // renderiza o select com as opções formatadas
   selectCollaboratorResponsable = new Choices('#selectCollaboratorResponsable', {
      choices: options,
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });
};

// Função para selecionar o funcionario responsavel
async function setSelectCollaboratorResponsableFromDB(value) {
   selectCollaboratorResponsable.setChoiceByValue(value);
};

// Função para pegar a opção selecionada do Select Colaborador resposavel
async function getSelectCollaboratorResponsable() {
   if (selectCollaboratorResponsable && selectCollaboratorResponsable.getValue(true).length === 0) {
      return undefined;
   } else {
       // Usar o método getValue() para pegar os valores selecionados
       const selectedValues = selectCollaboratorResponsable.getValue(true);
       // Transformar o array em uma string com os valores entre parênteses e separados por virgula
       return selectedValues;
   }
};

// Função que cria o select para selecionar as cidades do Brasil
let selectCity;
async function createSelectCity(data) {
   // Formate o array para ser usado com o Choices.js
   const options = data.map(function(element) {
      return {
         value: element.id,
         label: element.name,
      };
   });

   // verifica se o select ja existe, caso exista destroi
   if (selectCity) {
      selectCity.destroy();
   }

   // renderiza o select com as opções formatadas
   selectCity = new Choices('#selectCity', {
      choices: options,
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });
};

// Função para selecionar a cidade
async function setSelectCityFromDB(value) {
   selectCity.setChoiceByValue(value);
};

// Função para pegar a opção selecionada do Select Cidade
async function getSelectCity() {
   if (selectCity && selectCity.getValue(true).length === 0) {
      return undefined;
   } else {
       // Usar o método getValue() para pegar os valores selecionados
       const selectedValues = selectCity.getValue(true);
       // Transformar o array em uma string com os valores entre parênteses e separados por virgula
       return selectedValues;
   }
};

// Função que cria o select para selecionar os estados do Brasil
let selectState;
async function createSelectState(data) {
   // Formate o array para ser usado com o Choices.js
   const options = data.map(function(element) {
      return {
         value: element.id,
         label: element.name,
      };
   });

   // verifica se o select ja existe, caso exista destroi
   if (selectState) {
      selectState.destroy();
   }

   // renderiza o select com as opções formatadas
   selectState = new Choices('#selectState', {
      choices: options,
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });
};

// Função para selecionar o estado
async function setSelectStateFromDB(value) {
   selectState.setChoiceByValue(value);
};

// Função para pegar a opção selecionada do Select Estado
async function getSelectState() {
   if (selectState && selectState.getValue(true).length === 0) {
      return undefined;
   } else {
       // Usar o método getValue() para pegar os valores selecionados
       const selectedValues = selectState.getValue(true);
       // Transformar o array em uma string com os valores entre parênteses e separados por virgula
       return selectedValues;
   }
};

// Função que cria o select para selecionar os Países
let selectCountry;
async function createSelectCountry(data) {
   // Formate o array para ser usado com o Choices.js
   const options = data.map(function(element) {
      return {
         value: element.id,
         label: element.name,
      };
   });

   // verifica se o select ja existe, caso exista destroi
   if (selectCountry) {
      selectCountry.destroy();
   }

   // renderiza o select com as opções formatadas
   selectCountry = new Choices('#selectCountry', {
      choices: options,
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });
};

// Função para selecionar o País
async function setSelectCountryFromDB(value) {
   selectCountry.setChoiceByValue(value);
};

// Função para pegar a opção selecionada do Select País
async function getSelectCountry() {
   if (selectCountry && selectCountry.getValue(true).length === 0) {
      return undefined;
   } else {
       // Usar o método getValue() para pegar os valores selecionados
       const selectedValues = selectCountry.getValue(true);
       // Transformar o array em uma string com os valores entre parênteses e separados por virgula
       return selectedValues;
   }
};

// Função para inserir os dados nos inputs como: CPF/CNPJ, Razao social, logradouro etc.
async function insertDataOnInputs(data) {
   const input_cnpj_cpf = document.getElementById('input-cnpj-cpf');
   const input_razao_social = document.getElementById('input-razao-social');
   const input_fantasia = document.getElementById('input-fantasia');
   const input_inscricao_estadual = document.getElementById('input-inscricao-estadual');
   const opening_company = document.getElementById('opening-company');
   const input_cep = document.getElementById('input-cep');
   const input_street = document.getElementById('input-street');
   const input_complement = document.getElementById('input-complement');
   const input_neighborhood = document.getElementById('input-neighborhood');

   input_cnpj_cpf.value = formatCnpjCpfInput(data.cnpj_cpf);
   input_razao_social.value = data.name;
   input_fantasia.value = data.fantasy_name;
   input_inscricao_estadual.value = data.state_registration;
   opening_company.value = data.opening_date_formated;
   input_cep.value = formatCEP(data.cep);
   input_street.value = data.street;
   input_complement.value = data.complement;
   input_neighborhood.value = data.neighborhood;
};

// Função para formatar o CNPJ e CPF do input
function formatCEP(value) {
   // Remove todos os caracteres não numéricos
   value = value.replace(/\D/g, '');

   // Limita o comprimento a 14 dígitos
   if (value.length > 8) {
       value = value.substring(0, 8);
   }

   // Verifica o comprimento para formatar para CEP
   if (value.length === 8) {
      // Formata como CEP: 00.000-000
      return value.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2-$3');
   }

   // Retorna o valor sem formatação se não houver 8 dígitos
   return value;
};

// Função para formatar o CEP
async function inputCepVerification() {
   const inputCEP = document.getElementById('input-cep');

   // Permite que seja digitado somente numero
   inputCEP.addEventListener('input', (event) => {
      let value = event.target.value.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
      event.target.value = formatCEP(value);
   });

   inputCEP.addEventListener('keypress', (event) => {
      // Permite apenas a entrada de números
      const charCode = event.charCode || event.keyCode || event.which;
      if (charCode < 48 || charCode > 57) {
         event.preventDefault();
      }
   });
};

// Função para receber o id da pessoa que esta sendo aberta nesta janela
async function getPeopleInfo() {
   const queryString = window.location.search;
   const urlParams = new URLSearchParams(queryString);
   const id = urlParams.get('id');
   return id;
};

// Função que armazena todos os click na tela
async function eventClick() {
   // ========== BOTAO SALVAR ========== //
   const btn_save = document.getElementById('btn-save');

   btn_save.addEventListener('click', async function(e) {
      e.preventDefault();
      const value_select_people_type = await getSelectPeopleType();
      const value_cpf_cnpj = document.getElementById('input-cnpj-cpf').value.replace(/\D/g, '');
      const input_razao_social = document.getElementById('input-razao-social').value;
      const input_fantasia = document.getElementById('input-fantasia').value;
      const input_inscricao_estadual = document.getElementById('input-inscricao-estadual').value;
      const opening_company = document.getElementById('opening-company').value;
      const value_select_people_category = await getselectPeopleCategory();
      const value_select_people_status = await getSelectPeopleStatus();
      const value_select_comercial = await getSelectCommercial();
      const value_select_collaborator_responsable = await getSelectCollaboratorResponsable();
      const input_cep = document.getElementById('input-cep').value.replace(/\D/g, '');
      const input_street = document.getElementById('input-street').value;
      const input_complement = document.getElementById('input-complement').value;
      const input_neighborhood = document.getElementById('input-neighborhood').value;
      const value_select_city = await getSelectCity();
      const value_select_state = await getSelectState();
      const value_select_country = await getSelectCountry();
   })


   // ========== / BOTAO SALVAR ========== //
}

// Função executada após toda a página ser executada
window.addEventListener("load", async () => {
   const getAllPeopleCategory = await makeRequest('/api/people/getAllPeopleCategory', 'POST',);
   const getAllPeopleStatus = await makeRequest('/api/people/getAllPeopleStatus', 'POST',);
   const getAllCommercial = await makeRequest('/api/people/getAllCommercial', 'POST',);
   const getAllCollaboratorsResponsable = await makeRequest('/api/people/getAllCollaboratorsResponsable', 'POST',);
   const getCity = await makeRequest('/api/people/getCity', 'POST',);
   const getState = await makeRequest('/api/people/getState', 'POST',);
   const getCountry = await makeRequest('/api/people/getCountry', 'POST',);

   await createSelectPeopleType();
   await createSelectPeopleCategory(getAllPeopleCategory);
   await createSelectPeopleStatus(getAllPeopleStatus);
   await createSelectCommercial(getAllCommercial);
   await createSelectCollaboratorResponsable(getAllCollaboratorsResponsable);
   await createSelectCity(getCity);
   await createSelectState(getState);
   await createSelectCountry(getCountry);
   await inputCepVerification();



   // Consultas e função para preencher os campos com o que vem do banco de dados
   const peopleSelectedId = await getPeopleInfo();

   const getPeopleById = await makeRequest('/api/people/getPeopleById', 'POST', {peopleSelectedId: peopleSelectedId});
   const getPeopleCategoryById = await makeRequest('/api/people/getPeopleCategoryById', 'POST', {peopleSelectedId: peopleSelectedId});
   await setSelectPeopleTypeFromDB(getPeopleById[0].type_people);
   await setSelectPeopleCategoryFromDB(getPeopleCategoryById);
   await setSelectPeopleStatusFromDB(getPeopleById[0].people_status_id)
   await setSelectCommercialFromDB(getPeopleById[0].collaborators_commercial_id)
   await setSelectCollaboratorResponsableFromDB(getPeopleById[0].collaborators_responsable_id)
   await setSelectCityFromDB(getPeopleById[0].city_id)
   await setSelectStateFromDB(getPeopleById[0].state_id)
   await setSelectCountryFromDB(getPeopleById[0].country_id)
   await insertDataOnInputs(getPeopleById[0])

   await eventClick();

   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')

})