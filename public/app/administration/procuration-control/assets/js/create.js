function openWindow(url, width, height) {
    window.open(url, '_blank', `width=${width},height=${height},resizable=yes,scrollbars=yes`);
}

async function createDocument(attach) {
    let deadline = document.getElementById('newDeadline');
    let newDeadline = deadline.value;
    let newTitle = document.getElementById('newTitle');
    newTitle = newTitle.value;

    let result = await makeRequest(`/api/procuration-control/createDocument`, 'POST', {newTitle, newDeadline});

    window.close();

    if (attach) {
        openDetails(result)
    }
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

});