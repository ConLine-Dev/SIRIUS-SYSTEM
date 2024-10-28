let type = 'save';

// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {
    const action_id = await getParameters()
    await loadLocal();

    if(action_id){
        type = 'edit';
        document.querySelector('#btn-save').textContent = 'Atualizar'
        // carrega os dados da senha 
        await getInspections(action_id)
     }

    // carrega os dados da senha 
    // await getInspections(action_id);
    

    // remover loader
    // document.querySelector('#loader2').classList.add('d-none');

    document.querySelector('#btn-save').addEventListener('click', async () => {
        const date = document.querySelector('input[name="date"]').value
        const observation = document.querySelector('textarea[name="observation"]').value

        if (date.trim() === '') {
            alert('O campo "Data" não pode estar vazio.')
            return;
        }

        if (observation.trim() === '') {
            alert('A observação é obrigatória.')
            return;
        }

        if(type == 'save'){

           await sendActionCorrective()
        }else{
            await updateActionCorrective(action_id)
        }
        // await updateInspection(password_id, date, observation)
    })
})

async function loadLocal(){
    const Monitoring = await makeRequest(`/api/safety-inspection/safety_monitoring`);
    console.log(Monitoring)
    Monitoring.forEach(element => { 
        const option = document.createElement('option');
        option.value = element.id;
        option.text = element.name;
        document.querySelector('select[name="local"]').appendChild(option);
    })

}

// Função para receber o id da pessoa que esta sendo aberta nesta janela
async function getParameters() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const id = urlParams.get('id');
    return id;
};


// Função para pegar os dados do password
async function getInspections(id) {
    const Inspection = await makeRequest(`/api/Safety-Inspection/action-by-id/${id}`);



    document.querySelector('select[name="local"]').value = Inspection.local
    document.querySelector('input[name="date"]').value = Inspection.create_at
    document.querySelector('input[name="finish"]').value = Inspection.ended_at
    document.querySelector('textarea[name="observation"]').value = Inspection.description

    // // Desabilita os campos se a inspeção estiver concluida
    // if(Inspection.status == 1) {
        
    //     document.querySelector('#btn-save').setAttribute('disabled', 'disabled')
    //     document.querySelector('input[name="local"]').setAttribute('disabled', 'disabled')
    //     document.querySelector('input[name="date"]').setAttribute('disabled', 'disabled')
    //     document.querySelector('input[name="finish"]').setAttribute('disabled', 'disabled')
    //     document.querySelector('textarea[name="observation"]').setAttribute('disabled', 'disabled')
    // }else{

    //     document.querySelector('input[name="local"]').setAttribute('disabled', 'disabled')
    //     document.querySelector('input[name="date"]').setAttribute('disabled', 'disabled')
    // }

} 


// // Verifica informações no localStorage do usuario logado
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
};

async function updateActionCorrective(action_id) {
    const user = await getInfosLogin()
    const idCollaborator = user.system_collaborator_id

    const local = document.querySelector('select[name="local"]').value
    const date = document.querySelector('input[name="date"]').value
    const finish = document.querySelector('input[name="finish"]').value
    const observation = document.querySelector('textarea[name="observation"]').value

    const response = await makeRequest(`/api/Safety-Inspection/update-corrective-actions/${action_id}`, 'PUT', { local, date, finish, observation, idCollaborator });

    if (response && response.affectedRows) {
        window.close();
    } else {
        throw new Error('Erro ao atualizar a inspeção');
    }
}

async function sendActionCorrective() {
    const user = await getInfosLogin()
    const idCollaborator = user.system_collaborator_id

    const local = document.querySelector('select[name="local"]').value
    const date = document.querySelector('input[name="date"]').value
    const finish = document.querySelector('input[name="finish"]').value
    const observation = document.querySelector('textarea[name="observation"]').value

    const response = await makeRequest(`/api/Safety-Inspection/create-corrective-actions`, 'POST', { local, date, finish, observation, idCollaborator });

    if (response && response.affectedRows) {
        window.close();
    } else {
        throw new Error('Erro ao atualizar a inspeção');
    }
}


