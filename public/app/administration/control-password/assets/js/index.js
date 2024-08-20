document.addEventListener("DOMContentLoaded", async () => {

    //Chama a função
    await generateTable()

    document.querySelector('#loader2').classList.add('d-none')
})


async function generateTable() {
    // Fazer a requisição à API
    const dados = await makeRequest(`/api/control-password/getAll`);
    console.log(dados);

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#table_control_password')) {
        $('#table_control_password').DataTable().destroy();
    }

    // Calcular a altura disponível dinamicamente
    const alturaDisponivel = window.innerHeight - document.querySelector('.card-header').offsetHeight

    // Criar a nova tabela com os dados da API
    $('#table_control_password').DataTable({
        dom: 'frtip',
        paging: false,  // Desativa a paginação
        scrollY: '50vh',  // Define a altura dinamicamente
        scrollCollapse: true,  // Permite que a rolagem seja usada somente quando necessário
        order: [[0, 'asc']],
        data: dados,
        columns: [
            { data: 'title' },
            { data: 'login' },
            { data: 'responsibleName' },
            { data: 'departmentNames' },
            { data: 'update_at' },
            {
                data: null, // Esta coluna não vai buscar dados diretamente
                render: function (data, type, row) {
                    return `
                        <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-secondary-light product-btn" onclick="openPasswordEdit(${row.id})">
                            <i class="ri-edit-line"></i>
                        </a>
                        <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-danger-light product-btn" onclick="confirmarDelecao(${row.id})">
                            <i class="ri-delete-bin-line"></i>
                        </a>
                    `;
                },
                orderable: false, // Impede que a coluna seja ordenável
            },
        ],
        createdRow: function(row, data, dataIndex) {
            // Adiciona o atributo com o id da senha 
            $(row).attr('password-id', data.id);
            // Adicionar evento click na linha 
            $(row).on('dblclick', async function() {
                const password_id = $(this).attr('password-id'); // Captura o id do password
                await openPassword(password_id);
            });
        },
        buttons: [
            'excel', 'pdf', 'print'
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
        },
    });
}



// Função para editar uma linha (pode ser implementada conforme sua lógica)
function editarLinha(id) {
    console.log("Editar item com ID: " + id);
    // Implementar a lógica de edição aqui
}

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
            const delete_password = await makeRequest(`/api/control-password/delete`, 'POST', {id: id});
        }
    })
}

// Funçao para cadastrar nova senha no botao 'Novo'
function registerPassword() {

    const body = {
        url: '/app/administration/control-password/create',
        width: 1000,
        height: 640,
        resizable: false
    }
    window.ipcRenderer.invoke('open-exWindow', body);
}

// Função que envia para a proxima janela o id da senha clicada
async function openPassword(id) {
    const body = {
        url: `/app/administration/control-password/view?id=${id}`,
        width: 500,
        height: 420,
        resizable: false
    }
    window.ipcRenderer.invoke('open-exWindow', body);
 };

 // Função que envia para a proxima janela o id da senha clicada
async function openPasswordEdit(id) {
    const body = {
        url: `/app/administration/control-password/edit?id=${id}`,
        width: 1000,
        height: 640,
        resizable: false
    }
    window.ipcRenderer.invoke('open-exWindow', body);
 };