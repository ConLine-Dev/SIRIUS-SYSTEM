let occurrenceTable;

// Conecta-se ao servidor Socket.io
const socket = io();

// Evento para receber mensagens do servidor
socket.on('att-non-compliance', async (msg) => {
  document.querySelector('#loader2').classList.remove('d-none')
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

async function createTable() {
  let userData = await getInfosLogin();
  let collabId = userData.system_collaborator_id;
  const listTable = [];

  const getRefunds = await makeRequest(`/api/refunds/getRefunds`, 'POST', { collabId });

  for (let index = 0; index < getRefunds.length; index++) {
    const item = getRefunds[index];

    let formattedTitle = `${item.title} - #${item.id}`
    let createDate = new Date(item.createDate).toLocaleDateString('pt-BR');
    let totalValue = item.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    listTable.push({
      id: item.id,
      title: formattedTitle,
      collaborator: item.collaborator_name,
      value: totalValue,
      status: item.status,
      createDate: createDate,
    });
  }

  if ($.fn.DataTable.isDataTable("#occurrenceTable")) {
    $('#occurrenceTable').DataTable().clear().destroy();
  }

  $('#occurrenceTable tbody').empty();

  occurrenceTable = $('#occurrenceTable').DataTable({
    dom: 'frtip',
    pageInfo: false,
    data: listTable,
    columns: [
      { data: "title" },
      { data: "collaborator" },
      { data: "value" },
      { data: "status" },
      { data: "createDate" },
    ],
    language: {
      url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
    },
    order: [[0, 'desc']],
    lengthMenu: [[13], [13]],
    searching: true,
    rowCallback: function (row, data) {
      $(row).attr('occurrence-id', data.id);
    },
    drawCallback: function () {
      // Remove o antigo e adiciona novamente o duplo clique
      $('#occurrenceTable tbody tr').off('dblclick').on('dblclick', async function (e) {
        e.preventDefault();
        const id = $(this).attr('occurrence-id');
        if (id) {
          const body = {
            url: `/app/financial/refunds/details?id=${id}`,
            width: 800,
            height: 475,
            resizable: true,
            max: false
          };
          window.ipcRenderer.invoke('open-exWindow', body);
        }
      });
    }
  });
}

async function updateTableData() {
  const listTable = [];
  const getRefunds = await makeRequest(`/api/refunds/getRefundsADM`);

  for (let item of getRefunds) {
    let formattedTitle = `${item.title} - #${item.id}`
    let createDate = new Date(item.createDate).toLocaleDateString('pt-BR');
    let totalValue = item.total_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

    listTable.push({
      id: item.id,
      title: formattedTitle,
      collaborator: item.collaborator_name,
      value: totalValue,
      status: item.status,
      createDate: createDate,
    });
  }

  const table = $('#occurrenceTable').DataTable();
  table.clear();
  table.rows.add(listTable);
  table.draw(false); // importante: false = mantém página e busca
}

async function openRegister() {
  const body = {
    url: `/app/financial/refunds/create`,
    width: 1300,
    height: 675,
    resizable: false,
    max: false
  }
  window.ipcRenderer.invoke('open-exWindow', body);
}

async function dblClickOnOccurrence(tableId) {
  const rowTableOccurence = document.querySelectorAll(`${tableId} tbody tr`);

  for (let index = 0; index < rowTableOccurence.length; index++) {
    const element = rowTableOccurence[index];

    // Define a função de callback do evento
    const handleDoubleClick = async function (e) {
      e.preventDefault();
      const id = this.getAttribute('occurrence-id');
      const body = {
        url: `/app/financial/refunds/details?id=${id}`,
        width: 800,
        height: 475,
        resizable: true,
        max: false
      }

      window.ipcRenderer.invoke('open-exWindow', body);
    };

    // Remove event listener se já existir
    element.removeEventListener('dblclick', handleDoubleClick);
    // Adiciona event listener
    element.addEventListener('dblclick', handleDoubleClick);
  }
}

window.addEventListener("load", async () => {

  const socket = io();

  socket.on('updateRefunds', (data) => {
    updateTableData()
  })

  await createTable();


  document.querySelector('#loader2').classList.add('d-none')
})