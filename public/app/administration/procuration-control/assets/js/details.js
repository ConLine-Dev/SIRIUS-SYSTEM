let sAllResponsibles2;

function getLinkParams() {
    const params = new URLSearchParams(window.location.search);
    const documentId = params.get('documentId');
    return documentId;
}

async function createHistory() {
    const documentId = getLinkParams();
    const documentHistory = await makeRequest(`/api/procuration-control/documentHistory`, 'POST', { documentId });
    const divDocumentHistory = document.getElementById('documentHistory');
    let printDocumentHistory = '<ul class="timeline list-unstyled">';
    for (let index = documentHistory.length - 1; index >= 0; index--) {
        let createdDate = new Date(documentHistory[index].created_time);
        let dia = String(createdDate.getDate()).padStart(2, '0');
        let mes = String(createdDate.getMonth() + 1).padStart(2, '0');
        let ano = createdDate.getFullYear();
        let hora = String(createdDate.getHours()).padStart(2, '0');
        let min = String(createdDate.getMinutes()).padStart(2, '0');
        let dataFormatada = `${dia},${mesNamesPTBR(mes)} ${ano}`;
        let horaFormatada = `${hora}:${min}`;
        let fileName = documentHistory[index].file;
        let fileUrl = `/uploads/procuration-control/anexos/${fileName}`;
        let historyId = documentHistory[index].id;
        let avatarUrl = `https://cdn.conlinebr.com.br/colaboradores/${documentHistory[index].id_headcargo}`;
        let nomeResponsavel = `${documentHistory[index].name} ${documentHistory[index].family_name}`;
        printDocumentHistory += `
        <li>
          <div class="timeline-time text-end">
            <span class="date">${dataFormatada}</span>
            <span class="time d-inline-block">${horaFormatada}</span>
          </div>
          <div class="timeline-icon">
            <a href="javascript:void(0);"></a>
          </div>
          <div class="timeline-body">
            <div class="d-flex align-items-top timeline-main-content flex-wrap mt-0">
              <div class="avatar avatar-md online me-3 avatar-rounded mt-sm-0 mt-4">
                <img alt="avatar" src="${avatarUrl}">
              </div>
              <div class="flex-fill">
                <div class="d-flex align-items-center">
                  <div class="mt-sm-0 mt-2">
                    <p class="mb-0 fs-14 fw-semibold">${nomeResponsavel}</p>
                    <p class="mb-0 text-muted">
                      Anexo adicionado:
                      <span class="badge bg-primary-transparent fw-semibold mx-1">${fileName}</span>
                    </p>
                    <br><p class="mb-0 text-muted">${documentHistory[index].description}</p>
                  </div>
                  <div class="ms-auto">
                    <div class="hstack gap-2 fs-15">
                      <a href="${fileUrl}" class="btn btn-icon btn-sm btn-success" title="Baixar" download><i class="ri-download-2-line"></i></a>
                      <a href="${fileUrl}" class="btn btn-icon btn-sm btn-info" title="Visualizar" target="_blank"><i class="ri-eye-line"></i></a>
                      <a href="#" class="btn btn-icon btn-sm btn-danger" title="Remover" onclick="removeAttachmentJS(${historyId}, '${fileName}')"><i class="ri-delete-bin-6-line"></i></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </li>
        `;
    }
    printDocumentHistory += '</ul>';
    divDocumentHistory.innerHTML = printDocumentHistory;
}

function mesNamesPTBR(mes) {
    const nomes = {
        '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun',
        '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
    };
    return nomes[mes] || mes;
}

async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);

    return StorageGoogle;
};

async function saveEvent() {

    let documentId = getLinkParams();

    let involved = sAllResponsibles2.getValue().map(item => item.value);

    let sendData = await makeRequest(`/api/procuration-control/saveEvent`, 'POST', { documentId, involved })

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

async function addProcurationAttachment() {
    let loggedData = await getInfosLogin();
    let userId = loggedData.system_collaborator_id;
    let documentId = getLinkParams();
    let deadline = document.getElementById('newDeadline');
    let newDeadline = deadline.value;
    let newFile = document.getElementById('newFile');
    let file = newFile.files[0];
    let description = document.getElementById('newDescription');
    let newDescription = description.value;

    if (!file) {
        Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Favor adicionar um arquivo como anexo.' });
        return;
    }
    if (!newDeadline) {
        Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Favor adicionar a próxima data de validade do documento.' });
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentId', documentId);
    formData.append('userId', userId);
    formData.append('newDeadline', newDeadline);
    formData.append('newDescription', newDescription);

    try {
        const response = await fetch('/api/procuration-control/upload', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (result.success) {
            Swal.fire({ icon: 'success', title: 'Sucesso', text: result.message });
            // Limpa o formulário
            newFile.value = '';
            deadline.value = '';
            await createHistory();
        } else {
            Swal.fire({ icon: 'error', title: 'Erro', text: result.message || 'Erro ao enviar arquivo.' });
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Erro', text: 'Erro ao enviar arquivo.' });
    }
}

async function getAllResponsible() {

    let documentId = getLinkParams();
    const Responsible = await makeRequest(`/api/users/listAllUsersActive`);
    const involved = await makeRequest(`/api/procuration-control/getInvolved`, 'POST', { documentId });

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

    for (let index = 0; index < involved.length; index++) {
        sAllResponsibles2.setChoiceByValue(`${involved[index].collaborator_id}`)
    }
}

window.removeAttachmentJS = async function (historyId, fileName) {
    Swal.fire({
        title: 'Tem certeza?',
        text: 'Deseja remover este anexo e o registro do histórico? Esta ação não poderá ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch('/api/procuration-control/removeAttachment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ historyId, fileName })
                });
                const data = await response.json();
                if (data.success) {
                    Swal.fire({ icon: 'success', title: 'Removido!', text: data.message });
                    await createHistory();
                } else {
                    Swal.fire({ icon: 'error', title: 'Erro', text: data.message || 'Erro ao remover anexo.' });
                }
            } catch (error) {
                Swal.fire({ icon: 'error', title: 'Erro', text: 'Erro ao remover anexo.' });
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', async function () {

    await createHistory();
    await getAllResponsible();

});