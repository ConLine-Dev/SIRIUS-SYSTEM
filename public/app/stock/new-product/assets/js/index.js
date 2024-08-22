// Função para transformar todo texto em camel case
async function formatName(nome) {
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

// Função para formatar NCM
function formatNcm(value) {
   // Remove todos os caracteres não numéricos
   value = value.replace(/\D/g, '');

   // Limita o comprimento a 8 dígitos
   if (value.length > 8) {
       value = value.substring(0, 8);
   }

   // Verifica o comprimento para formatar para NCM
   if (value.length === 8) {
      // Formata como NCM: 0000.00.00
      return value.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3');
   }

   // Retorna o valor sem formatação se não houver 8 dígitos
   return value;
};

// Função para verificar se os campos estão preenchidos
async function getValuesFromInputs() {
   // Array com os names dos inputs que não devem ficar em branco e suas mensagens personalizadas
   let requiredInputFields = [
      { name: 'input-product', message: 'O campo Nome do Produto é obrigatório' },
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


async function eventClick() {
   // ========== VERIFICA PRODUTO CADASTRADO ========== //
   document.getElementById('input-product').addEventListener('input', async function (e) {
      e.preventDefault();
      let productName = this.value;
      
      if (productName.length >= 3) {
        const search = await makeRequest(`/api/stock/getTop5Products`, 'POST', { productName });
    
        let optionsContainer = document.getElementById('custom-options');
        optionsContainer.innerHTML = ''; // Limpa as opções atuais
    
        search.forEach(item => {
          const div = document.createElement('div');
          div.textContent = item.name;
          div.className = 'custom-option';
          div.addEventListener('click', () => {
            document.getElementById('input-product').value = item.name;
            optionsContainer.style.display = 'none';
          });
          optionsContainer.appendChild(div);
        });
    
        optionsContainer.style.display = 'block';
      }
    });
    
    document.addEventListener('click', function (e) {
      if (!document.querySelector('.custom-dropdown').contains(e.target)) {
        document.getElementById('custom-options').style.display = 'none';
      }
    });
    
   // ========== / VERIFICA PRODUTO CADASTRADO ========== //

   // ========== FORMATAR NCM ========== //
   document.getElementById('input-ncm').addEventListener('input', function(e) {
      e.preventDefault();

      this.value = formatNcm(this.value);
   })
   // ========== / FORMATAR NCM ========== //

   // ========== SALVAR NOVO PRODUTO ========== //
   document.getElementById('btn-save').addEventListener('click', async function(e) {
      e.preventDefault();
      let formBody = {};

      const inputProduct = await formatName(document.getElementById('input-product').value)
      const inputNcm = await formatName(document.getElementById('input-ncm').value)

      formBody.inputProduct = inputProduct;
      formBody.inputNcm = inputNcm.replace(/\D/g, '');
      
      const inputsValid = await getValuesFromInputs();
   
      if (inputsValid) {
         const insertSever = await makeRequest(`/api/stock/insertProduct`, 'POST', { formBody });
         window.close();
      }
   })
   // ========== / SALVAR NOVO PRODUTO ========== //
}

// Função executada após toda a página ser executada
window.addEventListener("load", async () => {

   await eventClick();

   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')
})