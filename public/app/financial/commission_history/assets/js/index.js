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
let toastCount = 0,choicesInstance, commissionedID, commissionedName, commissionTotalProfitProcess, commissionType, commissionTotalComission, commissionLength, registerCommissionID;

/**
 * Evento que será disparado quando o DOM estiver completamente carregado,
 * mas antes que recursos adicionais (como imagens e folhas de estilo) sejam carregados.
 */
document.addEventListener("DOMContentLoaded", async () => {
    // Lista os registros de comissão
    await listRegisters();
    // Configura os eventos
    await events();
    // Esconde o loader
    document.querySelector('#loader2').classList.add('d-none');
});

/**
 * Função para listar registros de comissão
 */
async function listRegisters() {
    // Faz uma requisição para obter os registros de comissão
    const registers = await makeRequest(`/api/headcargo/commission/listRegister`, 'POST');
    let history = '';

    // Itera sobre cada registro e cria o HTML correspondente
    for (let index = 0; index < registers.length; index++) {
        const element = registers[index];
        history += `<li class="list-group-item" data-ComissionID="${element.id}">
                        <div class="d-flex align-items-center justify-content-between flex-wrap">
                            <div class="d-flex align-items-center gap-2">
                                <div> 
                                    <span class="avatar bg-light">
                                        <img src="https://cdn.conlinebr.com.br/colaboradores/${element.user}" alt="">
                                    </span>
                                </div>
                                <div> 
                                    <span class="d-block fw-semibold text-ellipsis">
                                    <span class="text">${formatarNome(element.name + ' ' + element.family_name)}</span>
                                    
                                    ${element.status == 0 ? 
                                        '<i title="Comissão pendente" class="bi bi-patch-exclamation-fill text-warning ms-2"></i>' 
                                    : element.status == 3 ?
                                        '<i title="Registro cancelado" class="bi bi-x-octagon-fill text-danger ms-2"></i>'
                                    :    
                                        '<i title="Comissão paga" class="bi bi-patch-check-fill text-success ms-2"></i>'
                                    }</span> 
                                    <span class="d-block text-muted fs-12 fw-normal">${element.commissioned_type == 1 ? 'Vendedor' : 'Inside'}</span>
                                </div>
                            </div>
                            <div> 
                                <span class="fs-12 text-muted">Referência</span> 
                                <span class="d-block text-muted fs-12 fw-normal">${element.reference}</span> 
                            </div>
                        </div>
                    </li>`;
    }

    // Atualiza o HTML da lista de histórico com os registros gerados
    document.querySelector('.listHistory').innerHTML = history;
}

/**
 * Função para configurar os eventos na lista de histórico
 */
async function events() {
    const listHistory = document.querySelector('.listHistory');
    
    // Remove todos os event listeners existentes substituindo o elemento por uma cópia
    const newElement = listHistory.cloneNode(true);
    listHistory.parentNode.replaceChild(newElement, listHistory);

    // Adiciona um event listener ao novo elemento da lista
    newElement.addEventListener('click', async function(e) {
        if (e.target && e.target.closest('li')) {
            const item = e.target.closest('li'); // Obtém o item da lista clicado
            const id = item.getAttribute('data-comissionid'); // Obtém o ID do item
            const list = document.querySelectorAll('.listHistory li');

            // Remove a classe 'activeRef' de todos os itens da lista
            list.forEach(element => element.classList.remove('activeRef'));

            // Obtém os detalhes do registro pelo ID e adiciona a classe 'activeRef' ao item clicado
            await getRegisterById(id);
            item.classList.add('activeRef');
        }
    });


    const searchInput = document.querySelector('.searchInput')

    // Remove todos os event listeners existentes substituindo o elemento por uma cópia
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);

    // Adiciona um event listener ao novo elemento da lista
    newSearchInput.addEventListener('input', function() {
        var filter = this.value.toLowerCase();
        var items = document.querySelectorAll('.listHistory li');

        items.forEach(function(item) {
            var text = item.textContent.toLowerCase();
            if (text.includes(filter)) {
                item.style.display = 'block'
            } else {
                item.style.display = 'none'
            }
        });
    });



  // Adiciona um event listener ao novo elemento da lista
  document.querySelector('#btnExtrato').addEventListener('click', function() {
    const body = {
        url: `/app/financial/commission_extract`,
        max:true
    }
    window.ipcRenderer.invoke('open-exWindow', body);
  });
    
}

