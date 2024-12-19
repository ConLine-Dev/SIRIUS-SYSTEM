const table = [];
const socket = io();
let openedDetails = new Set();
let pageStatus = 'PENDING'
let currentGrouping = 'repurchases.process_id';

document.addEventListener("DOMContentLoaded", async () => {
    await generateTable();
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

    document.getElementById('groupByProcess').addEventListener('click', () => {
        currentGrouping = 'repurchases.process_id';
        generateTable(pageStatus, currentGrouping);
    });
    
    document.getElementById('groupByResponsavel').addEventListener('click', () => {
        currentGrouping = 'repurchases.created_by';
        generateTable(pageStatus, currentGrouping);
    });
});

// Esta função cria ou recria a tabela de controle de recompras
async function generateTable(status = 'PENDING', groupBy) {
    openedDetails = new Set();
    pageStatus = status
    groupBy = currentGrouping

    if ($.fn.DataTable.isDataTable('#table_repurchase_user')) {
        $('#table_repurchase_user').DataTable().destroy();
    }

    const userLogged = await getInfosLogin();

    // Define o título da coluna com base no agrupamento
    const columnTitle = groupBy === 'repurchases.created_by' ? 'Responsável' : 'Processo';

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
                data: 'creation_date',
                render: function (data) {
                    return formatarData(data);
                },
            }
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
            showRepurchaseDetails(processId, pageStatus);
        });
    });
}

