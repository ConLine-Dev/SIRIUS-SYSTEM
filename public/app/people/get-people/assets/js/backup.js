// Função para verificar se o tempo de login expirou
async function checkLoginExpiration() {
   // Verifica o localStorage para alterar a mensagem de boas vindas
   const StorageGoogleData = localStorage.getItem('StorageGoogle');
   const StorageGoogle = JSON.parse(StorageGoogleData);

   if (!localStorage.getItem('StorageGoogle')) {
       window.location.href = '/app/login';
   } else {
       document.querySelector('body').style.display = 'block'
   }



   const loginTime = localStorage.getItem('loginTime');

   if (loginTime) {
       const currentTime = new Date().getTime();
       const elapsedTime = currentTime - parseInt(loginTime);
   
       // 24 horas em milissegundos
       const twentyFourHours = 1000;

       if (elapsedTime >= twentyFourHours) {
           // Limpa os dados do usuário e redireciona para a página de login
           localStorage.removeItem('StorageGoogle');
           localStorage.removeItem('loginTime');
           window.location.href = '/app/login';
       }
   }
}

// Verifica o localStorage para setar informações
async function getInfosLogin() {
   const StorageGoogleData = localStorage.getItem('StorageGoogle');
   const StorageGoogle = JSON.parse(StorageGoogleData);

   return StorageGoogle;
}

async function setInfosLogin(StorageGoogle) {
   document.querySelectorAll('.imgUser').forEach(element => {
       element.src = StorageGoogle.picture ? StorageGoogle.picture : StorageGoogle.system_image
   });

   document.querySelectorAll('.UserName').forEach(element => {
       element.textContent = StorageGoogle.given_name.replace(/[^a-zA-Z\s]/g, '');
   });

   document.querySelectorAll('.buttonLogout').forEach(element => {
       element.addEventListener('click', function (e) {
               e.preventDefault()
       
               localStorage.removeItem('StorageGoogle');
               localStorage.removeItem('loginTime');
       
               window.location.href = '/app/login'
       })

   });


}

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
let selectPeopleCategory, selectPeopleStatus, selectCommercial, selectCollaboratorResponsable, selectCity, selectState, selectCountry;
async function createSelectWithChoices() {
   // Inicialize o select de categoria de pessoa
   selectPeopleCategory = new Choices('#selectPeopleCategory', {
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });

   // Inicialize o select de categoria de pessoa
   selectPeopleStatus = new Choices('#selectPeopleStatus', {
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });

   // Inicialize o select de categoria de pessoa
   selectCommercial = new Choices('#selectCommercial', {
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });

   // Inicialize o select de categoria de pessoa
   selectCollaboratorResponsable = new Choices('#selectCollaboratorResponsable', {
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });

   // Inicialize o select de categoria de pessoa
   selectCity = new Choices('#selectCity', {
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });

   // Inicialize o select de categoria de pessoa
   selectState = new Choices('#selectState', {
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });

   // Inicialize o select de categoria de pessoa
   selectCountry = new Choices('#selectCountry', {
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });
}

