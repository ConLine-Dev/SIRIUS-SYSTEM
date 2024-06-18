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

console.log(StorageGoogle)

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


async function getSettingsSellerById(userID, textName){
    commissionedID = userID
    commissionedName = textName

    document.querySelector('#loader2').classList.remove('d-none')

    // Atualiza os detalhes do comissionado no DOM
    const img = document.querySelector('.imgComissionado');
    const name = document.querySelector('.nameComissionado');
    const type = document.querySelector('.typeComission');

    // type.textContent = ` [${typeSales}]`;
    name.textContent = textName;
    img.innerHTML = '';
    img.style.backgroundImage = `url(https://cdn.conlinebr.com.br/colaboradores/${userID})`;
    img.style.backgroundPosition = 'center';
    img.style.backgroundSize = 'cover';

 


    if ($.fn.DataTable.isDataTable('#table_settings_inside') || $.fn.DataTable.isDataTable('#table_settings_seller')) {
        $('#table_settings_inside').DataTable().destroy(); // Destrói a tabela DataTable existente
        $('#table_settings_seller').DataTable().destroy(); // Destrói a tabela DataTable existente
    }

    const resultSeller = await makeRequest(`/api/headcargo/commission/listSettings`,'POST', {id:userID, type:1});
    $('#table_settings_seller').DataTable({
            layout: {
                topStart: {
                    buttons: [
                        {
                            text: ' <i class="ri-file-list-2-line label-btn-icon me-2"></i> Cadastrar',
                            className: 'btn btn-primary label-btn btn-table-custom',
                            enabled: true,
                            action: async function (e, dt, node, config) {

                                document.querySelector('#titleRegisterSettings').innerHTML = 'Porcentagem Vendedor Externo'
                                commissionType = 1
                                $('#registerSettings').modal('show')
                            }
                        }
                    ]
                }
            },
            data:resultSeller,
            paging: false,
            scrollX: true,
            scrollY: '60vh',
            pageInfo: false,
            bInfo: false,
            order: [[0, 'desc']],
            columns: [
                { data: 'value_min' }, // Coluna de processo
                { data: 'value_max' }, // Coluna de modal
                { data: 'percentage' }, // Coluna de abertura
                { data: 'date' }, // Coluna de abertura
                { data: 'perFullName' }, // Coluna de abertura
            ],
            language: {
                url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
                searchPlaceholder: 'Pesquisar...',
                Search: '',
            }
    });


    const resultInside = await makeRequest(`/api/headcargo/commission/listSettings`,'POST', {id:userID, type:2});
    $('#table_settings_inside').DataTable({
        layout: {
            topStart: {
                buttons: [
                    {
                        text: ' <i class="ri-file-list-2-line label-btn-icon me-2"></i> Cadastrar',
                        className: 'btn btn-primary label-btn btn-table-custom',
                        enabled: true,
                        action: async function (e, dt, node, config) {
                            document.querySelector('#titleRegisterSettings').innerHTML = 'Porcentagem Vendedor Interno (Inside)'
                            commissionType = 2
                            $('#registerSettings').modal('show')
                        }
                    }
                ]
            }
        },
        data:resultInside,
        paging: false,
        scrollX: true,
        scrollY: '60vh',
        pageInfo: false,
        bInfo: false,
        order: [[0, 'desc']],
        columns: [
            { data: 'value_min' }, // Coluna de processo
            { data: 'value_max' }, // Coluna de modal
            { data: 'percentage' }, // Coluna de abertura
            { data: 'date' }, // Coluna de abertura
            { data: 'perFullName' }, // Coluna de abertura
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
            searchPlaceholder: 'Pesquisar...',
            Search: '',
        }
    });


    // Atualiza os totais no DOM
    if(resultInside.length > 0){
    document.querySelector('.total_profit').textContent = resultInside[resultInside.length - 1].date;
    }

    if(resultSeller.length > 0){
    document.querySelector('.valor_Comissao_total').textContent = resultSeller[resultSeller.length - 1].date;
    }
    
    
    // document.querySelector('.quantidade_processo').textContent = register.data.length;
    // document.querySelector('.valor_Comissao_total').textContent = register.total_comission;

    document.querySelector('#loader2').classList.add('d-none')
}


async function events() {

    // Formatação para BRL (Real Brasileiro)
    new Cleave('.min_value', {
        numeral: true,
        numeralThousandsGroupStyle: 'thousand',
        numeralDecimalMark: ',',
        delimiter: '.',
        prefix: 'R$ ',
        rawValueTrimPrefix: true
    });
    
    new Cleave('.max_value', {
        numeral: true,
        numeralThousandsGroupStyle: 'thousand',
        numeralDecimalMark: ',',
        delimiter: '.',
        prefix: 'R$ ',
        rawValueTrimPrefix: true
    });


    

    await eventConfirmPercentage()

}

async function eventConfirmPercentage() {
    const buttonConfirm = document.querySelector('.btnconfirmPercentage');

    buttonConfirm.addEventListener('click', async function(e) {
        const min_value = document.querySelector('input[name="min_value"]');
        const max_value = document.querySelector('input[name="max_value"]');
        const percentage = document.querySelector('input[name="percentage"]');

        const body = {
            commissionedID: commissionedID,
            min_value: parseBRL(min_value.value),
            max_value: parseBRL(max_value.value),
            percentage: percentage.value,
            userID: StorageGoogle.system_collaborator_id,
            commissionType: commissionType
        };

        min_value.value = 'R$ '
        max_value.value = 'R$ '
        percentage.value = ''
       
        $('#registerSettings').modal('hide');
        await registerPercentage(body);
    });
}

async function registerPercentage(data){
    // Faz uma requisição para obter os detalhes do registro pelo ID
    const register = await makeRequest(`/api/headcargo/commission/registerPercentage`, 'POST', data);


    await getSettingsSellerById(commissionedID, commissionedName)
    return register
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
                                    <span class="d-block fw-semibold nameColab">${formatarNome(element.Nome)}</span> 
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

    const listCollaborators = document.querySelector('.listCollaborators');
        
    // Remove todos os event listeners existentes
    const newElement = listCollaborators.cloneNode(true);
    listCollaborators.parentNode.replaceChild(newElement, listCollaborators);

    newElement.addEventListener('click', async function(e) {
        if (e.target && e.target.closest('li')) {
            const item = e.target.closest('li');
            const id = item.getAttribute('data-idHeadCargo');
           
            const textName = item.querySelector('.nameColab').textContent
            const list = document.querySelectorAll('.listCollaborators li');

            list.forEach(element => element.classList.remove('activeRef'));

            await getSettingsSellerById(id, textName);
            item.classList.add('activeRef');
        }
    });
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
 * Função para converter valor formatado em BRL para um valor numérico
 * @param {string} formattedValue - Valor formatado como BRL
 * @returns {number} - Valor numérico sem formatação
 */
function parseBRL(formattedValue) {
    return parseFloat(formattedValue.replace('R$ ', '').replace(/\./g, '').replace(',', '.'));
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



