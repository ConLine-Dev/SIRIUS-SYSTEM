const table = [];
// Variável para contar o número de toasts exibidos
let toastCount = 0, verifyGlobal = true;


// Esta função é executada quando o documento HTML é completamente carregado e analisado
document.addEventListener("DOMContentLoaded", async () => {

    await ListAllClients();
    document.querySelector('#loader2').classList.add('d-none')

})

// Verifica informações no localStorage do usuario logado
// Esta função recupera e retorna os dados armazenados localmente relacionados ao login do Google.
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;   
}



// Função que envia para a proxima janela o id da senha clicada
async function openPassword(id) {
    const body = {
        url: `/app/administration/control-password/view?id=${id}`,
        width: 500,
        height: 420,
        resizable: false,
        alwaysOnTop: true
    }
    window.ipcRenderer.invoke('open-exWindow', body);
 };


 async function ListAllClients() {
    // Criar a nova tabela com os dados da API
    table['table_nps_clients'] = $('#table_nps_clients').DataTable({
        dom: 'frtip',
        paging: false,  // Desativa a paginação
        fixedHeader: true, // Cabeçalho fixo
        info: false,
        scrollY: 'calc(100vh - 180px)',  // Define a altura dinamicamente
        scrollCollapse: false,  // Permite que a rolagem seja usada somente quando necessário
        order: [[0, 'asc']],
        ajax: {
            url: `/api/nps/clients`,
            dataSrc: ''
        },
        columns: [
            {
                data: null, // Esta coluna não vai buscar dados diretamente
                render: function (data, type, row) {
                    return `
                        <div class="d-flex align-items-center">
                            <div class="me-2">
                                <span class="avatar avatar-md p-1 bg-light avatar-rounded">
                                    <img src="${row.IdVendedor != 62195 && row.IdVendedor != null ? row.ImgVendedor : '../../assets/images/brand-logos/mycon.svg'}" alt="">
                                </span>
                            </div>
                            <div>
                                <p class="fw-semibold mb-0">${row.Nome}</p>
                                <p class="fs-12 text-muted mb-0">${row.nomeSirius}</p>
                            </div>
                        </div>
                    `;
                },
                orderable: false, // Impede que a coluna seja ordenável
            },
            { data: 'Cpf_Cnpj' },
            { data: 'Link' }, // Aqui é onde o link será exibido na tabela
            {
                data: null, // Esta coluna não vai buscar dados diretamente
                render: function (data, type, row) {
                    return `
                        <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-secondary-light copy-link" data-link="${row.Link}" title="Copiar Link">
                            <i class="ri-file-copy-2-fill"></i>
                        </a>
                    `;
                },
                orderable: false, // Impede que a coluna seja ordenável
            },
        ],
        buttons: [
            'excel', 'pdf', 'print'
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        },
    });

    // Adicionar evento de pesquisa ao campo de input
    document.getElementById('search-client').addEventListener('keyup', function () {
        table['table_nps_clients'].search(this.value).draw();
    });

    // Foco automático no input de pesquisa após o carregamento dos dados
    table['table_nps_clients'].on('xhr.dt', function () {
        document.querySelector('#search-client').focus();
    });

    // Evento de clique para copiar o link
    document.addEventListener('click', function (e) {
        if (e.target.closest('.copy-link')) {
            const link = e.target.closest('.copy-link').getAttribute('data-link');
            if (link) {
                // Copiar o link para a área de transferência
                navigator.clipboard.writeText(link).then(() => {
                    createToast('Sucesso', 'Link copiado com sucesso!')
                    // alert('Link copiado: ' + link);  // Alerta ou notificação de sucesso
                }).catch(err => {
                    console.error('Erro ao copiar o link:', err);
                });
            }
        }
    });
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


