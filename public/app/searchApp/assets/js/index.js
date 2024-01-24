window.onload = async function () {

   await checkLoginExpiration()
   const StorageGoogle = await getInfosLogin();
   await setInfosLogin(StorageGoogle)
   console.log(StorageGoogle)
}




// Função para verificar se o tempo de login expirou
async function checkLoginExpiration() {

    // Verifica o localStorage para alterar a mensagem de boas vindas
   const StorageGoogleData = localStorage.getItem('StorageGoogle');
   const StorageGoogle = JSON.parse(StorageGoogleData);
  
   if(!localStorage.getItem('StorageGoogle')) {
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





// localStorage.removeItem('StorageGoogle');
// localStorage.removeItem('loginTime');


