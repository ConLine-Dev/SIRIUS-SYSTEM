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

// Variável
let toastCount = 0,commissionedID, commissionedName,commissionTotalProfitProcess,commissionType, commissionTotalComission,commissionLength, registerCommissionID;

/**
 * Evento que será disparado quando o DOM estiver completamente carregado,
 * mas antes que recursos adicionais (como imagens e folhas de estilo) sejam carregados.
 */
document.addEventListener("DOMContentLoaded", async () => {
  

    await listRegisters();
    await events();

    document.querySelector('#loader2').classList.add('d-none')

})



async function listRegisters(){
    const registers = await makeRequest(`/api/headcargo/commission/listRegister`,'POST');

    let history = ''

    for (let index = 0; index < registers.length; index++) {
        const element = registers[index];

        history += `<li class="list-group-item" data-ComissionID="${element.id}">
                        <div class="d-flex align-items-center justify-content-between  flex-wrap">
                            <div class="d-flex align-items-center gap-2">
                                <div> <span class="avatar bg-light"> <img src="https://cdn.conlinebr.com.br/colaboradores/${element.user}" alt=""> </span> </div>
                                <div> 
                                    <span class="d-block fw-semibold">${formatarNome(element.name+' '+element.family_name)} ${element.status == 0 ? '<i title="Comissão não foi paga" class="bi bi-patch-exclamation-fill text-danger ms-2"></i>' : '<i title="Comissão paga" class="bi bi-patch-check-fill text-success ms-2"></i>'}</span> 
                                    <span class="d-block text-muted fs-12 fw-normal">${element.commissioned_type == 1 ? 'Vendedor' : 'Inside'}</span>
                                </div>
                            </div>

                            <div> 
                                <span class="fs-12 text-muted">Referência</span> 
                                <span class="d-block text-muted fs-12 fw-normal">${element.reference}</span> 
                            </div>
                        </div>
                    </li>`
    }


  document.querySelector('.listHistory').innerHTML = history
  

    
}

async function events() {
    const listHistory = document.querySelector('.listHistory');
    
    // Remove todos os event listeners existentes
    const newElement = listHistory.cloneNode(true);
    listHistory.parentNode.replaceChild(newElement, listHistory);

    newElement.addEventListener('click', async function(e) {
        if (e.target && e.target.closest('li')) {
            const item = e.target.closest('li');
            const id = item.getAttribute('data-comissionid');
            const list = document.querySelectorAll('.listHistory li');

            list.forEach(element => element.classList.remove('activeRef'));

            await getRegisterById(id);
            item.classList.add('activeRef');
        }
    });
}

async function getRegisterById(id){
    const register = await makeRequest(`/api/headcargo/commission/getRegisterById`,'POST', {id:id});
    console.log(register)
    const typeSales = register.data[0].commissioned_type == 1 ? 'Vendedor' : 'Inside'; 

    commissionedName = register.comissionUserName;
    commissionedID = register.comissionUserID;
    registerCommissionID = register.registerID
    commissionTotalProfitProcess = register.total_profit_process
    commissionTotalComission = register.total_comission
    commissionLength = (register.data).length;
    commissionType = typeSales

    await createTableRegisters(register.data, register.comissionUserName, typeSales)


    
    const img = document.querySelector('.imgComissionado'); // Seleciona o elemento da imagem do comissionado
    const name = document.querySelector('.nameComissionado'); // Seleciona o elemento do nome do comissionado
    const type = document.querySelector('.typeComission'); // Seleciona o elemento do tipo de comissão

    type.textContent = ` [${typeSales}]`; // Define o texto do tipo de comissão
    name.textContent = register.comissionUserName; // Define o texto do nome do comissionado
    img.innerHTML = ''; // Limpa o conteúdo do elemento da imagem
    img.style.backgroundImage = `url(https://cdn.conlinebr.com.br/colaboradores/${register.comissionUserID})`; // Define a imagem de fundo com a URL do colaborador
    img.style.backgroundPosition = 'center'; // Centraliza a imagem de fundo
    img.style.backgroundSize = 'cover'; // Ajusta a imagem de fundo para cobrir todo o elemento


    document.querySelector('.total_profit').textContent = register.total_profit_process; // Atualiza o total de lucro
    document.querySelector('.quantidade_processo').textContent = register.data.length; // Atualiza a quantidade de processos
    document.querySelector('.valor_Comissao_total').textContent = register.total_comission; // Atualiza o valor total da comissão
}  

