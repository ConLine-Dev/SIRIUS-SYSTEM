const table = []
/**
 * Inicialização da página
 * Carrega os dados, e esconde o loader após o carregamento.
 */
document.addEventListener("DOMContentLoaded", async () => {
  
    await generateTable()

    hideLoader();

    const socket = io();

    socket.on('updateRepurchase', (data) => {
        table['table_repurchase_user'].ajax.reload(null, false)
    })

});








// Esta função cria ou recria a tabela de controle de senhas na página
async function generateTable() {

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#table_repurchase_user')) {
        $('#table_repurchase_user').DataTable().destroy();
    }

    const userLogged = await getInfosLogin()

    // Criar a nova tabela com os dados da API
    table['table_repurchase_user'] =  $('#table_repurchase_user').DataTable({
        dom: 'frtip',
        paging: false,  // Desativa a paginação
        fixedHeader: true, // Cabeçalho fixo
        info: false,
        scrollY: 'calc(100vh - 240px)',  // Define a altura dinamicamente
        scrollCollapse: false,  // Permite que a rolagem seja usada somente quando necessário
        order: [[0, 'asc']],
        ajax: {
            url: `/api/headcargo/repurchase-management/GetRepurchases?userId=${userLogged.system_collaborator_id}&status=PENDING`,
            dataSrc: ''
          },
        columns: [
            { data: 'referenceProcess' },
            { data: 'fee_name' },
            {
                data: 'status', // Esta coluna não vai buscar dados diretamente
                render: function (data, type, row) {
                    const status = {
                        'PENDING': 'Pendente',
                        'APPROVED': 'Aprovado',
                        'REJECTED': 'Rejeitado',
                    };
                    return status[data];
                },
            },
            {
                data: 'creation_date', // Esta coluna não vai buscar dados diretamente
                render: function (data, type, row) {
                    return formatarData(data);
                },
            },
            {
                data: null, // Esta coluna não vai buscar dados diretamente
                render: function (data, type, row) {
                    return `
                        <a href="javascript:void(0);" class="btn btn-sm btn-danger-light" title="Deletar" onclick="">
                             Cancelar
                        </a>
                    `;
                },
                orderable: false, // Impede que a coluna seja ordenável
            },
        ],
        createdRow: function(row, data, dataIndex) {
           
        },
        buttons: [
            'excel', 'pdf', 'print'
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        },
    });

    // Espera o carregamento completo dos dados via AJAX
    table['table_repurchase_user'].on('xhr.dt', function() {
        // Coloque aqui o código que precisa ser executado após os dados serem carregados

        introMain()

        // document.querySelector('#table_repurchase_user input').focus()
    });

    // Evento disparado quando a tabela é redesenhada
    table['table_repurchase_user'].on('draw.dt', function() {
        // Coloque aqui o código que precisa ser executado após o redesenho da tabela
    });


   
}

// Verifica informações no localStorage do usuario logado
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
};







/**
 * Função para ocultar o loader da página.
 */
function hideLoader() {
    document.querySelector('#loader2').classList.add('d-none');
}


function openNewrepurchase() {

    openWindow('/app/operational/repurchase-management/new-repurchase', 800, 600);

}

function openWindow(url, width, height) {
    const options = `width=${width},height=${height},resizable=yes`;
    window.open(url, '_blank', options);
}

function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        // hour: '2-digit',
        // minute: '2-digit'
    });
}
