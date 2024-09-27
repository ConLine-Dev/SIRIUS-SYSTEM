// Função que cria o select para selecionar as categorias de pessoas
let selectProduct;
async function createSelectWithChoices() {
   // Inicialize o select de categoria de pessoa
   selectProduct = new Choices('#selectProduct', {
      allowHTML: true,
      allowSearch: true,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',
      noResultsText: 'Não há opções disponíveis'
   });
}

// Função para carregar as opções do banco de dados
async function loadSelectProduct() {
   // Definir uma opção inicial como 'Carregando...'
   selectProduct.setChoices([{
      value: '',
      label: 'Digite algo...',
      disabled: false
   }], 'value', 'label', true);

   try {
      document.querySelector('.choices__input--cloned').addEventListener('input', async function(e) {
         const inputValue = document.querySelector('.choices__input--cloned').value;

         if (inputValue.length >= 3) {
            const searchProduct = await makeRequest(`/api/stock/getTop5Products`, 'POST', {productName: inputValue});

            // Formatar o array para ser usado com o Choices.js
            const options = searchProduct.map(element => ({
               value: element.id,
               label: element.name
            }));
      
            // Atualiza as opções do Choices.js
            selectProduct.clearChoices(); // Limpa as opções anteriores
            selectProduct.setChoices(options, 'value', 'label', true); // Define as novas opções
         }
      })

   } catch (error) {
      // Lida com o erro se a chamada para o banco de dados falhar
      console.error('Erro ao carregar opções:', error);
      selectProduct.clearChoices(); // Limpa opções
      selectProduct.setChoices([{
         value: '',
         label: 'Erro ao carregar opções',
         disabled: true
      }], 'value', 'label', true);
   }
}

// Função para pegar a opção selecionada do Select Cidade
async function getSelectProduct() {
   if (selectProduct) {
      const values = selectProduct.getValue(true);
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
document.querySelector('#selectProduct').addEventListener('showDropdown', async function() {
   if (selectProduct.getValue(true).length === 0) {
      await loadSelectProduct();
   }
});

async function newProduct() {
   const body = {
       url: `/app/stock/new-product`,
       width: 700, 
       height: 600,
       resizable:false
   }
   window.ipcRenderer.invoke('open-exWindow', body);
};

document.getElementById('createProduct').addEventListener('click', async function(e) {
   e.preventDefault();
   await newProduct();
})

// Função executada após toda a página ser executada
window.addEventListener("load", async () => {
   await createSelectWithChoices();
   await loadSelectProduct();

   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')
})