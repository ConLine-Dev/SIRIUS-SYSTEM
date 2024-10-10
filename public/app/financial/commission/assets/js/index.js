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
    // Carregar os recursos necessários
    await loadAssets();
    // Configurar eventos de clique
    await eventsCliks();
    // Definir a data padrão do filtro
    await setDateDefaultFilter();

    // Inicializar DataTable se não estiver já inicializado
    if (!tables['table_commission_commercial']) {
        // Configura a tabela com DataTable
        tables['table_commission_commercial'] = $('#table_commission_commercial').DataTable({
            layout: {
                topStart: {
                    buttons: [
                        // {
                        //     text: ' <i class="ri-file-list-2-line label-btn-icon me-2"></i> Salvar Registro',
                        //     className: 'btn btn-primary label-btn btn-table-custom',
                        //     enabled: false,
                        //     action: function (e, dt, node, config) {
                        //         // Ação a ser executada ao clicar no botão
                        //     }
                        // }
                    ]
                }
            },
            paging: false,
            scrollX: true,
            scrollY: '60vh',
            pageInfo: false,
            bInfo: false,
            order: [[0, 'desc']],
            language: {
                url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
                searchPlaceholder: 'Pesquisar...',
                Search: '',
            }
        });
    }

    // Esconder o loader
    document.querySelector('#loader2').classList.add('d-none');


    $('#staticBackdrop').modal('show')


});

/**
 * Função para definir a data padrão do filtro.
 */
async function setDateDefaultFilter() {
    /**
     * Função para formatar a data no formato YYYY-MM-DD
     * @param {Date} date - Objeto de data a ser formatado
     * @returns {string} - Data formatada como YYYY-MM-DD
     */
    function formatDate(date) {
        const year = date.getFullYear(); // Obtém o ano
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Obtém o mês (0-indexado) e adiciona um zero à esquerda se necessário
        const day = String(date.getDate()).padStart(2, '0'); // Obtém o dia e adiciona um zero à esquerda se necessário
        return `${year}-${month}-${day}`; // Retorna a data formatada como YYYY-MM-DD
    }

    const currentDate = new Date(); // Cria um novo objeto de data para a data atual
    const startOfYearDate = new Date(currentDate.getFullYear(), 0, 1); // Cria um novo objeto de data para o primeiro dia do ano

    const formattedCurrentDate = formatDate(currentDate); // Formata a data atual
    const formattedStartOfYearDate = formatDate(startOfYearDate); // Formata a data do primeiro dia do ano

    document.getElementById('dataDe').value = formattedStartOfYearDate; // Define o valor do input 'dataDe' com a data formatada do primeiro dia do ano
    document.getElementById('dataAte').value = formattedCurrentDate; // Define o valor do input 'dataAte' com a data formatada atual
}

/**
 * Função para carregar os recursos necessários.
 */
async function loadAssets() {
    await loadSales(); // Carrega os dados de vendas
    await loadInsideSales(); // Carrega os dados de vendas internas
}

/**
 * Função para obter os filtros selecionados.
 */
async function getFilters() {
    // Obtém os valores dos checkboxes selecionados para cada categoria de filtro
    const recebimentoList = getCheckedValues('.recebimento');
    const ComissaoAgenteList = getCheckedValues('.ComissaoAgente');
    const pagamentoList = getCheckedValues('.pagamento');
    const comissao_vendedorList = getCheckedValues('.comissao_vendedor');
    const comissao_insideList = getCheckedValues('.comissao_inside');
    const modalidadeList = getCheckedValues('.modalidade');

    // Valida se ao menos uma opção de cada categoria foi selecionada
    if (!validateFilters(recebimentoList, ComissaoAgenteList, pagamentoList, comissao_vendedorList, comissao_insideList, modalidadeList)) {
        return false;
    }

    // Obtém os valores dos inputs de data e das seleções de vendedores
    const dataDeValue = dataDe.value;
    const dataAteValue = dataAte.value;
    const vendedorIDValue = listOfSales.value;
    const insideIDValue = listOfInside.value;

    // Verifica se os inputs de data foram preenchidos
    if (!dataDeValue || !dataAteValue) {
        Swal.fire(
            'Atenção',
            "Por favor, preencha 'De' e 'Até' com base da data de compensação que deseja filtrar.",
            'error'
            )
        return false;
    }

    // Verifica se ao menos um vendedor ou um inside foi selecionado
    if (vendedorIDValue === '000' && insideIDValue === '000') {
        Swal.fire(
            'Atenção',
            "Por favor, selecione um 'Vendedor' ou 'Inside' para ser comissionado.",
            'error'
            )
        return false;
    }

    // Retorna um objeto contendo todos os filtros selecionados
    return {
        dataDe: dataDeValue,
        dataAte: dataAteValue,
        vendedorID: vendedorIDValue,
        InsideID: insideIDValue,
        recebimento: recebimentoList,
        pagamento: pagamentoList,
        ComissaoAgente: ComissaoAgenteList,
        comissaoVendedor: comissao_vendedorList,
        ComissaoInside: comissao_insideList,
        modalidade: modalidadeList,
    };
}

