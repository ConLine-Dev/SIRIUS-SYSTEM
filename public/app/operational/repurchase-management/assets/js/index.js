const table = [];
const socket = io();
let openedDetails = new Set();
let pageStatus = 'PENDING'



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
});

// Esta função cria ou recria a tabela de controle de recompras
async function generateTable(status = 'DRAFT') {
    openedDetails = new Set();
    pageStatus = status
    if ($.fn.DataTable.isDataTable('#table_repurchase_user')) {
        $('#table_repurchase_user').DataTable().destroy();
    }

    const userLogged = await getInfosLogin();

    table['table_repurchase_user'] = $('#table_repurchase_user').DataTable({
        dom: 'frtip',
        paging: false,
        fixedHeader: true,
        info: false,
        scrollY: 'calc(100vh - 240px)',
        scrollCollapse: false,
        order: [[0, 'asc']],
        ajax: {
            url: `/api/headcargo/repurchase-management/GetRepurchases?userID=${userLogged.system_collaborator_id}&status=${status}`,
            dataSrc: ''
        },
        columns: [
            {
                data: null,
                render: function (data, type, row) {
                    return `<button class="btn btn-sm btn-primary" onclick="showRepurchaseDetails(${row.process_id}, '${status}')">Ver Taxas</button>`;
                },
                orderable: false
            },
            { data: 'referenceProcess' },
            { data: 'repurchase_count' },
            {
                data: 'creation_date',
                render: function (data) {
                    return formatarData(data);
                },
            }
        ],
        createdRow: function(row, data, dataIndex) {
            $(row).attr('data-process-id', data.process_id);
        },
        buttons: ['excel', 'pdf', 'print'],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        },
    });

    table['table_repurchase_user'].on('xhr.dt', function() {
    
        // introMain();
    });

    table['table_repurchase_user'].on('draw', function() {
        openedDetails.forEach(processId => {
            showRepurchaseDetails(processId, pageStatus);
        });
    });
}

async function viewRejectionReason(reason) {
    try {
        if (reason) {
            Swal.fire({
                title: 'Motivo da Rejeição',
                text: reason,
                icon: 'info',
                confirmButtonText: 'Fechar'
            });
        } else {
            Swal.fire({
                title: 'Motivo não encontrado',
                text: 'Nenhum motivo registrado para esta rejeição.',
                icon: 'warning',
                confirmButtonText: 'Fechar'
            });
        }
    } catch (error) {
        console.error('Erro ao buscar motivo da rejeição:', error);
        Swal.fire({
            title: 'Erro',
            text: 'Não foi possível buscar o motivo da rejeição.',
            icon: 'error',
            confirmButtonText: 'Fechar'
        });
    }
}

