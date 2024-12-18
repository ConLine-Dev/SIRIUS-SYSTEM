const table = [];

//Função para cadastrar novo desconto folha pagamento
function createNewDiscount() {
    // URL da página que será aberta
    const url = '/app/administration/rh-payroll/create';

    // Alvo da janela (nova aba/janela)
    const target = '_blank';

    // Configurações da nova janela
    const features = 'width=1700,height=600,resizable=yes,scrollbars=yes,toolbar=no,menubar=no';

    // Abrir a nova janela com os parâmetros definidos
    window.open(url, target, features);
};

//Função Para abrir a janela de discontos fixos
function fixedDiscount() {
    // URL da página que será aberta
    const url = '/app/administration/rh-payroll/fixed-discounts';

    // Alvo da janela (nova aba/janela)
    const target = '_blank';

    // Configurações da nova janela
    const features = 'width=1920,height=974,resizable=yes,scrollbars=yes,toolbar=no,menubar=no';

    // Abrir a nova janela com os parâmetros definidos
    window.open(url, target, features);
};

// Função para listar todos os colaboradores
async function listUsers() {
    const users = await makeRequest(`/api/users/listAllUsersActive`);
    console.log(users)
    const divListUsers = document.querySelector('.listUsers');
    const searchInput = document.querySelector('.searchInput');

    divListUsers.innerHTML = '';
    let userHTML = '';

    for (let i = 0; i < users.length; i++) {
        const item = users[i];

        userHTML += `<li class="list-group-item" onclick="generateTable(${item.id_colab})" data_userid="${item.userID}" data-username="${item.username.toLowerCase()} ${item.familyName.toLowerCase()}">
                        <div class="d-flex align-items-center justify-content-between flex-wrap">
                            <div class="d-flex align-items-center gap-2">
                                <div> <span class="avatar bg-light"> <img src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt=""> </span> </div>
                                <div> 
                                    <span class="d-block fw-normal">${item.username} ${item.familyName}<i class="bi bi-patch-check-fill text-secondary ms-2"></i></span>   
                                </div>
                            </div>
                        </div>
                    </li>`;
    }

    divListUsers.innerHTML = userHTML;

    // Adiciona o evento de input para filtrar usuários
    searchInput.addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        const listItems = divListUsers.querySelectorAll('.list-group-item');

        listItems.forEach(item => {
            const username = item.getAttribute('data-username');
            if (username.includes(searchTerm)) {
                item.style.display = ''; // Mostra o item
            } else {
                item.style.display = 'none'; // Esconde o item
            }
        });
    });
};

// Verifica informações no localStorage do usuario logado
// Esta função recupera e retorna os dados armazenados localmente relacionados ao login do Google.
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;   
};

//Função para listar o responsável e os descontos dele
async function generateTable(id) {

    document.querySelector('#img_body').style.display = 'none'
    document.querySelector('#body_table').style.display = 'block'

    // const userLogged = await getInfosLogin()

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#table_rh_payroll')) {
        $('#table_rh_payroll').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    table['table_rh_payroll'] = $('#table_rh_payroll').DataTable({
        dom: 'frtip',
        paging: false,
        fixedHeader: true,
        info: false,
        scrollY: 'calc(100vh - 240px)',
        scrollCollapse: false,
        order: [[0, 'asc']],
        ajax: {
            url: `/api/rh-payroll/getAllByUser?id_collaborator=${id}`,
            dataSrc: ''
        },
        columns: [
            {
                data: 'month_year',
                render: function(data, type, row) {
                    return `
                        <button onclick="showDiscountDetails('${data}')" class="btn btn-icon btn-primary-transparent rounded-pill btn-wave waves-effect waves-light" title="Visualizar Detalhes">
                            <i class="ri-eye-close-line"></i>
                        </button>`;
                },
                orderable: false
            },
            { data: 'responsibleName' },
            { data: 'monthYear' },
            { 
                data: 'totalValue',
                render: function(data) {
                    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data || 0);
                }
            },
            {
                data: null,
                render: function(data, type, row) {
                    return `
                        <div class="hstack gap-2 fs-15">
                            <a href="javascript:void(0);" class="btn btn-sm btn-icon btn-warning-light" title="Editar" onclick="editDiscount(${data.id})">
                                <i class="ri-pencil-line"></i>
                            </a>
                            <a href="javascript:void(0);" class="btn btn-icon btn-wave waves-effect waves-light btn-sm btn-primary-light" title="Visualizar PDF">
                            <i class="ri-file-pdf-line"></i>
                            </a>
                            <a href="javascript:void(0);" class="btn btn-icon btn-wave waves-effect waves-light btn-sm btn-secondary-light" title="Enviar e-mail">
                            <i class="ri-mail-line"></i>
                            </a>
                        </div>`;
                },
                orderable: false
            }
        ],
        createdRow: function(row, data, dataIndex) {
            $(row).attr('discount-id', data.month_year);
        },
        buttons: ['excel', 'pdf', 'print'],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        },
    });

    
};

