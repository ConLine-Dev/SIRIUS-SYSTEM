const table = [] // Objeto que vai armazenar as tabelas criadas
// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {
 
    
    await generateTable()

    // remover loader
    document.querySelector('#loader2').classList.add('d-none');
    const socket = io();
    socket.on('update-corrective-actions', (data) => {
        table['corrective-actions'].ajax.reload(null, false)
    })
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
            { data: 'LocalName' },
            { data: 'description' },
            { data: 'create_at' },
            { data: 'ended_at' },
            { data: 'status', 
             render: function(data, type, row) {
                if(row.ended_at == '' || row.ended_at == null){ 
                    return '<span class="badge bg-warning-transparent">Pendente</span>';
                }else{
                    return '<span class="badge bg-success-transparent">Concluído</span>';
                }
                // return row.ended_at != '' ? '<span class="badge bg-success-transparent">Concluído</span>' : '<span class="badge bg-warning-transparent">Pendente</span>';
             },
            },
        ],
        createdRow: function(row, data, dataIndex) {
            // Adiciona o atributo com o id da senha 
            $(row).attr('action-id', data.id);
            // Adicionar evento click na linha 
            $(row).on('dblclick', async function() {
                const action_id = $(this).attr('action-id'); // Captura o id do password
                await openAction(action_id);
            });
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


function OpenCreate(){
    openWindow(`/app/ti/Safety-Inspection/create-corrective-Actions`, '550', '550');
}

function openAction(id){
    openWindow(`/app/ti/Safety-Inspection/create-corrective-Actions?id=${id}`, '550', '550');
}




function openWindow(url, width, height) {
   const options = `width=${width},height=${height},resizable=no`;
   window.open(url, '_blank', options);
}