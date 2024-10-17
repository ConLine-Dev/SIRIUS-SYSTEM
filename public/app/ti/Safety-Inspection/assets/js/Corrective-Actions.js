const table = [] // Objeto que vai armazenar as tabelas criadas
// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {
 
    
    await generateTable()

    // remover loader
    document.querySelector('#loader2').classList.add('d-none');

    
})


// Esta função cria ou recria a tabela de controle de senhas na página
async function generateTable() {

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#corrective-actions')) {
        $('#corrective-actions').DataTable().destroy();
    }


    // Criar a nova tabela com os dados da API
    table['corrective-actions'] =  $('#corrective-actions').DataTable({
        dom: 'frtip',
        paging: false,  // Desativa a paginação
        fixedHeader: true, // Cabeçalho fixo
        info: false,
        scrollY: 'calc(100vh - 240px)',  // Define a altura dinamicamente
        scrollCollapse: false,  // Permite que a rolagem seja usada somente quando necessário
        order: [[0, 'asc']],
        ajax: {
            url: `/api/safety-inspection/corrective-actions`,
            dataSrc: ''
          },

        columns: [
            { data: 'id' },
            { data: 'description' },
            { data: 'create_at' },
            { data: 'ended_at' },
            { data: 'status', 
             render: function(data) {
                return data == 1 ? '<span class="badge bg-success-transparent">Concluído</span>' : '<span class="badge bg-warning-transparent">Pendente</span>';
             },
            },
            // {
            //     data: null, // Esta coluna não vai buscar dados diretamente
            //     render: function (data, type, row) {
            //         let button = '';
            //         if(data.status == 1) {
            //             button = `
            //             <button class="btn btn-sm btn-info btn-wave waves-effect waves-light"> Visualizar </button>
            //             <button class="btn btn-sm btn-danger btn-wave waves-effect waves-light"> Iniciar </button>
            //             `
            //         }else{
            //             button = `
            //             <button class="btn btn-sm btn-info btn-wave waves-effect waves-light"> Visualizar </button>
            //             <button class="btn btn-sm btn-danger btn-wave waves-effect waves-light"> Iniciar </button>
            //             `
            //         }


            //         return button;
            //     },
            //     orderable: false, // Impede que a coluna seja ordenável
            // },
        ],
        createdRow: function(row, data, dataIndex) {
            // // Adiciona o atributo com o id da senha 
            // $(row).attr('password-id', data.id);
            // // Adicionar evento click na linha 
            // $(row).on('dblclick', async function() {
            //     const password_id = $(this).attr('password-id'); // Captura o id do password
            //     await openPassword(password_id);
            // });
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
    table['corrective-actions'].on('xhr.dt', function() {
        // Coloque aqui o código que precisa ser executado após os dados serem carregados

        // introMain()

        // document.querySelector('#corrective-actions input').focus()
    });

    // Evento disparado quando a tabela é redesenhada
    table['corrective-actions'].on('draw.dt', function() {
        // Coloque aqui o código que precisa ser executado após o redesenho da tabela
    });


   
}