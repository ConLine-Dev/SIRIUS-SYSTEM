async function getInfosLogin() {
  const StorageGoogleData = localStorage.getItem('StorageGoogle');
  const StorageGoogle = JSON.parse(StorageGoogleData);

  return StorageGoogle;
};

function getLinkParams() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  return id;
}

async function saveComment() {
  const id = getLinkParams();
  let userData = await getInfosLogin();
  let collabId = userData.system_collaborator_id;
  const comment = document.getElementById('saveComment').value;

  await makeRequest(`/api/speakup-portal/saveComment`, 'POST', { id, collabId, comment });
  await createHistory();
  document.getElementById('saveComment').value = '';
}

async function saveOccurrence() {
  Swal.fire({
    title: "Podemos considerar a denúncia como tratada?",
    showDenyButton: true,
    confirmButtonText: "Sim",
    denyButtonText: `Não`
  }).then((result) => {
    if (result.isConfirmed) {
      const status = 4;
      const id = getLinkParams();
      makeRequest(`/api/speakup-portal/updateStatus`, 'POST', { id, status });
      document.getElementById('occurrenceStatus').value = 'Tratado';
      document.getElementById('saveComment').focus();
    } else if (result.isDenied) {
      const status = 5;
      const id = getLinkParams();
      makeRequest(`/api/speakup-portal/updateStatus`, 'POST', { id, status });
      document.getElementById('occurrenceStatus').value = 'Reaberto';
      document.getElementById('saveComment').focus();
    }
  });

}

async function createHistory() {
  const id = getLinkParams();
  const getComments = await makeRequest(`/api/speakup-portal/getComments`, 'POST', { id });

  let userData = await getInfosLogin();
  let collabId = userData.system_collaborator_id

  const divOccurrenceComments = document.getElementById('occurrenceComments');
  let printOccurrenceComments = '<ul class="timeline list-unstyled">';
  for (let index = getComments.length - 1; index >= 0; index--) {
    let createdDate = new Date(getComments[index].create_date);
    let dia = String(createdDate.getDate()).padStart(2, '0');
    let mes = String(createdDate.getMonth() + 1).padStart(2, '0');
    let ano = createdDate.getFullYear();
    let hora = String(createdDate.getHours()).padStart(2, '0');
    let min = String(createdDate.getMinutes()).padStart(2, '0');
    let dataFormatada = `${dia},${mesNamesPTBR(mes)} ${ano}`;
    let horaFormatada = `${hora}:${min}`;

    let commentName = '';
    if (getComments[index].screen == 'main') {
      commentName = 'Você';
    } else {
      commentName = 'Responsável';
    }

    printOccurrenceComments += `
        <li>
          <div class="timeline-time text-end">
            <span class="date">${dataFormatada}</span>
            <span class="time d-inline-block">${horaFormatada}</span>
          </div>
          <div class="timeline-icon">
            <a href="javascript:void(0);"></a>
          </div>
          <div class="timeline-body">
            <div class="d-flex align-items-top timeline-main-content flex-wrap mt-0" style="flex-direction: column;">
              <p class="mb-0 fs-14 fw-semibold">${commentName}</p>
              <p class="mb-0 fs-12 fw-semibold">${getComments[index].description}</p>
              <div class="flex-fill">
                <div class="d-flex align-items-center">
                  <div class="mt-sm-0 mt-2">
                    <br><p class="mb-0 text-muted">${getComments[index].comment}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
        `;
  }
  printOccurrenceComments += '</ul>';
  divOccurrenceComments.innerHTML = printOccurrenceComments;
}

function mesNamesPTBR(mes) {
  const nomes = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
  };
  return nomes[mes] || mes;
}

async function printOcurrenceDetails() {
  const id = getLinkParams();
  const getDetails = await makeRequest(`/api/speakup-portal/getDetails`, 'POST', { id });

  if (getDetails[0].status == 'Ag. validação') {
    const button = document.getElementById("save");
    button.classList.replace("d-none", "d-block");
  }

  let occurrenceDate = new Date(getDetails[0].occurrence_date)
  occurrenceDate = occurrenceDate.toLocaleDateString('pt-BR')
  document.getElementById('occurrenceDate').value = occurrenceDate;
  document.getElementById('occurrenceStatus').value = getDetails[0].status;
  document.getElementById('description').value = getDetails[0].description;

  const attachments = await makeRequest(`/api/speakup-portal/getAttachments`, 'POST', { id });
  const divOccurrenceAttachments = document.getElementById('occurrenceAttachments');
  let printOccurrenceAttachments = '';

  for (let index = 0; index < attachments.length; index++) {
    let fileName = attachments[index].file;
    let fileUrl = `/uploads/speakup-attachments/${fileName}`;
    printOccurrenceAttachments += `
            <div class="mt-sm-0 mt-2" style="margin: 10px">
                <span class="bg-primary-transparent fw-semibold mx-1">${fileName}</span>
                <a href="${fileUrl}" class="btn btn-icon btn-sm btn-success" title="Baixar" download><i class="ri-download-2-line"></i></a>
                <a href="${fileUrl}" class="btn btn-icon btn-sm btn-info" title="Visualizar" target="_blank"><i class="ri-eye-line"></i></a>
            </div>`
  }
  divOccurrenceAttachments.innerHTML = printOccurrenceAttachments;
}

document.addEventListener('DOMContentLoaded', async function () {

  // const socket = io();

  // socket.on('updateCalendarEvents', (data) => {
  //   calendar.refetchEvents();
  // })

  await createHistory()
  await printOcurrenceDetails()

  document.querySelector('#loader2').classList.add('d-none')
});