async function printAll() {

  var procurationData = await makeRequest(`/api/procuration-control/procurationData`);
  var docsList = document.getElementById('docsList');

  let printDocsList = '';

  for (let index = 0; index < procurationData.length; index++) {

    let createdDate = new Date(procurationData[index].created_at)
    let formattedCreate = createdDate.toLocaleDateString('pt-BR')
    let updatedDate = new Date(procurationData[index].updated_at)
    let formattedUpdate = updatedDate.toLocaleDateString('pt-BR')
    let deadline = new Date(procurationData[index].deadline)
    let formattedDeadline = deadline.toLocaleDateString('pt-BR')

    printDocsList += `<div class="col-xl-2 d-flex flex-column" style="height: 100%">
                        <div class="card custom-card flex-fill mb-3" id="${procurationData[index].id}" onclick="openDetails(this.id);">
                            <div class="card-header d-flex" style="justify-content: space-between;">
                                <div class="card-title fw-semibold fs-14">${procurationData[index].title}</div>
                            </div>
                            <div class="card-body d-flex" style="flex-direction: column; justify-content: space-between;">
                                <div>Data Criação: ${formattedCreate}</div><br>
                                <div>Última Atualização: ${formattedUpdate}</div><br>
                                <div>Responsável: ${procurationData[index].name} ${procurationData[index].family_name}</div><br>
                                <span class="badge bg-success-transparent fw-semibold fs-13">Vencimento: ${formattedDeadline}</span>
                            </div>
                        </div>
                    </div>`
  }

  docsList.innerHTML = printDocsList;
}

async function openDetails(documentId){

  const body = {
      url: `/app/administration/procuration-control/details?documentId=${documentId}`,
      width: 1200,
      height: 715,
      resizable: false,
      max: false
  }
  window.ipcRenderer.invoke('open-exWindow', body);
}

function openWindow(url, width, height) {
  window.open(url, '_blank', `width=${width},height=${height},resizable=yes,scrollbars=yes`);
}

document.addEventListener('DOMContentLoaded', async function () {

  // const socket = io();

  // socket.on('updateCalendarEvents', (data) => {
  //   calendar.refetchEvents();
  // })

  await printAll();

  document.querySelector('#loader2').classList.add('d-none')

});