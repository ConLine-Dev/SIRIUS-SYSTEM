// Função que cria o select para selecionar as categorias de pessoas
let selectDepartments;
async function createSelectWithChoices() {
   // Inicialize o select de categoria de pessoa
   selectDepartments = new Choices('#selectDepartment', {
      allowHTML: false,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });
}

// Função para carregar as opções do banco de dados
async function loadSelectDepartments() {
   // Definir uma opção inicial como 'Carregando...'
   selectDepartments.setChoices([{
      value: '',
      label: 'Carregando...',
      disabled: false
   }], 'value', 'label', true);

   try {
      const searchDepartments = await makeRequest(`/api/product/listAllDepartments`, 'POST');

      // Formatar o array para ser usado com o Choices.js
      const options = searchDepartments.map(element => ({
         value: element.id,
         label: element.name
      }));

      // Atualiza as opções do Choices.js
      selectDepartments.clearChoices(); // Limpa as opções anteriores
      selectDepartments.setChoices(options, 'value', 'label', true); // Define as novas opções

   } catch (error) {
      // Lida com o erro se a chamada para o banco de dados falhar
      console.error('Erro ao carregar opções:', error);
      selectDepartments.clearChoices(); // Limpa opções
      selectDepartments.setChoices([{
         value: '',
         label: 'Erro ao carregar opções',
         disabled: true
      }], 'value', 'label', true);
   }
}

// Adiciona um evento para carregar as opções quando o dropdown do select é exibido
document.querySelector('#selectDepartment').addEventListener('showDropdown', async function() {
   if (selectDepartments.getValue(true).length === 0) {
      await loadSelectDepartments();
   }
});

// Função para pegar a opção selecionada do Select Departamentos
async function getSelectDepartments() {
   if (selectDepartments) {
      const values = selectDepartments.getValue(true);
      if (values && values.length === 0) {
         return undefined;
      } else {
         return values;
      }
   } else {
      return undefined;
   }
};

// Função para verificar se os campos estão preenchidos
async function getValuesFromInputs() {
   // Array com os names dos inputs que não devem ficar em branco e suas mensagens personalizadas
   let requiredInputFields = [
      { name: 'input-category-name', message: 'O campo NOME da CATEGORIA é obrigatório.' }
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
   // Array com os names dos selects que não devem ficar em branco e suas mensagens personalizadas
   let selectNames = [
      { name: 'selectDepartment', message: 'O campo DEPARTAMENTO é obrigatório.' },
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

// Click no botao de salvar
document.getElementById('btn-save').addEventListener('click', async function(e) {
   e.preventDefault();

   const selectDepartmentstValue = await getSelectDepartments();
   const inputCategoryName = document.getElementById('input-category-name').value;

   const inputsValid = await getValuesFromInputs();
   const selectsValid = await getValuesFromSelects();

   if (inputsValid && selectsValid) {
      const insertCategory = await makeRequest(`/api/product/createCategory`, 'POST', { departmentId: selectDepartmentstValue, name: inputCategoryName });
      window.close();
   }
   
})

// Função executada após toda a página ser executada
window.addEventListener("load", async () => {
   // const listAllDepartments = await makeRequest('/api/product/listAllDepartments', 'POST',);
   await createSelectWithChoices();
   await loadSelectDepartments();

   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')
})