/**
 * Função para selecionar a comissão de um usuário.
 * @param {string} id - ID do usuário
 * @param {string} Name - Nome do usuário
 * @param {string} typeText - Tipo de usuário (Vendedor ou Inside)
 */
async function selectUserComission(id, Name, typeText) {
    const img = document.querySelector('.imgComissionado'); // Seleciona o elemento da imagem do comissionado
    const name = document.querySelector('.nameComissionado'); // Seleciona o elemento do nome do comissionado
    const type = document.querySelector('.typeComission'); // Seleciona o elemento do tipo de comissão

    type.textContent = ` [${typeText}]`; // Define o texto do tipo de comissão
    name.textContent = Name; // Define o texto do nome do comissionado
    img.innerHTML = ''; // Limpa o conteúdo do elemento da imagem
    img.style.backgroundImage = `url(https://cdn.conlinebr.com.br/colaboradores/${id})`; // Define a imagem de fundo com a URL do colaborador
    img.style.backgroundPosition = 'center'; // Centraliza a imagem de fundo
    img.style.backgroundSize = 'cover'; // Ajusta a imagem de fundo para cobrir todo o elemento
}

/**
 * Função para submeter a comissão.
 */
async function submitCommission() {
    document.querySelector('#loader2').classList.remove('d-none'); // Exibe o loader
    const filters = await getFilters(); // Obtém os filtros selecionados
    if (!filters) {
        document.querySelector('#loader2').classList.add('d-none'); // Esconde o loader se os filtros não forem válidos
        return false;
    }

    const verify = await makeRequest(`/api/headcargo/commission/verifyRegisters`, 'POST', { filters });


    const dados = await makeRequest(`/api/headcargo/commission/filterComission`, 'POST', { filters }); // Faz uma requisição para filtrar a comissão
    
    const idvalue = listOfSales.value !== '000' ? listOfSales : listOfInside; // Define o elemento ID com base na seleção
    const typeSales = listOfSales.value !== '000' ? 'Vendedor' : 'Inside'; // Define o tipo de vendas
    const typeID = listOfSales.value !== '000' ? 0 : 1; // Define o tipo de ID (0 para Vendedor, 1 para Inside)

    const selectedValue = idvalue.value; // Obtém o valor selecionado
    const selectedText = idvalue.options[idvalue.selectedIndex].text; // Obtém o texto selecionado

    const user = {
        name: selectedText,
        id: selectedValue,
        type: typeID,
        userLog: StorageGoogle.system_userID,
        collabId: StorageGoogle.system_collaborator_id,
    }; // Cria um objeto usuário com os detalhes selecionados

    await selectUserComission(selectedValue, selectedText, typeSales); // Seleciona a comissão do usuário

    
    
    document.querySelector('.percentagem_processo').textContent = dados.percentagem +'%';
    // document.querySelector('.total_profit_estimado').textContent = dados.valor_Estimado_total;
    document.querySelector('.total_profit').textContent = dados.valor_Efetivo_total; // Atualiza o total de lucro
    document.querySelector('.quantidade_processo').textContent = dados.quantidade_processo; // Atualiza a quantidade de processos
    document.querySelector('.valor_Comissao_total').textContent = dados.valor_Comissao_total; // Atualiza o valor total da comissão

    if ($.fn.DataTable.isDataTable('#table_commission_commercial')) {
        $('#table_commission_commercial').DataTable().destroy(); // Destrói a tabela DataTable existente
    }



  
    const verifyPercentageComission = await makeRequest(`/api/headcargo/commission/verifyPercentageComission`, 'POST', { id:selectedValue });
    console.log(verifyPercentageComission)
    // document.querySelector('.btn_salvarRegistro').setAttribute('disabled', true);


    tables['table_commission_commercial'] = $('#table_commission_commercial').DataTable({
        layout: {
            topStart: {
                buttons: [
                    {
                        text: '<i class="ri-check-double-line label-btn-icon me-2"></i> Gerar Registro',
                        className: 'btn btn-success label-btn btn-table-custom btn_salvarRegistro',
                        enabled: verify && verifyPercentageComission,
                        action: async function (e, dt, node, config) {
                            Swal.fire({
                                title: 'Gerar Registro de Comissão?',
                                text: "Você tem certeza, isso não poderá ser desfeito!",
                                icon: 'question',
                                showCancelButton: true,
                                confirmButtonColor: '#3085d6',
                                cancelButtonColor: '#d33',
                                confirmButtonText: 'Sim, realizar registro!'
                            }).then(async (result) => {
                                if (result.isConfirmed) {

                                    await createRegister(typeID, { de: filters.dataDe, ate: filters.dataAte }, user); // Cria um novo registro ao clicar no botão
                                    // Swal.fire(
                                    //     'Registro',
                                    //     'Registro efetuado com sucesso, consulte no módulo de registros.',
                                    //     'success'
                                    // )
                                }
                            })
                            
                        }
                    }
                ]
            }
        },
        paging: false,
        scrollX: true,
        scrollY: '60vh',
        pageInfo: false,
        bInfo: false,
        order: [[0, 'desc']],
        data: dados.data, // Define os dados da tabela
        columns: [
            { data: 'check', orderable: false }, // Coluna de checkbox
            {
                class: 'financial-detail',
                orderable: false,
                data: null,
                defaultContent: '<i class="ri ri-eye-fill"></i>'
            },
            { data: 'modal'}, // Coluna de modal
            { data: 'processo',
                render: function(data, type, row) {
                    if (row.fatura_quant_vencidas > 0) {
                        return '<span data-id="'+row.fatura_pessoa_fatura+'" class="processo-vencido fw-bold">' + data + '</span>';
                    } else {
                        return data;
                    }
                } 
            }, // Coluna de processo
            { data: 'abertura' }, // Coluna de abertura
            { data: 'data_compensacao' }, // Coluna de data de compensação
            { data: 'tipo' }, // Coluna de tipo
            { data: 'cliente' }, // Coluna de cliente
            { data: 'vendedor' }, // Coluna de vendedor
            { data: 'inside' }, // Coluna de inside
            { data: 'importador' }, // Coluna de importador
            { data: 'exportador' }, // Coluna de exportador
            { data: 'comissao_vendedor' }, // Coluna de comissão de vendedor
            { data: 'comissao_inside' }, // Coluna de comissão de inside
            { data: 'estimado' }, // Coluna de valor estimado
            { data: 'efetivo' }, // Coluna de valor efetivo
            { data: 'restante' }, // Coluna de valor restante
            { data: 'valorComissao' }, // Coluna de valor valorComissao
            { data: 'IdLogistica_House', visible: false },  // Coluna de IdLogistica_House
        ],
        rowCallback: function(row, data, index) {

            if(data.Incentivo == 1){
                $(row).find('td').addClass('bd-yellow-500'); // Adiciona a classe 'bg-warning' a todas as colunas da linha
            }
            
            if(data.fatura_quant_vencidas > 0){
                $(row).find('td').addClass('bd-red-500'); // Adiciona a classe 'bg-warning' a todas as colunas da linha
            }

            

            
        },
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
            searchPlaceholder: 'Pesquisar...',
            Search: '',
        }
    });

    

    createToast('Sirius', `Filtro de comissões do(a) ${selectedText} foi gerado com sucesso!`); // Exibe uma mensagem de sucesso

    if(!verifyPercentageComission){
        createToast('Sirius', `Não existe porcentagem de comissão cadastrada para o colaborador(a) ${selectedText}.`); // Exibe uma mensagem de sucesso 
    }


    if(!verify){
        createToast('Sirius', `Atenção você não pode gerar um registro do(a) ${selectedText} pois já existe um registro em aberto.`); // Exibe uma mensagem de sucesso  
    }

    setTimeout(async () => {
        await countProcessosFiltered()
        document.querySelector('#loader2').classList.add('d-none'); // Esconde o loader
    }, 300);
    

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