// Função para exibir os detalhes abaixo dos descontos
async function showDiscountDetails(discountId) {
    console.log(discountId)
    try {

        // Função auxiliar para formatar moeda BRL
        function formatCurrency(value, currency) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
        }

        // Exibe a tabela de detalhes abaixo da linha do processo
        const tableRow = $(`#table_rh_payroll tr[discount-id="${discountId}"]`);
        const button = tableRow[0]
        const icon  = button.querySelector('i')

        if (tableRow.next().hasClass('details-row')) {
            tableRow.next().remove(); // Remove a linha se já estiver exibida
            icon.classList.remove("ri-eye-line"); // Alterna o ícone para "olho fechado"
            icon.classList.add("ri-eye-close-line");
        } else {
            const details = await makeRequest(`/api/rh-payroll/getDiscountById?id=${discountId}`);

        // Gera as linhas de detalhes
        let detailRows = details.map(fee => {
            return `
                <tr>
                    <td>${fee.name_discount}</td>
                    <td>${formatarData(fee.effective_date)}</td>
                    <td>${formatCurrency(fee.value,'BRL')}</td>
                    <td>
                        <div class="btn-list">
                            <a href="javascript:void(0);" class="btn btn-icon btn-wave waves-effect waves-light btn-sm btn-primary-light" title="Visualizar PDF">
                                <i class="ri-file-pdf-line"></i>
                            </a>
                            <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-purple-light" title="Deletar" onclick="confirmarDelecao(${fee.id})">
                                <i class="ri-delete-bin-line"></i>
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Adicionando uma linha extra com a observação
        detailRows += `
            <tr>
                <td colspan="4" style="text-align: left; color: gray; font-style: italic;">
                    Observação: Esta é uma observação geral sobre os dados apresentados.
                </td>
            </tr>
        `;
        


        // Define a estrutura da tabela de detalhes
        const detailTable = `
            <table class="table table-sm table-bordered mt-2">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Data Vigência</th>
                        <th>Valor R$</th>
                        <th class="intro-btn-action">Ação</th>
                    </tr>
                </thead>
                <tbody>${detailRows}</tbody>
            </table>
        `;

        tableRow.after(`<tr class="details-row"><td colspan="10">${detailTable}</td></tr>`);
        icon.classList.remove("ri-eye-close-line"); // Alterna o ícone para "olho aberto"
        icon.classList.add("ri-eye-line");
        }
    } catch (error) {
        console.error('Erro ao buscar detalhes das taxas:', error);
    }
};

function formatarData(dataISO) {
    const data = new Date(dataISO);
    // Subtrai 3 horas da data
    data.setHours(data.getHours() - 3);
    
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

//Função para editar os descontos
function editDiscount() {
    // URL da página que será aberta
    const url = '/app/administration/rh-payroll/edit';

    // Alvo da janela (nova aba/janela)
    const target = '_blank';

    // Configurações da nova janela
    const features = 'width=1700,height=600,resizable=yes,scrollbars=yes,toolbar=no,menubar=no';

    // Abrir a nova janela com os parâmetros definidos
    window.open(url, target, features);
};

// Função que confirma a deleção
function confirmarDelecao(id) {
    // Mostrar alerta de confirmação
    Swal.fire({
        title: 'Tem certeza?',
        text: "Deseja realmente deletar o registro selecionado?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Deletar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const delete_discount = await makeRequest(`/api/rh-payroll/delete`, 'POST', {id: id});
            console.log(delete_discount)
        }
    })
};




document.addEventListener("DOMContentLoaded", async () => {

    await listUsers();
    


    document.querySelector('#loader2').classList.add('d-none');
});