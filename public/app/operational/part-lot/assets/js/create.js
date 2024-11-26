// Função para abrir uma nova janela
function openWindow(url, width, height) {
   // Alvo da janela (nova aba/janela)
   const target = '_blank';
 
   // Configurações da nova janela
   const features = `width=${width},height=${height},resizable=yes,scrollbars=yes,toolbar=no,menubar=no`;
 
   // Abrir a nova janela com os parâmetros definidos
   window.open(url, target, features);
};

// Função para listar todos os colaboradores
async function listUsers() {
   const users = await makeRequest(`/api/users/listAllUsers`);
   const divListUsers = document.querySelector('.listUsers');
   const searchInput = document.querySelector('.searchInput');

   divListUsers.innerHTML = '';
   let userHTML = '';

   for (let i = 0; i < users.length; i++) {
       const item = users[i];

       userHTML += `<li class="list-group-item" data_userid="${item.userID}" data-username="${item.username.toLowerCase()} ${item.familyName.toLowerCase()}">
                       <div class="d-flex align-items-center justify-content-between flex-wrap">
                           <div class="d-flex align-items-center gap-2">
                               <div> <span class="avatar bg-light"> <img src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt=""> </span> </div>
                               <div> 
                                   <span class="d-block fw-normal">${item.username} ${item.familyName}<i class="bi bi-patch-check-fill text-secondary ms-2"></i></span>   
                               </div>
                           </div>
                       </div>
                   </li>`;
   }

   divListUsers.innerHTML = userHTML;

   // Adiciona o evento de input para filtrar usuários
   searchInput.addEventListener('input', function () {
      const searchTerm = this.value.toLowerCase();
      const listItems = divListUsers.querySelectorAll('.list-group-item');

      listItems.forEach(item => {
         const username = item.getAttribute('data-username');
         if (username.includes(searchTerm)) {
            item.style.display = ''; // Mostra o item
         } else {
            item.style.display = 'none'; // Esconde o item
         }
      });
   });
};

// Função para exibir os detalhes abaixo dos descontos
function toggleDetails(button) {
   const detailsRow = button.closest("tr").nextElementSibling;
   const icon = button.querySelector("i");

   if (detailsRow.style.display === "none" || !detailsRow.style.display) {
     detailsRow.style.display = "table-row"; // Exibe a linha de detalhes
     icon.classList.remove("ri-eye-close-line"); // Alterna o ícone para "olho aberto"
     icon.classList.add("ri-eye-line");
   } else {
     detailsRow.style.display = "none"; // Oculta a linha de detalhes
     icon.classList.remove("ri-eye-line"); // Alterna o ícone para "olho fechado"
     icon.classList.add("ri-eye-close-line");
   }
};
 
document.addEventListener("DOMContentLoaded", async () => {

   // await listUsers();
   document.querySelector('#loader2').classList.add('d-none');
});