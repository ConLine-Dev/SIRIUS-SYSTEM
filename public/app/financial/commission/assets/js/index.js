// Verifica o localStorage para alterar a mensagem de boas vindas
const StorageGoogleData = localStorage.getItem('StorageGoogle');
const StorageGoogle = JSON.parse(StorageGoogleData);

let toastCount = 0;

document.addEventListener("DOMContentLoaded", async () => {
  
    // await generateTable();



    await loadAssets();
    await eventsCliks();
    await setDateDefaultFilter();

    if(!tables['table_commission_commercial']){
        tables['table_commission_commercial'] = $('#table_commission_commercial').DataTable({
            // dom: 'Bfrtip',
            layout: {
                topStart: {
                    buttons: [
                        {
                            text: ' <i class="ri-file-list-2-line label-btn-icon me-2"></i> Salvar Registro',
                            className: 'btn btn-primary label-btn btn-table-custom',
                            enabled: false,
                            action: function (e, dt, node, config) {
                               
                            }
                        }
                    ]
                }
            },
            paging: false,
            scrollX: true,
            scrollY: '60vh',
            pageInfo: false,
            bInfo:false,  
            order: [[0, 'desc']],
            language: {
                searchPlaceholder: 'Pesquisar...',
                sSearch: '',
            },
        })
    }
    

  
    document.querySelector('#loader2').classList.add('d-none')

    // setTimeout(() => {
    //     CreteToast()
    //     console.log('dsa')
    // }, 2000);

    // setInterval(() => {
    //     createToast('Sirius', 'Comissão foi registrada e enviado por email')
    // }, 2000);
})

async function setDateDefaultFilter(){
        // Função para formatar a data no formato YYYY-MM-DD
        function formatDate(date) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        // Obter a data atual
        const currentDate = new Date();

        // Criar a data para o primeiro dia de janeiro do ano atual
        const startOfYearDate = new Date(currentDate.getFullYear(), 0, 1);

        // Formatar as datas
        const formattedCurrentDate = formatDate(currentDate);
        const formattedStartOfYearDate = formatDate(startOfYearDate);

        // Preencher os inputs com as datas formatadas
        document.getElementById('dataDe').value = formattedStartOfYearDate;
        document.getElementById('dataAte').value = formattedCurrentDate;
}

async function loadAssets(){
 
    await loadSales();
    await loadInsideSales();
    
}