/**
 * Função para obter os detalhes de um registro de comissão pelo ID
 * @param {string} id - ID do registro de comissão
 */
async function getRegisterById(id) {
    // Mostra o loader
    document.querySelector('#loader2').classList.remove('d-none')


    // Faz uma requisição para obter os detalhes do registro pelo ID
    const register = await makeRequest(`/api/headcargo/commission/getRegisterById`, 'POST', { id: id });

    const typeSales = register.data[0].commissioned_type == 1 ? 'Vendedor' : 'Inside';

    // Atualiza as variáveis globais com os dados do registro
    commissionedName = register.comissionUserName;
    commissionedID = register.comissionUserID;
    registerCommissionID = register.registerID;
    commissionTotalProfitProcess = register.total_profit_process;
    commissionTotalComission = register.total_comission;
    commissionLength = register.data.length;
    commissionType = typeSales;

    // Cria a tabela de registros de comissão
    await createTableRegisters(register.data, register.comissionUserName, typeSales);

    // Atualiza os detalhes do comissionado no DOM
    const img = document.querySelector('.imgComissionado');
    const name = document.querySelector('.nameComissionado');
    const type = document.querySelector('.typeComission');

    type.textContent = ` [${typeSales}]`;
    name.textContent = register.comissionUserName;
    img.innerHTML = '';
    img.style.backgroundImage = `url(https://cdn.conlinebr.com.br/colaboradores/${register.comissionUserID})`;
    img.style.backgroundPosition = 'center';
    img.style.backgroundSize = 'cover';

    // Atualiza os totais no DOM
    document.querySelector('.total_profit').textContent = register.total_profit_process;
    document.querySelector('.quantidade_processo').textContent = register.data.length;
    document.querySelector('.valor_Comissao_total').textContent = register.total_comission;

    // Esconde o loader
    document.querySelector('#loader2').classList.add('d-none')
}

/**
 * Função para criar a tabela de registros de comissão
 * @param {Array} registers - Lista de registros de comissão
 * @param {string} name - Nome do comissionado
 * @param {string} type - Tipo de comissionado (Vendedor ou Inside)
 */
