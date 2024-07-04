let daysOfProcess = 30, daysOfCotation = 30, Responsible = 'all';

// Inicialize o Web Worker (TENTEI FAZER UMA FORMA DIFERENTE PARA FAZER REQUISIÇÕES)
const worker = new Worker('./assets/js/worker.js');

/**
 * Função para carregar os dados de vendedores.
 */
function loadSales() {
    return new Promise((resolve, reject) => {
        worker.postMessage({
            url: `/api/headcargo/user/ByDep/62`
        });

        worker.addEventListener('message', function handler(event) {
            const { status, data, error } = event.data;

            if (status === 'success') {
                const options = data.map(sales => `<option value="${sales.IdFuncionario}">${formatarNome(sales.Nome)}</option>`);
                const optionDefault = `<option value="all" selected>Sem seleção</option>`;
                const listOfSales = document.getElementById('listOfSales');
                listOfSales.innerHTML = optionDefault + options.join('');

                $("#listOfSales").select2({
                    templateResult: formatState,
                    templateSelection: formatState,
                    placeholder: "Choose Customer"
                });

                $("#listOfSales").on('change', function(e) {
                    Responsible = this.value;
                });

                worker.removeEventListener('message', handler);
                resolve();
            } else {
                console.error('Erro ao carregar vendedores:', error);
                worker.removeEventListener('message', handler);
                reject(error);
            }
        });
    });
}

/**
 * Função para formatar o nome.
 * @param {string} nome - Nome a ser formatado
 * @returns {string} - Nome formatado
 */
function formatarNome(nome) {
    const preposicoes = new Set(["de", "do", "da", "dos", "das"]);
    const palavras = nome.split(" ");
    const palavrasFormatadas = palavras.map((palavra, index) => {
        if (preposicoes.has(palavra.toLowerCase()) && index !== 0) {
            return palavra.toLowerCase();
        } else {
            return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
        }
    });
    return palavrasFormatadas.join(" ");
}

/**
 * Função para formatar o estado.
 * @param {object} state - Estado a ser formatado
 * @returns {jQuery} - Elemento jQuery formatado
 */
function formatState(state) {
    if (!state.id) {
        return state.text;
    }
    const baseUrl = state.id === 'all' ? "../../assets/images/media/not-user.png" : `https://cdn.conlinebr.com.br/colaboradores/${state.id}`;
    const $state = $(
        `<span><img src="${baseUrl}" class="img-flag"> ${state.text}</span>`
    );
    return $state;
}

/**
 * Função para obter os filtros selecionados.
 * @returns {object} - Objeto contendo os filtros selecionados
 */
async function getFilters() {
    return {
        lastQuote: document.querySelector(`#activity_period_cotation`).value,
        lastProcess: document.querySelector(`#activity_period_process`).value,
        salesID: Responsible,
    };
}

/**
 * Função para enviar os filtros.
 */
async function submitFilter() {
    document.querySelector('#loader2').classList.remove('d-none');
    const filters = await getFilters();
    await generateTable(filters);
    document.querySelector('#loader2').classList.add('d-none');
}

/**
 * Função para gerar a tabela com os dados filtrados.
 * @param {object} filters - Filtros selecionados
 */
async function generateTable(filters) {
    return new Promise((resolve, reject) => {
        worker.postMessage({
            url: `/api/headcargo/inactive-clients-report/listAllClienteInactive`,
            method: 'POST',
            body: { filters }
        });

        worker.addEventListener('message', function handler(event) {
            const { status, data, error } = event.data;

            if (status === 'success') {
                if ($.fn.DataTable.isDataTable('#table-inactive-clients')) {
                    $('#table-inactive-clients').DataTable().destroy();
                }

                const table = $('#table-inactive-clients').DataTable({
                    dom: 'Bfrtip',
                    // responsive: true,
                    order: [[0, 'desc']],
                    data: data,
                    columns: [
                        { data: 'clientName' },
                        { data: 'responsible' },
                        { data: 'inside' },
                        { data: 'lastQuote' },
                        { data: 'lastProcess' },
                    ],
                    buttons: [
                        'excel', 'pdf'
                    ],
                    paging: false,
                    scrollX: true,
                    scrollY: '78vh',
                    pageInfo: false,
                    bInfo: false,
                    order: [[0, 'desc']],
                    language: {
                        url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
                        searchPlaceholder: 'Pesquisar...',
                    },
                    initComplete: function () {
                        requestAnimationFrame(() => {
                            resolve();
                        });
                    },
                    error: function (xhr, error, thrown) {
                        console.error('Erro ao inicializar o DataTable:', error);
                        requestAnimationFrame(() => {
                            reject(error);
                        });
                    }
                });



                worker.removeEventListener('message', handler);
            } else {
                console.error('Erro ao gerar a tabela:', error);
                worker.removeEventListener('message', handler);
                reject(error);
            }
        });
    });
}

/**
 * Evento que é disparado quando o conteúdo do DOM é carregado.
 */
document.addEventListener("DOMContentLoaded", async () => {
    await generateTable(); // Gera a tabela inicialmente
    await loadSales(); // Carrega os dados de vendedores

    document.querySelector('#loader2').classList.add('d-none'); // Oculta o loader
});
