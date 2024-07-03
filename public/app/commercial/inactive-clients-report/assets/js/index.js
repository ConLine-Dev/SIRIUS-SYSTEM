let daysOfProcess = 30, daysOfCotation = 30, Responsible = 'all';

/**
 * Função para carregar os dados de vendedores.
 */
async function loadSales() {
    const getSales = await makeRequest(`/api/headcargo/user/ByDep/62`); // Faz uma requisição para obter os dados de vendedores

    const options = getSales.map(sales => `<option value="${sales.IdFuncionario}">${formatarNome(sales.Nome)}</option>`); // Cria opções para cada vendedor
    const optionDefault = `<option value="all" selected>Sem seleção</option>`; // Cria uma opção padrão
    const listOfSales = document.getElementById('listOfSales'); // Seleciona o elemento de lista de vendedores
    listOfSales.innerHTML = optionDefault + options.join(''); // Define o conteúdo HTML da lista de vendedores

    $("#listOfSales").select2({
        templateResult: formatState, // Define o template para exibir as opções
        templateSelection: formatState, // Define o template para a seleção
        placeholder: "Choose Customer" // Define o placeholder
    });

    $("#listOfSales").on('change', async function(e) {
        Responsible = this.value; // Atualiza o valor de Responsible quando a seleção muda
    });
}

/**
 * Função para formatar o nome.
 * @param {string} nome - Nome a ser formatado
 * @returns {string} - Nome formatado
 */
function formatarNome(nome) {
    const preposicoes = new Set(["de", "do", "da", "dos", "das"]); // Conjunto de preposições
    const palavras = nome.split(" "); // Divide o nome em palavras
    const palavrasFormatadas = palavras.map((palavra, index) => {
        // Verifica se a palavra é uma preposição e não é a primeira palavra
        if (preposicoes.has(palavra.toLowerCase()) && index !== 0) {
            return palavra.toLowerCase(); // Retorna a palavra em minúsculas
        } else {
            return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase(); // Retorna a palavra com a primeira letra em maiúscula e o restante em minúsculas
        }
    });
    return palavrasFormatadas.join(" "); // Junta as palavras formatadas em uma string
}

/**
 * Função para formatar o estado.
 * @param {object} state - Estado a ser formatado
 * @returns {jQuery} - Elemento jQuery formatado
 */
function formatState(state) {
    if (!state.id) {
        return state.text; // Retorna o texto se o estado não tiver ID
    }
    const baseUrl = state.id === 'all' ? "../../assets/images/media/not-user.png" : `https://cdn.conlinebr.com.br/colaboradores/${state.id}`; // Define a URL da imagem
    const $state = $(
        `<span><img src="${baseUrl}" class="img-flag"> ${state.text}</span>` // Cria um elemento span com a imagem e o texto do estado
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
    document.querySelector('#loader2').classList.remove('d-none'); // Exibe o loader
    const filters = await getFilters(); // Obtém os filtros selecionados
    await generateTable(filters);
    document.querySelector('#loader2').classList.add('d-none');
}

/**
 * Função para gerar a tabela com os dados filtrados.
 * @param {object} filters - Filtros selecionados
 */
async function generateTable(filters) {
    return new Promise(async (resolve, reject) => {
        const dados = await makeRequest(`/api/headcargo/inactive-clients-report/listAllClienteInactive`, 'POST', { filters });

        // Esconder a tabela antes de destruir
        // $('#table-inactive-clients').hide();

        // Destruir a tabela existente, se houver
        if ($.fn.DataTable.isDataTable('#table-inactive-clients')) {
            $('#table-inactive-clients').DataTable().destroy();
        }

        // Criar a nova tabela com os dados da API
        const dataTable = $('#table-inactive-clients').DataTable({
            dom: 'Bfrtip',
            order: [[0, 'desc']],
            data: dados,
            columns: [
                { data: 'clientName' },
                { data: 'responsible' },
                { data: 'lastQuote' },
                { data: 'lastProcess' },
                // Adicione mais colunas conforme necessário
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
                // Após a inicialização completa do DataTables, mostrar a tabela e resolver a promessa
                // $('#table-inactive-clients').show();
                resolve();
            },
            error: function (xhr, error, thrown) {
                // Em caso de erro na inicialização do DataTables, rejeitar a promessa
                console.error('Erro ao inicializar o DataTable:', error);
                reject(error);
            }
        });

        // Retornar a instância do DataTables para manipulações futuras, se necessário
        return dataTable;
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
