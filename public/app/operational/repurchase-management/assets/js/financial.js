const table = [];
const socket = io();
let openedDetails = new Set();
let pageStatus = 'APPROVED'
let currentGrouping = 'repurchases.created_by';
let type = 'all';
let choicesInstance;

document.addEventListener("DOMContentLoaded", async () => {
    await generateTable(pageStatus, currentGrouping);
    hideLoader();

    // socket.on('updateRepurchase', (data) => {
    //     table['table_repurchase_user'].ajax.reload(null, false);
    // });
    socket.on('updateRepurchase', (data) => {
        openedDetails = new Set([...document.querySelectorAll('.details-row')].map(row => row.previousSibling.dataset.processId));
        table['table_repurchase_user'].ajax.reload(null, false);
    });


    const filesType = document.querySelectorAll('.files-type');
    filesType.forEach((element, index) => {
        element.addEventListener('click', () => {
            filesType.forEach((el, i) => {
                if (i !== index) el.classList.remove('active');
            });
            element.classList.add('active');
        });
    });

    // document.getElementById('groupByProcess').addEventListener('click', () => {
    //     currentGrouping = 'repurchases.process_id';
    //     generateTable(pageStatus, currentGrouping);
    // });
    
    // document.getElementById('groupByResponsavel').addEventListener('click', () => {
    //     currentGrouping = 'repurchases.created_by';
    //     generateTable(pageStatus, currentGrouping);
    // });
});

// Esta função cria ou recria a tabela de controle de recompras
async function generateTable(status = 'PENDING', groupBy) {
    openedDetails = new Set();
    pageStatus = status
    groupBy = currentGrouping
    type = 'all';

    if ($.fn.DataTable.isDataTable('#table_repurchase_user')) {
        $('#table_repurchase_user').DataTable().destroy();
        $('#table_repurchase_user').empty(); // Remove o conteúdo da tabela
    }

    const userLogged = await getInfosLogin();

    // Define o título da coluna com base no agrupamento
    const columnTitle = groupBy === 'repurchases.created_by' ? 'Responsável' : 'Processo';


        const tableElement = document.querySelector('#table_repurchase_user');
        tableElement.innerHTML = `
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Processo</th>
                    <th scope="col">Recompras</th>
                    <th scope="col">Ação</th>
                </tr>
            </thead>
            <tbody></tbody>
        `;

    table['table_repurchase_user'] = $('#table_repurchase_user').DataTable({
        dom: 'frtip',
        paging: false,
        fixedHeader: true,
        info: false,
        scrollY: 'calc(100vh - 240px)',
        scrollCollapse: false,
        order: [[0, 'asc']],
        ajax: {
            url: `/api/headcargo/repurchase-management/GetRepurchases?status=${status}&groupBy=${groupBy}`,
            dataSrc: ''
        },
        columns: [
            {
                data: null,
                render: function (data, type, row) {
                    return `<button class="btn btn-sm btn-primary" onclick="showRepurchaseDetails(${groupBy === 'repurchases.process_id' ? row.process_id : row.created_by}, '${status}', this)">Ver Taxas</button>`;
                },
                orderable: false
            },
            { data: groupBy === 'repurchases.process_id' ? 'referenceProcess' : 'fullName', title: columnTitle },
            { data: 'repurchase_count' },
            {
                data: 'created_by',
                render: function (data, type, row) {
                    return ` <td colspan="1" style="text-align: left; color: gray; font-style: italic;">
                    <button class="btn btn-sm btn-primary" onclick="generatePDF(${data}, this)">PDF</button>
                    <button class="btn btn-sm btn-primary" onclick="sendPreview(${data})">Enviar Prévia</button>
                    </td>`;
                },
                orderable: false
            },
        ],
        createdRow: function (row, data, dataIndex) {
            $(row).attr('data-process-id', groupBy === 'repurchases.process_id' ? data.process_id : data.created_by);
        },
        buttons: ['excel', 'pdf', 'print'],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        },
    });

    // table['table_repurchase_user'].on('xhr.dt', function () {
    //     introMain();
    // });

    table['table_repurchase_user'].on('draw', function() {
        openedDetails.forEach(processId => {
            if(type === 'all'){
                showRepurchaseDetails(processId, pageStatus);
            }
        });
    });
    
}

