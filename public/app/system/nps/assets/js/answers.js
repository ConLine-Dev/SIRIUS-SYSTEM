const table = [];
// Variável para contar o número de toasts exibidos
let toastCount = 0, verifyGlobal = true;


// Esta função é executada quando o documento HTML é completamente carregado e analisado
document.addEventListener("DOMContentLoaded", async () => {

    await ListAllAnswers();
    await renderGradeAverage()
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


 async function ListAllAnswers() {
    // Criar a nova tabela com os dados da API
    table['table-answers'] = $('#table-answers').DataTable({
        dom: 'frtip',
        paging: false,  // Desativa a paginação
        fixedHeader: true, // Cabeçalho fixo
        info: false,
        scrollY: 'calc(100vh - 310px)',  // Define a altura dinamicamente
        scrollCollapse: false,  // Permite que a rolagem seja usada somente quando necessário
        order: [[0, 'asc']],
        ajax: {
            url: `/api/nps/answers`,
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
                                    <img src="${row.IdVendedor != 62195 && row.IdVendedor != null ? 'https://cdn.conlinebr.com.br/colaboradores/'+row.IdVendedor : '../../assets/images/brand-logos/mycon.svg'}" alt="">
                                </span>
                            </div>
                            <div>
                                <p class="fw-semibold mb-0">${row.nomeempresa}</p>
                                <p class="fs-12 text-muted mb-0">${row.name}</p>
                            </div>
                        </div>
                    `;
                },
                orderable: false, // Impede que a coluna seja ordenável
            },
            {
                data: 'p1',
                render: function (data, type, row) {
                    const className = data <= 3 ? 'text-danger' : 'text-success';
                    return `<span class="${className}">${data}</span>`;
                }
            },
            {
                data: 'p2',
                render: function (data, type, row) {
                    const className = data <= 3 ? 'text-danger' : 'text-success';
                    return `<span class="${className}">${data}</span>`;
                }
            },
            {
                data: 'p3',
                render: function (data, type, row) {
                    const className = data <= 3 ? 'text-danger' : 'text-success';
                    return `<span class="${className}">${data}</span>`;
                }
            },
            {
                data: 'satisfaction',
                render: function (data, type, row) {
                    const className = data == 0 ? 'text-danger' : 'text-success';
                    const text = data == 1 ? 'Satisfeito' : 'Insatisfeito';
                    return `<span class="${className}">${text}</span>`;
                }
            },
            {
                data: 'feedback',
                render: function (data, type, row) {
                    return `
                        <span class="feedback-limit" style="cursor: pointer;" data-text="${row.feedback}">
                            ${row.feedback}
                        </span>
                    `;
                }
            },
            {
                data: 'date',
                render: function (data, type, row) {
                    const date = new Date(data);
                    const formattedDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    return formattedDate;
                }
            }
        ],
        buttons: [
            'excel', 'pdf', 'print'
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        }
    });

    // Adicionar evento de pesquisa ao campo de input
    document.getElementById('search-client').addEventListener('keyup', function () {
        table['table-answers'].search(this.value).draw();
    });

    // Foco automático no input de pesquisa após o carregamento dos dados
    table['table-answers'].on('xhr.dt', function () {
        document.querySelector('#search-client').focus();
    });

    
    // Evento de clique para copiar o link
    document.addEventListener('click', function (e) {
        if (e.target.closest('.feedback-limit')) {
            const text = e.target.closest('.feedback-limit').getAttribute('data-text');
            if (text) {
                // Copiar o link para a área de transferência
            //    alert(text)
               Swal.fire(
                text,
                )
            }
        }
    });
}

async function renderGradeAverage(){
    const {npsResult, clientesAtivos} = await makeRequest(`/api/nps/dashboard`);
    const resultNotes = await calculateAverages(npsResult)

    document.querySelector('.noteComercial').textContent = resultNotes.comercial
    document.querySelector('.noteFinancial').textContent = resultNotes.financeiro
    document.querySelector('.noteOperational').textContent = resultNotes.operacional
    document.querySelector('.noteGeral').textContent = resultNotes.geralMedia

 }


 async function countDistinctClientsByIdEmpresa(npsResult) {
    // Usa um Set para armazenar IDs de empresas únicos
    const uniqueIdEmpresas = new Set();

    // Itera sobre o array npsResult
    for (let i = 0; i < npsResult.length; i++) {
        // Adiciona o idempresa ao Set, o que garante que apenas valores únicos serão armazenados
        uniqueIdEmpresas.add(npsResult[i].idempresa);
    }

    // O tamanho do Set representa o número de empresas distintas
    return uniqueIdEmpresas.size;
 }

 async function calculateAverages(npsResult) {
    // Variáveis para somar as notas de cada categoria
    let totalP1 = 0, totalP2 = 0, totalP3 = 0, totalSatisfaction = 0;
    const totalRespostas = npsResult.length;

    // Itera sobre o array npsResult para somar as notas
    for (let i = 0; i < totalRespostas; i++) {
        totalP1 += npsResult[i].p1 || 0; // Soma p1
        totalP2 += npsResult[i].p2 || 0; // Soma p2
        totalP3 += npsResult[i].p3 || 0; // Soma p3
    }

    // Calcula a média de cada categoria
    const p1Media = totalP1 / totalRespostas;
    const p2Media = totalP2 / totalRespostas;
    const p3Media = totalP3 / totalRespostas;
    const geralMedia = (p1Media+p2Media+p3Media) / 3;

    // Retorna as médias
    return {
        comercial: p1Media.toFixed(2),
        operacional: p2Media.toFixed(2),
        financeiro: p3Media.toFixed(2),
        geralMedia: geralMedia.toFixed(2)
    };
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


