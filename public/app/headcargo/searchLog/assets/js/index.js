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

// Variável para contar o número de toasts exibidos
let toastCount = 0, verifyGlobal = true;

/**
 * Evento que será disparado quando o DOM estiver completamente carregado,
 * mas antes que recursos adicionais (como imagens e folhas de estilo) sejam carregados.
 */
document.addEventListener("DOMContentLoaded", async () => {
    // Esconder o loader
    document.querySelector('#loader2').classList.add('d-none');
});







/**
 * Função para submeter a comissão.
 */
async function submitCommission() {
    document.querySelector('#loader2').classList.remove('d-none'); // Exibe o loader

    
    const filters = {
        dataAte: document.querySelector('#dataAte').value,
        dataDe: document.querySelector('#dataDe').value,
        tabela: document.querySelector('#tabela').value,
        coluna: document.querySelector('#coluna').value,
        valor: document.querySelector('#valor').value,
    }

    console.log(filters)
    const dados = await makeRequest(`/api/headcargo/searchLog/filter`, 'POST', { filters });
    console.log(dados)




    tables['table_commission_commercial'] = $('#table_commission_commercial').DataTable({
        paging: false,
        scrollX: true,
        scrollY: '60vh',
        pageInfo: false,
        bInfo: false,
        order: [[0, 'desc']],
        data: dados, // Define os dados da tabela
        columns: [
            { data: 'Usuario' }, // Coluna de modal
            { data: 'Data_Inicio_Transacao' }, // Coluna de processo
            { data: 'Data_Termino_Transacao' }, // Coluna de abertura
            { data: 'Tempo_Transacao' }, // Coluna de data de compensação
            { data: 'Usuario_Windows' }, // Coluna de tipo
            { data: 'Computador' }, // Coluna de cliente
            { data: 'Tabela' }, // Coluna de vendedor
            { data: 'Tipo' }, // Coluna de inside
            { data: 'Data' }, // Coluna de importador
            { data: 'Indice' }, // Coluna de exportador
            { data: 'Campos' }, // Coluna de comissão de vendedor
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
            searchPlaceholder: 'Pesquisar...',
            Search: '',
        }
    });

    document.querySelector('#loader2').classList.add('d-none'); // Esconde o loader

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
