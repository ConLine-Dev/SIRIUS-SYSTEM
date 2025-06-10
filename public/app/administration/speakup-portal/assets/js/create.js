async function getInfosLogin() {
  const StorageGoogleData = localStorage.getItem('StorageGoogle');
  const StorageGoogle = JSON.parse(StorageGoogleData);

  return StorageGoogle;
};

async function saveOccurrence() {
  let date = document.getElementById('occurrenceDate');
  date = date.value;
  let description = document.querySelector('textarea[name="description"]').value;

  let userData = await getInfosLogin();
  let collabId = userData.system_collaborator_id
  let newFile = document.querySelectorAll('.newFile');

  const formData = new FormData();
  formData.append('date', date);
  formData.append('description', description);
  formData.append('collabId', collabId);
  for (let index = 0; index < newFile.length; index++) {
    if (newFile[index].files[0]) {
      formData.append('fileList', newFile[index].files[0]);
    }
  }

  if (!date || !description) {
    Swal.fire({
      title: "Ocorrência ainda não registrada!",
      text: "Preencha os campos de data e descrição para seguir.",
      icon: "error"
    });
  } else {
    await makeRequest(`/api/speakup-portal/upload`, 'POST', formData);

    Swal.fire({
      title: "Ocorrência registrada!",
      text: "Dados já enviados de forma totalmente anônima para a qualidade.",
      icon: "success",
      showCancelButton: false,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Ok!"
    }).then((result) => {
      if (result.isConfirmed) {
        window.close();
      }
    });
  }
}

function formatFileName(name) {

  const now = new Date();

  // Formata a data e hora
  const pad = num => String(num).padStart(2, '0');
  const formattedDate = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join('-');

  const formattedHour = [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join(':');

  let fileName = `${formattedDate}_${formattedHour}_${name}`;
  return fileName;
}

function newAttach() {
  const attachDiv = document.getElementById('attach');

  // Cria a nova div.col-4
  const newCol = document.createElement('div');
  newCol.className = 'col-4';
  newCol.style.paddingBottom = '10px';

  // Cria o input de arquivo
  const newInput = document.createElement('input');
  newInput.type = 'file';
  newInput.className = 'form-control me-2 intro-search-user-ticket newFile';

  // Insere o input na div
  newCol.appendChild(newInput);

  // Insere a nova col-4 no final da div#attach
  attachDiv.appendChild(newCol);
}

function openWindow(url, width, height) {
  window.open(url, '_blank', `width=${width},height=${height},resizable=yes,scrollbars=yes`);
}

document.addEventListener('DOMContentLoaded', async function () {

  // const socket = io();

  // socket.on('updateCalendarEvents', (data) => {
  //   calendar.refetchEvents();
  // })

  document.querySelector('#loader2').classList.add('d-none')
});