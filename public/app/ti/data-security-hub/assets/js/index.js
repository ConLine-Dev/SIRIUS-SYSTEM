/**
 * Inicialização da página
 * Carrega os dados, e esconde o loader após o carregamento.
 */
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadBackups();
        await loadDestinations();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }

    hideLoader();

    document.querySelector('#btnCloseDetail').addEventListener('click', () => document.querySelector('.selected-file-details').style.display = 'none');
});

/**
 * Função para ocultar o loader da página.
 */
function hideLoader() {
    document.querySelector('#loader2').classList.add('d-none');
}

/**
 * Função para carregar e exibir a lista de backups.
 */
async function loadBackups() {
    const backupsUrl = '/api/data-security-hub/backups';

    try {
        await renderBackupsTable();
    } catch (error) {
        console.error("Erro ao carregar backups:", error);
    }
}

/**
 * Função para renderizar a tabela de backups com DataTables.
 * @param {Array} backups - Lista de backups retornada pela API.
 */
async function renderBackupsTable() {
      // Inicializa o DataTables para exibir backups
      const table = $('#table_registers').DataTable({
        dom: 'frtip',  // Configuração dos elementos de DataTables: 'f' (search), 'r' (processing), 't' (table), 'i' (info), 'p' (pagination)
        paging: false,  // Desativa a paginação
        fixedHeader: true,  // Cabeçalho fixo
        info: false,
        scrollY: 'calc(100vh - 340px)',  // Altura dinâmica
        scrollCollapse: true,  // Habilita o scroll só quando necessário
        order: [[0, 'desc']],  // Define a ordenação inicial pela primeira coluna
        ajax: {
            url: '/api/data-security-hub/backups',  // URL da API
            dataSrc: ''  // A fonte de dados é a resposta JSON da API
        },
        columns: [
            { data: 'name' }, // Nome do backup
            { data: 'status' }, // Status do backup
            { data: 'size', render: (data) => `${data} TB` }, // Tamanho do backup com unidade
            { data: 'date', render: (data) => `<span class="badge bg-light text-dark">${formatarData(data)}</span>` } // Data formatada com badge
        ],
        createdRow: function(row, data) {
            // Adiciona atributo para capturar o ID
            $(row).attr('data-backup-id', data.id);

            // Adiciona evento para clique duplo, exibindo detalhes do backup
            $(row).on('click', function() {
                const backupId = $(this).data('backup-id');
                loadBackupDetails(backupId);  // Carrega os detalhes do backup ao dar duplo clique
            });
        },
        buttons: [
            'excel', 'pdf', 'print'  // Botões de exportação
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',  // Placeholder customizado para busca
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'  // URL do arquivo de tradução para português
        }
    });

    // Assumindo que 'table' é sua instância do DataTable
    table.on('xhr.dt', function() {
        // Espera o carregamento completo dos dados
        table.one('draw', function() {  // Usa 'one' para que ocorra apenas uma vez após o carregamento
            // Seleciona a primeira linha da tabela
            let firstRow = table.row(':eq(0)', { page: 'current' }).node();
            
            // Simula o clique na primeira linha
            if (firstRow) {
                $(firstRow).trigger('click');
            }
        });
        return true
    });


}


/**
 * Função para carregar e exibir os detalhes de um backup específico.
 * @param {number} backupId - ID do backup selecionado.
 */
async function loadBackupDetails(backupId) {
    const backupDetailsUrl = `/api/data-security-hub/backups/${backupId}`;

    try {
        const backup = await makeRequest(backupDetailsUrl, 'GET');
        displayBackupDetails(backup);
    } catch (error) {
        console.error("Erro ao carregar detalhes do backup:", error);
    }
}

/**
 * Função para exibir os detalhes de um backup na interface.
 * @param {Object} backup - Objeto contendo os detalhes do backup.
 */
function displayBackupDetails(backup) {
    document.querySelector('.selected-file-details').style.display = 'block';
    console.log(backup)
    document.querySelector('.filemanager-file-details .fileName').innerText = backup[0].name;
    document.querySelector('.filemanager-file-details .fileDetail').innerText = `${backup[0].size} TB | ${backup.length} arquivos | ${formatarData(backup[0].date)}`;
    document.querySelector('.filemanager-file-details .fileDescription').innerText = backup[0].description;
    document.querySelector('.filemanager-file-details .fileFormate').innerText = backup[0].file_format;
    document.querySelector('.filemanager-file-details .filelocation').innerText = backup[0].location;
}

/**
 * Função para carregar e exibir os destinos de backup.
 */
async function loadDestinations() {
    const destinationsUrl = '/api/data-security-hub/destinations';

    try {
        const destinations = await makeRequest(destinationsUrl, 'GET');
        renderDestinations(destinations);
    } catch (error) {
        console.error("Erro ao carregar destinos:", error);
    }
}

/**
 * Função para renderizar os destinos de backup na interface.
 * @param {Array} destinations - Lista de destinos retornada pela API.
 */
function renderDestinations(destinations) {
    const destinationsContainer = document.querySelector('.file-folders-container .row');
    destinationsContainer.innerHTML = ''; // Limpa o container

    destinations.forEach(destination => {
        const col = document.createElement('div');
        col.className = 'col-xxl-4 col-xl-4 col-lg-4 col-md-6';
        col.innerHTML = `
            <div class="card custom-card shadow-none bg-light">
                <div class="card-body p-3">
                    <a href="javascript:void(0);">
                        <div class="d-flex justify-content-between flex-wrap">
                            <div class="file-format-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" class="svg-primary" viewBox="0 0 24 24">
                                    <!-- Nuvem principal -->
                                    <path opacity="0.3" d="M12 4c-2.21 0-4 1.79-4 4 0 .34.04.68.1 1H8C5.79 9 4 10.79 4 13s1.79 4 4 4h8c2.21 0 4-1.79 4-4s-1.79-4-4-4h-.1c.06-.32.1-.66.1-1 0-2.21-1.79-4-4-4z"/>
                                    <path opacity="0.1" d="M20 13c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3s1.34-3 3-3h.09c.3-.7.88-1.28 1.59-1.57C9.47 7.67 10.67 7 12 7c1.66 0 3 1.34 3 3 0 .36-.07.7-.18 1.02-.1.3.05.63.35.72.31.1.63-.05.72-.35C15.89 10.56 16 9.8 16 9c0-2.76-2.24-5-5-5S6 6.24 6 9c0 1.02.31 1.98.87 2.79C7.15 12.04 8.04 13 9 13h8c1.1 0 2 .9 2 2z"/>
                                    <path opacity="1" d="M12 8l-3 3h2v3h2v-3h2l-3-3z"/>
                                </svg>
                            </div>
                            <div>
                                <span class="fw-semibold mb-1"> ${destination.destination_name} </span>
                                <span class="fs-10 d-block text-muted text-end"> ${destination.used_space}MB | ${destination.total_space}MB | ${destination.status}</span>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        `;
        destinationsContainer.appendChild(col);
    });
}

function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        // hour: '2-digit',
        // minute: '2-digit'
    });
}
