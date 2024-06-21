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


// Variáveis globais
let toastCount = 0,
    commissionedID, 
    commissionedName,
    commissionTotalProfitProcess,
    commissionType, 
    commissionTotalComission,
    commissionLength, 
    registerCommissionID;

/**
 * Evento que será disparado quando a página estiver completamente carregada
 * (incluindo CSS, imagens, etc.)
 */
window.addEventListener("load", async () => {
    await listCollaborators(); // Lista os colaboradores
    await events(); // Configura os eventos
    document.querySelector('#loader2').classList.add('d-none'); // Esconde o loader
});

/**
 * Função para obter as configurações do vendedor pelo ID
 * @param {number} userID - ID do usuário
 * @param {string} textName - Nome do usuário
 */
async function getSettingsSellerById(userID, textName) {
    commissionedID = userID;
    commissionedName = textName;
    document.querySelector('#loader2').classList.remove('d-none'); // Mostra o loader

    // Atualiza os detalhes do comissionado no DOM
    const img = document.querySelector('.imgComissionado');
    const name = document.querySelector('.nameComissionado');
    const type = document.querySelector('.typeComission');

    name.textContent = textName;
    img.innerHTML = '';
    img.style.backgroundImage = `url(https://cdn.conlinebr.com.br/colaboradores/${userID})`;
    img.style.backgroundPosition = 'center';
    img.style.backgroundSize = 'cover';

    // Destrói as tabelas DataTable existentes
    if ($.fn.DataTable.isDataTable('#table_settings_inside') || $.fn.DataTable.isDataTable('#table_settings_seller')) {
        $('#table_settings_inside').DataTable().destroy();
        $('#table_settings_seller').DataTable().destroy();
    }

    // Obtém as configurações do vendedor externo
    const resultSeller = await makeRequest(`/api/headcargo/commission/listSettings`, 'POST', { id: userID, type: 1 });
    $('#table_settings_seller').DataTable({
        layout: {
            topStart: {
                buttons: [
                    {
                        text: ' <i class="ri-save-3-line label-btn-icon me-2"></i> Cadastrar',
                        className: 'btn btn-success label-btn btn-table-custom',
                        enabled: true,
                        action: async function () {
                            document.querySelector('#titleRegisterSettings').innerHTML = 'Porcentagem Vendedor Externo';
                            commissionType = 1;
                            $('#registerSettings').modal('show');
                        }
                    }
                ]
            }
        },
        data: resultSeller,
        paging: false,
        scrollX: true,
        scrollY: '60vh',
        pageInfo: false,
        bInfo: false,
        columnDefs: [
            { "orderable": false, "targets": 5 }
        ],
        order: [[0, 'desc']],
        columns: [
            { data: 'value_min' },
            { data: 'value_max' },
            { data: 'percentage' },
            { data: 'date' },
            { data: 'perFullName' },
            { data: 'actions' }
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
            searchPlaceholder: 'Pesquisar...',
            Search: '',
        }
    });

    // Obtém as configurações do vendedor interno
    const resultInside = await makeRequest(`/api/headcargo/commission/listSettings`, 'POST', { id: userID, type: 2 });
    $('#table_settings_inside').DataTable({
        layout: {
            topStart: {
                buttons: [
                    {
                        text: ' <i class="ri-save-3-line label-btn-icon me-2"></i> Cadastrar',
                        className: 'btn btn-success label-btn btn-table-custom',
                        enabled: true,
                        action: async function () {
                            document.querySelector('#titleRegisterSettings').innerHTML = 'Porcentagem Vendedor Interno (Inside)';
                            commissionType = 2;
                            $('#registerSettings').modal('show');
                        }
                    }
                ]
            }
        },
        data: resultInside,
        paging: false,
        scrollX: true,
        scrollY: '60vh',
        pageInfo: false,
        bInfo: false,
        columnDefs: [
            { "orderable": false, "targets": 5 }
        ],
        order: [[0, 'desc']],
        columns: [
            { data: 'value_min' },
            { data: 'value_max' },
            { data: 'percentage' },
            { data: 'date' },
            { data: 'perFullName' },
            { data: 'actions' }
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
            searchPlaceholder: 'Pesquisar...',
            Search: '',
        }
    });

    // Atualiza os totais no DOM
    if (resultInside.length > 0) {
        document.querySelector('.total_profit').textContent = resultInside[resultInside.length - 1].date;
    }

    if (resultSeller.length > 0) {
        document.querySelector('.valor_Comissao_total').textContent = resultSeller[resultSeller.length - 1].date;
    }

    document.querySelector('#loader2').classList.add('d-none'); // Esconde o loader
}

