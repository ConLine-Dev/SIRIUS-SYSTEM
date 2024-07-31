const apiUrl = '/api/user-management';
const table = []

 // Função para carregar os usuários
 async function loadUsers() {

    table['table-user-management'] = $('#table-user-management').DataTable({
        dom: 'frtip',
        // scrollY: '78vh',
        scrollCollapse: true,
        pageLength: 13,
        paging: true,
        order: [[0, 'desc']],
        ajax: {
            url: apiUrl,
            dataSrc: ''
        },
        columns: [
          { data: 'username' },
          { data: 'collaborator_id' },
          {
            data: 'create',
            render: function (data, type, row) {
              return new Date(data).toLocaleDateString();
            }
          },
          {
            data: null,
            defaultContent: '<button class="btn btn-danger btn-sm delete-btn">Deletar</button>',
            orderable: false
          }
        ],
        "rowCallback": function(row, data, index) {
          // Add a unique ID to each row
          $(row).attr('id', data.id);
        },
        language: {
          searchPlaceholder: 'Pesquisar...',
          sSearch: '',
        },
        initComplete: function () {
          requestAnimationFrame(async () => {
              await dblClickOnOccurrence('#table-user-management')
          });
        },
      });


     
  }

async function dblClickOnOccurrence(tableId){
    const rowTableOccurence = document.querySelectorAll(`${tableId} tbody tr`);

    for (let index = 0; index < rowTableOccurence.length; index++) {
        const element = rowTableOccurence[index];

        // Define a função de callback do evento
        const handleDoubleClick = async function(e) {
            e.preventDefault();
            const id = this.getAttribute('occurrence-id');
      
            window.ipcRenderer.invoke('open-exWindow', {url: `/app/system/users/view`, width:'10px'});
        };

        // Remove event listener se já existir
        element.removeEventListener('dblclick', handleDoubleClick);
        // Adiciona event listener
        element.addEventListener('dblclick', handleDoubleClick);
    }
}


document.addEventListener('DOMContentLoaded', async function() {
    
    // Carregar usuários ao carregar a página
    await loadUsers();

    // MAbrir janela para criar novo usuário
    document.getElementById('newUserBtn').addEventListener('click', function() {

    window.ipcRenderer.invoke('open-exWindow', {url: `/app/system/users/create`, width:'10%'});

    });

    // // Salvar novo usuário
    // document.getElementById('userForm').addEventListener('submit', async function(event) {
    //   event.preventDefault();
    //   const formData = new FormData(this);
    //   const userData = Object.fromEntries(formData.entries());
    //   await makeRequest(apiUrl, 'POST', userData);
    //   $('#userModal').modal('hide');
    //   loadUsers();
    // });

    // // Deletar usuário
    // document.getElementById('userTableBody').addEventListener('click', async function(event) {
    //   if (event.target.classList.contains('delete-btn')) {
    //     const userId = event.target.closest('tr').getAttribute('data-id');
    //     await makeRequest(`${apiUrl}/${userId}`, 'DELETE');
    //     loadUsers();
    //   }
    // });

    // // Mostrar modal ao clicar duas vezes em um usuário
    // document.getElementById('userTableBody').addEventListener('dblclick', async function(event) {
    //   if (event.target.tagName === 'TD') {
    //     const userId = event.target.closest('tr').getAttribute('data-id');
    //     const user = await makeRequest(`${apiUrl}/${userId}`);
    //     document.getElementById('username').value = user.username;
    //     document.getElementById('email').value = user.email;
    //     document.getElementById('password').value = user.password;
    //     document.getElementById('collaborator_id').value = user.collaborator_id;
    //     $('#userModal').modal('show');
    //   }
    // });


    document.querySelector('#loader2').classList.add('d-none')
  });