// Função para mostrar os detalhes das taxas de recompra de um processo específico
async function showRepurchaseDetails(processId, status, button) {
    try {
        if(button){
            button.setAttribute('disabled', 'true');
        }
        console.log(processId, status)
        const userLogged = await getInfosLogin();
        
        const details = await makeRequest(`/api/headcargo/repurchase-management/GetFeesByProcess`, 'POST', { processId, status, groupBy:currentGrouping });

        // Função auxiliar para formatar moeda BRL
        function formatCurrency(value, currency) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
        }

         // Função auxiliar para formatar células com estilos específicos
         function formatValueCell(value, oldValue, currency, isPurchase, status) {
            const valueChanged = value !== oldValue;
            const badgeClass = valueChanged ? 'text-danger' : isPurchase ? status == 'PENDING' ? 'text-muted' : '' : status == 'PENDING' ? 'text-muted' : '';
            const formattedValue = formatCurrency(value, currency);
            return `<span class="${badgeClass}">${formattedValue}</span>`;
        }

        function generateActionButtons(fee) {
            if (fee.status === 'PENDING') {
                return `
                    <a href="javascript:void(0);" class="btn btn-sm btn-danger" title="Rejeitar" onclick="alterStatus(${fee.id},'REJECTED')">Rejeitar</a>
                    <a href="javascript:void(0);" class="btn btn-sm btn-success" title="Aprovar" onclick="alterStatus(${fee.id},'APPROVED')">Aprovar</a>
                `;
            }else if(fee.status === 'APPROVED'){
                return `
                    <a href="javascript:void(0);" class="btn btn-sm btn-danger" title="Cancelar" onclick="alterStatus(${fee.id},'REJECTED')">Rejeitar</a>
                `;
            }
            return '';
        }


        // Mapeamento de status
        const statusMap = {
            'PENDING': 'Pendente',
            'APPROVED': 'Aprovado',
            'REJECTED': 'Rejeitado',
            'CANCELED': 'Cancelado',
            'PAID': 'Pago',
        };

        // Gera as linhas de detalhes
        const detailRows = details.map(fee => {
            fee.old_sale_value = fee.old_sale_value ? fee.old_sale_value : 0;
            fee.old_purchase_value = fee.old_purchase_value ? fee.old_purchase_value : 0;
            fee.sale_value = fee.sale_value ? fee.sale_value : 0;
            fee.purchase_value = fee.purchase_value ? fee.purchase_value : 0;
            fee.coin_sale = fee.coin_sale ? fee.coin_sale : 'BRL';
            fee.coin_purchase = fee.coin_purchase ? fee.coin_purchase : 'BRL';
            
            const purchaseDifference = fee.purchase_value !== fee.old_purchase_value 
                ? formatCurrency(fee.old_purchase_value - fee.purchase_value, fee.coin_purchase) 
                : `<span class="${fee.status == 'PENDING' ? 'text-muted' : ''}"> - <span>`;
            const saleDifference = fee.sale_value !== fee.old_sale_value 
                ? formatCurrency(fee.sale_value - fee.old_sale_value, fee.coin_sale) 
                : `<span class="${fee.status == 'PENDING' ? 'text-muted' : ''}"> - <span>`;

                const oldPurchaseValueCell = formatValueCell(fee.old_purchase_value, fee.purchase_value, fee.coin_purchase, true, fee.status);
                const newPurchaseValueCell = formatValueCell(fee.purchase_value, fee.old_purchase_value, fee.coin_purchase, true, fee.status);
                const oldSaleValueCell = formatValueCell(fee.old_sale_value, fee.sale_value, fee.coin_sale, false, fee.status);
                const newSaleValueCell = formatValueCell(fee.sale_value, fee.old_sale_value, fee.coin_sale, false, fee.status);

                let styleDisabled = '';
                if (fee.status != 'PENDING') {
                    styleDisabled = 'background-color: #8699a399;';
                }
      

            const actionButtons = generateActionButtons(fee);

                return `
                <tr>
                    <td style="${styleDisabled}">${fee.fee_name}</td>
                    <td style="${styleDisabled}">${oldPurchaseValueCell}</td>
                    <td style="${styleDisabled}">${newPurchaseValueCell}</td>
                    <td style="${styleDisabled}"><span class="mb-0 fw-semibold">${purchaseDifference}</span></td>
                    <td style="${styleDisabled}">${oldSaleValueCell}</td>
                    <td style="${styleDisabled}">${newSaleValueCell}</td>
                    <td style="${styleDisabled}"><span class="mb-0 fw-semibold">${saleDifference}</span></td>
                    <td style="${styleDisabled}">${fee.fullName}</td>
                    <td style="${styleDisabled}">${formatarData(fee.creation_date)}</td>
                    <td style="${styleDisabled}">${statusMap[fee.status]}</td>
                    <td style="${styleDisabled}">${actionButtons}</td>
                </tr>
            `;
                    
        }).join('');

        // Define a estrutura da tabela de detalhes
        const detailTable = `
            <table class="table table-sm table-bordered mt-2">
                <thead>
                    <tr>
                        <th>Nome da Taxa</th>
                        <th>Antiga Compra</th>
                        <th>Nova Compra</th>
                        <th>Diferença Compra</th>
                        <th>Antiga Venda</th>
                        <th>Nova Venda</th>
                        <th>Diferença Venda</th>
                        <th>Responsável</th>
                        <th>Data de Criação</th>
                        <th>Status</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>${detailRows}</tbody>
            </table>
        `;

        // Exibe a tabela de detalhes abaixo da linha do processo
        const tableRow = $(`#table_repurchase_user tr[data-process-id="${processId}"]`);
        if (tableRow.next().hasClass('details-row')) {
            
            if(button){
                tableRow.next().remove(); // Remove a linha se já estiver exibida
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






async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    return JSON.parse(StorageGoogleData);
}

async function alterStatus(id, status) {
    // Mapeamento de status
    const statusMap = {
        'PENDING': 'Pendente',
        'APPROVED': 'Aprovado',
        'REJECTED': 'Rejeitado',
        'CANCELED': 'Cancelado',
        'PAID': 'Pago',
    };

    if(status != 'APPROVED'){
        Swal.fire({
            title: `Deseja realmente alterar o status para ${statusMap[status]}?`,
            showDenyButton: true,
            confirmButtonText: "Sim",
            denyButtonText: `Não`
        }).then(async (result) => {
            if (result.isDenied) {
                return;
            } else if (result.isConfirmed) {
                const userLogged = await getInfosLogin();
                await makeRequest('/api/headcargo/repurchase-management/UpdateRepurchaseStatus', 'POST', { repurchase_id: id, status: status, user_id: userLogged.system_collaborator_id });
            }
        });
    }else{
        const userLogged = await getInfosLogin();
        await makeRequest('/api/headcargo/repurchase-management/UpdateRepurchaseStatus', 'POST', { repurchase_id: id, status: status, user_id: userLogged.system_collaborator_id });
    }
 
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