/**
 * Função para carregar os dados de vendas.
 */
async function loadSales() {
    const getSales = await makeRequest(`/api/headcargo/user/ByDep/89`); // Faz uma requisição para obter os dados de vendas

    const options = getSales.map(sales => `<option value="${sales.IdFuncionario}">${formatarNome(sales.Nome)}</option>`); // Cria opções para cada venda
    const optionDefault = `<option value="000" selected>Sem seleção</option>`; // Cria uma opção padrão
    const listOfSales = document.getElementById('listOfSales'); // Seleciona o elemento de lista de vendas
    listOfSales.innerHTML = optionDefault + options.join(''); // Define o conteúdo HTML da lista de vendas

    $("#listOfSales").select2({
        templateResult: formatState, // Define o template para exibir as opções
        templateSelection: formatState, // Define o template para a seleção
        placeholder: "Choose Customer" // Define o placeholder
    });

    $("#listOfSales").on('change', async function(e) {
        if (this.value !== '000') {
            const selectedValue = this.value;
            const selectedText = this.options[this.selectedIndex].text;
            $("#listOfInside").val('000').trigger('change'); // Define o valor da outra lista como padrão e dispara o evento 'change'
        }
    });
}

/**
 * Função para carregar os dados de vendas internas.
 */
async function loadInsideSales() {
    const getSales = await makeRequest(`/api/headcargo/user/ByDep/89`); // Faz uma requisição para obter os dados de vendas internas
    const options = getSales.map(sales => `<option value="${sales.IdFuncionario}">${formatarNome(sales.Nome)}</option>`); // Cria opções para cada venda interna
    const optionDefault = `<option value="000" selected>Sem seleção</option>`; // Cria uma opção padrão
    const listOfInside = document.getElementById('listOfInside'); // Seleciona o elemento de lista de vendas internas
    listOfInside.innerHTML = optionDefault + options.join(''); // Define o conteúdo HTML da lista de vendas internas

    $("#listOfInside").select2({
        templateResult: formatState, // Define o template para exibir as opções
        templateSelection: formatState, // Define o template para a seleção
        placeholder: "Choose Customer" // Define o placeholder
    });

    $("#listOfInside").on('change', async function(e) {
        if (this.value !== '000') {
            const selectedValue = this.value;
            const selectedText = this.options[this.selectedIndex].text;
            $("#listOfSales").val('000').trigger('change'); // Define o valor da outra lista como padrão e dispara o evento 'change'
        }
    });
}