async function createTableRegisters(registers, name, type){


    if ($.fn.DataTable.isDataTable('#table_commission_commercial')) {
        $('#table_commission_commercial').DataTable().destroy(); // Destrói a tabela DataTable existente
    }


    $('#table_commission_commercial').DataTable({
                layout: {
                    topStart: {
                        buttons: [
                            {
                                text: ' <i class="ri-file-list-2-line label-btn-icon me-2"></i> Confirmar Pagamento',
                                className: 'btn btn-primary label-btn btn-table-custom',
                                enabled: registers[0].status == "Em aberto" ? true : false,
                                action: async function (e, dt, node, config) {
                                    e.currentTarget.setAttribute('disabled', true)
                                    // Ação a ser executada ao clicar no botão
                                    await confirmPayment();

                                    createToast('Sirius', `Baixa de comissões para ${commissionedName} no valor total de ${commissionTotalComission} efetuada com sucesso!`); // Exibe uma mensagem de sucesso
                                    await getRegisterById(registerCommissionID)
                                    await listRegisters()
                                    await events();

                                    document.querySelector(`.listHistory li[data-comissionid="${registerCommissionID}"]`).classList.add('activeRef')
                                    
                                    



                                  
                                }
                            },
                            {
                                text: ' <i class="ri-file-list-2-line label-btn-icon me-2"></i> Enviar por E-mail',
                                className: 'btn btn-primary label-btn btn-table-custom',
                                enabled: true,
                                action: async function (e, dt, node, config) {
                                    createToast('Sirius', `Enviando registro de comissão por e-mail, não se preocupe, estamos fazendo tudo para você`); // Exibe uma mensagem de sucesso

                                    e.currentTarget.setAttribute('disabled', true)
                                    await sendEmailRegisterComission()
                                    createToast('Sirius', `Registro de comissões enviado com sucesso!`); // Exibe uma mensagem de sucesso
                                    setTimeout(() => {
                                        e.currentTarget.removeAttribute('disabled')
                                    }, 1000);
                                    // Ação a ser executada ao clicar no botão
                                }
                            },
                            {
                                text: ' <i class="ri-file-list-2-line label-btn-icon me-2"></i> Exportar para Excel',
                                className: 'btn btn-primary label-btn btn-table-custom',
                                enabled: true,
                                action: function (e, dt, node, config) {
                                    createToast('Sirius', `Analisando dados e gerando Excel`); // Exibe uma mensagem de sucesso
                                    e.currentTarget.setAttribute('disabled', true)
                                    exportToExcel(registers, `Registro de Comissão - ${name} - ${type}.xlsx`);
                                    // Ação a ser executada ao clicar no botão
                                    createToast('Sirius', `Registro de Comissão - ${name} - ${type}.xlsx gerado com sucesso!`); // Exibe uma mensagem de sucesso
                                    setTimeout(() => {
                                        e.currentTarget.removeAttribute('disabled')
                                    }, 1000);
                                }
                            }
                        ]
                    }
                },
                data:registers,
                paging: false,
                scrollX: true,
                scrollY: '60vh',
                pageInfo: false,
                bInfo: false,
                order: [[0, 'desc']],
                columns: [
                    { data: 'processo' }, // Coluna de processo
                    { data: 'modal' }, // Coluna de modal
                    { data: 'seller' }, // Coluna de abertura
                    { data: 'inside' }, // Coluna de data de compensação
                    { data: 'create_date' }, // Coluna de importador
                    { data: 'payment' }, // Coluna de tipo
                    { data: 'status' }, // Coluna de cliente
                    { data: 'ValueProfit' }, // Coluna de vendedor
                    { data: 'valueComission' }, // Coluna de inside
                    { data: 'byUser' }, // Coluna de inside
                ],
                language: {
                    url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
                    searchPlaceholder: 'Pesquisar...',
                    Search: '',
                }
    });
}

async function confirmPayment(data){

    const sendEmail = await makeRequest(`/api/headcargo/commission/confirmPayment`,'POST', {id:registerCommissionID});


    
}

async function sendEmailRegisterComission(){
    const data = {
        commissionedID:commissionedID,
        commissionedName:commissionedName,
        registerCommissionID:registerCommissionID,
        commissionTotalProfitProcess:commissionTotalProfitProcess,
        commissionType:commissionType,
        commissionTotalComission:commissionTotalComission,
        commissionLength:commissionLength
    }

    const sendEmail = await makeRequest(`/api/headcargo/commission/sendEmailRegisters`,'POST', data);

    return sendEmail;
}

function exportToExcel(data, fileName) {
     // Transformar os dados em um formato adequado para exportação
     var formattedData = data.map(function(row) {



        if(row.payment != 'Pendente'){
            const str = row.payment;
            const regex = /<span.*?>(.*?)<\/span>(.*)/;
            const match = str.match(regex);
            row.payment = match[2]; // 2024-06-17 16:09:01
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

    // Adicionar formatação à primeira linha (cabeçalho)
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({c: C, r: 0});
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

    // Adicionar bordas e alinhamento ao restante das células
    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell_address = XLSX.utils.encode_cell({c: C, r: R});
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
    
    XLSX.writeFile(wb, fileName);
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



