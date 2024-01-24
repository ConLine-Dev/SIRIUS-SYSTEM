// Função para verificar se o tempo de login expirou
function checkLoginExpiration() {

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

 checkLoginExpiration()