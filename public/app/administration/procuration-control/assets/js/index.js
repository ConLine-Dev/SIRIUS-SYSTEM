async function getInfosLogin() {
  const StorageGoogleData = localStorage.getItem('StorageGoogle');
  const StorageGoogle = JSON.parse(StorageGoogleData);
  return StorageGoogle;
}

async function printAll() {

  let loggedData = await getInfosLogin();
  collabId = loggedData.system_collaborator_id;

  var procurationData = await makeRequest(`/api/procuration-control/procurationData`, 'POST', { collabId });
  var docsList = document.getElementById('docsList');

  let printDocsList = '';

  for (let index = 0; index < procurationData.length; index++) {

    let createdDate = new Date(procurationData[index].created_at)
    let formattedCreate = createdDate.toLocaleDateString('pt-BR')
    let updatedDate = new Date(procurationData[index].updated_at)
    let formattedUpdate = updatedDate.toLocaleDateString('pt-BR')
    let deadline = new Date(procurationData[index].deadline)
    let formattedDeadline = deadline.toLocaleDateString('pt-BR')
    let actualDate = new Date();
    let status = '';
    let badge = 'success'

    if (actualDate >= deadline) {
      status = '[VENCIDO] - ';
      badge = 'danger'
    }

    printDocsList += `<div class="col-xl-2 d-flex flex-column">
                        <div class="card custom-card flex-fill mb-3 card-procuration" id="${procurationData[index].id}" data-title="${procurationData[index].title}">
                            <div class="card-header d-flex" style="justify-content: space-between;">
                                <div class="card-title fw-semibold fs-14">${status}${procurationData[index].title}</div>
                            </div>
                            <div class="card-body d-flex" style="flex-direction: column; justify-content: space-between; max-height: 250px; overflow: scroll;">
                                <span class="badge bg-${badge}-transparent fw-semibold fs-13">Vencimento: ${formattedDeadline}</span>
                                <br><div>Data Criação: ${formattedCreate}</div><br>
                                <div>Última Descrição: ${procurationData[index].description}</div><br>
                                <div>Última Atualização: ${formattedUpdate}</div><br>
                                <div>Responsável: ${procurationData[index].name} ${procurationData[index].family_name}</div>
                            </div>
                        </div>
                    </div>`
  }

  docsList.innerHTML = printDocsList;

  // Adiciona evento de menu de contexto para cada card
  document.querySelectorAll('.card-procuration').forEach(card => {
    card.addEventListener('contextmenu', function (e) {
      e.preventDefault();
      showContextMenu(e, card.id, card.getAttribute('data-title'));
    });
    card.addEventListener('click', function (e) {
      showContextMenu.hide = true;
      openDetails(card.id);
    });
  });
}

function initializeFilter() {
  document.getElementById('btnPesquisa').addEventListener('input', function () {
    const filter = this.value.toLowerCase().trim();
    const columns = document.querySelectorAll('.defaultBodyTicket .col-xl-2');

    columns.forEach(col => {
      const card = col.querySelector('.card.custom-card');
      if (!card) return;

      const rawText = card.textContent || '';
      const cleanText = rawText.replace(/\s+/g, ' ').toLowerCase();
      const match = cleanText.includes(filter);

      if (match) {
        col.classList.remove('d-none');
      } else {
        col.classList.add('d-none');
      }
    });
  });
}

async function openDetails(documentId) {

  const body = {
    url: `/app/administration/procuration-control/details?documentId=${documentId}`,
    width: 1200,
    height: 715,
    resizable: false,
    max: false
  }
  window.ipcRenderer.invoke('open-exWindow', body);
}

async function openCreate() {

  const body = {
    url: `/app/administration/procuration-control/create`,
    width: 700,
    height: 710,
    resizable: false,
    max: false
  }
  window.ipcRenderer.invoke('open-exWindow', body);
}

function openWindow(url, width, height) {
  window.open(url, '_blank', `width=${width},height=${height},resizable=yes,scrollbars=yes`);
}

// Função para exibir o menu de contexto
function showContextMenu(e, docId, docTitle) {
  const menu = document.getElementById('contextMenu');
  menu.style.display = 'block';
  menu.style.left = e.pageX + 'px';
  menu.style.top = e.pageY + 'px';
  // Salva o id e título do documento selecionado
  menu.setAttribute('data-doc-id', docId);
  menu.setAttribute('data-doc-title', docTitle);
}

// Esconde o menu ao clicar fora
window.addEventListener('click', function () {
  document.getElementById('contextMenu').style.display = 'none';
});
window.addEventListener('scroll', function () {
  document.getElementById('contextMenu').style.display = 'none';
});

// Opção editar nome
const editNameOption = document.getElementById('editNameOption');
editNameOption.addEventListener('click', function (e) {
  e.preventDefault();
  const menu = document.getElementById('contextMenu');
  const docId = menu.getAttribute('data-doc-id');
  const docTitle = menu.getAttribute('data-doc-title');
  Swal.fire({
    title: 'Editar nome do documento',
    input: 'text',
    inputValue: docTitle,
    showCancelButton: true,
    confirmButtonText: 'Salvar',
    cancelButtonText: 'Cancelar',
    preConfirm: (newTitle) => {
      if (!newTitle) {
        Swal.showValidationMessage('O nome não pode ser vazio!');
      }
      return newTitle;
    }
  }).then(async (result) => {
    if (result.isConfirmed) {
      await updateDocTitle(docId, result.value);
      await printAll();
      Swal.fire('Salvo!', 'Nome atualizado com sucesso.', 'success');
    }
  });
  menu.style.display = 'none';
});

// Opção remover
const removeDocOption = document.getElementById('removeDocOption');
removeDocOption.addEventListener('click', function (e) {
  e.preventDefault();
  const menu = document.getElementById('contextMenu');
  const docId = menu.getAttribute('data-doc-id');
  Swal.fire({
    title: 'Tem certeza?',
    text: 'Deseja remover este documento? Esta ação não poderá ser desfeita.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, remover',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      await removeDoc(docId);
      await printAll();
      Swal.fire('Removido!', 'Documento removido com sucesso.', 'success');
    }
  });
  menu.style.display = 'none';
});

// Função para atualizar o nome do documento
async function updateDocTitle(docId, newTitle) {
  await makeRequest(`/api/procuration-control/updateTitle`, 'POST', { id: docId, title: newTitle });
}
// Função para remover documento
async function removeDoc(docId) {
  await makeRequest(`/api/procuration-control/removeDoc`, 'POST', { id: docId });
}

document.addEventListener('DOMContentLoaded', async function () {

  const socket = io();

  socket.on('updateDocuments', (data) => {
    printAll();
    initializeFilter();
  })

  await printAll();
  initializeFilter();

  document.querySelector('#loader2').classList.add('d-none')

});