// Função lista todos os colaboradores 
async function listPeople(data) {
   const people = document.getElementById('listPeople');

   let html = '';

   //Essa funçao faz a busca no banco para puxar todos os colaboradores
   for (let i = 0; i < data.length; i++) {
       const item = data[i];

       html += `<li class="files-type" data-people-id="${item.id}">
                   <a href="javascript:void(0)">
                       <div class="d-flex align-items-center">
                           <span class="name flex-fill text-nowrap"> ${item.fantasy_name}</span>
                           <span class="name flex-fill text-nowrap"> ${item.cnpj_cpf}</span>
                       </div>
                   </a>
               </li>`
   }

   people.innerHTML = html;
}


// Função é executada quando for pesquisar e selecionar um colaborador  
function eventClick() {

   // ========== PESQUISA ========== //    
   const input_search = document.querySelector('#search');
   input_search.addEventListener('keyup', function (e) {
       e.preventDefault();
       let term_search = this.value.toLowerCase(); // Obtém o valor do input em maiúscula
       // Itera sobre os itens da lista e mostra/oculta com base no termo de pesquisa
       let list_items = document.querySelectorAll('.list-unstyled .files-type');
       list_items.forEach(function (item) {
           let textoItem = item.querySelector('.name').textContent.toLowerCase();

           // Verifica se o texto do item contém o termo de pesquisa
           if (textoItem.includes(term_search)) {
               item.style.display = 'block'; // Mostra o item
           } else {
               item.style.display = 'none'; // Oculta o item
           }
       });
   })
   // ========== FIM PESQUISA ========== // 


   // ========== SELEÇAO VENDEDOR ========== // 
   const sales_selected = document.querySelectorAll('.files-type')
   sales_selected.forEach(item => {
       item.addEventListener('click', async function () {
           sales_selected.forEach(selected => {
               selected.classList.remove('active')
           });

           item.classList.add('active')

           const collaborator_id = this.getAttribute('data-collaborator-id')
           const getProductCategoryByCollaborator = await makeRequest(`/api/product/getProductCategory/${collaborator_id}`, 'POST',);

           const img_cards = document.getElementById('img-cards')
           const cards = document.getElementById('cards')

           if (!img_cards.classList.contains('d-none')) {
               img_cards.classList.add('d-none')
               cards.classList.remove('d-none')
           }
       })
   });
   // ========== FIM SELEÇAO VENDEDOR ========== // 


}


// Função executada após toda a página ser executada
window.addEventListener("load", async () => {

   const getAllPeople = await makeRequest('/api/people/listAllPeople', 'POST',);

   await listPeople(getAllPeople)

   eventClick()


   // Tela de carregando 'add=quando vc fecha algo/remove=quando vc abre algo'
   document.querySelector('#loader2').classList.add('d-none')

})