async function createTableRegisters(registers, name, type) {
    // Destrói a tabela DataTable existente, se houver
    if ($.fn.DataTable.isDataTable('#table_commission_commercial')) {
        $('#table_commission_commercial').DataTable().destroy();
    }

   
    // Inicializa a nova tabela DataTable
    $('#table_commission_commercial').DataTable({
        layout: {
            topStart: {
                buttons: [
                    {
                        text: ' <i class="ri-currency-line label-btn-icon me-2"></i> Confirmar Pagamento',
                        className: 'btn btn-success label-btn btn-table-custom',
                        enabled: registers[0].status_id == 0 ? true : false,
                        action: async function (e, dt, node, config) {

                            Swal.fire({
                                title: 'Confirmar baixa no registro?',
                                text: "Você tem certeza, isso não poderá ser desfeito!",
                                icon: 'question',
                                showCancelButton: true,
                                confirmButtonColor: '#3085d6',
                                cancelButtonColor: '#d33',
                                confirmButtonText: 'Sim, realizar baixa!'
                            }).then(async (result) => {
                                if (result.isConfirmed) {

                                    e.currentTarget.setAttribute('disabled', true);
                                    await confirmPayment();
                                    createToast('Sirius', `Baixa de comissões para ${commissionedName} no valor total de ${commissionTotalComission} efetuada com sucesso!`);
                                    await getRegisterById(registerCommissionID);
                                    await listRegisters();
                                    await events();
                                    document.querySelector(`.listHistory li[data-comissionid="${registerCommissionID}"]`).classList.add('activeRef');
                                
                                }
                            })
                        
                        }
                    },
                    {
                        text: ' <i class="ri-close-circle-line label-btn-icon me-2"></i> Cancelar',
                        className: 'btn btn-danger label-btn btn-table-custom',
                        enabled: registers[0].status_id == 0 ? true : false,
                        action: async function (e, dt, node, config) {
                            Swal.fire({
                                title: 'Cancelar registro?',
                                text: "Você tem certeza, isso não poderá ser desfeito!",
                                icon: 'question',
                                showCancelButton: true,
                                confirmButtonColor: '#3085d6',
                                cancelButtonColor: '#d33',
                                confirmButtonText: 'Sim, cancelar resgistro!'
                            }).then(async (result) => {
                                if (result.isConfirmed) {
                                    e.currentTarget.setAttribute('disabled', true);
                                    createToast('Sirius', `Cancelando resgistro...`);
                                    
                                    await cancelRegister()
                                    createToast('Sirius', `Registro cancelado com sucesso!`);
                                    await getRegisterById(registerCommissionID);
                                    await listRegisters();
                                    await events();
                                    document.querySelector(`.listHistory li[data-comissionid="${registerCommissionID}"]`).classList.add('activeRef');
                                    setTimeout(() => {
                                        e.currentTarget.removeAttribute('disabled');
                                    }, 1000);
                                
                                }
                            })
                        }
                    },
                    {
                        text: ' <i class="ri-mail-send-fill label-btn-icon me-2"></i> Enviar por E-mail',
                        className: 'btn btn-secondary label-btn btn-table-custom',
                        enabled: true,
                        action: async function (e, dt, node, config) {

                            Swal.fire({
                                title: 'Deseja enviar esse registro por email?',
                                text: "Este email por padrão será enviado para comissao-adm@conlinebr.com.br!",
                                icon: 'question',
                                showCancelButton: true,
                                confirmButtonColor: '#3085d6',
                                cancelButtonColor: '#d33',
                                confirmButtonText: 'Sim, enviar email!'
                            }).then(async (result) => {
                                if (result.isConfirmed) {
                                    e.currentTarget.setAttribute('disabled', true);
                                    createToast('Sirius', `Enviando registro de comissão por e-mail, não se preocupe, estamos fazendo tudo para você`);
                                    
                                    await sendEmailRegisterComission();
                                    createToast('Sirius', `Registro de comissões enviado com sucesso!`);
                                    setTimeout(() => {
                                        e.currentTarget.removeAttribute('disabled');
                                    }, 1000);
                                
                                }
                            })
                           
                        }
                    },
                    {
                        text: ' <i class="ri-mail-send-fill label-btn-icon me-2"></i> E-mail Comissionado',
                        className: 'btn btn-secondary label-btn btn-table-custom',
                        enabled: true,
                        action: async function (e, dt, node, config) {
                            const register = await makeRequest(`/api/collaborators-management/collaboratorsByHeadCargo/${commissionedID}`);
                
                            Swal.fire({
                                title: 'Deseja enviar esse registro por email?',
                                html: `
                                    <label for="emailSelect">Selecione ou adicione emails:</label>
                                    <select id="emailSelect" name="emails" class="choices-multiple" multiple>
                                        <option value="${register.email_personal}" selected>${register.email_personal}</option>
                                        <option value="${register.email_business}">${register.email_business}</option>
                                    </select>
                                `,
                                showCancelButton: true,
                                confirmButtonText: 'Sim, enviar email!',
                                cancelButtonText: 'Cancelar',
                                customClass: {
                                    popup: 'custom-swal-width custom-swal-height',
                                },
                                didOpen: () => {
                                    const emailSelect = document.getElementById('emailSelect');
                                    choicesInstance = new Choices(emailSelect, {
                                        addItems: true,
                                        addChoices: true,
                                        removeItemButton: true,
                                        duplicateItemsAllowed: false,  // Não permite emails duplicados
                                        editItems: true,
                                        allowHTML: true,
                                        customAddItemText: (value) => {
                                            // Condição específica para emails válidos
                                            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                            if (!emailPattern.test(value)) {
                                                return `O valor <b>"${value}"</b> não é um email válido`;
                                            }
                                        },
                                        addItemText: (value) => {
                                            return `Pressione Enter para adicionar o email <b>"${value}"</b>`;
                                          },
                                        noResultsText: 'Nenhum resultado encontrado',
                                        noChoicesText: 'Sem opções disponíveis',
                                        itemSelectText: 'Clique para selecionar',
                                        // Verificação do email
                                        addItemFilter: (value) => {
                                            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                            return emailPattern.test(value);
                                        }
                                    });
                            
                                },
                            }).then(async (result) => {
                                if (result.isConfirmed) {
                                    // const selectedEmails = Array.from(document.getElementById('emailSelect').selectedOptions).map(option => option.value);
                                    const emails = choicesInstance.getValue(true)
                                    // Função de envio do email
                                    await sendEmailRegisterComissionByColab(emails);
                            
                                    createToast('Sirius', `Registro de comissões enviado com sucesso para: ${selectedEmails.join(', ')}`);
                                }
                            });
                            
                        }
                    },
                    {
                        text: ' <i class="ri-file-excel-2-line label-btn-icon me-2"></i> Exportar para Excel',
                        className: 'btn btn-secondary label-btn btn-table-custom',
                        enabled: true,
                        action: function (e, dt, node, config) {
                            e.currentTarget.setAttribute('disabled', true);
                            createToast('Sirius', `Analisando dados e gerando Excel`);
                            
                            exportToExcel(registers, `Registro de Comissão - ${name} - ${type}.xlsx`);
                            createToast('Sirius', `Registro de Comissão - ${name} - ${type}.xlsx gerado com sucesso!`);
                            setTimeout(() => {
                                e.currentTarget.removeAttribute('disabled');
                            }, 1000);
                        }
                    }
                ]
            }
        },
        data: registers,
        paging: false,
        scrollX: true,
        scrollY: '60vh',
        pageInfo: false,
        bInfo: false,
        order: [[0, 'desc']],
        columns: [
            { data: 'processo' },
            { data: 'modal' },
            { data: 'seller' },
            { data: 'inside' },
            { data: 'create_date' },
            { data: 'payment' },
            { data: 'status' },
            { data: 'ValueProfit' },
            { data: 'valueComission' },
            { data: 'byUser' }
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
        }
    });
}


