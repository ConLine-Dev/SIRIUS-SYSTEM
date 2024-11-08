const table = [];
const socket = io();

document.addEventListener("DOMContentLoaded", async () => {
    await generateTable();
    hideLoader();

    socket.on('updateRepurchase', (data) => {
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
async function generateTable(status = 'PENDING') {
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
            url: `/api/headcargo/repurchase-management/GetRepurchases?status=${status}`,
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
        createdRow: function (row, data, dataIndex) {
            $(row).attr('data-process-id', data.process_id);
        },
        buttons: ['excel', 'pdf', 'print'],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        },
    });

    table['table_repurchase_user'].on('xhr.dt', function () {
        introMain();
    });
}

// Função para mostrar os detalhes das taxas de recompra de um processo específico
async function showRepurchaseDetails(processId, status) {
    try {
        const details = await makeRequest(`/api/headcargo/repurchase-management/GetFeesByProcess`, 'POST', { processId, status });

        // Função auxiliar para formatar moeda BRL
        function formatCurrency(value, currency) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
        }

        // Função auxiliar para formatar células com estilos específicos
        function formatValueCell(value, oldValue, currency, isPurchase) {
            const valueChanged = value !== oldValue;
            const badgeClass = valueChanged ? 'badge bg-danger-transparent' : isPurchase ? 'text-danger' : 'text-muted';
            const formattedValue = formatCurrency(value, currency);
            return `<span class="${badgeClass}">${formattedValue}</span>`;
        }

        // Mapeamento de status
        const statusMap = {
            'PENDING': 'Pendente',
            'APPROVED': 'Aprovado',
            'REJECTED': 'Rejeitado',
            'CANCELED': 'Cancelado',
        };

        // Gera as linhas de detalhes
        const detailRows = details.map(fee => {
            const purchaseDifference = fee.purchase_value !== fee.old_purchase_value
                ? formatCurrency(fee.purchase_value - fee.old_purchase_value, fee.coin_purchase)
                : '-';
            const saleDifference = fee.sale_value !== fee.old_sale_value
                ? formatCurrency(fee.sale_value - fee.old_sale_value, fee.coin_sale)
                : '-';

            const oldPurchaseValueCell = formatValueCell(fee.old_purchase_value, fee.purchase_value, fee.coin_purchase, true);
            const newPurchaseValueCell = formatValueCell(fee.purchase_value, fee.old_purchase_value, fee.coin_purchase, true);
            const oldSaleValueCell = formatValueCell(fee.old_sale_value, fee.sale_value, fee.coin_sale, false);
            const newSaleValueCell = formatValueCell(fee.sale_value, fee.old_sale_value, fee.coin_sale, false);


            const actionButtons = fee.status === 'PENDING'
                ? `<a href="javascript:void(0);" class="btn btn-sm btn-danger-light" title="Rejeitar" onclick="alterStatus(${fee.id},'REJECTED')">Rejeitar</a>
                   <a href="javascript:void(0);" class="btn btn-sm btn-success-light" title="Aprovar" onclick="alterStatus(${fee.id},'APPROVED')">Aprovar</a>
                   `
                : '';

            return `<tr>
                        <td>${fee.fee_name}</td>
                        <td>${oldPurchaseValueCell}</td>
                        <td>${newPurchaseValueCell}</td>
                        <td><span class="mb-0 fw-semibold">${purchaseDifference}</span></td>
                        <td>${oldSaleValueCell}</td>
                        <td>${newSaleValueCell}</td>
                        <td><span class="mb-0 fw-semibold">${saleDifference}</span></td>
                        <td>${fee.fullName}</td>
                        <td>${formatarData(fee.creation_date)}</td>
                        <td>${statusMap[fee.status]}</td>
                        <td>${actionButtons}</td>
                    </tr>`;
                    
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
            tableRow.next().remove(); // Remove a linha se já estiver exibida
        } else {
            tableRow.after(`<tr class="details-row"><td colspan="10">${detailTable}</td></tr>`);
        }
    } catch (error) {
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
