

// async function generateTable() {
//     // Fazer a requisição à API
//     const dados = await makeRequest(`/api/non-compliance/AllOccurrence`);

//     // Destruir a tabela existente, se houver
//     if ($.fn.DataTable.isDataTable('#table_rnc')) {
//         $('#table_rnc').DataTable().destroy();
//     }

//     // Criar a nova tabela com os dados da API
//     $('#table_rnc').DataTable({
//         dom: 'Bfrtip',
//         pageLength: 15,
//         order: [[0, 'desc']],
//         data: dados.data,
//         columns: [
//             { data: 'reference' },
//             { data: 'occurrence' },
//             { data: 'description' },
//             { data: 'origin' },
//             { data: 'date_occurrence' }
//             // Adicione mais colunas conforme necessário
//         ],
//         buttons: [
//             'excel', 'pdf', 'print'
//         ],
//         language: {
//             searchPlaceholder: 'Pesquisar...',
//             sSearch: '',
//         },
//     });
// }

async function listAllOccurrences(){
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/non-compliance/AllOccurrence`);

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#occurrences_table')) {
        $('#occurrences_table').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    $('#occurrences_table').DataTable({
        dom: 'Bfrtip',
        pageLength: 15,
        order: [[0, 'desc']],
        data: dados,
        columns: [
            { data: 'reference' },
            { data: 'description' },
            { data: 'type' },
            { data: 'type' },
            { data: 'date_occurrence' }
            // Adicione mais colunas conforme necessário
        ],
        buttons: [
            'excel', 'pdf'
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
        },
    });
}

document.addEventListener("DOMContentLoaded", async () => {
  
    await listAllOccurrences();


    document.querySelector('#loader2').classList.add('d-none')
})