// Função para mostrar os detalhes das taxas de recompra de um processo específico
async function showRepurchaseDetails(processId, status, button) {
    try {
        if(button){
            button.setAttribute('disabled', 'true');
        }
        
        const userLogged = await getInfosLogin();
        const details = await makeRequest(`/api/headcargo/repurchase-management/GetFeesByProcess`, 'POST', { processId, status, userID: userLogged.system_collaborator_id });

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
                return `<a href="javascript:void(0);" class="btn btn-sm btn-danger-light" title="Cancelar" onclick="alterStatus(${fee.id},'CANCELED')">Cancelar</a>`;

            }else if(fee.status === 'CANCELED'){

                return ``;
                return `
                    // <a href="javascript:void(0);" class="btn btn-sm btn-danger" title="Desfazer" onclick="alterStatus(${fee.id},'PENDING')">Desfazer</a>
                `;
            } else if (fee.status === 'REJECTED') {
                return `
                    <a href="javascript:void(0);" class="btn btn-sm btn-primary" title="Visualizar Motivo" onclick="viewRejectionReason('${fee.reason}')">Motivo</a>
                `;
            }
            else if (fee.status === 'DRAFT') {
                return `
                    <a href="javascript:void(0);" class="btn btn-sm btn-primary" title="Enviar para aprovação" onclick="alterStatus(${fee.id},'PENDING')">Enviar para aprovação</a>
                    <a href="javascript:void(0);" class="btn btn-sm btn-danger" title="Cancelar" onclick="alterStatus(${fee.id},'CANCELED')">Cancelar</a>
                `;
            }
            return '';
        }

        


        // Mapeamento de status
        const statusMap = {
            'PENDING': 'Pendente',
            'APPROVED': 'Aprovado',
            'DRAFT': 'Rascunho',
            'REJECTED': 'Rejeitado',
            'CANCELED': 'Cancelado',
            'PAID': 'Pago',
        };
        console.log(details)

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

                const calctotalSale = fee.sale_value !== fee.old_sale_value 
                    ? fee.sale_value - fee.old_sale_value
                    : 0;

                const calctotalPurchase = fee.purchase_value !== fee.old_purchase_value 
                    ? fee.old_purchase_value - fee.purchase_value
                    : 0;

                const totlaDifference = calctotalSale + calctotalPurchase;

                const totlaDifferenceFormat2 = () => {
                    if (fee.coin_purchase !== fee.coin_sale) {
                        // Moedas diferentes
                        if (calctotalSale !== 0 && calctotalPurchase !== 0) {
                            return 'Moeda divergente'; // Ambas diferenças são diferentes de zero
                        } else if (calctotalSale !== 0) {
                            return formatCurrency(calctotalSale, fee.coin_sale); // Apenas venda é diferente de zero
                        } else if (calctotalPurchase !== 0) {
                            return formatCurrency(calctotalPurchase, fee.coin_purchase); // Apenas compra é diferente de zero
                        } else {
                            return '-'; // Ambas são zero
                        }
                    } else {
                        // Moedas iguais
                        return formatCurrency(totlaDifference, fee.coin_purchase); // Soma das diferenças
                    }
                };

                const totlaDifferenceFormat = totlaDifferenceFormat2();

            const oldPurchaseValueCell = formatValueCell(fee.old_purchase_value, fee.purchase_value, fee.coin_purchase, true, fee.status);
            const newPurchaseValueCell = formatValueCell(fee.purchase_value, fee.old_purchase_value, fee.coin_purchase, true, fee.status);
            const oldSaleValueCell = formatValueCell(fee.old_sale_value, fee.sale_value, fee.coin_sale, false, fee.status);
            const newSaleValueCell = formatValueCell(fee.sale_value, fee.old_sale_value, fee.coin_sale, false, fee.status);


    
            let styleDisabled = '';
            if (fee.status == 'PENDING') {
            }else{
                styleDisabled = 'background-color: #8699a399;';
            }

            const buttons = generateActionButtons(fee);

             // Linha principal
            let row = `
            <tr>
                <td style="${styleDisabled}">${fee.fee_name}</td>
                <td style="${styleDisabled}">${oldPurchaseValueCell}</td>
                <td style="${styleDisabled}">${newPurchaseValueCell}</td>
                <td style="${styleDisabled}"><span class="mb-0 fw-semibold">${purchaseDifference}</span></td>
                <td style="${styleDisabled}">${oldSaleValueCell}</td>
                <td style="${styleDisabled}">${newSaleValueCell}</td>
                <td style="${styleDisabled}"><span class="mb-0 fw-semibold">${saleDifference}</span></td>
                 <td style="${styleDisabled}"><span class="mb-0 fw-semibold">${totlaDifferenceFormat}</span></td>
                <td style="${styleDisabled}">${fee.fullName}</td>
                <td style="${styleDisabled}">${formatarData(fee.creation_date)}</td>
                <td style="${styleDisabled}">${statusMap[fee.status]}</td>
                <td style="${styleDisabled}">${buttons}</td>
            </tr>
        `;

         // Linha adicional para 'reason', se existir
         if (fee.observation) {
            row += `
                <tr>
                    <td colspan="12" style="border-left: 4px solid #28a745; text-align: center; padding: 10px;">
                        <strong style="font-size: 0.8em; display: block; margin-bottom: 2px;opacity:0.5">↑ Observação da Recompra ↓</strong>
                        <span style="font-size: 1em;">${fee.observation}</span>
                    </td>
                </tr>
            `;
        }
        

        return row;
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
                         <th>Diferença Total</th>
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