/**
 * Função para criar um registro.
 * @param {number} typeID - Tipo de ID (0 para Vendedor, 1 para Inside)
 * @param {object} dateFilter - Filtros de data
 * @param {object} user - Dados do usuário
 */
async function createRegister(typeID, dateFilter, user) {

    const filters = {
        vendedorID: user.id
    }

    const verify = await makeRequest(`/api/headcargo/commission/verifyRegisters`, 'POST', { filters });

    if(!verify){
        document.querySelector('.btn_salvarRegistro').setAttribute('disabled', true); 
        createToast('Sirius', `Atenção você não pode gerar um novo registro do(a) ${user.name} pois já existe um registro em aberto.`); // Exibe uma mensagem de sucesso  
        return false;
    }

     const verifyPercentageComission = await makeRequest(`/api/headcargo/commission/verifyPercentageComission`, 'POST', { id:user.id });

     if(!verifyPercentageComission){
        document.querySelector('.btn_salvarRegistro').setAttribute('disabled', true); 
        createToast('Sirius', `Não existe porcentagem de comissão cadastrada para o colaborador(a) ${selectedText}.`); // Exibe uma mensagem de sucesso 
        return false;
    }

    document.querySelector('.btn_salvarRegistro').setAttribute('disabled', true); // Desabilita o botão de salvar registro
    const allProcessSelected = document.querySelectorAll('.selectCheckbox'); // Seleciona todos os checkboxes de processos
    const processSelected = [];

    // Itera sobre todos os checkboxes e adiciona os processos selecionados à lista
    for (let index = 0; index < allProcessSelected.length; index++) {
        const element = allProcessSelected[index];
        if (element.checked) {
            processSelected.push(element.getAttribute('data-id'));
        }
    }

    createToast('Sirius', `Registro de comissão gerado, não se preocupe, estamos fazendo tudo para você`); // Exibe uma mensagem de sucesso
    const dados = await makeRequest(`/api/headcargo/commission/createRegister`, 'POST', { process: processSelected, type: typeID, dateFilter, user }); // Faz uma requisição para criar um novo registro
    // document.querySelector('.btn_salvarRegistro').removeAttribute('disabled'); // Reabilita o botão de salvar registro

    if (dados.success) {
        createToast('Sirius', `Email registro de comissão enviado com sucesso!`); // Exibe uma mensagem de sucesso se a criação do registro for bem-sucedida
    } else {
        createToast('Sirius', `Tivemos problemas para gerar o registro e enviar o email.`); // Exibe uma mensagem de erro se houver problemas
    }
}