function addItemOnCustomKeyPress(value) {
    console.log(value)
	const addItemCharacters = ',; ';
  if (choicesInstance && value && addItemCharacters.includes(value.slice(-1))) {
    choicesInstance.setValue([value.slice(0, -1)]);
    choicesInstance.clearInput();
  }
}

/**
 * Função para cancelar o registro de pagamento de uma comissão
 */
async function cancelRegister() {
    // Faz uma requisição para confirmar o pagamento pelo ID do registro
    const sendEmail = await makeRequest(`/api/headcargo/commission/cancelRegister`, 'POST', { id: registerCommissionID });
    return sendEmail
}

/**
 * Função para confirmar o pagamento de uma comissão
 */
async function confirmPayment() {
    // Faz uma requisição para confirmar o pagamento pelo ID do registro
    const sendEmail = await makeRequest(`/api/headcargo/commission/confirmPayment`, 'POST', { id: registerCommissionID });
}

/**
 * Função para enviar o registro de comissão por e-mail
 */
async function sendEmailRegisterComission() {
    // Cria um objeto com os dados da comissão
    const data = {
        commissionedID: commissionedID,
        commissionedName: commissionedName,
        registerCommissionID: registerCommissionID,
        commissionTotalProfitProcess: commissionTotalProfitProcess,
        commissionType: commissionType,
        commissionTotalComission: commissionTotalComission,
        commissionLength: commissionLength
    };

    // Faz uma requisição para enviar o registro de comissão por e-mail
    const sendEmail = await makeRequest(`/api/headcargo/commission/sendEmailRegisters`, 'POST', data);
    return sendEmail;
}