/**
 * Função para configurar eventos
 */
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

    // Formatação para BRL (Real Brasileiro)
    new Cleave('.max_value', {
        numeral: true,
        numeralThousandsGroupStyle: 'thousand',
        numeralDecimalMark: ',',
        delimiter: '.',
        prefix: 'R$ ',
        rawValueTrimPrefix: true
    });

    const searchInput = document.querySelector('.searchInput');

    // Remove todos os event listeners existentes substituindo o elemento por uma cópia
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);

    // Adiciona um event listener ao novo elemento da lista
    newSearchInput.addEventListener('input', function () {
        const filter = this.value.toLowerCase();
        const items = document.querySelectorAll('.listCollaborators li');

        items.forEach(function (item) {
            const text = item.textContent.toLowerCase();
            if (text.includes(filter)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });

    await eventConfirmPercentage(); // Configura o evento para confirmação de porcentagem
}

/**
 * Função para configurar o evento de confirmação de porcentagem
 */
async function eventConfirmPercentage() {
    const buttonConfirm = document.querySelector('.btnconfirmPercentage');

    buttonConfirm.addEventListener('click', async function () {
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

        min_value.value = 'R$ ';
        max_value.value = 'R$ ';
        percentage.value = '';

        $('#registerSettings').modal('hide');
        await registerPercentage(body);
    });
}

async function removeSettings(id){
     // Faz uma requisição para registrar a comissão
     const removeRegister = await makeRequest(`/api/headcargo/commission/removeSetting`, 'POST', {id:id}); 

     // Atualiza as configurações do vendedor pelo ID
    await getSettingsSellerById(commissionedID, commissionedName);


    createToast('Sirius', `Removido a configuração de porcentagem ${commissionedName} com sucesso!`);

    return removeRegister
}

/**
 * Função para registrar a porcentagem de comissão
 * @param {Object} data - Dados da comissão
 */
async function registerPercentage(data) {
    // Faz uma requisição para registrar a comissão
    const register = await makeRequest(`/api/headcargo/commission/registerPercentage`, 'POST', data);

    // Atualiza as configurações do vendedor pelo ID
    await getSettingsSellerById(commissionedID, commissionedName);
    return register;
}

/**
 * Função para listar colaboradores
 */
async function listCollaborators() {
    // Obtém a lista de vendedores e vendedores internos
    const getSales = await makeRequest(`/api/headcargo/user/ByDep/62`);
    const getInsideSales = await makeRequest(`/api/headcargo/user/ByDep/75`);

    // Combina as listas e remove duplicatas
    const mergedArray = getSales.concat(getInsideSales);
    const uniqueArray = mergedArray.filter((item, index, self) => {
        return self.findIndex((t) => t.IdFuncionario === item.IdFuncionario) === index;
    });

    let history = '';

    // Cria a lista de colaboradores
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
                                <span class="fs-12 text-muted"></span> 
                                <span class="d-block text-muted fs-12 fw-normal"></span> 
                            </div>
                        </div>
                    </li>`;
    }

    document.querySelector('.listCollaborators').innerHTML = history;

    const listCollaborators = document.querySelector('.listCollaborators');

    // Remove todos os event listeners existentes
    const newElement = listCollaborators.cloneNode(true);
    listCollaborators.parentNode.replaceChild(newElement, listCollaborators);

    newElement.addEventListener('click', async function (e) {
        if (e.target && e.target.closest('li')) {
            const item = e.target.closest('li');
            const id = item.getAttribute('data-idHeadCargo');
            const textName = item.querySelector('.nameColab').textContent;
            const list = document.querySelectorAll('.listCollaborators li');

            list.forEach(element => element.classList.remove('activeRef'));

            await getSettingsSellerById(id, textName);
            item.classList.add('activeRef');
        }
    });
}

/**
 * Função para formatar nomes
 * @param {string} nome - Nome a ser formatado
 * @returns {string} - Nome formatado
 */
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

    toast.addEventListener('hidden.bs.toast', function () {
        toastContainer.removeChild(toast); // Remove o toast do DOM quando ele for ocultado
    });
}