/**
 * Função para configurar eventos de clique.
 */
async function eventsCliks() {
    // Seleciona o checkbox para selecionar todos os processos
    const selectAllCheckbox = document.querySelector('.selectAllCheckbox');
    selectAllCheckbox.addEventListener('click', function() {
        const all = this.checked; // Obtém o estado do checkbox (selecionado ou não)
        const allChecks = document.querySelectorAll('.selectCheckbox'); // Seleciona todos os checkboxes de processos
        for (let index = 0; index < allChecks.length; index++) {
            const element = allChecks[index];
            element.checked = all; // Define o estado de todos os checkboxes com base no estado do checkbox "selecionar todos"
        }
    });


    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('processo-vencido')) {
            const id = e.target.getAttribute('data-id');
            e.preventDefault();
            OpenOverdueInvoices(id);
        }

        if (e.target.classList.contains('selectCheckbox') || e.target.classList.contains('selectAllCheckbox')) {
            let checks = document.querySelectorAll('.selectCheckbox');

            let total = 0;
            let totalComissao = 0;
            let totalProcessosSelecionados = 0
            // Itera sobre cada elemento de verificação
            checks.forEach(check => {
                // Se o elemento de verificação está marcado, adiciona o valor à total
                if (check.checked) {
                    totalProcessosSelecionados++
                    total += parseFloat(check.getAttribute('data-value'));
                    totalComissao += parseFloat(check.getAttribute('data-comissao'));
                }
            });
        
            // Atualiza o total na página
            document.querySelector('.total_profit').textContent = total.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
            document.querySelector('.quantidade_processo').textContent = totalProcessosSelecionados;
            document.querySelector('.valor_Comissao_total').textContent = totalComissao.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
        }




    })

 
}
async function countProcessosFiltered(){
    let checks = document.querySelectorAll('.selectCheckbox');

    let total = 0;
    let totalComissao = 0;
    let totalProcessosSelecionados = 0
    // Itera sobre cada elemento de verificação
    checks.forEach(check => {
        // Se o elemento de verificação está marcado, adiciona o valor à total
        if (check.checked) {
            totalProcessosSelecionados++
            total += parseFloat(check.getAttribute('data-value'));
            totalComissao += parseFloat(check.getAttribute('data-comissao'));
        }
    });

    // Atualiza o total na página
    document.querySelector('.total_profit').textContent = total.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
    document.querySelector('.quantidade_processo').textContent = totalProcessosSelecionados;
    document.querySelector('.valor_Comissao_total').textContent = totalComissao.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})
}


$(document).on('click', '.financial-detail', async function () {
    var tr = $(this).closest('tr'); // Pega a linha da tabela
    var row = tables['table_commission_commercial'].row(tr); // Acessa a linha através do DataTables

    if (row.child.isShown()) {
        // Se os detalhes já estão mostrados, remove a linha de detalhes e troca o ícone para "plus"
        row.child.hide();
        tr.find('.ri').removeClass('ri-eye-off-fill').addClass('ri-eye-fill');
    } else {
        const data = await makeRequest(`/api/headcargo/commission/ListInvoicesByProcessId/${row.data().IdLogistica_House}`); // Faz uma requisição para obter os detalhes da fatura
        let detailsHtml = await formatDetails(data); // Função para formatar os detalhes retornados
        row.child(detailsHtml).show();
        tr.find('.ri').removeClass('ri-eye-fill').addClass('ri-eye-off-fill');
    }

    console.log(tr.find('.ri'))
});