async function getFilters(){

    // Selecionar todos os elementos checkbox com a classe 'recebimento'
    let recebimento = document.querySelectorAll('.recebimento');
    // Converter NodeList para Array
    let recebimentoArray = Array.from(recebimento);
    // Mapeia o array para obter os valores dos checkboxes marcados
    const recebimentoList = recebimentoArray.map(checkbox => checkbox.checked ? checkbox.value : '').filter(valor => valor !== '');


    
    // Selecionar todos os elementos checkbox com a classe 'ComissaoAgente'
    let ComissaoAgente = document.querySelectorAll('.ComissaoAgente');
    // Converter NodeList para Array
    let ComissaoAgenteArray = Array.from(ComissaoAgente);
    // Mapeia o array para obter os valores dos checkboxes marcados
    const ComissaoAgenteList = ComissaoAgenteArray.map(checkbox => checkbox.checked ? checkbox.value : '').filter(valor => valor !== '');


    // Selecionar todos os elementos checkbox com a classe 'pagamento'
    let pagamento = document.querySelectorAll('.pagamento');
    // Converter NodeList para Array
    let pagamentoArray = Array.from(pagamento);
    // Mapeia o array para obter os valores dos checkboxes marcados
    const pagamentoList = pagamentoArray.map(checkbox => checkbox.checked ? checkbox.value : '').filter(valor => valor !== '');


    // Selecionar todos os elementos checkbox com a classe 'comissao_vendedor'
    let comissao_vendedor = document.querySelectorAll('.comissao_vendedor');
    // Converter NodeList para Array
    let comissao_vendedorArray = Array.from(comissao_vendedor);
    // Mapeia o array para obter os valores dos checkboxes marcados
    const comissao_vendedorList = comissao_vendedorArray.map(checkbox => checkbox.checked ? checkbox.value : '').filter(valor => valor !== '');


    // Selecionar todos os elementos checkbox com a classe 'comissao_vendedor'
    let comissao_inside = document.querySelectorAll('.comissao_vendedor');
    // Converter NodeList para Array
    let comissao_insideArray = Array.from(comissao_inside);
    // Mapeia o array para obter os valores dos checkboxes marcados
    const comissao_insideList = comissao_insideArray.map(checkbox => checkbox.checked ? checkbox.value : '').filter(valor => valor !== '');


    // Selecionar todos os elementos checkbox com a classe 'modalidade'
    let modalidade = document.querySelectorAll('.modalidade');
    // Converter NodeList para Array
    let modalidadeArray = Array.from(modalidade);
    // Mapeia o array para obter os valores dos checkboxes marcados
    const modalidadeList = modalidadeArray.map(checkbox => checkbox.checked ? checkbox.value : '').filter(valor => valor !== '');



     // Verificar se todas as listas têm pelo menos um valor
     if (recebimentoList.length === 0) {
        alert("Por favor, selecione pelo menos uma opção de 'Recebimento'.");
        return false
    }
    if (ComissaoAgenteList.length === 0) {
        alert("Por favor, selecione pelo menos uma opção de 'Comissao Agente'.");
        return false
    }
    if (pagamentoList.length === 0) {
        alert("Por favor, selecione pelo menos uma opção de 'Pagamento'.");
        return false
    }
    if (comissao_vendedorList.length === 0) {
        alert("Por favor, selecione pelo menos uma opção de 'Comissao Vendedor'.");
        return false
    }
    if (comissao_insideList.length === 0) {
        alert("Por favor, selecione pelo menos uma opção de 'Comissao Inside'.");
        return false
    }
    if (modalidadeList.length === 0) {
        alert("Por favor, selecione pelo menos uma opção de 'Modalidade'.");
        return false
    }


     // Obtendo os valores dos campos dataDe, dataAte, vendedorID e InsideID
     const dataDeValue = dataDe.value;
     const dataAteValue = dataAte.value;
     const vendedorIDValue = listOfSales.value;
     const insideIDValue = listOfInside.value;
 
        if(!dataDeValue || !dataAteValue){
            alert("Por favor, preencha 'De' e 'Até'");
        }

     if (vendedorIDValue == '000' && insideIDValue == '000') {
        alert("Por favor, selecione um 'Vendedor' ou 'Inside' para ser comissionado.");
        return false;
    }


     const filters = {
        dataDe: dataDeValue,
        dataAte: dataAteValue,
        vendedorID: vendedorIDValue,
        InsideID: insideIDValue,
        recebimento: recebimentoList,
        pagamento: pagamentoList,
        ComissaoAgente:ComissaoAgenteList,
        comissaoVendedor: comissao_vendedorList,
        ComissaoInside: comissao_insideList,
        modalidade: modalidadeList,
    }

    return filters;
}

async function selectUserComission(id, Name, typeText){
    var img = document.querySelector('.imgComissionado');
    var name = document.querySelector('.nameComissionado');
    var type = document.querySelector('.typeComission');

    
    type.textContent = ` [${typeText}]`
    name.textContent = Name
    // Define os estilos usando a propriedade style
    img.innerHTML = ''
    img.style.backgroundImage = 'url(https://cdn.conlinebr.com.br/colaboradores/'+id+')';
    img.style.backgroundPosition = 'center';
    img.style.backgroundSize = 'cover';



}