// Esta função cria ou recria a tabela de controle de recompras
async function generateTablePayment() {
    openedDetails = new Set();
    type = 'payment';

    if ($.fn.DataTable.isDataTable('#table_repurchase_user')) {
        $('#table_repurchase_user').DataTable().destroy();
        $('#table_repurchase_user').empty(); // Remove o conteúdo da tabela
    }

    // const userLogged = await getInfosLogin();
   // Recria o thead
   const tableElement = document.querySelector('#table_repurchase_user');
   tableElement.innerHTML = `
       <thead>
           <tr>
               <th scope="col">#</th>
               <th scope="col">Comissionado</th>
               <th scope="col">Quantidade</th>
               <th scope="col">Aprovado por</th>
               <th scope="col">Data Pagamento</th>
               <th scope="col">Valor Recompras</th>
               <th scope="col">Comissão</th>
           </tr>
       </thead>
       <tbody></tbody>
   `;


    table['table_repurchase_user'] = $('#table_repurchase_user').DataTable({
        dom: 'frtip',
        paging: false,
        fixedHeader: true,
        info: false,
        scrollY: 'calc(100vh - 240px)',
        scrollCollapse: false,
        order: [[0, 'asc']],
        ajax: {
            url: `/api/headcargo/repurchase-management/GetRepurchasesPayment`,
            dataSrc: ''
        },
        columns: [
            {
                data: null,
                render: function (data, type, row) {
                    return `<button class="btn btn-sm btn-primary" onclick="showRepurchaseDetailsPayment('${row.unique_id}', this)">Ver mais</button>`;
                },
                orderable: false
            },
            { data: 'responsible' },
            { data: 'quant_recompras' },
            { data: 'fullNameAproved' },
            {
                data: 'payment_date',
                render: function (data, type, row) {
                    return formatarData(data);
                }
            },
            {
                data: 'total_recompra',
                render: function (data, type, row) {
                    return formatCurrencyNew(data, 'BRL');
                }
            },
            {
                data: 'valor_comissao',
                render: function (data, type, row) {
                    return formatCurrencyNew(data, 'BRL');
                }
            }
        ],
        createdRow: function (row, data, dataIndex) {
            $(row).attr('data-unique_id', data.unique_id);
        },
        buttons: ['excel', 'pdf', 'print'],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        },
    });

    // table['table_repurchase_user'].on('xhr.dt', function () {
    //     introMain();
    // });

    table['table_repurchase_user'].on('draw', function() {
        openedDetails.forEach(processId => {
            if(type === 'payment'){
                showRepurchaseDetailsPayment(processId);
            }
        });
    });
}

