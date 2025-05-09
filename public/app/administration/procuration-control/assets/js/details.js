function getLinkParams() {
    const params = new URLSearchParams(window.location.search);
    const documentId = params.get('documentId');
    return documentId;
}

async function createHistory() {
    const documentId = getLinkParams();

    const documentHistory = await makeRequest(`/api/procuration-control/documentHistory`, 'POST', {documentId});

    const divDocumentHistory = document.getElementById('documentHistory');
    let printDocumentHistory = '';

    for (let index = 0; index < documentHistory.length; index++) {
        let createdDate = new Date(documentHistory[index].created_time)
        let formattedCreate = createdDate.toLocaleDateString('pt-BR')
        printDocumentHistory += `<div class="col-12 card custom-card">
                                    <div class="d-flex" style="justify-content: space-between;">
                                        <div>
                                            <span class="avatar avatar-xs avatar-rounded">
                                                <img class="responsibleIMG" src="https://cdn.conlinebr.com.br/colaboradores/${documentHistory[index].id_headcargo}" alt="">
                                            </span>
                                            <label for="input-label" class="form-label center-text">${documentHistory[index].name} ${documentHistory[index].family_name}</label> 
                                        </div>
                                        <div>
                                            <label for="input-label" class="form-label center-text">${formattedCreate}</label>
                                        </div>
                                    </div>
                                    <textarea name="observation" class="form-control form-input"cols="30" rows="1" disabled placeholder="Anexo">${documentHistory[index].file}</textarea>
                                </div>`
    }

    divDocumentHistory.innerHTML = printDocumentHistory;
}

async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);

    return StorageGoogle;
};

async function saveEvent() {

    let loggedData = await getInfosLogin();
    let userId = loggedData.system_collaborator_id;
    let documentId = getLinkParams();
    let deadline = document.getElementById('newDeadline');
    let newDeadline = deadline.value;
    let newFile = document.getElementById('newFile');
    let fileName = formatFileName(newFile.files[0].name);

    if (!fileName) {
        alert('Favor adicionar um arquivo como anexo');
    }

    if (!newDeadline) {
        alert('Favor adicionar a próxima data de validade do documento');
    }

    let sendData = await makeRequest(`/api/procuration-control/saveEvent`, 'POST', {documentId, userId, newDeadline, fileName})

    window.close();
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

document.addEventListener('DOMContentLoaded', async function () {

    // const socket = io();

    // socket.on('updateCalendarEvents', (data) => {
    //   calendar.refetchEvents();
    // })

    await createHistory();
  
  });