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

  const getVolumes = await makeRequest(`/api/speakup-portal/getOccurrences`, 'POST', { collabId });

  for (let index = 0; index < getVolumes.length; index++) {
    const item = getVolumes[index];

    let occurrenceDate = new Date(item.occurrence_date)
    occurrenceDate = occurrenceDate.toLocaleDateString('pt-BR')
    let createDate = new Date(item.create_date)
    createDate = createDate.toLocaleDateString('pt-BR')

    listTable.push({
      id: item.id,
      description: item.description,
      occurrenceDate: occurrenceDate,
      status: item.status,
      createDate: createDate,
    });
  }

  if ($.fn.DataTable.isDataTable("#occurrenceTable")) {
    $('#occurrenceTable').DataTable().clear().destroy(); // Limpa e destrói a DataTable
  }

  $('#occurrenceTable tbody').empty(); // Remove apenas as linhas, mantendo os cabeçalhos

  // Recria a DataTable
  occurrenceTable = $('#occurrenceTable').DataTable({
    dom: 'frtip',
    pageInfo: false,
    "data": listTable,
    "columns": [
      { "data": "description" },
      { "data": "occurrenceDate" },
      { "data": "status" },
      { "data": "createDate" },
    ],
    "language": {
      url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
    },
    "order": [[3, 'desc']],
    "lengthMenu": [[13], [13]],
    "searching": true,
    "rowCallback": function (row, data, index) {
      // Adiciona um atributo id a cada linha
      $(row).attr('occurrence-id', data.id);
    },
    initComplete: function () {
      requestAnimationFrame(async () => {
        await dblClickOnOccurrence('#occurrenceTable')
      });
    },
  });
}

async function openRegister() {
  const body = {
    url: `/app/administration/speakup-portal/create`,
    width: 800,
    height: 475,
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
      console.log(id);
      const body = {
        url: `/app/administration/speakup-portal/details?id=${id}`,
        width: 1600,
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

  socket.on('updateOccurrences', (data) => {
    createTable()
  })

  await createTable();


  document.querySelector('#loader2').classList.add('d-none')
})

