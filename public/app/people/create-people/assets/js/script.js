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

// Função para transformar todo texto em camel case
async function formatarNome(nome) {
   const preposicoes = new Set(["de", "do", "da", "dos", "das"]); // Conjunto de preposições
   const palavras = nome.split(" "); // Divide o nome em palavras
   const palavrasFormatadas = palavras.map((palavra, index) => {
       // Verifica se a palavra é uma preposição e não é a primeira palavra
       if (preposicoes.has(palavra.toLowerCase()) && index !== 0) {
           return palavra.toLowerCase(); // Retorna a palavra em minúsculas
       } else {
           return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase(); // Retorna a palavra com a primeira letra em maiúscula e o restante em minúsculas
       }
   });
   return palavrasFormatadas.join(" "); // Junta as palavras formatadas em uma string
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
      noResultsText: 'Não há opções disponíveis',
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

// Função para pegar as opções selecionadas do select Categoria Pessoa para fazer update no banco de dados
async function getselectPeopleCategoryFromUpdate() {
   if (selectPeopleCategory && selectPeopleCategory.getValue(true).length === 0) {
      return undefined;
   } else {
       // Usar o método getValue() para pegar os valores selecionados
       const selectedValues = selectPeopleCategory.getValue(true);
       // Transformar o array em uma string com os valores entre parênteses e separados por virgula
       return selectedValues;
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

// Função para pegar a opção selecionada do Select de status da pessoa
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

// Função que envia para a proxima janela o id da pessoa clicada
async function openPeople(id) {
   const body = {
       url: `/app/people/get-people?id=${id}`
   }
   window.ipcRenderer.invoke('open-exWindow', body);
};

// Função que emite um alerta se o cadastro já existir no banco. Se não existir, cadastra o usuario normal
async function checkCompanyExistence(getPeopleByCNPJ) {
   if (getPeopleByCNPJ && getPeopleByCNPJ.company_exist) {
      const result = await Swal.fire({
         title: "CNPJ já cadastrado no sistema!",
         text: "Deseja visualiza-lo?",
         icon: "warning",
         showCancelButton: true,
         cancelButtonColor: "#d33",
         confirmButtonColor: "#0086ed",
         confirmButtonText: "Abrir",
         cancelButtonText: "Não",
         reverseButtons: true
      });

      // Limpa o campo de CNPJ
      document.getElementById('input-cnpj-cpf').value = '';

      if (result.isConfirmed) {
         await openPeople(getPeopleByCNPJ.company_exist[0].id);
      }
   } else {
      // Se o cadastro ainda nao existir no banco de dados, pega o que retorna da API e preenche nos inputs e selects

      const getCityOrStateById = await makeRequest('/api/people/getCityOrStateById', 'POST', {city: getPeopleByCNPJ.resultApi.municipio}); // Pega a cidade e o estado
      
      const input_razao_social = document.getElementById('input-razao-social');
      const input_fantasia = document.getElementById('input-fantasia');
      const input_cep = document.getElementById('input-cep');
      const input_street = document.getElementById('input-street');
      const input_complement = document.getElementById('input-complement');
      const input_neighborhood = document.getElementById('input-neighborhood');

      input_razao_social.value = getPeopleByCNPJ.resultApi.razao_social;
      input_fantasia.value = getPeopleByCNPJ.resultApi.nome_fantasia;
      input_cep.value = getPeopleByCNPJ.resultApi.cep;
      input_street.value = getPeopleByCNPJ.resultApi.logradouro;
      input_complement.value = getPeopleByCNPJ.resultApi.complemento;
      input_neighborhood.value = getPeopleByCNPJ.resultApi.bairro;
      await setSelectCityFromDB(getCityOrStateById[0].city_id);
      await setSelectStateFromDB(getCityOrStateById[0].state_id)
      await setSelectCountryFromDB(getCityOrStateById[0].country_id)
   }
};

// Função para verificar se os campos estão preenchidos
async function getValuesFromInputs() {
   // Array com os names dos inputs que não devem ficar em branco e suas mensagens personalizadas
   const requiredInputFields = [
      { name: 'input-cnpj-cpf', message: 'O campo CPF/CNPJ é obrigatório.' },
      { name: 'input-razao-social', message: 'O campo TAZÃO SOCIAL é obrigatório.' },
      { name: 'input-fantasia', message: 'O campo NOME FANTASIA é obrigatório.' },
      { name: 'input-cep', message: 'O campo CEP é obrigatório.' },
   ];

   const elements = document.querySelectorAll('.form-control[name]');
   let allValid = true;

   for (let index = 0; index < elements.length; index++) {
      const item = elements[index];
      const itemName = item.getAttribute('name');
      
      // Verificar se o campo está no array de campos obrigatórios e se está vazio
      const requiredField = requiredInputFields.find(field => field.name === itemName);
      if (requiredField && (item.value.trim() === '' || item.value.trim() === '0')) {
         Swal.fire(requiredField.message);
         allValid = false;
         break;
      }
   }

   return allValid;
};

// Função para os valores de qualquer selected
async function getSelectValues(selectName) {
   const selectElement = document.querySelector(`select[name="${selectName}"]`);
   if (selectElement) {
      const selectedOptions = Array.from(selectElement.selectedOptions);
      console.log(selectedOptions[0].value);
      if (selectedOptions[0].value === '') {
         return undefined;
      } else {
         const selectedValues = selectedOptions.map(option => option.value);
         return selectedValues;
      }
   } else {
      return undefined;
   }
};

// Função para verificar se os selects estão preenchidos
async function getValuesFromSelects() {
   // Array com os names dos selects que não devem ficar em branco e suas mensagens personalizadas
   const selectNames = [
      { name: 'typePeople', message: 'O campo TIPO PESSOA é obrigatório.' },
      { name: 'selectPeopleCategory', message: 'O campo CATEGORIA PESSOA é obrigatório.' },
      { name: 'selectCity', message: 'O campo CIDADE é obrigatório.' },
      { name: 'selectCountry', message: 'O campo PAÍS é obrigatório.' },
   ];
   let allValid = true;

   for (let i = 0; i < selectNames.length; i++) {
      const selectName = selectNames[i];
      const values = await getSelectValues(selectName.name);
      if (!values || values.length === 0) {
         Swal.fire(`${selectName.message}`);
         allValid = false;
         break;
      }
   }

   return allValid;
};

async function eventClick() {
   // ========== INPUT CHECKBOX INTERNACIONAL ========== //
   const checkbox_international = document.getElementById('input-checkbox-international');
   const cpf_cnpj = document.getElementById('input-cnpj-cpf');
   const input_razao_social = document.getElementById('input-razao-social');
   const fields_required = document.querySelectorAll('.required')

   checkbox_international.addEventListener('change', function() {
      if (checkbox_international && checkbox_international.checked) {
         cpf_cnpj.disabled = true;
         cpf_cnpj.value = '';
         input_razao_social.disabled = false;

         fields_required.forEach(item => {
            item.classList.add('d-none')
         });
      } else {
         cpf_cnpj.disabled = false;
         input_razao_social.disabled = true;
         fields_required.forEach(item => {
            item.classList.remove('d-none')
         });
      }
   })
   // ========== / INPUT CHECKBOX INTERNACIONAL ========== //

   // ========== INPUT CPF CNPJ ========== //
   document.getElementById('typePeople').addEventListener('change', async function() {
      const typePeople = await getSelectPeopleType()

      // Só remove o disabled do cpf-cnpj quando selecionar o tipo de pessoa!
      const cpf_cnpj = document.getElementById('input-cnpj-cpf');
      cpf_cnpj.disabled = false;

      // Se o tipo de pessoa for jurídica, entra no if, senão nao fará nada
      if (typePeople === 0) {
         document.getElementById('input-cnpj-cpf').addEventListener('input', async function() {
            const cnpj = this.value.replace(/\D/g, '');

            if (cnpj.length === 14) {
               const getPeopleByCNPJ = await makeRequest('/api/people/getPeopleByCNPJ', 'POST', { cnpj: cnpj });

               // Se o CNPJ existir no banco vai dar um alerta para o usuario se ele quer abrir o cadastro, para nao deixar cadastrar novamente. Senao, segue o cadastro normal
               await checkCompanyExistence(getPeopleByCNPJ);
            }
         })
      }
   })
   // ========== / INPUT CPF CNPJ ========== //

   // ========== BOTAO SALVAR ========== //
   const btn_save = document.getElementById('btn-save');

   btn_save.addEventListener('click', async function(e) {
      e.preventDefault();
      let formBody = {};

      const razaoSocial = await formatarNome(document.getElementById('input-razao-social').value)
      const fantasia = await formatarNome(document.getElementById('input-fantasia').value)
      const street = await formatarNome(document.getElementById('input-street').value)
      const complement = await formatarNome(document.getElementById('input-complement').value)
      const neighborhood = await formatarNome(document.getElementById('input-neighborhood').value)

      formBody.selectPeopleType = await getSelectPeopleType();
      formBody.cnpjCpf = document.getElementById('input-cnpj-cpf').value.replace(/\D/g, '');
      formBody.razaoSocial = razaoSocial;
      formBody.fantasia = fantasia;
      formBody.inscricaoEstadual = document.getElementById('input-inscricao-estadual').value;
      formBody.peopleCategory = await getselectPeopleCategoryFromUpdate();
      formBody.peopleStatus = await getSelectPeopleStatus();
      formBody.commercial = await getSelectCommercial();
      formBody.collaboratorResponsable = await getSelectCollaboratorResponsable();
      formBody.cep = document.getElementById('input-cep').value.replace(/\D/g, '');
      formBody.street = street;
      formBody.complement = complement;
      formBody.neighborhood = neighborhood;
      formBody.city = await getSelectCity();
      formBody.state = await getSelectState();
      formBody.country = await getSelectCountry();
      
      const inputsValid = await getValuesFromInputs();
      const selectsValid = await getValuesFromSelects();
   
      if (inputsValid && selectsValid) {
         const insertSever = await makeRequest(`/api/people/insertPeople`, 'POST', { formBody });
         window.close();
      }
   })
   // ========== / BOTAO SALVAR ========== //
};

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

   await eventClick();

   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')

})