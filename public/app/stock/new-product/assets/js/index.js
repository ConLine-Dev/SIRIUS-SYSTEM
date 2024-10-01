// Função para entrar na tela de entrada no estoque
async function newCategory() {
   const body = {
      url: `/app/stock/new-category`,
      width: 700, 
      height: 600,
      resizable:false
   }
   window.ipcRenderer.invoke('open-exWindow', body);
};

document.getElementById('createCategory').addEventListener('click', async function () {
      await newCategory();
});

// Função que cria o select para selecionar as categorias de pessoas
let selectCategory;
async function createSelectWithChoices() {
   // Inicialize o select de categoria de pessoa
   selectCategory = new Choices('#selectCategory', {
      allowHTML: false,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });
}

// Função para carregar as opções do banco de dados
async function loadSelectCategory() {
   // Definir uma opção inicial como 'Carregando...'
   selectCategory.setChoices([{
      value: '',
      label: 'Carregando...',
      disabled: false
   }], 'value', 'label', true);

   try {
      const listAllCategories = await makeRequest(`/api/product/listAllCategories`, 'POST');

      // Formatar o array para ser usado com o Choices.js
      const options = listAllCategories.map(element => ({
         value: element.id,
         label: element.name
      }));

      // Atualiza as opções do Choices.js
      selectCategory.clearChoices(); // Limpa as opções anteriores
      selectCategory.setChoices(options, 'value', 'label', true); // Define as novas opções

   } catch (error) {
      // Lida com o erro se a chamada para o banco de dados falhar
      console.error('Erro ao carregar opções:', error);
      selectCategory.clearChoices(); // Limpa opções
      selectCategory.setChoices([{
         value: '',
         label: 'Erro ao carregar opções',
         disabled: true
      }], 'value', 'label', true);
   }
}

// Adiciona um evento para carregar as opções quando o dropdown do select é exibido
document.querySelector('#selectCategory').addEventListener('showDropdown', async function() {
   if (selectCategory.getValue(true).length === 0) {
      await loadSelectCategory();
   }
});

// Função para pegar a opção selecionada do Select Categorias
async function getSelectCategory() {
   if (selectCategory) {
      const values = selectCategory.getValue(true);
      if (values && values.length === 0) {
         return undefined;
      } else {
         return values;
      }
   } else {
      return undefined;
   }
};

function allowOnlyNumbers(inputElement, maxLength) {
   inputElement.addEventListener('input', function(e) {
      // Remove todos os caracteres que não são números
      let value = this.value.replace(/\D/g, '');

      // Limita o número máximo de caracteres
      if (value.length > maxLength) {
         value = value.substring(0, maxLength);
      }

      // Atualiza o valor do campo com a nova string filtrada
      this.value = value;
   });
}

// Função para verificar se os campos estão preenchidos
async function getValuesFromInputs() {
   // Array com os names dos inputs que não devem ficar em branco e suas mensagens personalizadas
   let requiredInputFields = [
      { name: 'input-product-name', message: 'O campo NOME do PRODUTO é obrigatório.' }
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
      { name: 'selectCategory', message: 'O campo CATEGORIA é obrigatório.' },
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

   const selectCategoryValue = await getSelectCategory();
   const inputProductName = document.getElementById('input-product-name').value.trim();
   let inputNCM = document.getElementById('input-ncm').value.trim();
   !inputNCM ? inputNCM = null : inputNCM; // Se nao existir valor no NCM entao retorna null

   const textareaObservation = document.getElementById('textarea-observation').value.trim();
   !textareaObservation ? inputNCM = null : textareaObservation

   const inputsValid = await getValuesFromInputs();
   const selectsValid = await getValuesFromSelects();

   if (inputsValid && selectsValid) {
      const insertProduct = await makeRequest(`/api/product/createProduct`, 'POST', { name: inputProductName, ncm: inputNCM, categoryId: selectCategoryValue, textareaObservation});
      window.close();
   }
   
})

// Função executada após toda a página ser executada
window.addEventListener("load", async () => {
   const inputNCM = document.getElementById('input-ncm');
   allowOnlyNumbers(inputNCM, 8);

   await createSelectWithChoices();
   await loadSelectCategory();

   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')
})