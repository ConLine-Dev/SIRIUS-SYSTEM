/**
 * Desenvolvido por: Petryck William
 * GitHub: https://github.com/peewilliam
 */

/**
 * Verifica o localStorage para alterar a mensagem de boas vindas
 */
// Obtém os dados armazenados no localStorage sob a chave 'StorageGoogle'
const StorageGoogleData = localStorage.getItem('StorageGoogle');
// Converte os dados armazenados de JSON para um objeto JavaScript
const StorageGoogle = JSON.parse(StorageGoogleData);

// Variável
let toastCount = 0,commissionedID, commissionedName,commissionTotalProfitProcess,commissionType, commissionTotalComission,commissionLength, registerCommissionID;

/**
 * Evento que será disparado quando o DOM estiver completamente carregado,
 * mas antes que recursos adicionais (como imagens e folhas de estilo) sejam carregados.
 */
window.addEventListener("load", async () => {

    await listCollaborators();
    await events();
    
    document.querySelector('#loader2').classList.add('d-none')

})



async function events() {
    const listCollaborators = document.querySelector('.listCollaborators');
    
    // Remove todos os event listeners existentes
    const newElement = listCollaborators.cloneNode(true);
    listCollaborators.parentNode.replaceChild(newElement, listCollaborators);

    newElement.addEventListener('click', async function(e) {
        if (e.target && e.target.closest('li')) {
            const item = e.target.closest('li');
            const id = item.getAttribute('data-idHeadCargo');
            const list = document.querySelectorAll('.listCollaborators li');

            list.forEach(element => element.classList.remove('activeRef'));

            // await getRegisterById(id);
            item.classList.add('activeRef');
        }
    });
}


async function listCollaborators(){
    const getSales = await makeRequest(`/api/headcargo/user/ByDep/62`);
    const getInsideSales = await makeRequest(`/api/headcargo/user/ByDep/75`);

    const mergedArray = getSales.concat(getInsideSales);

    const uniqueArray = mergedArray.filter((item, index, self) => {
        return self.findIndex((t) => t.IdFuncionario === item.IdFuncionario) === index;
    });



    let history = ''

    for (let index = 0; index < uniqueArray.length; index++) {
        const element = uniqueArray[index];

        history += `<li class="list-group-item" data-idHeadCargo="${element.IdFuncionario}">
                        <div class="d-flex align-items-center justify-content-between  flex-wrap">
                            <div class="d-flex align-items-center gap-2">
                                <div> <span class="avatar bg-light"> <img src="https://cdn.conlinebr.com.br/colaboradores/${element.IdFuncionario}" alt=""> </span> </div>
                                <div> 
                                    <span class="d-block fw-semibold">${formatarNome(element.Nome)}</span> 
                                    <span class="d-block text-muted fs-12 fw-normal"></span>
                                </div>
                            </div>

                            <div> 
                                <span class="fs-12 text-muted">Referência</span> 
                                <span class="d-block text-muted fs-12 fw-normal"></span> 
                            </div>
                        </div>
                    </li>`
    }


  document.querySelector('.listCollaborators').innerHTML = history
}



function formatarNome(nome) {
    const preposicoes = new Set(["de", "do", "da", "dos", "das"]);
    const palavras = nome.split(" ");
    
    const palavrasFormatadas = palavras.map((palavra, index) => {
        // Se a palavra for uma preposição e não é a primeira palavra
        if (preposicoes.has(palavra.toLowerCase()) && index !== 0) {
            return palavra.toLowerCase();
        } else {
            return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
        }
    });
    
    return palavrasFormatadas.join(" ");
}


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
    toast.dataset.bsDelay = '5000'; // Define o atraso do toast para 5 segundos

    const toastHeader = document.createElement('div'); // Cria um novo elemento div para o cabeçalho do toast
    toastHeader.className = 'toast-header text-bg-danger'; // Define as classes do cabeçalho do toast
    toastHeader.innerHTML = `
        <strong class="me-auto">${title}</strong>
        <small>Agora mesmo</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    `; // Define o conteúdo HTML do cabeçalho do toast

    const toastBody = document.createElement('div'); // Cria um novo elemento div para o corpo do toast
    toastBody.className = 'toast-body'; // Define a classe do corpo do toast
    toastBody.innerText = text; // Define o texto do corpo do toast

    toast.appendChild(toastHeader); // Adiciona o cabeçalho ao toast
    toast.appendChild(toastBody); // Adiciona o corpo ao toast

    const toastContainer = document.getElementById('toast-container'); // Seleciona o contêiner de toasts
    toastContainer.appendChild(toast); // Adiciona o toast ao contêiner

    const bsToast = new bootstrap.Toast(toast); // Inicializa o toast com o Bootstrap
    bsToast.show(); // Exibe o toast

    toast.addEventListener('hidden.bs.toast', function() {
        toastContainer.removeChild(toast); // Remove o toast do DOM quando ele for ocultado
    });
}



