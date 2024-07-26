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
}

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

   await eventClick();

   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')

})