// Função para carregar as opções do banco de dados
async function loadSelectPeopleCategory() {
   // Mostra o indicador de carregamento
   selectPeopleCategory.setChoices([{
      value: '',
      label: 'Carregando...',
      disabled: true
   }], 'value', 'label', true);

   try {
      // Simula uma chamada para o banco de dados
      const getAllPeopleCategory = await makeRequest('/api/people/getAllPeopleCategory', 'POST',);

      // Formate o array para ser usado com o Choices.js
      const options = getAllPeopleCategory.map(element => ({
         value: element.id,
         label: element.name
      }));

      // Atualiza as opções do Choices.js
      selectPeopleCategory.clearChoices();
      selectPeopleCategory.setChoices(options, 'value', 'label', true);    
   } catch (error) {
      // Lida com o erro se a chamada para o banco de dados falhar
      console.error('Erro ao carregar opções:', error);
      selectPeopleCategory.clearChoices();
      selectPeopleCategory.setChoices([{
         value: '',
         label: 'Erro ao carregar opções',
         disabled: true
      }], 'value', 'label', true);
   }

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

// Adiciona um evento para carregar as opções quando o dropdown do select é exibido
document.querySelector('#selectPeopleCategory').addEventListener('showDropdown', async function() {
   if (selectPeopleCategory.getValue(true).length === 0) {
      await loadSelectPeopleCategory();
   }
});

// Função para carregar as opções do banco de dados
async function loadSelectPeopleStatus() {
   // Mostra o indicador de carregamento
   selectPeopleStatus.setChoices([{
      value: '',
      label: 'Carregando...',
      disabled: true
   }], 'value', 'label', true);

   try {
      // Simula uma chamada para o banco de dados
      const getAllPeopleStatus = await makeRequest('/api/people/getAllPeopleStatus', 'POST');

      // Formate o array para ser usado com o Choices.js
      const options = getAllPeopleStatus.map(element => ({
         value: element.id,
         label: element.name
      }));

      // Atualiza as opções do Choices.js
      selectPeopleStatus.clearChoices();
      selectPeopleStatus.setChoices(options, 'value', 'label', true);    
   } catch (error) {
      // Lida com o erro se a chamada para o banco de dados falhar
      console.error('Erro ao carregar opções:', error);
      selectPeopleStatus.clearChoices();
      selectPeopleStatus.setChoices([{
         value: '',
         label: 'Erro ao carregar opções',
         disabled: true
      }], 'value', 'label', true);
   }

};

// Função para selecionar o status da pessoa
async function setSelectPeopleStatusFromDB(value) {
   selectPeopleStatus.setChoiceByValue(value);
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

// Adiciona um evento para carregar as opções quando o dropdown do select é exibido
document.querySelector('#selectPeopleStatus').addEventListener('showDropdown', async function() {
   if (selectPeopleStatus.getValue(true).length === 0) {
      await loadselectPeopleStatus();
   }
});

// Função para carregar as opções do banco de dados
async function loadSelectCommercial() {
   // Mostra o indicador de carregamento
   selectCommercial.setChoices([{
      value: '',
      label: 'Carregando...',
      disabled: true
   }], 'value', 'label', true);

   try {
      // Simula uma chamada para o banco de dados
      const getAllCommercial = await makeRequest('/api/people/getAllCommercial', 'POST',);

      // Formate o array para ser usado com o Choices.js
      const options = getAllCommercial.map(element => ({
         value: element.commercial_id,
         label: element.commercial
      }));

      // Atualiza as opções do Choices.js
      selectCommercial.clearChoices();
      selectCommercial.setChoices(options, 'value', 'label', true);
   } catch (error) {
      // Lida com o erro se a chamada para o banco de dados falhar
      console.error('Erro ao carregar opções:', error);
      selectCommercial.clearChoices();
      selectCommercial.setChoices([{
         value: '',
         label: 'Erro ao carregar opções',
         disabled: true
      }], 'value', 'label', true);
   }
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

// Adiciona um evento para carregar as opções quando o dropdown do select é exibido
document.querySelector('#selectCommercial').addEventListener('showDropdown', async function() {
   if (selectCommercial.getValue(true).length === 0) {
      await loadSelectCommercial();
   }
});

// Função para carregar as opções do banco de dados
async function loadSelectCollaboratorResponsable() {
   // Mostra o indicador de carregamento
   selectCollaboratorResponsable.setChoices([{
      value: '',
      label: 'Carregando...',
      disabled: true
   }], 'value', 'label', true);

   try {
      // Simula uma chamada para o banco de dados
      const getAllCollaboratorsResponsable = await makeRequest('/api/people/getAllCollaboratorsResponsable', 'POST',);

      // Formate o array para ser usado com o Choices.js
      const options = getAllCollaboratorsResponsable.map(element => ({
         value: element.collaborator_responsable_id,
         label: element.collaborator_responsable
      }));

      // Atualiza as opções do Choices.js
      selectCollaboratorResponsable.clearChoices();
      selectCollaboratorResponsable.setChoices(options, 'value', 'label', true);
   } catch (error) {
      // Lida com o erro se a chamada para o banco de dados falhar
      console.error('Erro ao carregar opções:', error);
      selectCollaboratorResponsable.clearChoices();
      selectCollaboratorResponsable.setChoices([{
         value: '',
         label: 'Erro ao carregar opções',
         disabled: true
      }], 'value', 'label', true);
   }

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

// Adiciona um evento para carregar as opções quando o dropdown do select é exibido
document.querySelector('#selectCollaboratorResponsable').addEventListener('showDropdown', async function() {
   if (selectCollaboratorResponsable.getValue(true).length === 0) {
      await loadSelectCollaboratorResponsable();
   }
});


// Função para carregar as opções do banco de dados
async function loadSelectCity() {
   // Mostra o indicador de carregamento
   selectCity.setChoices([{
      value: '',
      label: 'Carregando...',
      disabled: true
   }], 'value', 'label', true);

   try {
      // Simula uma chamada para o banco de dados
      const getCity = await makeRequest('/api/people/getCity', 'POST',);

      // Formate o array para ser usado com o Choices.js
      const options = getCity.map(element => ({
         value: element.id,
         label: element.name
      }));

      // Atualiza as opções do Choices.js
      selectCity.clearChoices();
      selectCity.setChoices(options, 'value', 'label', true);
   } catch (error) {
      // Lida com o erro se a chamada para o banco de dados falhar
      console.error('Erro ao carregar opções:', error);
      selectCity.clearChoices();
      selectCity.setChoices([{
         value: '',
         label: 'Erro ao carregar opções',
         disabled: true
      }], 'value', 'label', true);
   }

};

// Função para selecionar a cidade
async function setSelectCityFromDB(value) {
   selectCity.setChoiceByValue(value);
};

// Função para pegar a opção selecionada do Select Cidade
async function getSelectCity() {
   if (selectCity) {
      const values = selectCity.getValue(true);
      if (values && values.length === 0) {
         return undefined;
      } else {
         return values;
      }
   } else {
      return undefined;
   }
};

// Adiciona um evento para carregar as opções quando o dropdown do select é exibido
document.querySelector('#selectCity').addEventListener('showDropdown', async function() {
   if (selectCity.getValue(true).length === 0) {
      await loadSelectCity();
   }
});

// Função para carregar as opções do banco de dados
async function loadSelectState() {
   // Simula uma chamada para o banco de dados
   const getState = await makeRequest('/api/people/getState', 'POST',);

   // Formate o array para ser usado com o Choices.js
   const options = getState.map(element => ({
      value: element.id,
      label: element.name
   }));

   // Atualiza as opções do Choices.js
   selectState.clearChoices();
   selectState.setChoices(options, 'value', 'label', true);
};

// Função para selecionar o estado
async function setSelectStateFromDB(value) {
   selectState.setChoiceByValue(value);
};

// Função para pegar a opção selecionada do Select Estado
async function getSelectState() {
   if (selectState) {
      const values = selectState.getValue(true);
      if (values && values.length === 0) {
         return undefined;
      } else {
         return values;
      }
   } else {
      return undefined;
   }
};

// Adiciona um evento para carregar as opções quando o dropdown do select é exibido
document.querySelector('#selectState').addEventListener('showDropdown', async function() {
   if (selectState.getValue(true).length === 0) {
      await loadSelectState();
   }
});

// Função para carregar as opções do banco de dados
async function loadSelectCountry() {
   // Simula uma chamada para o banco de dados
   const getCountry = await makeRequest('/api/people/getCountry', 'POST',);

   // Formate o array para ser usado com o Choices.js
   const options = getCountry.map(element => ({
      value: element.id,
      label: element.name
   }));

   // Atualiza as opções do Choices.js
   selectCountry.clearChoices();
   selectCountry.setChoices(options, 'value', 'label', true);
};

// Função para selecionar o País
async function setSelectCountryFromDB(value) {
   selectCountry.setChoiceByValue(value);
};

// Função para pegar a opção selecionada do Select País
async function getSelectCountry() {
   if (selectCountry) {
      const values = selectCountry.getValue(true);
      if (values && values.length === 0) {
         return undefined;
      } else {
         return values;
      }
   } else {
      return undefined;
   }
};

// Adiciona um evento para carregar as opções quando o dropdown do select é exibido
document.querySelector('#selectCountry').addEventListener('showDropdown', async function() {
   if (selectCountry.getValue(true).length === 0) {
      await loadSelectCountry();
   }
});

// Função para inserir os dados nos inputs como: CPF/CNPJ, Razao social, logradouro etc.
async function insertDataOnInputs(data) {
   const input_cnpj_cpf = document.getElementById('input-cnpj-cpf');
   const input_razao_social = document.getElementById('input-razao-social');
   const input_fantasia = document.getElementById('input-fantasia');
   const input_inscricao_estadual = document.getElementById('input-inscricao-estadual');
   const input_cep = document.getElementById('input-cep');
   const input_street = document.getElementById('input-street');
   const input_complement = document.getElementById('input-complement');
   const input_neighborhood = document.getElementById('input-neighborhood');
   const checkbox_international = document.getElementById('input-checkbox-international');

   input_cnpj_cpf.value = data.cnpj_cpf === null ? '' : formatCnpjCpfInput(data.cnpj_cpf);
   input_razao_social.value = data.name;
   input_fantasia.value = data.fantasy_name;
   input_inscricao_estadual.value = data.state_registration;
   input_cep.value = formatCEP(data.cep);
   input_street.value = data.street;
   input_complement.value = data.complement;
   input_neighborhood.value = data.neighborhood;
   checkbox_international.checked = data.international === 1 ? true : false;
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

// Função para verificar se os campos estão preenchidos
async function getValuesFromInputs() {
   const isInternation = document.getElementById('input-checkbox-international').checked;

   // Array com os names dos inputs que não devem ficar em branco e suas mensagens personalizadas
   let requiredInputFields = [
      { name: 'input-cnpj-cpf', message: 'O campo CPF/CNPJ é obrigatório.' },
      { name: 'input-razao-social', message: 'O campo TAZÃO SOCIAL é obrigatório.' },
      { name: 'input-fantasia', message: 'O campo NOME FANTASIA é obrigatório.' },
      { name: 'input-cep', message: 'O campo CEP é obrigatório.' },
   ];

   if (isInternation) {
      requiredInputFields = requiredInputFields.filter(field => field.name !== 'input-cnpj-cpf' && field.name !== 'input-cep');
   }

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
      if (!selectedOptions || selectedOptions.length === 0 || selectedOptions[0].value === '') {
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
   const isInternation = document.getElementById('input-checkbox-international').checked;
   // Array com os names dos selects que não devem ficar em branco e suas mensagens personalizadas
   let selectNames = [
      { name: 'typePeople', message: 'O campo TIPO PESSOA é obrigatório.' },
      { name: 'selectPeopleCategory', message: 'O campo CATEGORIA PESSOA é obrigatório.' },
      { name: 'selectCity', message: 'O campo CIDADE é obrigatório.' },
      { name: 'selectState', message: 'O campo ESTADO é obrigatório.' },
      { name: 'selectCountry', message: 'O campo PAÍS é obrigatório.' },
   ];

   if (isInternation) {
      selectNames = selectNames.filter(field => field.name !== 'selectState');
   }

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

// Função que armazena todos os click na tela
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

   // ========== INPUT CEP ========== //
   document.getElementById('input-cep').addEventListener('input', async function () {
      const cep = this.value.replace(/\D/g, '');
         
      const input_street = document.getElementById('input-street');
      const input_complement = document.getElementById('input-complement');
      const input_neighborhood = document.getElementById('input-neighborhood');

      // Verifica se cep tem 8 digitos
      if (cep.length === 8) {
         const api = await makeRequest(`https://viacep.com.br/ws/${cep}/json/`); // Consulta na api o cep
         if (api && api.localidade) {
            const getCityOrStateById = await makeRequest('/api/people/getCityOrStateById', 'POST', {city: api.localidade}); // Pega a cidade e o estado
   
            input_street.value = api.logradouro;
            input_complement.value = api.complemento;
            input_neighborhood.value = api.bairro;
            await setSelectCityFromDB(getCityOrStateById[0].city_id);
            await setSelectStateFromDB(getCityOrStateById[0].state_id)
            await setSelectCountryFromDB(getCityOrStateById[0].country_id)
         } else {
            Swal.fire('CEP incorreto');
            this.value = '';
            input_street.value = '';
            input_complement.value = '';
            input_neighborhood.value = '';
            await setSelectCityFromDB('');
            await setSelectStateFromDB('');
            await setSelectCountryFromDB('');
         }
      }
   })
   // ========== / INPUT CEP ========== //  

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
      const inputCheckbox = await document.getElementById('input-checkbox-international').checked;

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
      formBody.international = inputCheckbox === true ? 1 : 0;
      formBody.peopleId = await getPeopleInfo();

      const inputsValid = await getValuesFromInputs();
      const selectsValid = await getValuesFromSelects();
   
      if (inputsValid && selectsValid) {
         const insertSever = await makeRequest(`/api/people/updateGetPeople`, 'POST', { formBody });
         window.close();
      }
   })
   // ========== / BOTAO SALVAR ========== //
};

// Função executada após toda a página ser carregada
window.addEventListener("load", async () => {
   await checkLoginExpiration()

   setInterval(async () => {
       await checkLoginExpiration()
   }, 1000);

   await createSelectPeopleType();
   await createSelectWithChoices();
   await inputCepVerification();

   // Carrega as opções dos selects
   await loadSelectPeopleCategory();
   await loadSelectPeopleStatus();
   await loadSelectCommercial();
   await loadSelectCollaboratorResponsable();
   await loadSelectCity();
   await loadSelectState();
   await loadSelectCountry();

   // Consultas e função para preencher os campos com os dados do banco de dados
   const peopleSelectedId = await getPeopleInfo();

   const getPeopleById = await makeRequest('/api/people/getPeopleById', 'POST', {peopleSelectedId: peopleSelectedId});
   const getPeopleCategoryById = await makeRequest('/api/people/getPeopleCategoryById', 'POST', {peopleSelectedId: peopleSelectedId});

   await setSelectPeopleTypeFromDB(getPeopleById[0].type_people);
   await setSelectPeopleCategoryFromDB(getPeopleCategoryById);
   await setSelectPeopleStatusFromDB(getPeopleById[0].people_status_id);
   await setSelectCommercialFromDB(getPeopleById[0].collaborators_commercial_id);
   await setSelectCollaboratorResponsableFromDB(getPeopleById[0].collaborators_responsable_id);
   await setSelectCityFromDB(getPeopleById[0].city_id);
   await setSelectStateFromDB(getPeopleById[0].state_id);
   await setSelectCountryFromDB(getPeopleById[0].country_id);
   await insertDataOnInputs(getPeopleById[0]);

   await eventClick();

   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none');
});
