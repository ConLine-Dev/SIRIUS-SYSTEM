window.onload = async function () {

   await checkLoginExpiration()

   setInterval(async () => {
      await checkLoginExpiration()
   }, 1000);

   const StorageGoogle = await getInfosLogin();
   await setInfosLogin(StorageGoogle)

   // console.log(window)
const teste = await window.ipcRenderer.invoke('check-for-updates'); 
console.log(teste)

// console.log(window.ipcRenderer)
// Exemplo de uso no lado do cliente
const electron = window.electron;

// Ouvindo um evento chamado 'meu-evento'
electron.on('update-available', (arg) => {
  console.log('Evento recebido no lado do cliente:', arg);
  // Faça o que precisar com os dados recebidos
});
 
}




// Função para verificar se o tempo de login expirou
async function checkLoginExpiration() {

    // Verifica o localStorage para alterar a mensagem de boas vindas
   const StorageGoogleData = localStorage.getItem('StorageGoogle');
   const StorageGoogle = JSON.parse(StorageGoogleData);
  
   if(!localStorage.getItem('StorageGoogle')) {
        window.location.href = '/app/login';
   }else{
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
async function getInfosLogin(){
     const StorageGoogleData = localStorage.getItem('StorageGoogle');
     const StorageGoogle = JSON.parse(StorageGoogleData);

     return StorageGoogle;
}

async function setInfosLogin(StorageGoogle){
   document.querySelectorAll('.imgUser').forEach(element => {
      element.src = StorageGoogle.picture
    });

    document.querySelectorAll('.UserName').forEach(element => {
      element.textContent = StorageGoogle.given_name.replace(/[^a-zA-Z\s]/g, '');
    });

    document.querySelectorAll('.buttonLogout').forEach(element => {
      element.addEventListener('click', function(e){
         e.preventDefault()

         localStorage.removeItem('StorageGoogle');
         localStorage.removeItem('loginTime');
   
         window.location.href = '/app/login'
      })

    });
    
    
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


