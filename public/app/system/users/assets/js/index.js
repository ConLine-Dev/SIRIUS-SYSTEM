const apiUrl = '/api/user-management';
let table = [];

const socket = io();

socket.on("updateTableUsers", async (data) => {
  table['table-user-management'].ajax.reload(null, false);
});

// Função para carregar os usuários
async function loadUsers() {
  table['table-user-management'] = $('#table-user-management').DataTable({
    dom: 'frtip',
    scrollCollapse: true,
    pageLength: 15,
    paging: true,
    order: [[0, 'desc']],
    ajax: {
      url: apiUrl,
      dataSrc: ''
    },
    columns: [
      { data: 'username' },
      { data: 'ColabFullName' },
      {
        data: 'create',
        render: function (data, type, row) {
          return new Date(data).toLocaleDateString();
        }
      }
    ],
    rowCallback: function(row, data, index) {
      // Add a unique ID to each row
      $(row).attr('id', data.id);
    },
    language: {
      searchPlaceholder: 'Pesquisar...',
      sSearch: '',
    }
  });

  // Adicionar evento de duplo clique na tabela usando delegação de eventos
  document.querySelector('#table-user-management tbody').addEventListener('dblclick', async function(event) {
    const targetRow = event.target.closest('tr');
    if (targetRow) {
      const id = targetRow.getAttribute('id');
      if (id) {
        event.preventDefault();
        await window.ipcRenderer.invoke('open-exWindow', {url: `/app/system/users/view?id=${id}`, width:450, height: 605, resizable:false});
      }
    }
  });
}

async function searchTable() {
  // Adicionar evento de pesquisa ao input
  const searchInput = document.querySelector('.btn_search');
  searchInput.addEventListener('input', function() {
    table['table-user-management'].search(this.value).draw();
  });
}

document.addEventListener('DOMContentLoaded', async function() {
  // Carregar usuários ao carregar a página
  await loadUsers();
  await searchTable();

  // Abrir janela para criar novo usuário
  document.getElementById('newUserBtn').addEventListener('click', function() {
    window.ipcRenderer.invoke('open-exWindow', {url: `/app/system/users/create`, width:450, height: 600, resizable:false});
  });

  document.querySelector('#loader2').classList.add('d-none');
});