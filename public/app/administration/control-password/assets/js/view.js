// Variável para contar o número de toasts exibidos
let toastCount = 0, verifyGlobal = true;


// Função para pegar os dados do password
async function getPassword(id) {
    const Password = await makeRequest(`/api/control-password/getView`, 'POST', {id_password: id});

    document.querySelector('title[name="title"]').textContent = Password.title
    document.querySelector('input[name="login"]').value = Password.login
    document.querySelector('input[name="password"]').value = Password.password
    document.querySelector('input[name="link"]').value = Password.link
    document.querySelector('textarea[name="observation"]').value = Password.observation
} 

//Função para quando clicar nos botoes ao lado (copiar/visualizar/abrir navegador)
function eventClick() {
    const copy = document.querySelectorAll('.copy')
    for (let index = 0; index < copy.length; index++) {
        const element = copy[index];
        element.addEventListener('click', function(){

            const login = document.querySelector('input[name="login"]').value
            navigator.clipboard.writeText(login).then(function() {
                createToast('Copiado com sucesso'); // Exibe uma mensagem de sucesso 
            }).catch(function(error) {
                console.error("Falha ao copiar o texto: ", error);
            });
            
        })
    }

    const view = document.querySelectorAll('.view')
    for (let index = 0; index < view.length; index++) {
        const element = view[index];
        element.addEventListener('click', function(){
            const eyes = this.querySelector('i')
            if(eyes.classList.contains('ri-eye-off-line')){
                eyes.classList.remove('ri-eye-off-line')
                eyes.classList.add('ri-eye-line')
                document.querySelector('input[name="password"]').setAttribute('type', 'text')
            } else{
                eyes.classList.remove('ri-eye-line')
                eyes.classList.add('ri-eye-off-line')
                document.querySelector('input[name="password"]').setAttribute('type', 'password')
            }
        })
    }

    const link = document.querySelectorAll('.link')
    for (let index = 0; index < link.length; index++) {
        const element = link[index];
        element.addEventListener('click', function(){
            const navigator = document.querySelector('input[name="link"]').value
            window.ipcRenderer.invoke('external-link', 'https://www.google.com.br');

        
        })
        
    }
}


// Função para receber o id da pessoa que esta sendo aberta nesta janela
async function getPasswordInfo() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id');
    return id;
 };


/**
 * Função para criar um toast.
 * @param {string} title - Título do toast
 * @param {string} text - Texto do toast
 */
function createToast(title, text) {
    toastCount++; // Incrementa o contador de toasts
    const toast = document.createElement('div'); // Cria um novo elemento div para o toast
    toast.className = 'toast align-items-center border-0'; // Define as classes do toast
    toast.id = `toast-${toastCount}`; // Define o ID do toast
    toast.role = 'alert'; // Define o papel do toast como alerta
    toast.ariaLive = 'assertive'; // Define a propriedade aria-live como assertiva
    toast.ariaAtomic = 'true'; // Define a propriedade aria-atomic como true
    toast.dataset.bsDelay = '1000'; // Define o atraso do toast para 5 segundos

    const toastHeader = document.createElement('div'); // Cria um novo elemento div para o cabeçalho do toast
    toastHeader.className = 'tittle-notification text-bg-success'; // Define as classes do cabeçalho do toast
    toastHeader.innerHTML = `
        <center>${title}</center>
    `; // Define o conteúdo HTML do cabeçalho do toast

    toast.appendChild(toastHeader); // Adiciona o cabeçalho ao toast

    const toastContainer = document.getElementById('toast-container'); // Seleciona o contêiner de toasts
    toastContainer.appendChild(toast); // Adiciona o toast ao contêiner

    const bsToast = new bootstrap.Toast(toast); // Inicializa o toast com o Bootstrap
    bsToast.show(); // Exibe o toast

    toast.addEventListener('hidden.bs.toast', function() {
        toastContainer.removeChild(toast); // Remove o toast do DOM quando ele for ocultado
    });
} 

// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {
    const password_id = await getPasswordInfo()
    // carrega os dados da senha 
    await getPassword(password_id);

    eventClick()

    

    // remover loader
    document.querySelector('#loader2').classList.add('d-none');

    
})