// Função para mostrar os detalhes das taxas de recompra de um processo específico
async function showRepurchaseDetails(processId, status, button) {
    try {
        if(button){
            button.setAttribute('disabled', 'true');
        }
        const userLogged = await getInfosLogin();
        
        const AllRepurchase = await makeRequest(`/api/headcargo/repurchase-management/get-value-and-rate-by-repurchase`, 'POST', { userID:processId, status: status});
        console.log(AllRepurchase)
        const details = AllRepurchase.fees;
        // Função auxiliar para formatar moeda BRL
        function formatCurrency(value, currency) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
        }

       
        let totalPurchase = 0;
        console.log(details)

        // Gera as linhas de detalhes
        let detailRows = details.map(fee => {

                let styleDisabled = '';
                if (fee.status != 'PENDING') {
                    styleDisabled = 'background-color: #8699a399;';
                }

            const actionButtons = fee.status === 'PENDING'
                ? `<a href="javascript:void(0);" class="btn btn-sm btn-danger-light" title="Rejeitar" onclick="alterStatus(${fee.id},'REJECTED')">Rejeitar</a>
                   <a href="javascript:void(0);" class="btn btn-sm btn-success-light" title="Aprovar" onclick="alterStatus(${fee.id},'APPROVED')">Aprovar</a>
                   `
                : '';

                totalPurchase += (fee.sale_value - fee.old_sale_value) + (fee.old_purchase_value - fee.purchase_value)

                let row = `
                <tr data-id="${fee.id}">
                    <td style="${styleDisabled}"><span style="cursor: pointer" class="d-block fw-bold fs-15 text-warning" onclick="OpenDetailsProcess('${fee.process_id}',this)">${fee.referenceProcess}</span></td>
                    <td style="${styleDisabled}">${fee.fullpaidFormated}</td>
                    <td style="${styleDisabled}">${fee.fee_name}</td>
                    <td style="${styleDisabled}">${fee.oldPurchaseValueCell}</td>
                    <td style="${styleDisabled}">${fee.newPurchaseValueCell}</td>
                    <td style="${styleDisabled}">${fee.purchaseFactor != 'Sem Fator' ? (fee.purchaseFactor).toFixed(4) : '1'}</td>
                    <td style="${styleDisabled}"><span class="mb-0 fw-semibold">${fee.purchaseDifferenceFormated} ${fee.purchaseFactor != 'Sem Fator' ? '['+fee.purchaseDifferenceConvertedFormated+']' : ''}</span></td>
                    <td style="${styleDisabled}">${fee.oldSaleValueCell} </td>
                    <td style="${styleDisabled}">${fee.newSaleValueCell} </td>
                    <td style="${styleDisabled}">${fee.saleFactor != 'Sem Fator' ? (fee.saleFactor).toFixed(4) : '1'}</td>
                    <td style="${styleDisabled}"><span class="mb-0 fw-semibold">${fee.saleDifferenceFormated} ${fee.saleFactor != 'Sem Fator' ? '['+fee.saleDifferenceConvertedFormated+']' : ''}</span></td>
                    <td style="${styleDisabled}">${fee.fullNameAproved}</td>
                    <td style="${styleDisabled}">${fee.approved_date}</td>
                    <td style="${styleDisabled}">${fee.status}</td>
                </tr>
            `;


            // Linha adicional para 'reason', se existir
            if (fee.reason) {
                row += `
                    <tr>
                        <td colspan="14" style="border-left: 4px solid #28a745; text-align: center; padding: 10px;">
                            <strong style="font-size: 0.8em; display: block; margin-bottom: 2px;opacity:0.5">↑ Observação da Recompra ↑</strong>
                            <span style="font-size: 1em;">${fee.reason}</span>
                        </td>
                    </tr>
                `;
            }

            return row;
                    
        }).join('');

        
        detailRows += `
            <tr>
                <td colspan="12" style="text-align: left; color: gray; font-style: italic;">
                     
                </td>
                <td colspan="1" style="text-align: right; color: gray; font-style: italic;">
                      Total de Recompras
                </td>
                <td colspan="1" style="text-align: left; color: gray; font-style: italic;">
                    ${AllRepurchase.totalRepurchaseFomated}
                </td>
            </tr>
          
            <tr>
            <td colspan="13" style="text-align: left; color: gray; font-style: italic;">
                 
            </td>
            <td colspan="1" style="text-align: left; color: gray; font-style: italic;">
            <button style="width: 100%" class="btn btn-sm btn-primary" onclick="markAsPaid(this)">Efetuar Baixa</button>
            </td>
        </tr>
        `;


        // Define a estrutura da tabela de detalhes
        const detailTable = `
            <table class="table table-sm table-bordered mt-2">
                <thead>
                    <tr>
                        <th>Processo</th>
                        <th>Lucro</th>
                        <th>Nome da Taxa</th>
                        <th>Antiga Compra</th>
                        <th>Nova Compra</th>
                        <th>Fator</th>
                        <th>Diferença Compra</th>
                        <th>Antiga Venda</th>
                        <th>Nova Venda</th>
                        <th>Fator</th>
                        <th>Diferença Venda</th>
                        <th>Aprovado por</th>
                        <th>Data Aprovação</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>${detailRows}</tbody>
            </table>
        `;

        // Exibe a tabela de detalhes abaixo da linha do processo
        const tableRow = $(`#table_repurchase_user tr[data-process-id="${processId}"]`);
        if (tableRow.next().hasClass('details-row')) {
            tableRow.next().remove(); // Remove a linha se já estiver exibida
            if(button){
                button.removeAttribute('disabled');
                button.innerHTML = 'Ver Taxas';
            }
        } else {
            tableRow.after(`<tr class="details-row"><td colspan="10">${detailTable}</td></tr>`);
            if(button){
                button.removeAttribute('disabled');
                button.innerHTML = 'Ocultar Taxas';
            }
        }
    } catch (error) {
        console.error('Erro ao buscar detalhes das taxas:', error);
        if(button){
            button.removeAttribute('disabled');
        }
    }
}

async function OpenDetailsProcess(process_id){
    // Obtém o tamanho da tela
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Calcula a posição central
    const width = screenWidth / 1.8;
    const height = screenHeight / 1.2;

    openWindow('/app/operational/repurchase-management/open-process?processId='+process_id, width, height);
    // const process = await makeRequest('/api/headcargo/repurchase-management/GetRepurchasesInfoProcess?process_id='+process_id);
    // console.log(process)
    
    
}