// Função para formatar os detalhes retornados da consulta
async function formatDetails(data) {

    let trs = '';
    for (let index = 0; index < data.length; index++) {
        const element = data[index];
        trs += `<tr>
                    <td style="max-width: 50px !important">${element.Pessoa}</td>
                    <td style="max-width: 50px !important">${element.TIPO_FATURA}</td>
                    <td style="max-width: 50px !important">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: element.Sigla }).format(element.Valor_Original)}</td>
                    <td style="max-width: 50px !important">${element.SituacaoNome}</td>
                </tr>`
    }

    return `
    <table class="table table-bordered" style="width:calc(100vw - 411px) !important;">
        <tr>
            <td style="max-width: 50px !important;"><b>Pessoa</b></td>
            <td style="max-width: 50px !important;"><b>Tipo</b></td>
            <td style="max-width: 50px !important;"><b>Valor</b></td>
            <td style="max-width: 50px !important;"><b>Situação</b></td>
        </tr>
        ${trs}

        
    </table>`
    
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
    const baseUrl = state.id === '000' ? "../../assets/images/media/not-user.png" : `https://cdn.conlinebr.com.br/colaboradores/${state.id}`; // Define a URL da imagem
    const $state = $(
        `<span><img src="${baseUrl}" class="img-flag"> ${state.text}</span>` // Cria um elemento span com a imagem e o texto do estado
    );
    return $state;
}

/**
 * Função para obter valores de checkboxes marcados.
 * @param {string} selector - Seletor dos checkboxes
 * @returns {Array} - Lista de valores dos checkboxes marcados
 */
function getCheckedValues(selector) {
    const checkboxes = document.querySelectorAll(selector); // Seleciona os checkboxes com o seletor fornecido
    const checkboxArray = Array.from(checkboxes); // Converte a NodeList para um array
    return checkboxArray.map(checkbox => checkbox.checked ? checkbox.value : '').filter(valor => valor !== ''); // Retorna os valores dos checkboxes marcados, filtrando valores vazios
}

/**
 * Função para validar os filtros selecionados.
 * @param {Array} recebimentoList - Lista de valores de recebimento
 * @param {Array} ComissaoAgenteList - Lista de valores de comissão de agente
 * @param {Array} pagamentoList - Lista de valores de pagamento
 * @param {Array} comissao_vendedorList - Lista de valores de comissão de vendedor
 * @param {Array} comissao_insideList - Lista de valores de comissão de inside
 * @param {Array} modalidadeList - Lista de valores de modalidade
 * @returns {boolean} - Verdadeiro se todos os filtros são válidos, falso caso contrário
 */
function validateFilters(recebimentoList, ComissaoAgenteList, pagamentoList, comissao_vendedorList, comissao_insideList, modalidadeList) {
    if (recebimentoList.length === 0) {
        Swal.fire(
            'Atenção',
            "Por favor, selecione pelo menos uma opção de 'Recebimento'.",
            'error'
            )
        return false;
    }
    if (ComissaoAgenteList.length === 0) {
        Swal.fire(
            'Atenção',
            "Por favor, selecione pelo menos uma opção de 'Comissao Agente'.",
            'error'
            )
        return false;
    }
    if (pagamentoList.length === 0) {
        Swal.fire(
            'Atenção',
            "Por favor, selecione pelo menos uma opção de 'Pagamento'.",
            'error'
            )
        return false;
    }
    if (comissao_vendedorList.length === 0) {
        Swal.fire(
            'Atenção',
            "Por favor, selecione pelo menos uma opção de 'Comissao Vendedor'.",
            'error'
            )
        return false;
    }
    if (comissao_insideList.length === 0) {
        Swal.fire(
            'Atenção',
            "Por favor, selecione pelo menos uma opção de 'Comissao Inside'.",
            'error'
            )
        return false;
    }
    if (modalidadeList.length === 0) {
        Swal.fire(
            'Atenção',
            "Por favor, selecione pelo menos uma opção de 'Modalidade'.",
            'error'
            )
        return false;
    }
    return true;
}

