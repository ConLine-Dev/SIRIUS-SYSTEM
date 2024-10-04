const socket = io();

// Função para verificar se o tempo de login expirou
async function checkLoginExpiration() {

   // Verifica o localStorage para alterar a mensagem de boas vindas
   const StorageGoogleData = localStorage.getItem('StorageGoogle');
   const StorageGoogle = JSON.parse(StorageGoogleData);

   if (!localStorage.getItem('StorageGoogle')) {
      window.location.href = '/app/login';
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

async function loadAllApps(user) {
   // Carrega as unidades cadastradas (filiais)
   const AllApps = await makeRequest(`/api/system/listApp`, 'POST', user);
   console.log(AllApps);

   const appsByCategory = {};

   // Agrupa as aplicações por categoria
   AllApps.forEach(element => {
      const category = element.category_name;
      if (!appsByCategory[category]) {
         appsByCategory[category] = [];
      }
      appsByCategory[category].push(element);
   });

   let appsHTML = '';

   // Ordena as categorias por ordem alfabética
   const sortedCategories = Object.keys(appsByCategory).sort((a, b) => a.localeCompare(b));

   // Itera sobre as categorias ordenadas
   sortedCategories.forEach(category => {
      const apps = appsByCategory[category];

      // Ordena os aplicativos dentro da categoria por ordem alfabética
      apps.sort((a, b) => a.title.localeCompare(b.title));

      // Verifica se a categoria contém algum aplicativo
      if (apps.length > 0) {
         appsHTML += `<div class="fw-semibold mb-1 categoryName fs-12 ">${category}</div>`;


         // Itera sobre os aplicativos dentro da categoria
         apps.forEach(app => {
            appsHTML += `<div class="col-6 col-sm-4 col-md-3 col-lg-2 mb-2">
                           <a href="${app.path}">
                              <div class="text-center p-3 related-app"> 
                                 <span class="avatar avatar-sm"> 
                                 ${app.icon}
                                 </span> 

                                 <span class="d-block fs-12 no-break"><strong>${app.title}</strong> </span> 
                                 <span class="d-block fs-10 no-break">${app.description} </span>
                              
                              </div>
                           </a>
                        </div>`;
         });
      }
   });

   document.querySelector('#listAllApp').innerHTML = appsHTML;
}



function searchItems() {
   const input = document.querySelector('.inputSearch');
   const filter = normalizeString(input.value);
   const listAllApp = document.getElementById('listAllApp');
   const categories = listAllApp.getElementsByClassName('categoryName');

   for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      const nextSibling = category.nextElementSibling;
      const apps = [];

      // Agrupa os aplicativos pertencentes a essa categoria
      let sibling = nextSibling;
      while (sibling && sibling.classList.contains('col-6')) {
         apps.push(sibling);
         sibling = sibling.nextElementSibling;
      }

      let hasVisibleApp = false;

      // Verifica cada aplicativo dentro da categoria
      apps.forEach(app => {
         const textContent = app.textContent || app.innerText;
         if (normalizeString(textContent).includes(filter)) {
            app.style.display = "";  // Mostra o item se corresponder à pesquisa
            hasVisibleApp = true;    // Marca que há pelo menos um item visível
         } else {
            app.style.display = "none";  // Oculta o item se não corresponder
         }
      });

      // Se nenhum item dentro da categoria está visível, oculta a categoria
      if (hasVisibleApp) {
         category.style.display = "";  // Mostra a categoria se houver itens visíveis
      } else {
         category.style.display = "none";  // Oculta a categoria se não houver itens visíveis
      }
   }
}


function normalizeString(str) {
   return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {
   // inicio da função verificar tempo de carregamento da pagina e suas consultas no banco
   console.time(`A página "${document.title}" carregou em`)

   initLoaderMessages()
   await checkLoginExpiration()

   setInterval(async () => {
      await checkLoginExpiration()
   }, 1000);

   const StorageGoogle = await getInfosLogin();
   await setInfosLogin(StorageGoogle)

   // carrega aplicações que o usuario tem acesso
   await loadAllApps(StorageGoogle)
   const searchInput = document.querySelector('.inputSearch');
   searchInput.focus();


   let layoutSetting = document.querySelector(".layout-setting");
   layoutSetting?.addEventListener("click", toggleTheme);


   // fim da função verificar tempo de carregamento da pagina e suas consultas no banco
   console.timeEnd(`A página "${document.title}" carregou em`);

   // document.querySelector('#loader2').classList.add('d-none'); // Esconde o loader



   function showNotification() {
      const notification = new Notification("Edinho", {
         body: "Você tem uma nova notificação",
         icon: __dirname + '/logo/icone-sirius.ico',
         tag: 'soManyNotification',
         hasReply: true
      })
   }
   //  showNotification()

   //  console.log(Notification.permission)
   //  if (Notification.permission === "granted") {
   //    showNotification()
   //    //alert('we have permission');
   //  } else if (Notification.permission === "denied") {
   //    Notification.requestPermission()
   //  };

})


function initLoaderMessages() {
   const messages = [
      "Carregando recursos",
      "Verificando dados",
      "Quase lá",
      "Preparando a experiência",
      "Finalizando"
   ];

   let messageIndex = 0;
   const messageElement = document.getElementById('loader-message');

   // Função para atualizar a mensagem a cada 2 segundos
   function updateMessage() {
      if (!document.querySelector('#loader2')?.classList.contains('d-none')) {
         if (messageIndex < messages.length) {
            if(messageElement){
               messageElement.textContent = messages[messageIndex];
               messageIndex++;
            }
            
         }
      }
   }
   // Atualiza a mensagem a cada 2 segundos
   setInterval(updateMessage, 1500);
}

async function printSimplifiedCategories() {
   const simplifiedTicketCategories = await makeRequest('/api/user-tickets/simplifiedticketcategories');
   const divSimplifiedCategories = document.getElementById('simplifiedCategories');
   let printSimplifiedCategories = '';

   for (let index = 0; index < simplifiedTicketCategories.length; index++) {

      printSimplifiedCategories += `
           <div class="col-3">
               <a href="javascript:void(0);" class="border-0" onclick="printSimplifiedSubcategories(${simplifiedTicketCategories[index].id})">
                   <div class="list-group-item border-0">
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
                       <div class="list-group-item border-0">
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

      resetSimplifiedTicket();
   }
}

function resetSimplifiedTicket() {

   $('#add-simplified-task').modal('hide');
   document.getElementById('simplifiedDescription').value = "";

   const divSimplifiedSubcategories = document.getElementById('simplifiedSubcategories');
   let printSimplifiedSubcategories = '';

   printSimplifiedSubcategories = ``

   divSimplifiedSubcategories.innerHTML = printSimplifiedSubcategories;
}

async function getInfosLogin() {
   const StorageGoogleData = localStorage.getItem('StorageGoogle');
   const StorageGoogle = JSON.parse(StorageGoogleData);
   return StorageGoogle;
}


/* header theme toggle */
async function toggleTheme() {
   const user = await getInfosLogin()

   let html = document.querySelector("html");
   if (html.getAttribute("data-theme-mode") === "dark") {
      html.setAttribute("data-theme-mode", "light");
      html.setAttribute("data-header-styles", "light");
      html.setAttribute("data-menu-styles", "light");
      if (!localStorage.getItem("primaryRGB")) {
         html.setAttribute("style", "");
      }
      html.removeAttribute("data-bg-theme");
      document.querySelector("#switcher-light-theme").checked = true;
      document.querySelector("#switcher-menu-light").checked = true;
      document
         .querySelector("html")
         .style.removeProperty("--body-bg-rgb", localStorage.bodyBgRGB);
      checkOptions();
      html.style.removeProperty("--body-bg-rgb2");
      html.style.removeProperty("--light-rgb");
      html.style.removeProperty("--form-control-bg");
      html.style.removeProperty("--input-border");
      document.querySelector("#switcher-header-light").checked = true;
      document.querySelector("#switcher-menu-light").checked = true;
      document.querySelector("#switcher-light-theme").checked = true;
      document.querySelector("#switcher-background4").checked = false;
      document.querySelector("#switcher-background3").checked = false;
      document.querySelector("#switcher-background2").checked = false;
      document.querySelector("#switcher-background1").checked = false;
      document.querySelector("#switcher-background").checked = false;
      localStorage.removeItem("ynexdarktheme");
      localStorage.removeItem("ynexMenu");
      localStorage.removeItem("ynexHeader");
      localStorage.removeItem("bodylightRGB");
      localStorage.removeItem("bodyBgRGB");
      if (localStorage.getItem("ynexlayout") != "horizontal") {
         html.setAttribute("data-menu-styles", "dark");
      }
      html.setAttribute("data-header-styles", "light");


      window.electron.sendMessage('theme-changed', 'light');

   } else {
      html.setAttribute("data-theme-mode", "dark");
      html.setAttribute("data-header-styles", "dark");
      if (!localStorage.getItem("primaryRGB")) {
         html.setAttribute("style", "");
      }
      html.setAttribute("data-menu-styles", "dark");
      document.querySelector("#switcher-dark-theme").checked = true;
      document.querySelector("#switcher-menu-dark").checked = true;
      document.querySelector("#switcher-header-dark").checked = true;
      checkOptions();
      document.querySelector("#switcher-menu-dark").checked = true;
      document.querySelector("#switcher-header-dark").checked = true;
      document.querySelector("#switcher-dark-theme").checked = true;
      document.querySelector("#switcher-background4").checked = false;
      document.querySelector("#switcher-background3").checked = false;
      document.querySelector("#switcher-background2").checked = false;
      document.querySelector("#switcher-background1").checked = false;
      document.querySelector("#switcher-background").checked = false;
      localStorage.setItem("ynexdarktheme", "true");
      localStorage.setItem("ynexMenu", "dark");
      localStorage.setItem("ynexHeader", "dark");
      localStorage.removeItem("bodylightRGB");
      localStorage.removeItem("bodyBgRGB");


      window.electron.sendMessage('theme-changed', 'dark');
   }
}

async function redirectToTable() {

   const body = {
      url: `/app/searchApp/simplifiedTicket`,
      width: 500,
      height: 560,
      resizable: false
   }
   window.ipcRenderer.invoke('open-exWindow', body);
}