// Função para mostrar os detalhes das taxas de recompra de um processo específico
async function showRepurchaseDetailsPayment(unique_id, button) {
    try {
        console.log(button)
        if(button){
            button.setAttribute('disabled', 'true');
        }
        const userLogged = await getInfosLogin();
        
        const AllRepurchase = await makeRequest(`/api/headcargo/repurchase-management/GetRepurchasesPaymentDetails`, 'POST', { unique_id:unique_id});

        console.log(AllRepurchase)
        // Gera as linhas de detalhes
        let detailRows = AllRepurchase.map(fee => {

                return `
                <tr data-id="${fee.fee_id}" data-repurchasesID="${fee.id}" data-unique_id="${fee.unique_id}">
                    <td>${fee.reference_process}</td>
                    <td>${fee.fullpaid_formated}</td>
                    <td>${fee.fee_name}</td>
                    <td>${fee.old_purchase_value_cell}</td>
                    <td>${fee.new_purchase_value_cell}</td>
                    <td>${fee.purchase_factor}</td>
                    <td>${fee.purchase_difference_formated}</td>
                    <td>${fee.old_sale_value_cell}</td>
                    <td>${fee.new_sale_value_cell}</td>
                    <td>${fee.sale_factor}</td>
                    <td>${fee.sale_difference_formated}</td>
                    <td>${fee.fullNameAproved}</td>
                    <td>${formatarData(fee.payment_date)}</td>
                    <td>${fee.percent_repurchase_comission_formated}</td>
                    
                   
                </tr>
            `;


                    
        }).join('');

        detailRows += `
        <tr>
        <td colspan="13" style="text-align: left; color: gray; font-style: italic;">
             
        </td>
        <td colspan="1" style="text-align: left; color: gray; font-style: italic;">
        <button style="width: 100%" class="btn btn-sm btn-primary" onclick="revertPayment(this)">Reverter Baixa</button>
        </td>
    </tr>
    `;

   

        // Define a estrutura da tabela de detalhes
        const detailTable = `
            <table class="table table-sm table-bordered mt-2">
                <thead>
                    <tr>
                        <th>Processo</th>
                        <th>Lucro</th>
                        <th>Nome da Taxa</th>
                        <th>Antiga Compra</th>
                        <th>Nova Compra</th>
                        <th>Fator</th>
                        <th>Diferença Compra</th>
                        <th>Antiga Venda</th>
                        <th>Nova Venda</th>
                        <th>Fator</th>
                        <th>Diferença Venda</th>
                        <th>Aprovado por</th>
                        <th>Data Aprovação</th>
                        <th>Comissão</th>
                    </tr>
                </thead>
                <tbody>${detailRows}</tbody>
            </table>
        `;

        // Exibe a tabela de detalhes abaixo da linha do processo
        const tableRow = $(`#table_repurchase_user tr[data-unique_id="${unique_id}"]`);
        if (tableRow.next().hasClass('details-row')) {
            tableRow.next().remove(); // Remove a linha se já estiver exibida
            if(button){
                button.removeAttribute('disabled');
                button.innerHTML = 'Ver Taxas';
            }
        } else {
            tableRow.after(`<tr class="details-row"><td colspan="10">${detailTable}</td></tr>`);
            if(button){
                button.removeAttribute('disabled');
                button.innerHTML = 'Ocultar Taxas';
            }
        }
    } catch (error) {
        if(button){
            button.removeAttribute('disabled');
        }
        console.error('Erro ao buscar detalhes das taxas:', error);
    }
}

function addItemOnCustomKeyPress(value) {
    console.log(value)
	const addItemCharacters = ',; ';
  if (choicesInstance && value && addItemCharacters.includes(value.slice(-1))) {
    choicesInstance.setValue([value.slice(0, -1)]);
    choicesInstance.clearInput();
  }
}


async function sendPreview(userID){

// alert('dsads')

    const collaborators = await makeRequest(`/api/collaborators-management/collaborators/${userID}`);
   
    const register = collaborators.collaborator
            console.log(register)  
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

       
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            // const selectedEmails = Array.from(document.getElementById('emailSelect').selectedOptions).map(option => option.value);
            const emails = choicesInstance.getValue(true)
            // Função de envio do email
            // await sendEmailRegisterComissionByColab(emails);
    
            await makeRequest('/api/headcargo/repurchase-management/send-preview', 'POST', { userID: userID, destination: emails });
            // createToast('Sirius', `Registro de comissões enviado com sucesso para: ${selectedEmails.join(', ')}`);
        }
    });

    // 

}

