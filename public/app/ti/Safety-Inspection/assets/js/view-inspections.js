
// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {
    const password_id = await getParameters()
    // carrega os dados da senha 
    await getInspections(password_id);

    // remover loader
    // document.querySelector('#loader2').classList.add('d-none');

    document.querySelector('#btn-save').addEventListener('click', async () => {
        const date = document.querySelector('input[name="finish"]').value
        const observation = document.querySelector('textarea[name="observation"]').value

        if (date.trim() === '') {
            alert('O campo "Finalizado" não pode estar vazio.')
            return;
        }

        if (observation.trim() === '') {
            alert('A observação é obrigatória.')
            return;
        }

        await updateInspection(password_id, date, observation)
    })
})

// Função para receber o id da pessoa que esta sendo aberta nesta janela
async function getParameters() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id');
    return id;
};


// Função para pegar os dados do password
async function getInspections(id) {
    const Inspection = await makeRequest(`/api/Safety-Inspection/inspections-by-id/${id}`);
    console.log(Inspection)


    document.querySelector('input[name="local"]').value = Inspection.nameLocation
    document.querySelector('input[name="date"]').value = Inspection.date
    document.querySelector('input[name="finish"]').value = Inspection.finished
    document.querySelector('textarea[name="observation"]').value = Inspection.description

    // Desabilita os campos se a inspeção estiver concluida
    if(Inspection.status == 1) {
        
        document.querySelector('#btn-save').setAttribute('disabled', 'disabled')
        document.querySelector('input[name="local"]').setAttribute('disabled', 'disabled')
        document.querySelector('input[name="date"]').setAttribute('disabled', 'disabled')
        document.querySelector('input[name="finish"]').setAttribute('disabled', 'disabled')
        document.querySelector('textarea[name="observation"]').setAttribute('disabled', 'disabled')
    }else{

        document.querySelector('input[name="local"]').setAttribute('disabled', 'disabled')
        document.querySelector('input[name="date"]').setAttribute('disabled', 'disabled')
    }

} 


// Verifica informações no localStorage do usuario logado
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
};


async function updateInspection(id, finished, description) {
    const status = 1
    const user = await getInfosLogin()
    const idCollaborator = user.system_collaborator_id

    const response = await makeRequest(`/api/Safety-Inspection/inspections/${id}`, 'PUT', { finished, status, description, idCollaborator });

    if (response && response.affectedRows) {
        window.close();
    } else {
        throw new Error('Erro ao atualizar a inspeção');
    }
}