async function submitCommission(){
     // Fazer a requisição à API
    document.querySelector('#loader2').classList.remove('d-none')
    const filters = await getFilters();
    console.log(filters)
    if(!filters){
        // alert('Verifique os campos obrigatorios')
        document.querySelector('#loader2').classList.add('d-none')

        return false
    }


    const dados = await makeRequest(`/api/headcargo/commission/filterComission`,'POST', {filters: filters});

    const idvalue = listOfSales.value != '000' ? listOfSales : listOfInside
    const typeSales = listOfSales.value != '000' ? 'Vendedor' : 'Inside'

    const typeID = listOfSales.value != '000' ? 0 : 1 //0 VENDEDOR | 1 INSIDE

    const selectedValue = idvalue.value;
    const selectedText = idvalue.options[idvalue.selectedIndex].text;

    const user = {
        name: selectedText,
        id: selectedValue,
        type: typeID,
        userLog: StorageGoogle.system_userID,
        collabId: StorageGoogle.system_collaborator_id
    }


     await selectUserComission(selectedValue, selectedText, typeSales);


     document.querySelector('.total_profit').textContent = dados.valor_Efetivo_total

     document.querySelector('.quantidade_processo').textContent = dados.quantidade_processo

     document.querySelector('.valor_Comissao_total').textContent = dados.valor_Comissao_total
     

   
     // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#table_commission_commercial')) {
        $('#table_commission_commercial').DataTable().destroy();
    }


    // Criar a nova tabela com os dados da API
    tables['table_commission_commercial'] = $('#table_commission_commercial').DataTable({
        // dom: 'Bfrtip',
        layout: {
            topStart: {
                buttons: [
                    {
                        text: ' <i class="ri-file-list-2-line label-btn-icon me-2"></i> Salvar Registro',
                        className: 'btn btn-primary label-btn btn-table-custom btn_salvarRegistro',
                        action: async function (e, dt, node, config) {
                            await createRegister(typeID, {de:filters.dataDe, ate: filters.dataAte}, user)
                        }
                    }
                ]
            }
        },
        paging: false,
        scrollX: true,
        scrollY: '60vh',
        pageInfo: false,
        bInfo:false,  
        // pageLength: 15,
        order: [[0, 'desc']],
        data: dados.data,
        columns: [
            { data: 'check', "orderable": false},
            { data: 'modal' },
            { data: 'processo' },
            { data: 'abertura' },
            { data: 'data_compensacao' },
            { data: 'tipo' },
            { data: 'cliente' },
            { data: 'vendedor' },
            { data: 'inside' },
            { data: 'importador' },
            { data: 'exportador' },
            { data: 'comissao_vendedor' },
            { data: 'comissao_inside' },
            { data: 'estimado' },
            { data: 'efetivo' },
            { data: 'restante' }
            // Adicione mais colunas conforme necessário
        ],
        buttons: [
            // 'excel', 'pdf', 'print'
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
        },
    });

 

    
    document.querySelector('#loader2').classList.add('d-none')

    createToast('Sirius', `Filtro de comissões do(a) ${selectedText} foi gerado com sucesso!`)

}


function createToast(title, text) {
    toastCount++;

    // Create a new toast element
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center  border-0';
    toast.id = `toast-${toastCount}`;
    toast.role = 'alert';
    toast.ariaLive = 'assertive';
    toast.ariaAtomic = 'true';
    toast.dataset.bsDelay = '5000'; // Auto hide after 5 seconds

    // Toast header
    const toastHeader = document.createElement('div');
    toastHeader.className = 'toast-header text-bg-danger';
    toastHeader.innerHTML = `
        <strong class="me-auto">${title}</strong>
        <small>Agora mesmo</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    `;

    // Toast body
    const toastBody = document.createElement('div');
    toastBody.className = 'toast-body';
    toastBody.innerText = text;

    // Append header and body to the toast element
    toast.appendChild(toastHeader);
    toast.appendChild(toastBody);

    // Append the toast element to the toast container
    const toastContainer = document.getElementById('toast-container');
    toastContainer.appendChild(toast);

    // Initialize and show the toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    // Remove the toast from the DOM when it is hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toastContainer.removeChild(toast);
    });
}

