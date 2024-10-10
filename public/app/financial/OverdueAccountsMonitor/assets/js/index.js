const table = [];
let daysOfProcess = 30, daysOfCotation = 30, Responsible = 'all';

// Inicialize o Web Worker (TENTEI FAZER UMA FORMA DIFERENTE PARA FAZER REQUISIÇÕES)
const worker = new Worker('./assets/js/worker.js');



document.addEventListener("DOMContentLoaded", async () => {

    await generateTable()
    await loadSales();
    await eventsCliks()

    document.querySelector('#loader2').classList.add('d-none')
})

async function eventsCliks() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('processo-vencido')) {
            const id = e.target.getAttribute('data-id');
            e.preventDefault();
            // OpenOverdueInvoices(id);
        }

 
    })

    $('#table-overdue-accounts-monitor tbody').on('click', 'tr', function () {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
        }
        else {
            table['table-overdue-accounts-monitor'].$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
        }
    });

     // Vinculando o evento de pesquisa ao DataTable
     table['table-overdue-accounts-monitor'].on('search.dt', function() {
        calcularValorTotal(); // Chama a função ao realizar a pesquisa
    });
}

function formatarParaNumero(valor) {
    // Remove o símbolo "R$", os pontos de milhar e troca a vírgula decimal por ponto
    const valorFormatado = valor.replace('R$', '').replace('.', '').replace(',', '.').trim();
    // Converte a string para número float
    return parseFloat(valorFormatado);
}

// Função para calcular o valor total da coluna value_comission considerando apenas os itens visíveis da tabela
function calcularValorTotal() {
    let valorTotal = 0;
    table['table-overdue-accounts-monitor'].rows({ search: 'applied' }).data().each(function (row) {
        valorTotal += formatarParaNumero(row.Valor_Total);
    });


    const numeroRegistrosFiltrados = table['table-overdue-accounts-monitor'].rows({ search: 'applied' }).count();
    document.querySelector('.total-comisions').textContent = numeroRegistrosFiltrados;

    document.querySelector('.total-pay').textContent = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorTotal.toFixed(2));
}

/**
 * Obtém as informações de login do armazenamento local.
 * @returns {Object} As informações de login armazenadas.
 */
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;   
}


/**
 * Função assíncrona responsável por gerar a tabela de contas vencidas.
 * 
 * @returns {Promise<void>} Uma Promise vazia.
 */
async function generateTable(id = null, idresponsavel = null) {

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#table-overdue-accounts-monitor')) {
        $('#table-overdue-accounts-monitor').DataTable().destroy();
    }

    // console.log(id, idresponsavel)
    // Calcular a altura disponível dinamicamente
    const alturaDisponivel = window.innerHeight - document.querySelector('.card-header').offsetHeight

    const userLogged = await getInfosLogin()
    
    idresponsavel = idresponsavel == 0 ? null : idresponsavel;

    let where = ``;
    if(id != null){
        where = `id=`+id;
    }
    
    if(idresponsavel != null){
        where = `idresponsavel=`+idresponsavel; 
    }
    if(id != null && idresponsavel != null){
        where = `id=`+id+`&&idresponsavel=`+idresponsavel;
    }

 

    // Criar a nova tabela com os dados da API
    table['table-overdue-accounts-monitor'] =  $('#table-overdue-accounts-monitor').DataTable({
        dom: 'frtip',
        paging: false,  // Desativa a paginação
        fixedHeader: true, // Cabeçalho fixo
        info: false,
        scrollY: 'calc(100vh - 345px)',  // Define a altura dinamicamente
        scrollCollapse: false,  // Permite que a rolagem seja usada somente quando necessário
        order: [[0, 'asc']],
        ajax: {
            url: `/api/headcargo/commission/overdueInvoices?${where}`,
            method: 'GET',
            dataSrc: '',
        },
        columns: [
            { data: 'Pessoa',
                render: function (data, type, row) {
                    console.log(row)
                    const formattedName = capitalizeName(data);
                    const formattedNameVendedor = capitalizeName(row.Vendedor);
                    return `<div class="d-flex align-items-center">
                        <div class="avatar avatar-sm me-2 avatar-rounded">
                            <img src="https://cdn.conlinebr.com.br/colaboradores/${row.IdVendedor}" alt="">
                        </div>
                        <div>
                            <div class="lh-1">
                                <span data-id="${row.IdPessoa}" class="processo-vencido">${formattedName}</span>
                            </div>
                            <div class="lh-1">
                                <span class="fs-11 text-muted">Responsável: ${formattedNameVendedor}</span>
                            </div>
                        </div>
                    </div>`;
                },
            },
            { data: 'Numero_Processo' },
            { data: 'Dias_Vencidos' },
            { data: 'Valor_Total' },
        ],
        createdRow: function(row, data, dataIndex) {
           
        },
        buttons: [
            'excel', 'pdf', 'print'
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        },
    });

    // Espera o carregamento completo dos dados via AJAX
    table['table-overdue-accounts-monitor'].on('xhr.dt', function() {
        // Coloque aqui o código que precisa ser executado após os dados serem carregados
        document.querySelector('#table-overdue-accounts-monitor_filter input').focus()
    });

}

/**
 * Capitaliza um nome.
 * @param {string} name - O nome a ser capitalizado.
 * @returns {string} O nome capitalizado.
 */
function capitalizeName(name) {
    if (!name) {
        return '';
    }
    const words = name.toLowerCase().split(' ');
    const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
    return capitalizedWords.join(' ');
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


async function OpenOverdueInvoices(id) {
    const dados = await makeRequest(`/api/headcargo/commission/overdueInvoices?id=${id}`); // Faz uma requisição para filtrar a comissão
    console.log(dados)
    let invoices = ``;
    for (let index = 0; index < dados.length; index++) {
        const element = dados[index];
        invoices += ` 
        <tr>
            <td>${element.Numero_Processo}</td>
            <td class="text-danger">${element.Valor_Total}</td>
            <td>${element.Dias_Vencidos}</td>
            <td>${element.Pessoa}</td>
        </tr>`
    }

    document.querySelector('#table-OverdueInvoices').innerHTML = invoices; 

    $('#OverdueInvoicesModal').modal('show')
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
 * Carrega as vendas e popula o dropdown de vendedores.
 * 
 * @returns {Promise<void>} Uma promise que é resolvida quando as vendas são carregadas com sucesso.
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

                $("#listOfSales").on('change', async function(e) {
                    Responsible = this.value == 'all'  ? null : Number(this.value);
                    console.log(Responsible)
                    await generateTable(null, Responsible || Number(Responsible));
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