/**
 * Função para enviar o registro de comissão por e-mail
 */
async function sendEmailRegisterComissionByColab(email) {
    // Cria um objeto com os dados da comissão
    const data = {
        commissionedID: commissionedID,
        commissionedName: commissionedName,
        registerCommissionID: registerCommissionID,
        commissionTotalProfitProcess: commissionTotalProfitProcess,
        commissionType: commissionType,
        commissionTotalComission: commissionTotalComission,
        commissionLength: commissionLength,
        email:email
    };

    // Faz uma requisição para enviar o registro de comissão por e-mail
    const sendEmail = await makeRequest(`/api/headcargo/commission/sendEmailRegistersByColab`, 'POST', data);
    return sendEmail;
}

/**
 * Função para exportar os registros de comissão para um arquivo Excel
 * @param {Array} data - Dados a serem exportados
 * @param {string} fileName - Nome do arquivo Excel
 */
function exportToExcel(data, fileName) {
    // Formata os dados para exportação
    var formattedData = data.map(function(row) {
        if (row.payment != 'Pendente') {
            const str = row.payment;
            const regex = /<span.*?>(.*?)<\/span>(.*)/;
            const match = str.match(regex);
            row.payment = match[2]; // Extrai a data de pagamento do HTML
        }
        return {
            "Modal": row.modal,
            "Processo": row.processo,
            "Pago em": row.payment,
            "Vendedor": row.seller,
            "Inside": row.inside,
            "Profit": row.ValueProfit,
            "Comissão": row.valueComission,
            "Criado em": row.create_date,
            "Gerado por": row.byUser,
            "Status": row.status,
            "Tipo de Comissão": row.commissioned_type == 1 ? 'Vendedor' : 'Inside'
        };
    });

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Registro`);

    // Adiciona formatação ao cabeçalho
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ c: C, r: 0 });
        if (!ws[cell_address]) continue;
        ws[cell_address].s = {
            font: {
                bold: true,
                color: { rgb: "FFFFFF" }
            },
            fill: {
                fgColor: { rgb: "4F81BD" }
            },
            alignment: {
                horizontal: "center",
                vertical: "center"
            },
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            }
        };
    }

    // Adiciona bordas e alinhamento ao restante das células
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = XLSX.utils.encode_cell({ c: C, r: R });
            if (!ws[cell_address]) continue;
            ws[cell_address].s = ws[cell_address].s || {};
            ws[cell_address].s.border = {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            };
            ws[cell_address].s.alignment = {
                horizontal: "center",
                vertical: "center"
            };
        }
    }
    
    // Escreve o arquivo Excel
    XLSX.writeFile(wb, fileName);
}

/**
 * Função para formatar o nome do comissionado
 * @param {string} nome - Nome do comissionado
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
 * Função para criar um toast.
 * @param {string} title - Título do toast
 * @param {string} text - Texto do toast
 */
function createToast(title, text) {
    toastCount++;
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center border-0';
    toast.id = `toast-${toastCount}`;
    toast.role = 'alert';
    toast.ariaLive = 'assertive';
    toast.ariaAtomic = 'true';
    toast.dataset.bsDelay = '5000';

    const toastHeader = document.createElement('div');
    toastHeader.className = 'toast-header text-bg-danger';
    toastHeader.innerHTML = `
        <strong class="me-auto">${title}</strong>
        <small>Agora mesmo</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
    `;

    const toastBody = document.createElement('div');
    toastBody.className = 'toast-body';
    toastBody.innerText = text;

    toast.appendChild(toastHeader);
    toast.appendChild(toastBody);

    const toastContainer = document.getElementById('toast-container');
    toastContainer.appendChild(toast);

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', function() {
        toastContainer.removeChild(toast);
    });
}
