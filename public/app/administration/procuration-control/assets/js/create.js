let sAllResponsibles2;

function openWindow(url, width, height) {
    window.open(url, '_blank', `width=${width},height=${height},resizable=yes,scrollbars=yes`);
}

async function createDocument(attach) {
    let newDeadline = document.getElementById('newDeadline').value;
    let newTitle = document.getElementById('newTitle').value;
    let newDetails = document.getElementById('newDetails').value;

    let involved = sAllResponsibles2.getValue().map(item => item.value);

    let result = await makeRequest(`/api/procuration-control/createDocument`, 'POST', { newTitle, newDeadline, newDetails, involved });

    window.close();

    if (attach) {
        openDetails(result)
    }
}

async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);

    return StorageGoogle;
};

async function getAllResponsible() {
    const Responsible = await makeRequest(`/api/users/listAllUsersActive`);

    const loggedData = await getInfosLogin();
    const collabData = await makeRequest(`/api/meeting-control/getCollabData`, 'POST', loggedData);

    const listaDeOpcoes2 = Responsible.map(function (element) {
        return {
            value: `${element.id_colab}`,
            label: `${element.username + ' ' + element.familyName}`
        };
    });

    if (sAllResponsibles2) {
        sAllResponsibles2.destroy();
    }

    sAllResponsibles2 = new Choices('select[name="responsibles"]', {
        choices: listaDeOpcoes2,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
    });

    sAllResponsibles2.setChoiceByValue(`${collabData[0].collabId}`)
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

document.addEventListener('DOMContentLoaded', async function () {

    // const socket = io();
    // socket.on('updateDocuments', (data) => {
    // })

    await getAllResponsible();

});