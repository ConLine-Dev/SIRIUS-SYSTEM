
const elements = {
    newOccurenceButton: document.querySelector('#newOccurenceButton'),
    rowTableOccurence: document.querySelectorAll('#occurrences_table tbody tr')
}

async function listPendingOccurrences(){
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/non-compliance/getPendingOccurrences`);

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#occurrences_table')) {
        $('#occurrences_table').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    $('#occurrences_table').DataTable({
        dom: 'Bfrtip',
        pageLength: 10,
        order: [[0, 'desc']],
        data: dados,
        pageInfo: false,
        bInfo: false,
        columns: [
            { data: 'reference' },
            { data: 'title' },
            { data: 'description' },
            { data: 'type' },
            { data: 'responsibles' },
            { data: 'status' },
            { data: 'date_occurrence' },
            // { data: 'action' }
            // Adicione mais colunas conforme necessário
        ],
        buttons: [
            'excel', 'pdf'
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/1.12.1/i18n/pt-BR.json",
            searchPlaceholder: 'Pesquisar...',
        },
        "rowCallback": function(row, data, index) {
            // Adiciona um atributo id a cada linha
            $(row).attr('ocurrence-id', data.id);
        },
        initComplete: function () {
            requestAnimationFrame(async () => {
                await dblClickOnOccurrence()
            });
        },
    });

    
}


async function Events(){
    await clickNewOccurence()
    
}

async function clickNewOccurence(){
    elements.newOccurenceButton.addEventListener('click', async function(e){
        e.preventDefault()

        const body = {
            url: '/app/administration/non-compliance/new-occurrence'
        }

        window.ipcRenderer.invoke('open-exWindow', body);
    })



}

async function dblClickOnOccurrence(){
    const rowTableOccurence = document.querySelectorAll('#occurrences_table tbody tr')

    for (let index = 0; index < rowTableOccurence.length; index++) {
        const element = rowTableOccurence[index];

        element.addEventListener('dblclick', async function(e){
            e.preventDefault()
            const id = this.getAttribute('ocurrence-id')

            const body = {
                url: `/app/administration/non-compliance/view-occurrence?id=${id}`
            }
    
            window.ipcRenderer.invoke('open-exWindow', body);
        })
        
    }
}

window.addEventListener("load", async () => {
  
    await listPendingOccurrences();
    await Events()


    document.querySelector('#loader2').classList.add('d-none')
})