async function markAsPaid(button) {
    try {
        // Desabilita o botão
        button.setAttribute('disabled', 'true');
        button.innerText = 'Processando...';

        // Captura todos os IDs das recompras listadas na tabela
        const rows = button.closest('table').querySelectorAll('tr[data-id]');
        const repurchaseIds = Array.from(rows).map(row => row.dataset.id);

        if (repurchaseIds.length === 0) {
            alert('Nenhuma recompra disponível para alteração.');
            return;
        }
        console.log(repurchaseIds)

        // Envia os IDs ao servidor
        const response = await fetch('/api/headcargo/repurchase-management/mark-as-paid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: repurchaseIds })
        });

        if (response.ok) {
            alert('Recompras marcadas como pagas com sucesso!');
            button.innerText = 'Concluído';
            table['table_repurchase_user'].ajax.reload(null, false); // Atualiza a tabela
        } else {
            alert('Erro ao marcar recompra(s) como pagas.');
            button.removeAttribute('disabled');
            button.innerText = 'Efetuar Baixa';
        }
    } catch (error) {
        console.error('Erro ao marcar recompra(s) como pagas:', error);
        button.removeAttribute('disabled');
        button.innerText = 'Efetuar Baixa';
    }
}


async function generatePDF(userID, e) {
    try {
        e.setAttribute('disabled', true);
        const response = await fetch('/api/headcargo/repurchase-management/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userID: userID }),
        });

        if (response.ok) {
            const blob = await response.blob();

            // Criar uma URL temporária para o Blob
            const pdfUrl = URL.createObjectURL(blob);

            // Abrir o PDF em uma nova aba
            window.open(pdfUrl, '_blank');
        } else {
            console.error('Erro ao gerar o PDF');
        }
        e.removeAttribute('disabled');
    } catch (error) {
        e.removeAttribute('disabled');
        console.error('Erro:', error);
    }
}

async function revertPayment(button) {
    try {
        // Desabilita o botão
        button.setAttribute('disabled', 'true');
        button.innerText = 'Processando...';

        // Captura todos os IDs das recompras listadas na tabela
        const rows = button.closest('table').querySelectorAll('tr[data-repurchasesID]');
        const repurchaseIds = Array.from(rows).map(row => row.dataset.repurchasesID);
        const repurchaseUniques = Array.from(rows).map(row => row.dataset.unique_id);

        if (repurchaseUniques.length === 0) {
            alert('Nenhuma recompra disponível para reversão.');
            return;
        }

        if (repurchaseIds.length === 0) {
            alert('Nenhuma recompra disponível para reversão.');
            return;
        }

        // Envia os IDs ao servidor
        const response = await fetch('/api/headcargo/repurchase-management/revert-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: repurchaseIds, uniques:repurchaseUniques })
        });

        if (response.ok) {
            alert('Pagamentos revertidos com sucesso!');
            button.innerText = 'Concluído';
            table['table_repurchase_user'].ajax.reload(null, false); // Atualiza a tabela
        } else {
            alert('Erro ao reverter pagamento(s).');
            button.removeAttribute('disabled');
            button.innerText = 'Reverter Pagamento';
        }
    } catch (error) {
        console.error('Erro ao reverter pagamento(s):', error);
        button.removeAttribute('disabled');
        button.innerText = 'Reverter Pagamento';
    }
}







async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    return JSON.parse(StorageGoogleData);
}

async function alterStatus(id, status) {
    const userLogged = await getInfosLogin();
    await makeRequest('/api/headcargo/repurchase-management/UpdateRepurchaseStatus', 'POST', { repurchase_id: id, status: status, user_id: userLogged.system_collaborator_id });
}

function hideLoader() {
    document.querySelector('#loader2').classList.add('d-none');
}

function openNewrepurchase() {
    openWindow('/app/operational/repurchase-management/new-repurchase', 800, 600);
}

function openWindow(url, width, height) {
    window.open(url, '_blank', `width=${width},height=${height},resizable=yes`);
}

function formatarData(dataISO) {
    const data = new Date(dataISO);
    // Subtrai 3 horas da data
    data.setHours(data.getHours() - 3);

    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatCurrencyNew(value, currency) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
}
