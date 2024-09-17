// Verifica o localStorage para setar informações
async function getInfosLogin() {
   const StorageGoogleData = localStorage.getItem('StorageGoogle');
   const StorageGoogle = JSON.parse(StorageGoogleData);

   return StorageGoogle;
}

// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {

    printSimplifiedCategories()

   document.querySelector('#loader2').classList.add('d-none'); // Esconde o loader

})

async function printSimplifiedCategories() {
   const simplifiedTicketCategories = await makeRequest('/api/user-tickets/simplifiedticketcategories');
   const divSimplifiedCategories = document.getElementById('simplifiedCategories');
   let printSimplifiedCategories = '';

   for (let index = 0; index < simplifiedTicketCategories.length; index++) {

      printSimplifiedCategories += `
           <div class="col-3">
               <a href="javascript:void(0);" class="border-0" onclick="printSimplifiedSubcategories(${simplifiedTicketCategories[index].id})">
                   <div class="border-0">
                       <div class="d-flex align-items-start row">
                           <span class="transaction-icon card icon-square">
                               ${simplifiedTicketCategories[index].icon}
                               <span>${simplifiedTicketCategories[index].name}</span>
                           </span>
                       </div>
                   </div>
               </a>
           </div>`
   }
   divSimplifiedCategories.innerHTML = printSimplifiedCategories;
}

async function printSimplifiedSubcategories(category) {
   const simplifiedTicketSubcategories = await makeRequest('/api/user-tickets/simplifiedticketsubcategories');
   const divSimplifiedSubcategories = document.getElementById('simplifiedSubcategories');
   let printSimplifiedSubcategories = '';

   for (let index = 0; index < simplifiedTicketSubcategories.length; index++) {
      if (simplifiedTicketSubcategories[index].id_simplified_ticket_categories == category) {
         printSimplifiedSubcategories += `
               <div class="col-3">
                   <a href="javascript:void(0);" class="border-0">
                       <div class="border-0">
                           <div class="d-flex align-items-start row">
                               <span class="transaction-icon card icon-square simplified-ticket" data-name="${simplifiedTicketSubcategories[index].name}" id="${simplifiedTicketSubcategories[index].id}">
                                   ${simplifiedTicketSubcategories[index].icon}
                                   <span>${simplifiedTicketSubcategories[index].name}</span>
                               </span>
                           </div>
                       </div>
                   </a>
               </div>`
      }
   }
   divSimplifiedSubcategories.innerHTML = printSimplifiedSubcategories;

   selectSimplifiedTicket();
}

function selectSimplifiedTicket() {
   const buttons = document.querySelectorAll('.simplified-ticket');

   buttons.forEach(function (button) {
      button.addEventListener('click', function () {
         buttons.forEach(function (b) {
            b.classList.remove('selected-ticket');
         });
         this.classList.add('selected-ticket');
      });
   });
}

async function sendSimplificatedTicket() {

   const loginData = await getInfosLogin();
   const subCategory = document.querySelector('.selected-ticket');
   const idCollaborator = (loginData.system_collaborator_id).toString();

   if (subCategory) {
      const subCategoryId = subCategory.getAttribute('id');
      let description = document.querySelector('#simplifiedDescription').value;
      const categoryName = subCategory.getAttribute('data-name');

      const arraySimplifiedTicket = { subCategoryId, description, categoryName, idCollaborator };

      const ticket = await makeRequest('/api/user-tickets/create', 'POST', arraySimplifiedTicket);
   }
   window.close();
}

async function getInfosLogin() {
   const StorageGoogleData = localStorage.getItem('StorageGoogle');
   const StorageGoogle = JSON.parse(StorageGoogleData);
   return StorageGoogle;
}

