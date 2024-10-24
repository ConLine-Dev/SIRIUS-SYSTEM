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
    if ($.fn.DataTable.isDataTable('#Inspections')) {
        $('#Inspections').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    table['Inspections'] = $('#Inspections').DataTable({
        dom: 'frtip',
        paging: false,  // Desativa a paginação
        fixedHeader: true, // Cabeçalho fixo
        info: false,
        scrollY: 'calc(100vh - 240px)',  // Define a altura dinamicamente
        scrollCollapse: false,  // Permite que a rolagem seja usada somente quando necessário
        order: [[0, 'desc']],
        ajax: {
            url: `/api/safety-inspection/inspections`,
            dataSrc: ''
        },
        columns: [
            { data: 'id' },
            { data: 'description' },
            { data: 'nameLocation' },
            { data: 'date', 
                render: function(data) {
                    return formatDate(data);
                }
            },
            { data: 'finished', 
                render: function(data) {
                    return data ? formatDate(data) : 'Pendente';
                }
            },
            { data: 'fullName', 
            render: function(data) {
                return data || '<span class="badge bg-danger-transparent">Inspeção automática programada</span>';
            }
        },
            { data: 'status', 
                render: function(data) {
                    return data == 1 ? '<span class="badge bg-success-transparent">Concluído</span>' : '<span class="badge bg-warning-transparent">Pendente</span>';
                }
            },
           
            // {
            //     data: null, 
            //     render: function(data, type, row) {
            //         let button = '';
            //         if (data.status == 1) {
            //             button = '<button class="btn btn-sm btn-info btn-wave waves-effect waves-light">Visualizar</button>';
            //         } else {
            //             button = `
            //                 <button class="btn btn-sm btn-info btn-wave waves-effect waves-light">Visualizar</button>
            //                 <button class="btn btn-sm btn-danger btn-wave waves-effect waves-light">Iniciar</button>
            //             `;
            //         }
            //         return button;
            //     },
            //     orderable: false
            // }
        ],
        createdRow: function(row, data, dataIndex) {
            $(row).attr('data-id', data.id);  // Adiciona o atributo com o id da linha
            $(row).attr('data-status', data.status);  // Adiciona o atributo com o status
        },
        buttons: ['excel', 'pdf', 'print'],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        }
    });

    // Evento para disparar após o redesenho da tabela
    table['Inspections'].on('draw.dt', function() {
        $('#Inspections tbody').off('dblclick').on('dblclick', 'tr', function() {
            const id = $(this).data('id');
            const status = $(this).data('status');
            if (id) {
                onTableRowDoubleClick(id, status);
            }
        });
    });

}



// Função que é chamada ao clicar duas vezes na linha da tabela
function onTableRowDoubleClick(id, status) {
    if (status !== 2) {
        openInspection(id);
    }
}


function formatDate(dateString) {
    // Dividir a string de data no formato "YYYY-MM-DD"
    const [year, month, day] = dateString.split('-');
    
    // Retornar no formato "DD/MM/YYYY"
    return `${day}/${month}/${year}`;
}


// Função que envia para a proxima janela o id da senha clicada
async function openInspection(id) {
    // const body = {
    //     url: `/app/ti/Safety-Inspection/view-inspections`,
    //     width:'150',
    //     height:'100'
    // }
    // window.ipcRenderer.invoke('open-exWindow', body);

    openWindow(`/app/ti/Safety-Inspection/view-inspections?id=${id}`, '550', '550');
 };

function openWindow(url, width, height) {
    const options = `width=${width},height=${height},resizable=no`;
    window.open(url, '_blank', options);
}

// Exemplo de uso:
// openWindow('/app/ti/Safety-Inspection/create-inspections/123', '150', '150');

//  async function createInspection(id) {
//     const body = {
//         url: `/app/ti/Safety-Inspection/create-inspections/%{id}`,
//         width:'150px',
//         height:'150px'
//     }
//     window.ipcRenderer.invoke('open-exWindow', body);
//  };
