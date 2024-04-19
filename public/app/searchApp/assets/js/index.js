
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
      apps += `<div class="col-xxl-3 col-xl-3 col-lg-3 col-md-3">
                  <div class="card custom-card shadow-none bg-light">
                     <div class="card-body p-3">
                        <a href="${element.path}">
                              <div class="d-flex justify-content-between flex-wrap">
                                 <div class="file-format-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="svg-success" enable-background="new 0 0 24 24" viewBox="0 0 24 24">
                                          <circle cx="12" cy="4" r="2" opacity="0.3"></circle>
                                          <path fill="#b7d7fd" d="M12 6a1.98 1.98 0 0 1-1-.277V8a1 1 0 0 0 2 0V5.723A1.98 1.98 0 0 1 12 6z"></path>
                                          <path opacity="0.3" d="M17 22H7a3.003 3.003 0 0 1-3-3v-9a3.003 3.003 0 0 1 3-3h10a3.003 3.003 0 0 1 3 3v9a3.003 3.003 0 0 1-3 3z"></path>
                                          <path opacity="1" d="M14.97 12.243 16.28 7H7.72l1.31 5.243A1 1 0 0 0 10 13h4a1 1 0 0 0 .97-.757z"></path>
                                          <path fill="#b7d7fd" d="M2 18a1 1 0 0 1-1-1v-2a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1zm20 0a1 1 0 0 1-1-1v-2a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1z"></path>
                                          <circle cx="9" cy="16" r="1" opacity="1"></circle>
                                          <circle cx="15" cy="16" r="1" opacity="1"></circle>
                                    </svg>
                                 </div>
                                 <div> <span class="fw-semibold mb-1"> ${element.title} </span> <span class="fs-10 d-block text-muted text-end"> ${element.description} </span> </div>
                              </div>
                        </a>
                     </div>
                  </div>
            </div>`
   }

   document.querySelector('#listAllApp').innerHTML = apps


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

   const teste = await window.ipcRenderer.invoke('check-for-updates');

   // Exemplo de uso no lado do cliente
   const electron = window.electron;

   // Ouvindo um evento chamado 'meu-evento'
   electron.on('update-available', (arg) => {
      console.log('Evento recebido no lado do cliente:', arg);
      // Faça o que precisar com os dados recebidos
   });

   // fim da função verificar tempo de carregamento da pagina e suas consultas no banco
   console.timeEnd(`A página "${document.title}" carregou em`);
})
      
