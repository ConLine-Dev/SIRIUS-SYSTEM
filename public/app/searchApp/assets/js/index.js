
// Função para verificar se o tempo de login expirou
async function checkLoginExpiration() {

   // Verifica o localStorage para alterar a mensagem de boas vindas
   const StorageGoogleData = localStorage.getItem('StorageGoogle');
   const StorageGoogle = JSON.parse(StorageGoogleData);

   if (!localStorage.getItem('StorageGoogle')) {
      window.location.href = '/app/login';
   } else {
      document.querySelector('body').style.display = 'block'
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

async function loadAllApps(user){
   // carrega as unidades cadastradas (filiais)
   const AllApps = await makeRequest(`/api/system/listApp`, 'POST', user);

   let apps = '';
   for (let index = 0; index < AllApps.length; index++) {
      const element = AllApps[index];
      apps += ` <div class="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
                     <a href="${element.path}">
                        <div class="text-center p-3 related-app"> 
                           <span class="avatar avatar-sm avatar-rounded"> 
                           ${element.icon}
                           </span> 

                           <span class="d-block fs-12 no-break"><strong>${element.title}</strong> </span> 
                           <span class="d-block fs-10 no-break">${element.description} </span>
                        
                        </div>
                     </a>
               </div>`
   }

   document.querySelector('#listAllApp').innerHTML = apps


}


function normalizeString(str) {
   return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function searchItems() {
   const input = document.querySelector('.inputSearch');
   const filter = normalizeString(input.value);
   const listAllApp = document.getElementById('listAllApp');
   const items = listAllApp.getElementsByClassName('col-6');

   for (let i = 0; i < items.length; i++) {
       const item = items[i];
       const textContent = item.textContent || item.innerText;

       if (normalizeString(textContent).includes(filter)) {
           item.style.display = "";
       } else {
           item.style.display = "none";
       }
   }
}

// Exemplo no código do frontend (renderer process)
// const { ipcRenderer } = window;

// console.log(ipcRenderer)
// ipcRenderer.on('update-available', () => {
//   // Lidar com uma atualização disponível
//   console.log('Atualização disponível. Baixando...');
// });

// ipcRenderer.on('update-downloaded', () => {
//   // Lidar com uma atualização baixada e pronta para instalação
//   console.log('Atualização baixada. Reiniciando aplicativo para instalar...');
//   ipcRenderer.invoke('quit-and-install');
// });

// // Exemplo para verificar atualizações manualmente
// ipcRenderer.invoke('check-for-updates');

// localStorage.removeItem('StorageGoogle');
// localStorage.removeItem('loginTime');

// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {
   // inicio da função verificar tempo de carregamento da pagina e suas consultas no banco
   console.time(`A página "${document.title}" carregou em`)

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


   // const teste = await window.ipcRenderer.invoke('check-for-updates');

   // // Exemplo de uso no lado do cliente
   // const electron = window.electron;

   // // Ouvindo um evento chamado 'meu-evento'
   // electron.on('update-available', (arg) => {
   //    console.log('Evento recebido no lado do cliente:', arg);
   //    // Faça o que precisar com os dados recebidos
   // });

  

   // fim da função verificar tempo de carregamento da pagina e suas consultas no banco
   console.timeEnd(`A página "${document.title}" carregou em`);
})
      
