document.addEventListener("DOMContentLoaded", async () => {

    //Chama a função
    await generateTable()

    document.querySelector('#loader2').classList.add('d-none')
})


async function generateTable() {
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/control-password/getAll`);
    console.log(dados)

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#table_control_password')) {
        $('#table_control_password').DataTable().destroy();
    }

    // Criar a nova tabela com os dados da API
    $('#table_control_password').DataTable({
        dom: 'frtip',
        pageLength: 15,
        order: [[0, 'desc']],
        data: dados,
        columns: [
            { data: 'title' },
            { data: 'login' },
            { data: 'responsibleName' },
            { data: 'departmentNames' },
            { data: 'update_at' },
            { data: 'action' }
            // Adicione mais colunas conforme necessário
        ],
        buttons: [
            'excel', 'pdf', 'print'
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
        },
    });
}

function registerPassword() {


    const body = {
        url: '/app/administration/control-password/create'
    }
    window.ipcRenderer.invoke('open-exWindow', body);
}