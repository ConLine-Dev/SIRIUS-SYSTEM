// Conecta-se ao servidor Socket.io
const socket = io();

 // Evento para receber mensagens do servidor
 socket.on('att-non-compliance', async (msg) => {
    document.querySelector('#loader2').classList.remove('d-none')
    await listPendingOccurrences();
    await listAllOccurrences();
    document.querySelector('#loader2').classList.add('d-none')
});

const elements = {
    newOccurenceButton: document.querySelector('#newOccurenceButton'),
    rowTableOccurence: document.querySelectorAll('#occurrences_table tbody tr')
}

/**
 * Verifica informações no localStorage do usuario logado
 */
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
}

async function listPendingOccurrences(){

    const user = await getInfosLogin();
    console.log(user)
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/non-compliance/getOccurence-collaborator`, 'POST', {id:user.system_collaborator_id, type:'1,2,4'});
    console.log(dados)

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#pending_occurrences_table')) {
        $('#pending_occurrences_table').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    $('#pending_occurrences_table').DataTable({
        dom: 'frtip',
        pageLength: 5,
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
            $(row).attr('occurrence-id', data.id);
        },
        initComplete: function () {
            requestAnimationFrame(async () => {
                await dblClickOnOccurrence('#pending_occurrences_table')
            });
        },
    });

    
}

async function listAllOccurrences(){
    const user = await getInfosLogin();
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/non-compliance/getOccurence-collaborator`, 'POST', {id:user.system_collaborator_id, type:'0,3,5'});
    console.log(dados)
    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#all_occurrences_table')) {
        $('#all_occurrences_table').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    $('#all_occurrences_table').DataTable({
        dom: 'frtip',
        pageLength: 5,
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
            $(row).attr('occurrence-id', data.id);
        },
        initComplete: function () {
            requestAnimationFrame(async () => {
                await dblClickOnOccurrence('#all_occurrences_table')
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

async function dblClickOnOccurrence(tableId){
    const rowTableOccurence = document.querySelectorAll(`${tableId} tbody tr`);

    for (let index = 0; index < rowTableOccurence.length; index++) {
        const element = rowTableOccurence[index];

        // Define a função de callback do evento
        const handleDoubleClick = async function(e) {
            e.preventDefault();
            const id = this.getAttribute('occurrence-id');
            const body = {
                url: `/app/administration/non-compliance/view-occurrence?id=${id}`
            };

            window.ipcRenderer.invoke('open-exWindow', body);
        };

        // Remove event listener se já existir
        element.removeEventListener('dblclick', handleDoubleClick);
        // Adiciona event listener
        element.addEventListener('dblclick', handleDoubleClick);
    }
}

window.addEventListener("load", async () => {
  
    await listPendingOccurrences();
    await listAllOccurrences();
    await Events()


    document.querySelector('#loader2').classList.add('d-none')
})