async function loadSales() {
    // Fazer a requisição à API
    const getSales = await makeRequest(`/api/headcargo/user/ByDep/62`);

    // Mapeia o array de frutas para criar opções <option>
    const options = getSales.map(sales => `<option value="${sales.IdFuncionario}">${formatarNome(sales.Nome)}</option>`);

    const optionDefault = `<option value="000" selected>Sem seleção</option>`;
    // Adiciona as opções ao <select>
    const listOfSales = document.getElementById('listOfSales');
    listOfSales.innerHTML = optionDefault + options.join('');

    // Inicializa o select2
    $("#listOfSales").select2({
        templateResult: formatState,
        templateSelection: formatState, // Use the same format for the selected option
        placeholder: "Choose Customer"
    });

    // Adiciona um event listener para o evento de mudança usando jQuery
    $("#listOfSales").on('change', async function(e) {

        if(this.value != '000'){
            const selectedValue = this.value;
            const selectedText = this.options[this.selectedIndex].text;
            // await selectUserComission(selectedValue, selectedText, 'Vendedor');
    
            // Define o valor do outro select como '000' e dispara o evento 'change'
            $("#listOfInside").val('000').trigger('change');
        }
       
    });
}

async function loadInsideSales() {
    // Fazer a requisição à API
    const getSales = await makeRequest(`/api/headcargo/user/ByDep/75`);

    // Mapeia o array de frutas para criar opções <option>
    const options = getSales.map(sales => `<option value="${sales.IdFuncionario}">${formatarNome(sales.Nome)}</option>`);

    const optionDefault = `<option value="000" selected>Sem seleção</option>`;
    // Adiciona as opções ao <select>
    const listOfInside = document.getElementById('listOfInside');
    listOfInside.innerHTML = optionDefault + options.join('');

    // Inicializa o select2
    $("#listOfInside").select2({
        templateResult: formatState,
        templateSelection: formatState, // Use the same format for the selected option
        placeholder: "Choose Customer"
    });

    // Adiciona um event listener para o evento de mudança usando jQuery
    $("#listOfInside").on('change', async function(e) {
        if(this.value != '000'){
            const selectedValue = this.value;
            const selectedText = this.options[this.selectedIndex].text;
            // await selectUserComission(selectedValue, selectedText, 'Inside');
    
            // Define o valor do outro select como '000' e dispara o evento 'change'
            $("#listOfSales").val('000').trigger('change');
        }
        
    });
}

async function createRegister(typeID, dateFilter, user){
    document.querySelector('#loader2').classList.remove('d-none')
    const allProcessSelected = document.querySelectorAll('.selectCheckbox')
    const processSelected = []

    for (let index = 0; index < allProcessSelected.length; index++) {
        const element = allProcessSelected[index];

        if(element.checked){
            processSelected.push(element.getAttribute('data-id'))
        }
          
    }

   



    const dados = await makeRequest(`/api/headcargo/commission/createRegister`,'POST', {process: processSelected, type: typeID, dateFilter:dateFilter, user});
    

    document.querySelector('#loader2').classList.add('d-none')
}

async function eventsCliks(){
    
    // ESCUTA O EVENTO CLICK NO CHECKBOX DA TABELA PARA MARCAR TODOS OS PROCESSOS OU DESMARCAR
    const selectAllCheckbox = document.querySelector('.selectAllCheckbox')
    selectAllCheckbox.addEventListener('click', function(){
        const all = this.checked

        const allChecks = document.querySelectorAll('.selectCheckbox')
        for (let index = 0; index < allChecks.length; index++) {
            const element = allChecks[index];
            element.checked = all
            
        }
    })

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
 /* templating */
 function formatState(state) {
    if (!state.id) {
        return state.text;
    }
    var baseUrl = ''
    if(state.id == '000'){
        baseUrl = "../../assets/images/media/not-user.png";  
    }else{
        baseUrl = "https://cdn.conlinebr.com.br/colaboradores/"+state.id;
    }


    var $state = $(
        '<span><img src="'+baseUrl+'" class="img-flag" > ' + state.text + '</span>'
    );
    return $state;
};


