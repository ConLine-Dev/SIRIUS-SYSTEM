const table = [];
// table['table_control_password'].ajax.reload(null, false)

// Esta função é executada quando o documento HTML é completamente carregado e analisado
document.addEventListener("DOMContentLoaded", async () => {

    //Chama a função
    await generateTable()

    const socket = io();

    socket.on('table_collaborators_certificates', (data) => {
        table['table_collaborators_certificates'].ajax.reload(null, false)
    })


    await listCertiticates()

    document.querySelector('#loader2').classList.add('d-none')
})

// Verifica informações no localStorage do usuario logado
// Esta função recupera e retorna os dados armazenados localmente relacionados ao login do Google.
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
}

async function listCertiticates(){
    const certiticates = await makeRequest(`/api/collaborators-certificates/certificates`);
    console.log(certiticates)
    document.querySelector('.allcertificates').innerHTML = '';
    for (let index = 0; index < certiticates.length; index++) {
        const element = certiticates[index];
            
        document.querySelector('.allcertificates').innerHTML += `<li data-id="${element.id}" class="list-group-item">
        <div class="d-flex align-items-center justify-content-between  flex-wrap">
            <div class="d-flex align-items-center gap-2">
                <div> <span class="avatar avatar-sm p-1 bg-light"> <img src="../../assets/images/media/Certificado-digital.png" alt=""> </span> </div>
                <div> <span class="d-block fw-semibold">${element.name}</span> <span class="d-block text-muted fs-12 fw-normal">-</span> </div>
            </div>
            <div> 
            </div>
            <div> <span class="fs-12 text-muted">Vencimento</span> <span class="fw-semibold d-block">29/07/2025</span> </div>
        </div>
    </li>`
    }

}

// Esta função cria ou recria a tabela de controle de senhas na página
async function generateTable() {

    // Destruir a tabela existente, se houver
    if ($.fn.DataTable.isDataTable('#table_collaborators_certificates')) {
        $('#table_collaborators_certificates').DataTable().destroy();
    }

    // Calcular a altura disponível dinamicamente
    const alturaDisponivel = window.innerHeight - document.querySelector('.card-header').offsetHeight

    const userLogged = await getInfosLogin()

    // Criar a nova tabela com os dados da API
    table['table_collaborators_certificates'] =  $('#table_collaborators_certificates').DataTable({
        dom: 'frtip',
        paging: false,  // Desativa a paginação
        // fixedHeader: true, // Cabeçalho fixo
        info: false,
        scrollY: 'calc(100vh - 240px)',  // Define a altura dinamicamente
        scrollCollapse: false,  // Permite que a rolagem seja usada somente quando necessário
        order: [[0, 'asc']],
        ajax: {
            url: `/api/collaborators-certificates/collaborators-certificates`,
            dataSrc: ''
          },
        columns: [
            {
                data: 'ColabFullName', // Esta coluna não vai buscar dados diretamente
                render: function (data, type, row) {
                    return `<div class="d-flex align-items-center"> 
                    <span class="avatar avatar-sm p-1 me-1 bg-light avatar-rounded"> 
                    <img src="https://cdn.conlinebr.com.br/colaboradores/${row.id_headcargo}" alt=""> 
                    </span> 
                    <a href="javascript:void(0);" class="fw-semibold mb-0">${row.ColabFullName}</a> </div>`;


                },
            },
            { data: 'certificate_name' },
            { data: 'reason' },
            {
                data: null, // Esta coluna não vai buscar dados diretamente
                render: function (data, type, row) {
                    return `
                        <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-danger-light product-btn" title="Deletar" onclick="confirmarDelecao(${row.id})">
                            <i class="ri-delete-bin-line"></i>
                        </a>
                    `;
                },
                orderable: false, // Impede que a coluna seja ordenável
            },
        ],
        createdRow: function(row, data, dataIndex) {
            // Adiciona o atributo com o id da senha 
            $(row).attr('collaborators_certificates-id', data.id);
            // Adicionar evento click na linha 
            $(row).on('dblclick', async function() {
                const password_id = $(this).attr('collaborators_certificates-id'); // Captura o id do password
                await openCollaboratorsCertificates(password_id);
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
            const delete_password = await makeRequest(`/api/collaborators-certificates/collaborators-certificates/${id}`, 'DELETE');
        }
    })
}

// Funçao para cadastrar nova senha no botao 'Novo'
function registerPassword() {

    const body = {
        url: '/app/system/collaborators-certificates/create',
        width: 700,
        height: 370,
        resizable: false
    }
    window.ipcRenderer.invoke('open-exWindow', body);
}

// Função que envia para a proxima janela o id da senha clicada
async function openCollaboratorsCertificates(id) {
    const body = {
        url: `/app/system/collaborators-certificates/edit?id=${id}`,
        width: 700,
        height: 370,
        resizable: false
    }
    window.ipcRenderer.invoke('open-exWindow', body);
 };

