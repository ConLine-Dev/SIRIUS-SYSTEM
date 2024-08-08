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

   // renderiza o select com as opções formatadas
   selectPeopleStatus = new Choices('#selectPeopleStatus', {
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });

   // renderiza o select com as opções formatadas
   selectCommercial = new Choices('#selectCommercial', {
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });

   // renderiza o select com as opções formatadas
   selectCollaboratorResponsable = new Choices('#selectCollaboratorResponsable', {
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });

   // renderiza o select com as opções formatadas
   selectCity = new Choices('#selectCity', {
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis',
      position: 'top'
   });

   // renderiza o select com as opções formatadas
   selectState = new Choices('#selectState', {
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis',
      position: 'top'
   });

   // renderiza o select com as opções formatadas
   selectCountry = new Choices('#selectCountry', {
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis',
      position: 'top'
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
      const getAllPeopleStatus = await makeRequest('/api/people/getAllPeopleStatus', 'POST',);

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
      await loadSelectPeopleStatus();
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
      if (selectedOptions.length === 0 || selectedOptions[0].value === '') {
         return undefined;
      } else {
         const selectedValues = selectedOptions.map(option => option.value);
         return selectedValues;
      }
   } else {
      return undefined;
   }
}

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
   await createSelectPeopleType();
   await createSelectWithChoices()
   await inputCepVerification();

   // Carrega as cidades, estados e países ao carregar a pagina
   await loadSelectCity();
   await loadSelectState();
   await loadSelectCountry();

   await eventClick();

   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')
})